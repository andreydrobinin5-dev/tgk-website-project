#!/bin/bash
###############################################################################
# Скрипт для исправления URL портфолио на VPS
###############################################################################

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

SERVER_IP=$(hostname -I | awk '{print $1}')
INDEX_TSX="/var/www/yolonaiils/src/pages/Index.tsx"

if [ ! -f "$INDEX_TSX" ]; then
    log_error "Файл Index.tsx не найден: $INDEX_TSX"
    exit 1
fi

log_info "Создаём резервную копию Index.tsx..."
cp "$INDEX_TSX" "$INDEX_TSX.backup_$(date +%Y%m%d_%H%M%S)"

log_info "Восстанавливаем оригинальные URL из GitHub..."
cd /var/www/yolonaiils
git checkout src/pages/Index.tsx

log_info "Заменяем URL портфолио последовательно..."

# Массив оригинальных URL (точно как в коде)
ORIGINAL_URLS=(
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-42 (2).jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-42.jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-43.jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-44 (2).jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-44.jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-46.jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-47 (2).jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-47.jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-48 (2).jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-48.jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-49.jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-51.jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-52.jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-53 (2).jpg"
    "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-53.jpg"
)

# Заменяем каждый URL индивидуально
for i in "${!ORIGINAL_URLS[@]}"; do
    old_url="${ORIGINAL_URLS[$i]}"
    new_url="http://$SERVER_IP/storage/portfolio/portfolio_$(printf "%02d" $((i+1))).jpg"
    
    # Экранируем спецсимволы для sed
    old_url_escaped=$(echo "$old_url" | sed 's/[&/\]/\\&/g' | sed 's/ /\\ /g')
    new_url_escaped=$(echo "$new_url" | sed 's/[&/\]/\\&/g')
    
    # Заменяем ПЕРВОЕ вхождение (0,/pattern/)
    sed -i "0,|$old_url_escaped|s||$new_url_escaped|" "$INDEX_TSX"
    
    echo "  ✓ Заменено: portfolio_$(printf "%02d" $((i+1))).jpg"
done

log_info "Все URL портфолио обновлены ✓"

log_info "Пересобираем фронтенд..."
cd /var/www/yolonaiils
npm run build

log_info "Перезапускаем Nginx..."
systemctl restart nginx

log_info "🎉 Готово! Проверьте сайт: http://$SERVER_IP"
