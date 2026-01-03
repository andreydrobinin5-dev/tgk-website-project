#!/bin/bash
###############################################################################
# Диагностика проблемы с авторизацией и API
###############################################################################

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "========================================"
echo "   ДИАГНОСТИКА ПРОБЛЕМЫ"
echo "========================================"
echo ""

# 1. Проверка API health
log_info "1. Проверка API health endpoint..."
if curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null; then
    echo ""
else
    log_error "API не отвечает на /health"
    echo ""
fi

# 2. Проверка логов PM2
log_info "2. Логи PM2 (последние 30 строк)..."
pm2 logs yolonaiils-api --lines 30 --nostream
echo ""

# 3. Проверка файла backend/auth/index.py
log_info "3. Проверка файла backend/auth/index.py..."
if [ -f "/var/www/yolonaiils/backend/auth/index.py" ]; then
    log_debug "Файл существует"
    
    # Показываем строку с хешем
    log_debug "Хеш в коде (строка 88-90):"
    sed -n '88,90p' /var/www/yolonaiils/backend/auth/index.py
else
    log_error "Файл не найден!"
fi
echo ""

# 4. Тест авторизации с реальным паролем
log_info "4. Тест POST /api/auth/login с паролем 'yolo2024'..."
RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"password": "yolo2024"}')

echo "Ответ сервера:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

# 5. Проверка доступности эндпоинтов
log_info "5. Проверка эндпоинтов API..."

ENDPOINTS=(
    "http://localhost:8000/health"
    "http://localhost:8000/api/slots"
    "http://localhost:8000/api/auth/login"
    "http://localhost/api/slots"
    "http://localhost/health"
)

for endpoint in "${ENDPOINTS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$endpoint" 2>/dev/null || echo "FAIL")
    
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "405" ]; then
        echo -e "  ${GREEN}✓${NC} $endpoint - HTTP $STATUS"
    else
        echo -e "  ${RED}✗${NC} $endpoint - HTTP $STATUS"
    fi
done
echo ""

# 6. Проверка конфигурации Nginx
log_info "6. Конфигурация Nginx для API..."
grep -A 10 "location.*\/api\/" /etc/nginx/sites-available/yolonaiils || log_warning "Секция /api/ не найдена"
echo ""

# 7. Генерируем новый корректный хеш
log_info "7. Генерация нового bcrypt хеша для 'yolo2024'..."
NEW_HASH=$(python3 <<PYGEN
import bcrypt
password = "yolo2024"
hash_result = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12))
print(hash_result.decode())
PYGEN
)

log_debug "Новый хеш: $NEW_HASH"
echo ""

# 8. Тест хеша
log_info "8. Тестируем сгенерированный хеш..."
python3 <<PYTEST
import bcrypt

password = "yolo2024"
test_hash = "$NEW_HASH"

if bcrypt.checkpw(password.encode(), test_hash.encode()):
    print("  ✓ Хеш работает корректно!")
else:
    print("  ✗ Хеш НЕ работает!")
PYTEST
echo ""

# 9. Проверка импортов bcrypt
log_info "9. Проверка установки bcrypt в venv..."
cd /var/www/yolonaiils/api_server
source venv/bin/activate
python3 -c "import bcrypt; print('  ✓ bcrypt version:', bcrypt.__version__)" 2>/dev/null || log_error "bcrypt не установлен!"
echo ""

log_info "=== РЕКОМЕНДАЦИИ ==="
echo ""
echo "Если хеш работает в тесте, но не работает в API:"
echo "  1. Обновите код backend/auth/index.py с правильным хешем"
echo "  2. Перезапустите PM2: pm2 restart yolonaiils-api"
echo "  3. Проверьте логи: pm2 logs yolonaiils-api"
echo ""
echo "Если /api/ возвращает 404:"
echo "  1. Проверьте Nginx конфигурацию выше"
echo "  2. Убедитесь что API слушает на порту 8000"
echo "  3. Перезапустите Nginx: systemctl restart nginx"
echo ""
