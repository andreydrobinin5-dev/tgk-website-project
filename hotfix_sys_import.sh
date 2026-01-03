#!/bin/bash

###############################################################################
# Hotfix: Добавление import sys в backend функции
###############################################################################

echo "🔧 Исправление ошибки: NameError: name 'sys' is not defined"

# Проверка bookings/index.py
if grep -q "sys.path.insert" /var/www/yolonaiils/backend/bookings/index.py; then
    if ! grep -q "^import sys" /var/www/yolonaiils/backend/bookings/index.py; then
        echo "📝 Добавление 'import sys' в bookings/index.py"
        sed -i '1s/^/import sys\n/' /var/www/yolonaiils/backend/bookings/index.py
        echo "✅ bookings/index.py исправлен"
    else
        echo "✅ bookings/index.py уже содержит import sys"
    fi
fi

# Проверка payment/index.py
if [ -f "/var/www/yolonaiils/backend/payment/index.py" ]; then
    if grep -q "sys.path.insert" /var/www/yolonaiils/backend/payment/index.py; then
        if ! grep -q "^import sys" /var/www/yolonaiils/backend/payment/index.py; then
            echo "📝 Добавление 'import sys' в payment/index.py"
            sed -i '1s/^/import sys\n/' /var/www/yolonaiils/backend/payment/index.py
            echo "✅ payment/index.py исправлен"
        else
            echo "✅ payment/index.py уже содержит import sys"
        fi
    fi
fi

# Перезапуск API
echo "🔄 Перезапуск API..."
pm2 restart yolonaiils-api

sleep 3

# Проверка
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo "✅ API работает!"
    curl -s http://localhost:8000/health | python3 -m json.tool
else
    echo "❌ API не отвечает, смотри логи:"
    pm2 logs yolonaiils-api --lines 20 --nostream
fi
