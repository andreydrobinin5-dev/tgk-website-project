#!/bin/bash

echo "=== Проверка файлов портфолио ==="
echo ""

echo "Содержимое /var/www/yolonaiils_storage/portfolio/:"
ls -lah /var/www/yolonaiils_storage/portfolio/

echo ""
echo "=== Проверка прав доступа ==="
ls -ld /var/www/yolonaiils_storage
ls -ld /var/www/yolonaiils_storage/portfolio

echo ""
echo "=== Проверка конфигурации Nginx ==="
cat /etc/nginx/sites-available/yolonaiils | grep -A 5 "location /storage"

echo ""
echo "=== Тест прямого доступа ==="
curl -I http://localhost/storage/portfolio/portfolio_01.jpg 2>&1 | head -5

echo ""
echo "=== Логи Nginx (последние 10 строк) ==="
tail -10 /var/log/nginx/yolonaiils_error.log
