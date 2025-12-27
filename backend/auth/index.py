import json
import secrets
import os
import psycopg2
import bcrypt
from datetime import datetime, timedelta

SECURITY_HEADERS = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff'
}

def handler(event: dict, context) -> dict:
    """API для авторизации администратора с хешированием паролей"""
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
    
    if method == 'POST':
        data = json.loads(event.get('body', '{}'))
        password = data.get('password', '')
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        try:
            source_ip = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
            
            cur.execute("""
                CREATE TABLE IF NOT EXISTS rate_limit (
                    ip VARCHAR(45) PRIMARY KEY,
                    auth_attempts INT DEFAULT 0,
                    last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cur.execute("""
                SELECT auth_attempts, last_attempt 
                FROM rate_limit 
                WHERE ip = %s
            """, (source_ip,))
            
            result = cur.fetchone()
            
            if result:
                attempts, last_attempt = result
                time_diff = (datetime.now() - last_attempt).total_seconds()
                
                if time_diff < 3600 and attempts >= 10:
                    return {
                        'statusCode': 429,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': frontend_domain,
                            'Access-Control-Allow-Credentials': 'true',
                            **SECURITY_HEADERS
                        },
                        'body': json.dumps({'error': 'Слишком много попыток. Попробуйте через час'}),
                        'isBase64Encoded': False
                    }
                
                if time_diff >= 3600:
                    attempts = 0
            else:
                attempts = 0
            
            stored_hash_str = os.environ.get('ADMIN_PASSWORD_HASH', '')
            
            # Fallback: генерируем хеш для пароля "yolo2024" если секрет не настроен
            if not stored_hash_str:
                # Используем предгенерированный хеш для "yolo2024"
                temp_password = "yolo2024"
                stored_hash = bcrypt.hashpw(temp_password.encode(), bcrypt.gensalt(rounds=12))
            else:
                stored_hash = stored_hash_str.encode()
            
            if bcrypt.checkpw(password.encode(), stored_hash):
                token = secrets.token_urlsafe(32)
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
                    DELETE FROM admin_sessions WHERE expires_at < CURRENT_TIMESTAMP
                """)
                
                cur.execute("""
                    INSERT INTO admin_sessions (token, expires_at)
                    VALUES (%s, %s)
                """, (token, expires_at))
                
                cur.execute("""
                    INSERT INTO rate_limit (ip, auth_attempts, last_attempt)
                    VALUES (%s, 0, CURRENT_TIMESTAMP)
                    ON CONFLICT (ip) DO UPDATE SET auth_attempts = 0, last_attempt = CURRENT_TIMESTAMP
                """, (source_ip,))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': frontend_domain,
                        **SECURITY_HEADERS
                    },
                    'body': json.dumps({
                        'success': True,
                        'token': token,
                        'expires_at': expires_at.isoformat()
                    }),
                    'isBase64Encoded': False
                }
            else:
                cur.execute("""
                    INSERT INTO rate_limit (ip, auth_attempts, last_attempt)
                    VALUES (%s, 1, CURRENT_TIMESTAMP)
                    ON CONFLICT (ip) DO UPDATE SET 
                        auth_attempts = rate_limit.auth_attempts + 1,
                        last_attempt = CURRENT_TIMESTAMP
                """, (source_ip,))
                
                conn.commit()
                
                return {
                    'statusCode': 401,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': frontend_domain,
                        'Access-Control-Allow-Credentials': 'true',
                        **SECURITY_HEADERS
                    },
                    'body': json.dumps({
                        'success': False,
                        'error': 'Неверный пароль'
                    }),
                    'isBase64Encoded': False
                }
        except Exception as e:
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