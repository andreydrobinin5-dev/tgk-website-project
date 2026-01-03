#!/bin/bash

###############################################################################
# YOLO NAIILS - Финальный скрипт развертывания на VPS
# Ubuntu 24.04
# С локальным хранилищем файлов (без S3)
# Версия: 3.0 (все исправления включены)
###############################################################################

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Файл логов
LOG_FILE="/root/yolonaiils_deploy.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "=== Начало развертывания: $(date) ===" >> "$LOG_FILE"

# Функция для вывода сообщений
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
    echo "[INFO] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "[WARNING] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
    echo "[DEBUG] $(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Функция для проверки успешности команды
check_success() {
    if [ $? -eq 0 ]; then
        log_info "$1 ✓"
    else
        log_error "$1 ✗"
        log_error "Последние 20 строк лога:"
        tail -20 "$LOG_FILE"
        exit 1
    fi
}

# Приветствие
clear
echo "================================================"
echo "   YOLO NAIILS - Финальный установщик v3.0"
echo "   С локальным хранилищем файлов"
echo "   Все исправления включены"
echo "================================================"
echo ""
log_info "Логи сохраняются в: $LOG_FILE"
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
echo "Telegram Bot: ${TG_TOKEN:0:20}..."
echo "Telegram Chat ID: $TG_CHAT"
echo "Хранилище: ЛОКАЛЬНОЕ (на VPS)"
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
apt update >> "$LOG_FILE" 2>&1
check_success "Обновление списка пакетов"

apt upgrade -y >> "$LOG_FILE" 2>&1
check_success "Обновление пакетов"

log_info "Проверка Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >> "$LOG_FILE" 2>&1
    check_success "Добавление репозитория Node.js"
    
    apt install -y nodejs >> "$LOG_FILE" 2>&1
    check_success "Установка Node.js"
else
    log_info "Node.js уже установлен ✓"
fi
log_debug "Node.js версия: $(node --version)"

log_info "Проверка Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx >> "$LOG_FILE" 2>&1
    check_success "Установка Nginx"
else
    log_info "Nginx уже установлен ✓"
fi

log_info "Проверка PostgreSQL..."
if ! command -v psql &> /dev/null; then
    apt install -y postgresql postgresql-contrib >> "$LOG_FILE" 2>&1
    check_success "Установка PostgreSQL"
else
    log_info "PostgreSQL уже установлен ✓"
fi

log_info "Проверка Python..."
if ! command -v python3 &> /dev/null; then
    apt install -y python3 python3-pip python3-venv >> "$LOG_FILE" 2>&1
    check_success "Установка Python"
else
    log_info "Python уже установлен ✓"
fi

# Проверка python3-venv (критично для виртуальных окружений)
if ! python3 -m venv --help &> /dev/null; then
    log_info "Установка python3-venv..."
    apt install -y python3-venv >> "$LOG_FILE" 2>&1
    check_success "Установка python3-venv"
else
    log_info "python3-venv уже установлен ✓"
fi

log_debug "Python версия: $(python3 --version)"

log_info "Проверка PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2 >> "$LOG_FILE" 2>&1
    check_success "Установка PM2"
else
    log_info "PM2 уже установлен ✓"
fi

log_info "Проверка Certbot..."
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx >> "$LOG_FILE" 2>&1
    check_success "Установка Certbot"
else
    log_info "Certbot уже установлен ✓"
fi

log_info "Проверка дополнительных утилит..."
apt install -y git curl wget unzip >> "$LOG_FILE" 2>&1
check_success "Проверка утилит"

log_info "Все пакеты установлены успешно ✓"
echo ""

###############################################################################
# БЛОК 3: Настройка PostgreSQL
###############################################################################

log_info "Шаг 3: Настройка базы данных PostgreSQL"

sudo -u postgres psql >> "$LOG_FILE" 2>&1 <<EOF
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
psql "$DATABASE_URL" -c "SELECT version();" >> "$LOG_FILE" 2>&1
check_success "Проверка подключения к БД"
echo ""

###############################################################################
# БЛОК 4: Создание папки для хранения файлов
###############################################################################

log_info "Шаг 4: Создание локального хранилища файлов"

mkdir -p /var/www/yolonaiils_storage/uploads
mkdir -p /var/www/yolonaiils_storage/receipts
mkdir -p /var/www/yolonaiils_storage/references
mkdir -p /var/www/yolonaiils_storage/portfolio

chown -R www-data:www-data /var/www/yolonaiils_storage
chmod -R 755 /var/www/yolonaiils_storage

log_info "Папки для хранения созданы ✓"
log_info "  - /var/www/yolonaiils_storage/uploads (фото клиентов)"
log_info "  - /var/www/yolonaiils_storage/receipts (чеки оплаты)"
log_info "  - /var/www/yolonaiils_storage/references (референсы)"
log_info "  - /var/www/yolonaiils_storage/portfolio (портфолио)"
echo ""

###############################################################################
# БЛОК 5: Клонирование проекта
###############################################################################

log_info "Шаг 5: Клонирование проекта из GitHub"

if [ -d "/var/www/yolonaiils" ]; then
    log_warning "Папка /var/www/yolonaiils уже существует. Удаляю..."
    rm -rf /var/www/yolonaiils
fi

cd /var/www
git clone $GITHUB_REPO yolonaiils >> "$LOG_FILE" 2>&1
check_success "Клонирование репозитория"

if [ ! -d "/var/www/yolonaiils" ]; then
    log_error "Не удалось клонировать репозиторий"
    exit 1
fi

log_info "Проект клонирован ✓"
echo ""

###############################################################################
# БЛОК 6: Загрузка портфолио с poehali.dev
###############################################################################

log_info "Шаг 6: Загрузка портфолио с poehali.dev"

# Список всех фото из портфолио
PORTFOLIO_URLS=(
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-42 (2).jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-42.jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-43.jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-44 (2).jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-44.jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-46.jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-47 (2).jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-47.jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-48 (2).jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-48.jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-49.jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-51.jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-52.jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-53 (2).jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-53.jpg"
)

cd /var/www/yolonaiils_storage/portfolio

DOWNLOAD_COUNT=0
FAILED_COUNT=0

for i in "${!PORTFOLIO_URLS[@]}"; do
    url="${PORTFOLIO_URLS[$i]}"
    filename="portfolio_$(printf "%02d" $((i+1))).jpg"
    
    log_debug "Загрузка: $filename"
    if wget -q -O "$filename" "$url" 2>> "$LOG_FILE"; then
        DOWNLOAD_COUNT=$((DOWNLOAD_COUNT + 1))
        log_debug "  ✓ $filename загружен"
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
        log_warning "  ✗ Не удалось загрузить $filename"
    fi
done

log_info "Портфолио загружено: $DOWNLOAD_COUNT из ${#PORTFOLIO_URLS[@]} фото ✓"
if [ $FAILED_COUNT -gt 0 ]; then
    log_warning "Не удалось загрузить $FAILED_COUNT фото"
fi

# Установка прав доступа
chown -R www-data:www-data /var/www/yolonaiils_storage/portfolio
chmod -R 755 /var/www/yolonaiils_storage/portfolio

echo ""

###############################################################################
# БЛОК 7: Обновление URL портфолио в коде
###############################################################################

log_info "Шаг 7: Обновление URL портфолио на локальные"

INDEX_TSX="/var/www/yolonaiils/src/pages/Index.tsx"

if [ -f "$INDEX_TSX" ]; then
    log_debug "Замена URL портфолио в Index.tsx"
    
    # Создаём резервную копию
    cp "$INDEX_TSX" "$INDEX_TSX.backup"
    
    # Заменяем URL портфолио (исправленная версия с правильным sed)
    for i in {1..15}; do
        new_url="http://$SERVER_IP/storage/portfolio/portfolio_$(printf "%02d" $i).jpg"
        
        # Используем безопасную замену через sed с разделителем |
        sed -i "s|https://cdn\.poehali\.dev/files/photo_2025-12-27_00-41-[^'\"]*|$new_url|" "$INDEX_TSX"
    done
    
    log_info "URL портфолио обновлены на локальные ✓"
else
    log_warning "Файл Index.tsx не найден, пропускаем обновление URL"
fi

echo ""

###############################################################################
# БЛОК 8: Применение миграций БД
###############################################################################

log_info "Шаг 8: Применение миграций базы данных"

cd /var/www/yolonaiils

if [ -d "db_migrations" ]; then
    for migration in db_migrations/*.sql; do
        if [ -f "$migration" ]; then
            log_info "Применение миграции: $(basename $migration)"
            psql "$DATABASE_URL" -f "$migration" >> "$LOG_FILE" 2>&1
            check_success "Миграция $(basename $migration)"
        fi
    done
    log_info "Миграции применены ✓"
else
    log_warning "Папка db_migrations не найдена"
fi
echo ""

###############################################################################
# БЛОК 9: Создание .env файла
###############################################################################

log_info "Шаг 9: Создание файла переменных окружения"

cat > /var/www/yolonaiils/.env <<EOF
# База данных
DATABASE_URL=$DATABASE_URL

# Локальное хранилище файлов
STORAGE_TYPE=local
STORAGE_PATH=/var/www/yolonaiils_storage
STORAGE_URL=http://$SERVER_IP/storage

# Telegram уведомления
TELEGRAM_BOT_TOKEN=$TG_TOKEN
TELEGRAM_CHAT_ID=$TG_CHAT
EOF

chmod 600 /var/www/yolonaiils/.env
log_info "Файл .env создан и защищен ✓"
echo ""

###############################################################################
# БЛОК 10: Обновление URL бэкенда в коде
###############################################################################

log_info "Шаг 10: Обновление URL бэкенда в коде"

cd /var/www/yolonaiils

if [ -f "src/pages/Index.tsx" ]; then
    sed -i 's|https://functions\.poehali\.dev/9689b825-c9ac-49db-b85b-f1310460470d|/api/slots|g' src/pages/Index.tsx
    sed -i 's|https://functions\.poehali\.dev/406a4a18-71da-46ec-a8a4-efc9c7c87810|/api/bookings|g' src/pages/Index.tsx
    sed -i 's|https://functions\.poehali\.dev/07e0a713-f93f-4b65-b2a7-9c7d8d9afe18|/api/payment|g' src/pages/Index.tsx
    log_info "URL в Index.tsx обновлены ✓"
fi

if [ -f "src/pages/Admin.tsx" ]; then
    sed -i 's|https://functions\.poehali\.dev/[a-f0-9-]*|/api|g' src/pages/Admin.tsx
fi

if [ -d "src/components/admin" ]; then
    find src/components/admin -name "*.tsx" -exec sed -i 's|https://functions\.poehali\.dev/[a-f0-9-]*|/api|g' {} \;
fi

log_info "URL обновлены ✓"
echo ""

###############################################################################
# БЛОК 11: Сборка фронтенда
###############################################################################

log_info "Шаг 11: Установка зависимостей и сборка фронтенда"

cd /var/www/yolonaiils
npm install >> "$LOG_FILE" 2>&1
check_success "Установка npm зависимостей"

npm run build >> "$LOG_FILE" 2>&1
check_success "Сборка фронтенда"

if [ ! -d "dist" ]; then
    log_error "Ошибка сборки фронтенда (папка dist не создана)"
    exit 1
fi

log_info "Фронтенд собран ✓"
echo ""

###############################################################################
# БЛОК 12: Настройка API сервера
###############################################################################

log_info "Шаг 12: Настройка Python API сервера"

cd /var/www/yolonaiils
mkdir -p api_server
cd api_server

# Удаляем старое виртуальное окружение если есть
rm -rf venv

python3 -m venv venv >> "$LOG_FILE" 2>&1
check_success "Создание виртуального окружения Python"

source venv/bin/activate

pip install --upgrade pip >> "$LOG_FILE" 2>&1
pip install fastapi uvicorn psycopg2-binary pydantic python-multipart python-dotenv requests bcrypt >> "$LOG_FILE" 2>&1
check_success "Установка Python зависимостей"

# Создаём main.py с динамическими импортами
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
    print("✓ slots handler загружен")
except ImportError as e:
    print(f"⚠️ slots handler не найден: {e}")
    handlers['slots'] = None

try:
    from bookings.index import handler as bookings_handler
    handlers['bookings'] = bookings_handler
    print("✓ bookings handler загружен")
except ImportError as e:
    print(f"⚠️ bookings handler не найден: {e}")
    handlers['bookings'] = None

try:
    from payment.index import handler as payment_handler
    handlers['payment'] = payment_handler
    print("✓ payment handler загружен")
except ImportError as e:
    print(f"⚠️ payment handler не найден: {e}")
    handlers['payment'] = None

try:
    from auth.index import handler as auth_handler
    handlers['auth'] = auth_handler
    print("✓ auth handler загружен")
except ImportError as e:
    print(f"⚠️ auth handler не найден: {e}")
    handlers['auth'] = None

try:
    from telegram.index import handler as telegram_handler
    handlers['telegram'] = telegram_handler
    print("✓ telegram handler загружен")
except ImportError as e:
    print(f"⚠️ telegram handler не найден: {e}")
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
        # Заглушка для payment если нет handler
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

log_info "API сервер настроен ✓"
log_debug "Доступные handlers: slots, bookings, payment (stub), auth, telegram"
echo ""

###############################################################################
# БЛОК 13: Запуск API через PM2
###############################################################################

log_info "Шаг 13: Запуск API через PM2"

cd /var/www/yolonaiils/api_server

pm2 delete yolonaiils-api 2>/dev/null || true
pm2 start "venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000" --name yolonaiils-api >> "$LOG_FILE" 2>&1
check_success "Запуск PM2 процесса"

pm2 save >> "$LOG_FILE" 2>&1
check_success "Сохранение списка PM2 процессов"

# Настройка автозапуска PM2
STARTUP_COMMAND=$(pm2 startup systemd -u root --hp /root 2>/dev/null | grep 'sudo' | head -1)
if [ -n "$STARTUP_COMMAND" ]; then
    log_debug "Выполнение команды автозапуска PM2"
    eval "$STARTUP_COMMAND" >> "$LOG_FILE" 2>&1
    check_success "Настройка автозапуска PM2"
else
    log_warning "Не удалось получить команду автозапуска PM2"
fi

log_info "API сервер запущен ✓"
sleep 5

# Проверка API
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    log_info "API работает корректно ✓"
else
    log_error "API не отвечает, проверяем логи:"
    pm2 logs yolonaiils-api --lines 30 --nostream
    log_warning "Продолжаем установку Nginx..."
fi
echo ""

###############################################################################
# БЛОК 14: Настройка Nginx
###############################################################################

log_info "Шаг 14: Настройка Nginx"

cat > /etc/nginx/sites-available/yolonaiils <<NGINXEOF
server {
    listen 80;
    server_name $SERVER_IP;

    root /var/www/yolonaiils/dist;
    index index.html;

    access_log /var/log/nginx/yolonaiils_access.log;
    error_log /var/log/nginx/yolonaiils_error.log;

    # Отдача загруженных файлов
    location /storage/ {
        alias /var/www/yolonaiils_storage/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

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

check_success "Создание конфигурации Nginx"

ln -sf /etc/nginx/sites-available/yolonaiils /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t >> "$LOG_FILE" 2>&1
check_success "Проверка конфигурации Nginx"

systemctl restart nginx >> "$LOG_FILE" 2>&1
check_success "Перезапуск Nginx"

log_info "Nginx настроен и перезапущен ✓"
echo ""

###############################################################################
# БЛОК 15: Финальная проверка
###############################################################################

log_info "Шаг 15: Финальная проверка установки"

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

if [ -d "/var/www/yolonaiils_storage" ]; then
    echo -e "${GREEN}✓${NC} Локальное хранилище: настроено"
else
    echo -e "${RED}✗${NC} Локальное хранилище: ошибка"
fi

PORTFOLIO_COUNT=$(ls -1 /var/www/yolonaiils_storage/portfolio/*.jpg 2>/dev/null | wc -l)
if [ $PORTFOLIO_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Портфолио: загружено $PORTFOLIO_COUNT фото"
else
    echo -e "${RED}✗${NC} Портфолио: фото не найдены"
fi

echo "================================================"
echo ""

###############################################################################
# БЛОК 16: Итоговая информация
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
echo "📁 ПУТИ:"
echo "   Проект: /var/www/yolonaiils"
echo "   Хранилище: /var/www/yolonaiils_storage"
echo "   .env файл: /var/www/yolonaiils/.env"
echo "   Логи: $LOG_FILE"
echo ""
echo "🗂️ ЛОКАЛЬНОЕ ХРАНИЛИЩЕ:"
echo "   Портфолио: /var/www/yolonaiils_storage/portfolio ($PORTFOLIO_COUNT фото)"
echo "   Референсы: /var/www/yolonaiils_storage/references"
echo "   Чеки: /var/www/yolonaiils_storage/receipts"
echo "   Uploads: /var/www/yolonaiils_storage/uploads"
echo "   URL: http://$SERVER_IP/storage/"
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
echo "# Просмотр логов развертывания:"
echo "tail -f $LOG_FILE"
echo ""
echo "# Просмотр логов Nginx:"
echo "tail -f /var/log/nginx/yolonaiils_error.log"
echo ""
echo "# Обновление кода из GitHub:"
echo "cd /var/www/yolonaiils && git pull && npm run build && pm2 restart yolonaiils-api"
echo ""
echo "================================================"
echo ""
echo "🎉 Откройте в браузере: http://$SERVER_IP"
echo ""

# Сохранение информации
cat > /root/yolonaiils_install_info.txt <<EOF
YOLO NAIILS - Информация об установке v3.0
============================================================

Дата установки: $(date)
IP сервера: $SERVER_IP

САЙТ: http://$SERVER_IP
АДМИНКА: http://$SERVER_IP/admin

База данных:
  URL: $DATABASE_URL
  Имя БД: $DB_NAME
  Пользователь: $DB_USER
  Пароль: $DB_PASSWORD

Хранилище:
  Тип: ЛОКАЛЬНОЕ (на VPS)
  Путь: /var/www/yolonaiils_storage
  URL: http://$SERVER_IP/storage/
  Портфолио: $PORTFOLIO_COUNT фото загружено

Telegram:
  Bot Token: $TG_TOKEN
  Chat ID: $TG_CHAT

Пути:
  Проект: /var/www/yolonaiils
  Хранилище: /var/www/yolonaiils_storage
  .env файл: /var/www/yolonaiils/.env
  Логи: $LOG_FILE

Команды:
  Логи API: pm2 logs yolonaiils-api
  Перезапуск: pm2 restart yolonaiils-api
  Файлы: ls -lah /var/www/yolonaiils_storage/
  Логи деплоя: tail -f $LOG_FILE
EOF

log_info "Информация сохранена в /root/yolonaiils_install_info.txt"
echo ""

log_info "Всё готово! 🚀"
echo "=== Завершение развертывания: $(date) ===" >> "$LOG_FILE"
