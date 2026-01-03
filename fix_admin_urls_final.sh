#!/bin/bash
###############################################################################
# Финальное исправление URL админки после коммита 32cf712
###############################################################################

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo "========================================"
echo "   ИСПРАВЛЕНИЕ URL АДМИНКИ"
echo "========================================"
echo ""

cd /var/www/yolonaiils

log_info "1. Получаем последний коммит из GitHub..."
git fetch origin
git pull origin main

log_info "2. Устанавливаем зависимости..."
npm install

log_info "3. Пересобираем фронтенд..."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}[ERROR]${NC} Ошибка сборки!"
    exit 1
fi

log_info "4. Перезапускаем Nginx..."
systemctl restart nginx

log_info "5. Тестируем авторизацию..."
sleep 2

AUTH_RESPONSE=$(curl -s -X POST http://localhost/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"password": "yolo2024"}')

if echo "$AUTH_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓${NC} Авторизация работает!"
    echo ""
    echo "Ответ сервера:"
    echo "$AUTH_RESPONSE" | python3 -m json.tool
else
    echo -e "${RED}✗${NC} Авторизация не работает"
    echo "Ответ: $AUTH_RESPONSE"
fi

echo ""
log_info "🎉 Готово!"
echo ""
echo "Теперь попробуйте:"
echo "  1. Откройте http://$(hostname -I | awk '{print $1}')/admin в режиме инкогнито"
echo "  2. Введите пароль: yolo2024"
echo "  3. Откройте консоль браузера (F12 → Network)"
echo ""
echo "Должен уйти запрос:"
echo "  POST http://$(hostname -I | awk '{print $1}')/api/auth/login"
echo ""
