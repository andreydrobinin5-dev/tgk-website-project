#!/bin/bash

echo "Поиск FastAPI сервера..."
echo ""

echo "1. Проверка PM2 конфигурации:"
pm2 describe yolonaiils-api | grep -E "(script|cwd|interpreter)"
echo ""

echo "2. Поиск Python файлов в /var/www/yolonaiils:"
find /var/www/yolonaiils -name "*.py" -type f | grep -v "__pycache__" | grep -v "node_modules"
echo ""

echo "3. Проверка процесса через ps:"
ps aux | grep -E "uvicorn|fastapi|python.*8000" | grep -v grep
echo ""

echo "4. Проверка содержимого корня проекта:"
ls -la /var/www/yolonaiils/ | grep -E "\.py$|server"
