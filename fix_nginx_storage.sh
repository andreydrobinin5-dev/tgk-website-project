#!/bin/bash
###############################################################################
# Исправление конфигурации Nginx для корректной раздачи storage
###############################################################################

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

SERVER_IP=$(hostname -I | awk '{print $1}')

log_info "Создаём резервную копию конфига Nginx..."
cp /etc/nginx/sites-available/yolonaiils /etc/nginx/sites-available/yolonaiils.backup_$(date +%Y%m%d_%H%M%S)

log_info "Создаём исправленную конфигурацию Nginx..."

cat > /etc/nginx/sites-available/yolonaiils <<'NGINXEOF'
server {
    listen 80;
    server_name SERVER_IP_PLACEHOLDER;

    root /var/www/yolonaiils/dist;
    index index.html;

    access_log /var/log/nginx/yolonaiils_access.log;
    error_log /var/log/nginx/yolonaiils_error.log;

    # ВАЖНО: /storage/ должен быть ПЕРЕД location /
    # Отдача загруженных файлов
    location /storage/ {
        alias /var/www/yolonaiils_storage/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
        
        # Явно указываем типы файлов
        types {
            image/jpeg jpg jpeg;
            image/png png;
            image/gif gif;
            image/webp webp;
        }
    }

    # API проксирование
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8000/health;
    }

    # Кеширование статики фронтенда
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Фронтенд (SPA) - ДОЛЖЕН БЫТЬ ПОСЛЕДНИМ
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINXEOF

# Заменяем плейсхолдер на реальный IP
sed -i "s/SERVER_IP_PLACEHOLDER/$SERVER_IP/" /etc/nginx/sites-available/yolonaiils

log_info "Проверяем конфигурацию Nginx..."
if nginx -t; then
    log_info "Конфигурация корректна ✓"
else
    log_error "Ошибка в конфигурации Nginx!"
    exit 1
fi

log_info "Перезапускаем Nginx..."
systemctl restart nginx

log_info "Проверяем доступ к файлам..."
sleep 2

if curl -I http://localhost/storage/portfolio/portfolio_01.jpg 2>&1 | grep -q "200 OK"; then
    echo -e "${GREEN}✓${NC} Файлы доступны!"
else
    echo -e "${RED}✗${NC} Файлы всё ещё недоступны"
    echo "Логи Nginx:"
    tail -5 /var/log/nginx/yolonaiils_error.log
fi

echo ""
log_info "🎉 Готово! Проверяйте сайт: http://$SERVER_IP"
