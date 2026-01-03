#!/bin/bash
###############################################################################
# Финальное исправление Nginx с правильными приоритетами
###############################################################################

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

SERVER_IP=$(hostname -I | awk '{print $1}')

log_info "Создаём финальную конфигурацию Nginx..."

cat > /etc/nginx/sites-available/yolonaiils <<'NGINXEOF'
server {
    listen 80;
    server_name SERVER_IP_PLACEHOLDER;

    root /var/www/yolonaiils/dist;
    index index.html;

    access_log /var/log/nginx/yolonaiils_access.log;
    error_log /var/log/nginx/yolonaiils_error.log;

    # КРИТИЧНО: ^~ отключает проверку regex locations
    # Отдача загруженных файлов из storage (максимальный приоритет)
    location ^~ /storage/ {
        alias /var/www/yolonaiils_storage/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin "*";
        
        # Автоопределение MIME типов
        default_type application/octet-stream;
    }

    # API проксирование
    location ^~ /api/ {
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
    location ^~ /health {
        proxy_pass http://localhost:8000/health;
    }

    # Кеширование статики фронтенда (ТОЛЬКО для файлов в dist/)
    location ~* ^/(?!storage|api|health).*\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
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
nginx -t

log_info "Перезапускаем Nginx..."
systemctl restart nginx

log_info "Тестируем доступ к файлам..."
sleep 2

echo ""
echo "=== Проверка storage файлов ==="
for i in 01 02 03; do
    if curl -s -I "http://localhost/storage/portfolio/portfolio_${i}.jpg" | grep -q "200 OK"; then
        echo -e "${GREEN}✓${NC} portfolio_${i}.jpg доступен"
    else
        echo -e "${RED}✗${NC} portfolio_${i}.jpg недоступен"
    fi
done

echo ""
echo "=== Проверка API ==="
if curl -s http://localhost/health | grep -q "healthy"; then
    echo -e "${GREEN}✓${NC} API работает"
else
    echo -e "${RED}✗${NC} API не отвечает"
fi

echo ""
log_info "🎉 Проверяйте сайт: http://$SERVER_IP"
echo "📸 Портфолио должно загрузиться!"
