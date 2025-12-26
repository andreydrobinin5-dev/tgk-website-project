import json
import os
import psycopg2
import base64
import boto3
from datetime import datetime

def handler(event: dict, context) -> dict:
    """API для создания заявок на запись с загрузкой фото"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        if method == 'POST':
            data = json.loads(event.get('body', '{}'))
            
            slot_id = data.get('slot_id')
            client_name = data.get('name')
            client_contact = data.get('contact')
            booking_type = data.get('type')
            comment = data.get('comment', '')
            photos_base64 = data.get('photos', [])
            
            cur.execute("""
                UPDATE time_slots 
                SET is_available = false 
                WHERE id = %s AND is_available = true
            """, (slot_id,))
            
            if cur.rowcount == 0:
                return {
                    'statusCode': 409,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Слот уже занят'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                INSERT INTO bookings 
                (slot_id, client_name, client_contact, booking_type, comment)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (slot_id, client_name, client_contact, booking_type, comment))
            
            booking_id = cur.fetchone()[0]
            
            s3 = boto3.client('s3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
            )
            
            photo_urls = []
            for idx, photo_data in enumerate(photos_base64):
                if photo_data.startswith('data:image'):
                    photo_data = photo_data.split(',')[1]
                
                photo_bytes = base64.b64decode(photo_data)
                file_key = f'bookings/{booking_id}/photo_{idx}.jpg'
                
                s3.put_object(
                    Bucket='files',
                    Key=file_key,
                    Body=photo_bytes,
                    ContentType='image/jpeg'
                )
                
                photo_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{file_key}"
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
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'booking_id': booking_id,
                    'photos': photo_urls,
                    'message': 'Заявка создана'
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'GET':
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
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
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
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()