import json
import os
import psycopg2
import base64
from datetime import datetime

SECURITY_HEADERS = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff'
}

def handler(event: dict, context) -> dict:
    """API для подтверждения оплаты и отправки уведомлений в Telegram"""
    method = event.get('httpMethod', 'GET')
    frontend_domain = os.environ.get('FRONTEND_DOMAIN', '*')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': frontend_domain,
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Credentials': 'true',
                **SECURITY_HEADERS
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': frontend_domain,
                **SECURITY_HEADERS
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    conn = None
    cur = None
    
    try:
        body = json.loads(event.get('body', '{}'))
        booking_id = body.get('booking_id')
        receipt_data = body.get('receipt_url', '')
        
        if not booking_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': frontend_domain,
                    **SECURITY_HEADERS
                },
                'body': json.dumps({'error': 'Не указан ID заявки'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        # Получаем информацию о заявке
        cur.execute("""
            SELECT b.id, b.name, b.contact, b.type, b.comment, 
                   ts.date, ts.time, b.status
            FROM bookings b
            JOIN time_slots ts ON b.slot_id = ts.id
            WHERE b.id = %s
        """, (booking_id,))
        
        booking = cur.fetchone()
        
        if not booking:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': frontend_domain,
                    **SECURITY_HEADERS
                },
                'body': json.dumps({'error': 'Заявка не найдена'}),
                'isBase64Encoded': False
            }
        
        booking_id, name, contact, booking_type, comment, slot_date, slot_time, status = booking
        
        # Сохраняем чек оплаты если есть
        receipt_url = None
        if receipt_data:
            storage_type = os.environ.get('STORAGE_TYPE', 'local')
            
            if storage_type == 'local':
                # Локальное хранилище
                storage_path = os.environ.get('STORAGE_PATH', '/var/www/yolonaiils_storage')
                storage_url = os.environ.get('STORAGE_URL', 'http://localhost/storage')
                
                receipts_folder = os.path.join(storage_path, 'receipts')
                os.makedirs(receipts_folder, exist_ok=True)
                
                # Декодируем base64
                if receipt_data.startswith('data:image'):
                    receipt_data = receipt_data.split(',')[1]
                
                receipt_bytes = base64.b64decode(receipt_data)
                
                # Сохраняем файл
                receipt_filename = f'receipt_{booking_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.jpg'
                receipt_path = os.path.join(receipts_folder, receipt_filename)
                
                with open(receipt_path, 'wb') as f:
                    f.write(receipt_bytes)
                
                os.chmod(receipt_path, 0o644)
                
                receipt_url = f"{storage_url}/receipts/{receipt_filename}"
        
        # Обновляем статус заявки
        cur.execute("""
            UPDATE bookings 
            SET status = 'paid', 
                payment_receipt_url = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
        """, (receipt_url, booking_id))
        
        conn.commit()
        
        # Получаем фотографии клиента
        cur.execute("""
            SELECT photo_url 
            FROM booking_photos 
            WHERE booking_id = %s
            ORDER BY id
        """, (booking_id,))
        
        photos = [row[0] for row in cur.fetchall()]
        
        # Отправка в Telegram
        telegram_sent = False
        telegram_error = None
        
        telegram_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        telegram_chat_id = os.environ.get('TELEGRAM_CHAT_ID')
        
        if telegram_token and telegram_chat_id:
            try:
                import requests
                
                # Формируем сообщение
                type_names = {
                    'know_what_i_want': '🎯 Знаю что хочу',
                    'have_reference': '📸 Есть референс',
                    'consultation_needed': '💬 Нужна консультация'
                }
                
                message = f"""
🔔 <b>Новая заявка #{booking_id}</b>

👤 <b>Клиент:</b> {name}
📞 <b>Контакт:</b> {contact}

📅 <b>Дата:</b> {slot_date}
⏰ <b>Время:</b> {slot_time}

🎨 <b>Тип заявки:</b> {type_names.get(booking_type, booking_type)}
"""
                
                if comment:
                    message += f"\n💬 <b>Комментарий:</b> {comment}"
                
                if photos:
                    message += f"\n\n📷 <b>Референсы клиента:</b> {len(photos)} шт."
                
                if receipt_url:
                    message += f"\n\n💳 <b>Чек оплаты:</b> загружен"
                
                # Отправляем текстовое сообщение
                requests.post(
                    f'https://api.telegram.org/bot{telegram_token}/sendMessage',
                    json={
                        'chat_id': telegram_chat_id,
                        'text': message,
                        'parse_mode': 'HTML'
                    },
                    timeout=10
                )
                
                # Отправляем чек если есть
                if receipt_url and receipt_url.startswith('http'):
                    requests.post(
                        f'https://api.telegram.org/bot{telegram_token}/sendPhoto',
                        json={
                            'chat_id': telegram_chat_id,
                            'photo': receipt_url,
                            'caption': f'💳 Чек оплаты для заявки #{booking_id}'
                        },
                        timeout=10
                    )
                
                telegram_sent = True
                
            except Exception as e:
                telegram_error = str(e)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': frontend_domain,
                'Access-Control-Allow-Credentials': 'true',
                **SECURITY_HEADERS
            },
            'body': json.dumps({
                'success': True,
                'booking_id': booking_id,
                'receipt_url': receipt_url,
                'telegram_sent': telegram_sent,
                'telegram_error': telegram_error if not telegram_sent else None
            }),
            'isBase64Encoded': False
        }
        
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': frontend_domain,
                **SECURITY_HEADERS
            },
            'body': json.dumps({'error': 'Некорректный JSON'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        if conn:
            conn.rollback()
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': frontend_domain,
                **SECURITY_HEADERS
            },
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
