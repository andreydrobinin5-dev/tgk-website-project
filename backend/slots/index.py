import json
import os
import psycopg2
from datetime import datetime, date
from utils import verify_admin_token

SECURITY_HEADERS = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff'
}

def handler(event: dict, context) -> dict:
    """API для управления слотами времени записи"""
    frontend_domain = os.environ.get('FRONTEND_DOMAIN', '*')
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': frontend_domain,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
        if method == 'GET':
            cur.execute("""
                SELECT id, slot_date, slot_time, is_available 
                FROM time_slots 
                WHERE slot_date >= CURRENT_DATE
                ORDER BY slot_date, slot_time
            """)
            slots = cur.fetchall()
            
            result = [{
                'id': row[0],
                'date': row[1].isoformat(),
                'time': str(row[2]),
                'available': row[3]
            } for row in slots]
            
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
        
        elif method == 'POST':
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
            
            data = json.loads(event.get('body', '{}'))
            slot_date = data.get('date')
            slot_time = data.get('time')
            
            cur.execute("""
                INSERT INTO time_slots (slot_date, slot_time, is_available)
                VALUES (%s, %s, true)
                ON CONFLICT (slot_date, slot_time) DO NOTHING
                RETURNING id
            """, (slot_date, slot_time))
            
            result = cur.fetchone()
            conn.commit()
            
            if result:
                return {
                    'statusCode': 201,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': frontend_domain,
                        'Access-Control-Allow-Credentials': 'true',
                        **SECURITY_HEADERS
                    },
                    'body': json.dumps({'id': result[0], 'message': 'Слот создан'}),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 409,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': frontend_domain,
                        'Access-Control-Allow-Credentials': 'true',
                        **SECURITY_HEADERS
                    },
                    'body': json.dumps({'error': 'Слот уже существует'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'PUT':
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
            
            data = json.loads(event.get('body', '{}'))
            slot_id = data.get('id')
            is_available = data.get('available')
            
            cur.execute("""
                UPDATE time_slots 
                SET is_available = %s
                WHERE id = %s
            """, (is_available, slot_id))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': frontend_domain,
                    'Access-Control-Allow-Credentials': 'true',
                    **SECURITY_HEADERS
                },
                'body': json.dumps({'message': 'Слот обновлен'}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
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
            
            data = json.loads(event.get('body', '{}'))
            slot_id = data.get('slot_id')
            
            cur.execute("""
                DELETE FROM time_slots 
                WHERE id = %s
            """, (slot_id,))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': frontend_domain,
                    'Access-Control-Allow-Credentials': 'true',
                    **SECURITY_HEADERS
                },
                'body': json.dumps({'message': 'Слот удален'}),
                'isBase64Encoded': False
            }
        
    except Exception as e:
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