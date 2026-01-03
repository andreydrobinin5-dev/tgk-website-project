#!/bin/bash
###############################################################################
# Обновление API на VPS после добавления новых функций
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

log_info "Обновление API сервера на VPS..."

cd /var/www/yolonaiils

log_info "Загружаем последние изменения из GitHub..."
git pull origin main

log_info "Устанавливаем зависимости для новых функций..."
cd api_server
source venv/bin/activate

pip install requests --upgrade

log_info "Перезапускаем API сервер..."
pm2 restart yolonaiils-api

sleep 3

log_info "Проверяем статус API..."
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo -e "${GREEN}✓${NC} API работает"
    
    # Показываем доступные handlers
    curl -s http://localhost:8000/health | python3 -m json.tool
else
    echo -e "${RED}✗${NC} API не отвечает"
    log_warning "Логи API:"
    pm2 logs yolonaiils-api --lines 20 --nostream
fi

echo ""
log_info "🎉 Готово! Все бэкенд функции обновлены"
log_info "Доступные endpoints:"
echo "  - POST /api/auth/login - Авторизация админа"
echo "  - GET /api/slots - Получение слотов"
echo "  - POST /api/bookings - Создание заявки"
echo "  - POST /api/payment - Подтверждение оплаты + Telegram"
echo "  - POST /api/telegram - Отправка уведомлений"
