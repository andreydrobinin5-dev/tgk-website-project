#!/bin/bash
###############################################################################
# Полное обновление проекта на VPS после коммита
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

echo "========================================"
echo "   ПОЛНОЕ ОБНОВЛЕНИЕ ПРОЕКТА"
echo "========================================"
echo ""

cd /var/www/yolonaiils

log_info "1. Загружаем последние изменения из GitHub..."
git fetch origin
CURRENT_COMMIT=$(git rev-parse HEAD)
LATEST_COMMIT=$(git rev-parse origin/main)

if [ "$CURRENT_COMMIT" == "$LATEST_COMMIT" ]; then
    log_warning "Уже на последнем коммите: ${CURRENT_COMMIT:0:7}"
else
    log_info "Обновляем с ${CURRENT_COMMIT:0:7} → ${LATEST_COMMIT:0:7}"
    git pull origin main
fi

log_info "2. Обновляем зависимости фронтенда..."
npm install

log_info "3. Пересобираем фронтенд..."
npm run build

if [ ! -d "dist" ]; then
    log_error "Ошибка сборки фронтенда!"
    exit 1
fi

log_info "4. Обновляем Python зависимости API..."
cd api_server
source venv/bin/activate
pip install --upgrade psycopg2-binary pydantic python-multipart python-dotenv requests bcrypt

log_info "5. Перезапускаем API сервер..."
pm2 restart yolonaiils-api

sleep 3

log_info "6. Перезапускаем Nginx..."
systemctl restart nginx

log_info "7. Проверяем статус сервисов..."
echo ""

# Проверка API
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo -e "${GREEN}✓${NC} API работает"
else
    echo -e "${RED}✗${NC} API не работает"
    log_warning "Логи:"
    pm2 logs yolonaiils-api --lines 20 --nostream
fi

# Проверка авторизации
AUTH_TEST=$(curl -s -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"password": "yolo2024"}')

if echo "$AUTH_TEST" | grep -q "success.*true"; then
    echo -e "${GREEN}✓${NC} Авторизация работает (пароль: yolo2024)"
else
    echo -e "${RED}✗${NC} Авторизация не работает"
    echo "Ответ: $AUTH_TEST"
fi

# Проверка фронтенда
if curl -s http://localhost/ | grep -q "YOLO"; then
    echo -e "${GREEN}✓${NC} Фронтенд загружается"
else
    echo -e "${RED}✗${NC} Фронтенд не загружается"
fi

echo ""
log_info "🎉 Обновление завершено!"
log_info "🌐 Сайт: http://$(hostname -I | awk '{print $1}')"
log_info "🔑 Админка: http://$(hostname -I | awk '{print $1}')/admin"
log_info "🔐 Пароль: yolo2024"
echo ""
log_warning "⚠️ Если пароль всё ещё не работает:"
echo "  1. Очистите кеш браузера (Ctrl+Shift+Delete)"
echo "  2. Попробуйте в режиме инкогнито"
echo "  3. Проверьте консоль браузера (F12)"
