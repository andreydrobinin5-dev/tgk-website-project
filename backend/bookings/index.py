import json
import os
import psycopg2
import base64
from datetime import datetime

# Относительные импорты для VPS
try:
    from bookings.utils import verify_admin_token
    from bookings.validation import sanitize_text, validate_contact, validate_booking_type, validate_name
except ImportError:
    # Fallback для Cloud Functions
    from utils import verify_admin_token
    from validation import sanitize_text, validate_contact, validate_booking_type, validate_name

SECURITY_HEADERS = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self' https://cdn.poehali.dev; style-src 'self'"
}

def handler(event: dict, context) -> dict:
    """API для создания заявок на запись с загрузкой фото"""
    frontend_domain = os.environ.get('FRONTEND_DOMAIN', '*')
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': frontend_domain,
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, Cookie',
                'Access-Control-Allow-Credentials': 'true',
                **SECURITY_HEADERS
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        if method == 'POST':
            body = event.get('body', '{}')
            
            if len(body) > 50 * 1024 * 1024:
                return {
                    'statusCode': 413,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': frontend_domain,
                        'Access-Control-Allow-Credentials': 'true',
                        **SECURITY_HEADERS
                    },
                    'body': json.dumps({'error': 'Размер данных слишком большой'}),
                    'isBase64Encoded': False
                }
            
            data = json.loads(body)
            
            slot_id = data.get('slot_id')
            client_name = data.get('name', '')
            client_contact = data.get('contact', '')
            booking_type = data.get('type', '')
            comment = data.get('comment', '')
            photos_base64 = data.get('photos', [])
            
            if not validate_name(client_name):
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': frontend_domain,
                        'Access-Control-Allow-Credentials': 'true',
                        **SECURITY_HEADERS
                    },
                    'body': json.dumps({'error': 'Некорректное имя'}),
                    'isBase64Encoded': False
                }
            
            if not validate_contact(client_contact):
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': frontend_domain,
                        'Access-Control-Allow-Credentials': 'true',
                        **SECURITY_HEADERS
                    },
                    'body': json.dumps({'error': 'Некорректный контакт'}),
                    'isBase64Encoded': False
                }
            
            if not validate_booking_type(booking_type):
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': frontend_domain,
                        'Access-Control-Allow-Credentials': 'true',
                        **SECURITY_HEADERS
                    },
                    'body': json.dumps({'error': 'Некорректный тип записи'}),
                    'isBase64Encoded': False
                }
            
            client_name = sanitize_text(client_name, 100)
            client_contact = sanitize_text(client_contact, 100)
            comment = sanitize_text(comment, 500)
            
            MAX_PHOTOS = 3
            if len(photos_base64) > MAX_PHOTOS:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': frontend_domain,
                        'Access-Control-Allow-Credentials': 'true',
                        **SECURITY_HEADERS
                    },
                    'body': json.dumps({'error': f'Максимум {MAX_PHOTOS} фото'}),
                    'isBase64Encoded': False
                }
            

            
            VALID_IMAGE_SIGNATURES = {
                b'\xff\xd8\xff': 'image/jpeg',
                b'\x89PNG\r\n\x1a\n': 'image/png',
                b'GIF87a': 'image/gif',
                b'GIF89a': 'image/gif',
                b'RIFF': 'image/webp'
            }
            
            MAX_PHOTO_SIZE = 5 * 1024 * 1024
            for idx, photo_data in enumerate(photos_base64):
                if photo_data.startswith('data:image'):
                    photo_data = photo_data.split(',')[1]
                
                photo_bytes = base64.b64decode(photo_data)
                
                if len(photo_bytes) > MAX_PHOTO_SIZE:
                    return {
                        'statusCode': 413,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': frontend_domain,
                            'Access-Control-Allow-Credentials': 'true',
                            **SECURITY_HEADERS
                        },
                        'body': json.dumps({'error': f'Фото {idx + 1} слишком большое (максимум 5MB)'}),
                        'isBase64Encoded': False
                    }
                
                is_valid_image = False
                for signature in VALID_IMAGE_SIGNATURES.keys():
                    if photo_bytes.startswith(signature):
                        is_valid_image = True
                        break
                
                if not is_valid_image:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': frontend_domain,
                            'Access-Control-Allow-Credentials': 'true',
                            **SECURITY_HEADERS
                        },
                        'body': json.dumps({'error': f'Файл {idx + 1} не является изображением'}),
                        'isBase64Encoded': False
                    }
            
            cur.execute("""
                SELECT id FROM time_slots 
                WHERE id = %s AND is_available = true
                FOR UPDATE
            """, (slot_id,))
            
            locked_slot = cur.fetchone()
            
            if not locked_slot:
                return {
                    'statusCode': 409,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': frontend_domain,
                        'Access-Control-Allow-Credentials': 'true',
                        **SECURITY_HEADERS
                    },
                    'body': json.dumps({'error': 'Слот уже занят'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                UPDATE time_slots 
                SET is_available = false 
                WHERE id = %s
            """, (slot_id,))
            
            cur.execute("""
                INSERT INTO bookings 
                (slot_id, client_name, client_contact, booking_type, comment)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (slot_id, client_name, client_contact, booking_type, comment))
            
            booking_id = cur.fetchone()[0]
            
            # Локальное хранилище вместо S3
            storage_path = os.environ.get('STORAGE_PATH', '/var/www/yolonaiils_storage')
            storage_url = os.environ.get('STORAGE_URL', 'http://localhost/storage')
            
            photo_urls = []
            for idx, photo_data in enumerate(photos_base64):
                if photo_data.startswith('data:image'):
                    photo_data = photo_data.split(',')[1]
                
                photo_bytes = base64.b64decode(photo_data)
                
                # Создаем папку для booking
                booking_folder = os.path.join(storage_path, 'uploads', f'booking_{booking_id}')
                os.makedirs(booking_folder, exist_ok=True)
                
                # Сохраняем файл
                file_name = f'photo_{idx}.jpg'
                file_path = os.path.join(booking_folder, file_name)
                
                with open(file_path, 'wb') as f:
                    f.write(photo_bytes)
                
                # Устанавливаем права доступа
                os.chmod(file_path, 0o644)
                
                # Генерируем URL
                photo_url = f"{storage_url}/uploads/booking_{booking_id}/{file_name}"
                photo_urls.append(photo_url)
                
                cur.execute("""
                    INSERT INTO booking_photos (booking_id, photo_url)
                    VALUES (%s, %s)
                """, (booking_id, photo_url))
            
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': frontend_domain,
                    'Access-Control-Allow-Credentials': 'true',
                    **SECURITY_HEADERS
                },
                'body': json.dumps({
                    'booking_id': booking_id,
                    'photos': photo_urls,
                    'message': 'Заявка создана'
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'GET':
            # Получаем токен из заголовка X-Admin-Token или из cookie
            headers = event.get('headers', {})
            token = headers.get('X-Admin-Token') or headers.get('x-admin-token')
            
            if not token:
                cookie_header = headers.get('cookie', '') or headers.get('Cookie', '')
                if cookie_header:
                    for cookie in cookie_header.split('; '):
                        if cookie.startswith('admin_token='):
                            token = cookie.split('=', 1)[1]
                            break
            
            if not verify_admin_token(token):
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': frontend_domain,
                        'Access-Control-Allow-Credentials': 'true',
                        **SECURITY_HEADERS
                    },
                    'body': json.dumps({'error': 'Неавторизован'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                SELECT b.id, b.client_name, b.client_contact, 
                       b.booking_type, b.comment, b.payment_status,
                       ts.slot_date, ts.slot_time, b.receipt_url, b.created_at
                FROM bookings b
                JOIN time_slots ts ON b.slot_id = ts.id
                ORDER BY b.created_at DESC
                LIMIT 50
            """)
            
            bookings = cur.fetchall()
            result = []
            
            for row in bookings:
                booking_id = row[0]
                
                cur.execute("""
                    SELECT photo_url FROM booking_photos 
                    WHERE booking_id = %s
                """, (booking_id,))
                
                photos = [photo[0] for photo in cur.fetchall()]
                
                result.append({
                    'id': booking_id,
                    'name': row[1],
                    'contact': row[2],
                    'type': row[3],
                    'comment': row[4],
                    'payment_status': row[5],
                    'date': row[6].isoformat(),
                    'time': str(row[7]),
                    'receipt_url': row[8],
                    'created_at': row[9].isoformat() if row[9] else None,
                    'photos': photos
                })
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': frontend_domain,
                    'Access-Control-Allow-Credentials': 'true',
                    **SECURITY_HEADERS
                },
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            # Получаем токен из заголовка X-Admin-Token или из cookie
            headers = event.get('headers', {})
            token = headers.get('X-Admin-Token') or headers.get('x-admin-token')
            
            if not token:
                cookie_header = headers.get('cookie', '') or headers.get('Cookie', '')
                if cookie_header:
                    for cookie in cookie_header.split('; '):
                        if cookie.startswith('admin_token='):
                            token = cookie.split('=', 1)[1]
                            break
            
            if not verify_admin_token(token):
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': frontend_domain,
                        'Access-Control-Allow-Credentials': 'true',
                        **SECURITY_HEADERS
                    },
                    'body': json.dumps({'error': 'Неавторизован'}),
                    'isBase64Encoded': False
                }
            
            params = event.get('queryStringParameters', {})
            booking_id = params.get('id')
            
            if not booking_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': frontend_domain,
                        'Access-Control-Allow-Credentials': 'true',
                        **SECURITY_HEADERS
                    },
                    'body': json.dumps({'error': 'Не указан ID заявки'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT slot_id FROM bookings WHERE id = %s", (booking_id,))
            result = cur.fetchone()
            
            if not result:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': frontend_domain,
                        'Access-Control-Allow-Credentials': 'true',
                        **SECURITY_HEADERS
                    },
                    'body': json.dumps({'error': 'Заявка не найдена'}),
                    'isBase64Encoded': False
                }
            
            slot_id = result[0]
            
            cur.execute("DELETE FROM booking_photos WHERE booking_id = %s", (booking_id,))
            cur.execute("DELETE FROM bookings WHERE id = %s", (booking_id,))
            cur.execute("UPDATE time_slots SET is_available = true WHERE id = %s", (slot_id,))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': frontend_domain,
                    'Access-Control-Allow-Credentials': 'true',
                    **SECURITY_HEADERS
                },
                'body': json.dumps({'message': 'Заявка удалена, слот освобожден'}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': frontend_domain,
                    'Access-Control-Allow-Credentials': 'true',
                    **SECURITY_HEADERS
                },
                'body': json.dumps({'error': 'Method not allowed'}),
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
                'Access-Control-Allow-Credentials': 'true',
                **SECURITY_HEADERS
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()