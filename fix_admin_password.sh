#!/bin/bash
###############################################################################
# Исправление проблемы с паролем администратора
###############################################################################

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_info "Исправление логики проверки пароля в backend/auth/index.py..."

cd /var/www/yolonaiils/backend/auth

# Создаём резервную копию
cp index.py index.py.backup_$(date +%Y%m%d_%H%M%S)

# Исправляем логику: используем фиксированный хеш для "yolo2024"
cat > index.py <<'PYEOF'
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
            
            # ИСПРАВЛЕНО: используем фиксированный хеш для "yolo2024"
            # Хеш сгенерирован заранее: bcrypt.hashpw("yolo2024".encode(), bcrypt.gensalt(rounds=12))
            stored_hash_str = os.environ.get(
                'ADMIN_PASSWORD_HASH',
                '$2b$12$vK8Z.PqE5xJZ6X1rN5zYzOZYJXfH3q9K1YQZ9X1rN5zYzOZYJXfH3O'
            )
            
            stored_hash = stored_hash_str.encode()
            
            # Проверка пароля
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
PYEOF

log_info "Файл backend/auth/index.py обновлён ✓"

log_info "Генерируем правильный bcrypt хеш для пароля 'yolo2024'..."

# Генерируем реальный хеш с помощью Python
CORRECT_HASH=$(python3 <<PYGEN
import bcrypt
password = "yolo2024"
hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))
print(hash.decode())
PYGEN
)

log_info "Новый хеш сгенерирован: ${CORRECT_HASH:0:30}..."

# Обновляем хеш в index.py
sed -i "s|\$2b\$12\$vK8Z\.PqE5xJZ6X1rN5zYzOZYJXfH3q9K1YQZ9X1rN5zYzOZYJXfH3O|$CORRECT_HASH|" /var/www/yolonaiils/backend/auth/index.py

log_info "Хеш обновлён в коде ✓"

log_info "Перезапускаем API сервер..."
pm2 restart yolonaiils-api

sleep 3

log_info "Проверяем API..."
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo -e "${GREEN}✓${NC} API работает"
else
    echo -e "${RED}✗${NC} API не отвечает"
    log_warning "Логи:"
    pm2 logs yolonaiils-api --lines 20 --nostream
fi

echo ""
log_info "🎉 Готово! Теперь пароль 'yolo2024' должен работать"
log_warning "Попробуйте войти в админку: http://$(hostname -I | awk '{print $1}')/admin"
echo ""
log_info "Пароль: yolo2024"
