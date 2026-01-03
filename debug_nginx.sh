#!/bin/bash

echo "=== Активная конфигурация Nginx ==="
cat /etc/nginx/sites-available/yolonaiils

echo ""
echo "=== Симлинк в sites-enabled ==="
ls -la /etc/nginx/sites-enabled/ | grep yolonaiils

echo ""
echo "=== Проверка других конфигов ==="
ls -la /etc/nginx/sites-enabled/

echo ""
echo "=== Тест конфигурации ==="
nginx -T 2>&1 | grep -A 20 "server_name 193.233.230.139"

echo ""
echo "=== Процессы Nginx ==="
ps aux | grep nginx
