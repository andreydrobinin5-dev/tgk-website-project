import json
import os
import psycopg2
import requests

def handler(event: dict, context) -> dict:
    """Отправка заявки мастеру в Telegram"""
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        data = json.loads(event.get('body', '{}'))
        booking_id = data.get('booking_id')
        receipt_url = data.get('receipt_url', '')
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        cur.execute("""
            SELECT b.client_name, b.client_contact, b.booking_type, 
                   b.comment, ts.slot_date, ts.slot_time
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
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Заявка не найдена'}),
                'isBase64Encoded': False
            }
        
        name, contact, booking_type, comment, slot_date, slot_time = booking
        
        type_labels = {
            'know_what_i_want': '✅ Знаю, что хочу',
            'not_sure': '🤔 Пока не определилась',
            'no_design': '⭕ Без дизайна'
        }
        
        message = f"""💅 <b>Новая запись!</b>

👤 <b>Имя:</b> {name}
📱 <b>Контакт:</b> {contact}
📅 <b>Дата:</b> {slot_date.strftime('%d.%m.%Y')}
🕐 <b>Время:</b> {slot_time}
💡 <b>Сценарий:</b> {type_labels.get(booking_type, booking_type)}
💬 <b>Комментарий:</b> {comment if comment else 'нет'}
💳 <b>Предоплата:</b> {'✅ чек приложен' if receipt_url else '⏳ ожидается'}
"""
        
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        chat_id = os.environ.get('TELEGRAM_CHAT_ID')
        
        if not bot_token or not chat_id:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Telegram не настроен'}),
                'isBase64Encoded': False
            }
        
        telegram_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
        response = requests.post(telegram_url, json={
            'chat_id': chat_id,
            'text': message,
            'parse_mode': 'HTML'
        })
        
        if not response.ok:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Ошибка отправки в Telegram'}),
                'isBase64Encoded': False
            }
        
        cur.execute("""
            SELECT photo_url FROM booking_photos WHERE booking_id = %s
        """, (booking_id,))
        
        photos = cur.fetchall()
        for photo in photos:
            photo_url = photo[0]
            requests.post(f'https://api.telegram.org/bot{bot_token}/sendPhoto', json={
                'chat_id': chat_id,
                'photo': photo_url
            })
        
        if receipt_url:
            cur.execute("""
                UPDATE bookings 
                SET receipt_url = %s, telegram_sent = true
                WHERE id = %s
            """, (receipt_url, booking_id))
        else:
            cur.execute("""
                UPDATE bookings 
                SET telegram_sent = true
                WHERE id = %s
            """, (booking_id,))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'message': 'Заявка отправлена мастеру'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
