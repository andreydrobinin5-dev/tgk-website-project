#!/bin/bash

###############################################################################
# YOLO NAIILS - Автоматический скрипт развертывания на VPS
# Ubuntu 24.04
###############################################################################

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Приветствие
clear
echo "================================================"
echo "   YOLO NAIILS - Скрипт развертывания на VPS"
echo "================================================"
echo ""

###############################################################################
# БЛОК 1: Сбор данных от пользователя
###############################################################################

log_info "Шаг 1: Сбор конфигурации"
echo ""

# Получаем IP автоматически
SERVER_IP=$(hostname -I | awk '{print $1}')
log_info "IP сервера определен автоматически: $SERVER_IP"
echo ""

# GitHub репозиторий
read -p "Введите URL вашего GitHub репозитория (например: https://github.com/username/repo.git): " GITHUB_REPO
echo ""

# База данных
log_info "Настройка базы данных PostgreSQL"
read -p "Введите имя базы данных [yolonaiils]: " DB_NAME
DB_NAME=${DB_NAME:-yolonaiils}

read -p "Введите имя пользователя БД [yolouser]: " DB_USER
DB_USER=${DB_USER:-yolouser}

read -sp "Введите пароль для БД (или оставьте пустым для автогенерации): " DB_PASSWORD
echo ""
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD="YoloNails2025!$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9')"
    log_info "Сгенерирован пароль БД: $DB_PASSWORD"
fi
echo ""

# S3 хранилище
log_info "Настройка S3 хранилища (Яндекс.Облако)"
read -p "Введите AWS_ACCESS_KEY_ID: " AWS_KEY
read -sp "Введите AWS_SECRET_ACCESS_KEY: " AWS_SECRET
echo ""
read -p "Введите имя S3 бакета: " AWS_BUCKET
echo ""

# Telegram
log_info "Настройка Telegram уведомлений"
read -p "Введите TELEGRAM_BOT_TOKEN: " TG_TOKEN
read -p "Введите TELEGRAM_CHAT_ID: " TG_CHAT
echo ""

# Подтверждение
echo "================================================"
echo "ПРОВЕРЬТЕ ДАННЫЕ:"
echo "================================================"
echo "IP сервера: $SERVER_IP"
echo "GitHub: $GITHUB_REPO"
echo "База данных: $DB_NAME"
echo "Пользователь БД: $DB_USER"
echo "Пароль БД: $DB_PASSWORD"
echo "S3 Bucket: $AWS_BUCKET"
echo "Telegram Bot: ${TG_TOKEN:0:20}..."
echo "Telegram Chat ID: $TG_CHAT"
echo "================================================"
echo ""

read -p "Всё верно? Продолжить установку? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    log_error "Установка отменена пользователем"
    exit 1
fi

###############################################################################
# БЛОК 2: Установка необходимого ПО
###############################################################################

log_info "Шаг 2: Обновление системы и установка ПО"
apt update
apt upgrade -y

log_info "Установка Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

log_info "Установка Nginx..."
apt install -y nginx

log_info "Установка PostgreSQL..."
apt install -y postgresql postgresql-contrib

log_info "Установка Python и зависимостей..."
apt install -y python3 python3-pip python3-venv

log_info "Установка PM2..."
npm install -g pm2

log_info "Установка Certbot..."
apt install -y certbot python3-certbot-nginx

log_info "Установка дополнительных утилит..."
apt install -y git curl wget unzip

log_info "Все пакеты установлены успешно ✓"
echo ""

###############################################################################
# БЛОК 3: Настройка PostgreSQL
###############################################################################

log_info "Шаг 3: Настройка базы данных PostgreSQL"

sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
EOF

log_info "База данных создана и настроена ✓"

# Проверка подключения
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    log_info "Подключение к БД проверено ✓"
else
    log_error "Ошибка подключения к БД"
    exit 1
fi
echo ""

###############################################################################
# БЛОК 4: Клонирование проекта
###############################################################################

log_info "Шаг 4: Клонирование проекта из GitHub"

if [ -d "/var/www/yolonaiils" ]; then
    log_warning "Папка /var/www/yolonaiils уже существует. Удаляю..."
    rm -rf /var/www/yolonaiils
fi

cd /var/www
git clone $GITHUB_REPO yolonaiils

if [ ! -d "/var/www/yolonaiils" ]; then
    log_error "Не удалось клонировать репозиторий"
    exit 1
fi

log_info "Проект клонирован ✓"
echo ""

###############################################################################
# БЛОК 5: Применение миграций БД
###############################################################################

log_info "Шаг 5: Применение миграций базы данных"

cd /var/www/yolonaiils

if [ -d "db_migrations" ]; then
    for migration in db_migrations/*.sql; do
        if [ -f "$migration" ]; then
            log_info "Применение миграции: $migration"
            psql "$DATABASE_URL" -f "$migration"
        fi
    done
    log_info "Миграции применены ✓"
else
    log_warning "Папка db_migrations не найдена"
fi
echo ""

###############################################################################
# БЛОК 6: Создание .env файла
###############################################################################

log_info "Шаг 6: Создание файла переменных окружения"

cat > /var/www/yolonaiils/.env <<EOF
# База данных
DATABASE_URL=$DATABASE_URL

# S3 хранилище (Яндекс.Облако)
AWS_ACCESS_KEY_ID=$AWS_KEY
AWS_SECRET_ACCESS_KEY=$AWS_SECRET
AWS_ENDPOINT_URL=https://storage.yandexcloud.net
AWS_BUCKET_NAME=$AWS_BUCKET

# Telegram уведомления
TELEGRAM_BOT_TOKEN=$TG_TOKEN
TELEGRAM_CHAT_ID=$TG_CHAT
EOF

chmod 600 /var/www/yolonaiils/.env
log_info "Файл .env создан и защищен ✓"
echo ""

###############################################################################
# БЛОК 7: Обновление URL в фронтенде
###############################################################################

log_info "Шаг 7: Обновление URL бэкенда в коде"

cd /var/www/yolonaiils

# Замена URL в Index.tsx
if [ -f "src/pages/Index.tsx" ]; then
    sed -i 's|https://functions\.poehali\.dev/9689b825-c9ac-49db-b85b-f1310460470d|/api/slots|g' src/pages/Index.tsx
    sed -i 's|https://functions\.poehali\.dev/406a4a18-71da-46ec-a8a4-efc9c7c87810|/api/bookings|g' src/pages/Index.tsx
    sed -i 's|https://functions\.poehali\.dev/07e0a713-f93f-4b65-b2a7-9c7d8d9afe18|/api/payment|g' src/pages/Index.tsx
    log_info "URL в Index.tsx обновлены ✓"
fi

# Замена URL в Admin.tsx
if [ -f "src/pages/Admin.tsx" ]; then
    sed -i 's|https://functions\.poehali\.dev/[a-f0-9-]*|/api|g' src/pages/Admin.tsx
    log_info "URL в Admin.tsx обновлены ✓"
fi

# Замена URL в компонентах админки
if [ -d "src/components/admin" ]; then
    find src/components/admin -name "*.tsx" -exec sed -i 's|https://functions\.poehali\.dev/[a-f0-9-]*|/api|g' {} \;
    log_info "URL в компонентах админки обновлены ✓"
fi

echo ""

###############################################################################
# БЛОК 8: Сборка фронтенда
###############################################################################

log_info "Шаг 8: Установка зависимостей и сборка фронтенда"

cd /var/www/yolonaiils
npm install
npm run build

if [ ! -d "dist" ]; then
    log_error "Ошибка сборки фронтенда (папка dist не создана)"
    exit 1
fi

log_info "Фронтенд собран ✓"
echo ""

###############################################################################
# БЛОК 9: Настройка API сервера
###############################################################################

log_info "Шаг 9: Настройка Python API сервера"

cd /var/www/yolonaiils
mkdir -p api_server
cd api_server

# Создание виртуального окружения
python3 -m venv venv
source venv/bin/activate

# Установка зависимостей
pip install --upgrade pip
pip install fastapi uvicorn psycopg2-binary pydantic boto3 python-multipart python-dotenv

# Создание main.py
cat > main.py <<'PYEOF'
import os
import json
import sys
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
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

from slots.index import handler as slots_handler
from bookings.index import handler as bookings_handler
from payment.index import handler as payment_handler

class Context:
    request_id = "vps-request"
    function_name = "api"
    function_version = "1.0"
    memory_limit_in_mb = 512

@app.get("/api/slots")
@app.options("/api/slots")
async def get_slots(request: Request):
    if request.method == "OPTIONS":
        return {"status": "ok"}
    
    event = {
        "httpMethod": "GET",
        "headers": dict(request.headers),
        "queryStringParameters": dict(request.query_params)
    }
    result = slots_handler(event, Context())
    return json.loads(result['body'])

@app.post("/api/bookings")
@app.options("/api/bookings")
async def create_booking(request: Request):
    if request.method == "OPTIONS":
        return {"status": "ok"}
    
    body = await request.body()
    event = {
        "httpMethod": "POST",
        "body": body.decode(),
        "headers": dict(request.headers)
    }
    result = bookings_handler(event, Context())
    return json.loads(result['body'])

@app.post("/api/payment")
@app.options("/api/payment")
async def confirm_payment(request: Request):
    if request.method == "OPTIONS":
        return {"status": "ok"}
    
    body = await request.body()
    event = {
        "httpMethod": "POST",
        "body": body.decode(),
        "headers": dict(request.headers)
    }
    result = payment_handler(event, Context())
    return json.loads(result['body'])

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "yolonaiils-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
PYEOF

log_info "API сервер настроен ✓"
echo ""

###############################################################################
# БЛОК 10: Запуск API через PM2
###############################################################################

log_info "Шаг 10: Запуск API через PM2"

cd /var/www/yolonaiils/api_server

# Остановка старого процесса если есть
pm2 delete yolonaiils-api 2>/dev/null || true

# Запуск нового
pm2 start "venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000" --name yolonaiils-api
pm2 save

# Автозапуск при перезагрузке
pm2 startup | tail -n 1 | bash

log_info "API сервер запущен ✓"
sleep 3

# Проверка
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    log_info "API работает корректно ✓"
else
    log_error "API не отвечает"
    pm2 logs yolonaiils-api --lines 20
    exit 1
fi
echo ""

###############################################################################
# БЛОК 11: Настройка Nginx
###############################################################################

log_info "Шаг 11: Настройка Nginx"

cat > /etc/nginx/sites-available/yolonaiils <<NGINXEOF
server {
    listen 80;
    server_name $SERVER_IP;

    root /var/www/yolonaiils/dist;
    index index.html;

    access_log /var/log/nginx/yolonaiils_access.log;
    error_log /var/log/nginx/yolonaiils_error.log;

    # API проксирование
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

    # Health check
    location /health {
        proxy_pass http://localhost:8000/health;
    }

    # Фронтенд (SPA)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Кеширование статики
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINXEOF

# Активация конфигурации
ln -sf /etc/nginx/sites-available/yolonaiils /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверка конфигурации
nginx -t
if [ $? -ne 0 ]; then
    log_error "Ошибка в конфигурации Nginx"
    exit 1
fi

systemctl restart nginx
log_info "Nginx настроен и перезапущен ✓"
echo ""

###############################################################################
# БЛОК 12: Финальная проверка
###############################################################################

log_info "Шаг 12: Финальная проверка установки"

echo ""
echo "================================================"
echo "   ПРОВЕРКА СЕРВИСОВ"
echo "================================================"

# PostgreSQL
if systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✓${NC} PostgreSQL: работает"
else
    echo -e "${RED}✗${NC} PostgreSQL: не работает"
fi

# Nginx
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓${NC} Nginx: работает"
else
    echo -e "${RED}✗${NC} Nginx: не работает"
fi

# API
if pm2 status | grep -q "yolonaiils-api.*online"; then
    echo -e "${GREEN}✓${NC} API сервер: работает"
else
    echo -e "${RED}✗${NC} API сервер: не работает"
fi

# Проверка HTTP
if curl -s http://localhost/ | grep -q "YOLO"; then
    echo -e "${GREEN}✓${NC} Фронтенд: загружается"
else
    echo -e "${RED}✗${NC} Фронтенд: не загружается"
fi

# Проверка API endpoints
if curl -s http://localhost/health | grep -q "healthy"; then
    echo -e "${GREEN}✓${NC} API Health: OK"
else
    echo -e "${RED}✗${NC} API Health: FAIL"
fi

echo "================================================"
echo ""

###############################################################################
# БЛОК 13: Итоговая информация
###############################################################################

log_info "УСТАНОВКА ЗАВЕРШЕНА!"
echo ""
echo "================================================"
echo "   ДАННЫЕ ДЛЯ ДОСТУПА"
echo "================================================"
echo ""
echo "🌐 САЙТ:"
echo "   http://$SERVER_IP"
echo ""
echo "🔧 АДМИНКА:"
echo "   http://$SERVER_IP/admin"
echo ""
echo "💾 БАЗА ДАННЫХ:"
echo "   URL: $DATABASE_URL"
echo "   Имя БД: $DB_NAME"
echo "   Пользователь: $DB_USER"
echo "   Пароль: $DB_PASSWORD"
echo ""
echo "📁 ПУТЬ К ПРОЕКТУ:"
echo "   /var/www/yolonaiils"
echo ""
echo "🔐 ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ:"
echo "   /var/www/yolonaiils/.env"
echo ""
echo "================================================"
echo ""
echo "📝 ПОЛЕЗНЫЕ КОМАНДЫ:"
echo ""
echo "# Просмотр логов API:"
echo "pm2 logs yolonaiils-api"
echo ""
echo "# Перезапуск API:"
echo "pm2 restart yolonaiils-api"
echo ""
echo "# Просмотр логов Nginx:"
echo "tail -f /var/log/nginx/yolonaiils_error.log"
echo ""
echo "# Обновление кода из GitHub:"
echo "cd /var/www/yolonaiils && git pull && npm run build && pm2 restart yolonaiils-api"
echo ""
echo "# Проверка статуса всех сервисов:"
echo "systemctl status nginx postgresql && pm2 status"
echo ""
echo "================================================"
echo ""
echo "🎉 Откройте в браузере: http://$SERVER_IP"
echo ""

# Сохранение информации в файл
cat > /root/yolonaiils_install_info.txt <<EOF
YOLO NAIILS - Информация об установке
======================================

Дата установки: $(date)
IP сервера: $SERVER_IP

САЙТ: http://$SERVER_IP
АДМИНКА: http://$SERVER_IP/admin

База данных:
  URL: $DATABASE_URL
  Имя БД: $DB_NAME
  Пользователь: $DB_USER
  Пароль: $DB_PASSWORD

S3:
  Bucket: $AWS_BUCKET
  Access Key: $AWS_KEY

Telegram:
  Bot Token: $TG_TOKEN
  Chat ID: $TG_CHAT

Пути:
  Проект: /var/www/yolonaiils
  .env файл: /var/www/yolonaiils/.env
  Nginx конфиг: /etc/nginx/sites-available/yolonaiils

Команды:
  Логи API: pm2 logs yolonaiils-api
  Перезапуск: pm2 restart yolonaiils-api
  Обновление: cd /var/www/yolonaiils && git pull && npm run build && pm2 restart yolonaiils-api
EOF

log_info "Информация сохранена в /root/yolonaiils_install_info.txt"
echo ""

log_info "Всё готово! 🚀"
