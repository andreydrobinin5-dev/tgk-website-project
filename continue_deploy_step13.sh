#!/bin/bash

###############################################################################
# YOLO NAIILS - Продолжение деплоя с шага 13
# Используйте этот скрипт если основной деплой остановился на шаге 13
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================================"
echo "   YOLO NAIILS - Продолжение с шага 13"
echo "================================================"
echo ""

# Проверка наличия проекта
if [ ! -d "/var/www/yolonaiils" ]; then
    echo -e "${RED}[ERROR]${NC} Проект не найден в /var/www/yolonaiils"
    exit 1
fi

# Установка python3-venv
echo -e "${GREEN}[INFO]${NC} Установка python3-venv..."
apt install -y python3.12-venv

# Шаг 13: Настройка Python API
echo -e "${GREEN}[INFO]${NC} Шаг 13: Настройка Python API сервера"

cd /var/www/yolonaiils
mkdir -p api_server
cd api_server

# Удаляем битое виртуальное окружение если есть
rm -rf venv

# Создаём виртуальное окружение
python3 -m venv venv
echo -e "${GREEN}✓${NC} Виртуальное окружение создано"

# Активируем
source venv/bin/activate

# Устанавливаем зависимости
pip install --upgrade pip
pip install fastapi uvicorn psycopg2-binary pydantic python-multipart python-dotenv requests bcrypt
echo -e "${GREEN}✓${NC} Python зависимости установлены"

# Создаём main.py
cat > main.py <<'PYEOF'
import os
import json
import sys
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv('/var/www/yolonaiils/.env')

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sys.path.insert(0, '/var/www/yolonaiils/backend')

# Динамический импорт handlers с обработкой ошибок
handlers = {}

try:
    from slots.index import handler as slots_handler
    handlers['slots'] = slots_handler
except ImportError as e:
    print(f"⚠️ slots handler не найден: {e}")
    handlers['slots'] = None

try:
    from bookings.index import handler as bookings_handler
    handlers['bookings'] = bookings_handler
except ImportError as e:
    print(f"⚠️ bookings handler не найден: {e}")
    handlers['bookings'] = None

try:
    from payment.index import handler as payment_handler
    handlers['payment'] = payment_handler
except ImportError as e:
    print(f"⚠️ payment handler не найден: {e}")
    handlers['payment'] = None

try:
    from auth.index import handler as auth_handler
    handlers['auth'] = auth_handler
except ImportError:
    handlers['auth'] = None

try:
    from telegram.index import handler as telegram_handler
    handlers['telegram'] = telegram_handler
except ImportError:
    handlers['telegram'] = None

class Context:
    request_id = "vps-request"
    function_name = "api"
    function_version = "1.0"
    memory_limit_in_mb = 512

def create_error_response(message: str):
    return JSONResponse(
        status_code=503,
        content={"error": message, "available": list(handlers.keys())}
    )

@app.get("/api/slots")
@app.options("/api/slots")
async def get_slots(request: Request):
    if request.method == "OPTIONS":
        return {"status": "ok"}
    
    if not handlers.get('slots'):
        return create_error_response("Slots handler не доступен")
    
    event = {
        "httpMethod": "GET",
        "headers": dict(request.headers),
        "queryStringParameters": dict(request.query_params)
    }
    result = handlers['slots'](event, Context())
    return json.loads(result['body'])

@app.post("/api/bookings")
@app.options("/api/bookings")
async def create_booking(request: Request):
    if request.method == "OPTIONS":
        return {"status": "ok"}
    
    if not handlers.get('bookings'):
        return create_error_response("Bookings handler не доступен")
    
    body = await request.body()
    event = {
        "httpMethod": "POST",
        "body": body.decode(),
        "headers": dict(request.headers)
    }
    result = handlers['bookings'](event, Context())
    return json.loads(result['body'])

@app.get("/api/bookings")
@app.delete("/api/bookings/{booking_id}")
async def manage_bookings(request: Request, booking_id: int = None):
    if not handlers.get('bookings'):
        return create_error_response("Bookings handler не доступен")
    
    event = {
        "httpMethod": request.method,
        "headers": dict(request.headers),
        "queryStringParameters": dict(request.query_params),
        "pathParameters": {"id": booking_id} if booking_id else {}
    }
    result = handlers['bookings'](event, Context())
    return json.loads(result['body'])

@app.post("/api/payment")
@app.options("/api/payment")
async def confirm_payment(request: Request):
    if request.method == "OPTIONS":
        return {"status": "ok"}
    
    if not handlers.get('payment'):
        body = await request.body()
        data = json.loads(body.decode())
        return {
            "success": True,
            "message": "Payment endpoint (stub)",
            "data": data
        }
    
    body = await request.body()
    event = {
        "httpMethod": "POST",
        "body": body.decode(),
        "headers": dict(request.headers)
    }
    result = handlers['payment'](event, Context())
    return json.loads(result['body'])

@app.post("/api/auth/login")
@app.options("/api/auth/login")
async def login(request: Request):
    if request.method == "OPTIONS":
        return {"status": "ok"}
    
    if not handlers.get('auth'):
        return create_error_response("Auth handler не доступен")
    
    body = await request.body()
    event = {
        "httpMethod": "POST",
        "body": body.decode(),
        "headers": dict(request.headers)
    }
    result = handlers['auth'](event, Context())
    return JSONResponse(
        status_code=result.get('statusCode', 200),
        content=json.loads(result['body']),
        headers=result.get('headers', {})
    )

@app.get("/health")
async def health():
    available_handlers = [k for k, v in handlers.items() if v is not None]
    return {
        "status": "healthy",
        "service": "yolonaiils-api",
        "storage": "local",
        "handlers": available_handlers
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
PYEOF

echo -e "${GREEN}✓${NC} main.py создан"

# Шаг 14: Запуск через PM2
echo -e "${GREEN}[INFO]${NC} Шаг 14: Запуск API через PM2"

pm2 delete yolonaiils-api 2>/dev/null || true
pm2 start "venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000" --name yolonaiils-api
pm2 save

# Настройка автозапуска
STARTUP_COMMAND=$(pm2 startup systemd -u root --hp /root 2>/dev/null | grep 'sudo' | head -1)
if [ -n "$STARTUP_COMMAND" ]; then
    eval "$STARTUP_COMMAND"
    echo -e "${GREEN}✓${NC} Автозапуск PM2 настроен"
fi

echo -e "${GREEN}✓${NC} API запущен через PM2"

sleep 5

# Проверка API
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo -e "${GREEN}✓${NC} API работает корректно"
else
    echo -e "${RED}✗${NC} API не отвечает"
    pm2 logs yolonaiils-api --lines 30 --nostream
fi

# Шаг 15: Nginx
echo -e "${GREEN}[INFO]${NC} Шаг 15: Настройка Nginx"

SERVER_IP=$(hostname -I | awk '{print $1}')

cat > /etc/nginx/sites-available/yolonaiils <<NGINXEOF
server {
    listen 80;
    server_name $SERVER_IP;

    root /var/www/yolonaiils/dist;
    index index.html;

    access_log /var/log/nginx/yolonaiils_access.log;
    error_log /var/log/nginx/yolonaiils_error.log;

    location /storage/ {
        alias /var/www/yolonaiils_storage/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /health {
        proxy_pass http://localhost:8000/health;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/yolonaiils /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl restart nginx

echo -e "${GREEN}✓${NC} Nginx настроен и перезапущен"

# Финальная проверка
echo ""
echo "================================================"
echo "   ПРОВЕРКА СЕРВИСОВ"
echo "================================================"

if systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✓${NC} PostgreSQL: работает"
else
    echo -e "${RED}✗${NC} PostgreSQL: не работает"
fi

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓${NC} Nginx: работает"
else
    echo -e "${RED}✗${NC} Nginx: не работает"
fi

if pm2 status | grep -q "yolonaiils-api.*online"; then
    echo -e "${GREEN}✓${NC} API сервер: работает"
else
    echo -e "${RED}✗${NC} API сервер: не работает"
fi

if curl -s http://localhost/ | grep -q "YOLO"; then
    echo -e "${GREEN}✓${NC} Фронтенд: загружается"
else
    echo -e "${RED}✗${NC} Фронтенд: не загружается"
fi

if curl -s http://localhost/health | grep -q "healthy"; then
    echo -e "${GREEN}✓${NC} API Health: OK"
else
    echo -e "${RED}✗${NC} API Health: FAIL"
fi

echo ""
echo "================================================"
echo "   ✅ УСТАНОВКА ЗАВЕРШЕНА!"
echo "================================================"
echo ""
echo "🌐 САЙТ: http://$SERVER_IP"
echo "🔧 АДМИНКА: http://$SERVER_IP/admin"
echo ""
echo "📝 Полезные команды:"
echo "  pm2 logs yolonaiils-api"
echo "  pm2 restart yolonaiils-api"
echo "  tail -f /var/log/nginx/yolonaiils_error.log"
echo ""
