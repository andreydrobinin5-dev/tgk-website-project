#!/bin/bash
###############################################################################
# Диагностика проблемы с добавлением слотов (405 Method Not Allowed)
###############################################################################

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "========================================"
echo "   ДИАГНОСТИКА /api/slots POST"
echo "========================================"
echo ""

log_info "1. Проверка API health..."
curl -s http://localhost:8000/health | jq '.'
echo ""

log_info "2. Проверка GET /api/slots (должен работать)..."
curl -s http://localhost:8000/api/slots | jq '.' | head -20
echo ""

log_info "3. Тест POST /api/slots с токеном..."
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password": "yolo2024"}' | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  log_error "Не удалось получить токен авторизации"
  exit 1
fi

log_info "Токен получен: ${TOKEN:0:20}..."
echo ""

log_info "Отправляем POST запрос на создание слота..."
curl -v -X POST http://localhost:8000/api/slots \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: $TOKEN" \
  -d '{"date": "2026-01-10", "time": "14:00"}' 2>&1 | grep -E "(< HTTP|< Content-Type|\"error\"|\"message\"|\"id\")"

echo ""
echo ""

log_info "4. Проверка PM2 логов API сервера..."
pm2 logs yolonaiils-api --lines 30 --nostream

echo ""
log_info "5. Показываем структуру backend директории..."
ls -la /var/www/yolonaiils/backend/

echo ""
log_info "6. Проверяем содержимое slots handler..."
head -100 /var/www/yolonaiils/backend/slots/index.py

echo ""
echo "========================================"
log_info "Диагностика завершена"
echo "========================================"
