import json
import hashlib
import secrets
import os
import psycopg2
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    """API для авторизации администратора с хешированием паролей"""
    method = event.get('httpMethod', 'GET')
    
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
    
    if method == 'POST':
        data = json.loads(event.get('body', '{}'))
        password = data.get('password', '')
        
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        correct_hash = hashlib.sha256('yolo2024'.encode()).hexdigest()
        
        if password_hash == correct_hash:
            token = secrets.token_urlsafe(32)
            
            conn = psycopg2.connect(os.environ['DATABASE_URL'])
            cur = conn.cursor()
            
            try:
                expires_at = datetime.now() + timedelta(days=7)
                
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS admin_sessions (
                        id SERIAL PRIMARY KEY,
                        token VARCHAR(64) UNIQUE NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        expires_at TIMESTAMP NOT NULL
                    )
                """)
                
                cur.execute("""
                    INSERT INTO admin_sessions (token, expires_at)
                    VALUES (%s, %s)
                """, (token, expires_at))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'token': token
                    }),
                    'isBase64Encoded': False
                }
            except Exception as e:
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
        else:
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': False,
                    'error': 'Неверный пароль'
                }),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
