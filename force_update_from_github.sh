#!/bin/bash
###############################################################################
# Принудительное обновление с GitHub (сброс локальных изменений)
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
echo "   ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ"
echo "========================================"
echo ""

cd /var/www/yolonaiils

log_warning "Сбрасываем локальные изменения..."
git reset --hard HEAD

log_info "Получаем последний коммит из GitHub..."
git fetch origin

log_info "Переключаемся на последнюю версию main..."
git reset --hard origin/main

CURRENT_COMMIT=$(git rev-parse HEAD)
log_info "Текущий коммит: ${CURRENT_COMMIT:0:7}"

log_info "Проверяем исправленные файлы..."
echo ""
echo "Admin.tsx - строка 49 (должно быть /api/auth/login):"
sed -n '49p' src/pages/Admin.tsx
echo ""
echo "AdminSlots.tsx - строка 39 (должно быть /api/slots):"
sed -n '39p' src/components/admin/AdminSlots.tsx
echo ""
echo "AdminBookings.tsx - строка 42 (должно быть /api/bookings):"
sed -n '42p' src/components/admin/AdminBookings.tsx
echo ""

log_info "Устанавливаем зависимости..."
npm install

log_info "Пересобираем фронтенд..."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}[ERROR]${NC} Ошибка сборки!"
    exit 1
fi

log_info "Перезапускаем Nginx..."
systemctl restart nginx

sleep 2

log_info "Тестируем авторизацию..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"password": "yolo2024"}')

echo ""
if echo "$AUTH_RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓✓✓ АВТОРИЗАЦИЯ РАБОТАЕТ! ✓✓✓${NC}"
    echo ""
    echo "Получен токен:"
    echo "$AUTH_RESPONSE" | python3 -m json.tool | grep -E '(success|token|expires)' | head -3
else
    echo -e "${RED}✗ Авторизация НЕ работает${NC}"
    echo "Ответ: $AUTH_RESPONSE"
fi

echo ""
echo "========================================"
log_info "🎉 Обновление завершено!"
echo "========================================"
echo ""
echo "Откройте админку: http://$(hostname -I | awk '{print $1}')/admin"
echo "Пароль: yolo2024"
echo ""
log_warning "⚠️ ВАЖНО: Откройте в режиме ИНКОГНИТО или очистите кеш!"
echo ""
