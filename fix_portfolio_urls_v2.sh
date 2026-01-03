#!/bin/bash
###############################################################################
# Скрипт для исправления URL портфолио на VPS (v2)
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

log_info "Заменяем URL портфолио на локальные..."

# Используем Python для точной замены (надёжнее чем sed с пробелами и скобками)
python3 <<PYTHON_SCRIPT
import re

# Читаем файл
with open("$INDEX_TSX", "r", encoding="utf-8") as f:
    content = f.read()

# Массив оригинальных URL → новые URL
replacements = [
    ("https://cdn.poehali.dev/files/photo_2025-12-27_00-41-42 (2).jpg", "http://$SERVER_IP/storage/portfolio/portfolio_01.jpg"),
    ("https://cdn.poehali.dev/files/photo_2025-12-27_00-41-42.jpg", "http://$SERVER_IP/storage/portfolio/portfolio_02.jpg"),
    ("https://cdn.poehali.dev/files/photo_2025-12-27_00-41-43.jpg", "http://$SERVER_IP/storage/portfolio/portfolio_03.jpg"),
    ("https://cdn.poehali.dev/files/photo_2025-12-27_00-41-44 (2).jpg", "http://$SERVER_IP/storage/portfolio/portfolio_04.jpg"),
    ("https://cdn.poehali.dev/files/photo_2025-12-27_00-41-44.jpg", "http://$SERVER_IP/storage/portfolio/portfolio_05.jpg"),
    ("https://cdn.poehali.dev/files/photo_2025-12-27_00-41-46.jpg", "http://$SERVER_IP/storage/portfolio/portfolio_06.jpg"),
    ("https://cdn.poehali.dev/files/photo_2025-12-27_00-41-47 (2).jpg", "http://$SERVER_IP/storage/portfolio/portfolio_07.jpg"),
    ("https://cdn.poehali.dev/files/photo_2025-12-27_00-41-47.jpg", "http://$SERVER_IP/storage/portfolio/portfolio_08.jpg"),
    ("https://cdn.poehali.dev/files/photo_2025-12-27_00-41-48 (2).jpg", "http://$SERVER_IP/storage/portfolio/portfolio_09.jpg"),
    ("https://cdn.poehali.dev/files/photo_2025-12-27_00-41-48.jpg", "http://$SERVER_IP/storage/portfolio/portfolio_10.jpg"),
    ("https://cdn.poehali.dev/files/photo_2025-12-27_00-41-49.jpg", "http://$SERVER_IP/storage/portfolio/portfolio_11.jpg"),
    ("https://cdn.poehali.dev/files/photo_2025-12-27_00-41-51.jpg", "http://$SERVER_IP/storage/portfolio/portfolio_12.jpg"),
    ("https://cdn.poehali.dev/files/photo_2025-12-27_00-41-52.jpg", "http://$SERVER_IP/storage/portfolio/portfolio_13.jpg"),
    ("https://cdn.poehali.dev/files/photo_2025-12-27_00-41-53 (2).jpg", "http://$SERVER_IP/storage/portfolio/portfolio_14.jpg"),
    ("https://cdn.poehali.dev/files/photo_2025-12-27_00-41-53.jpg", "http://$SERVER_IP/storage/portfolio/portfolio_15.jpg"),
]

# Последовательная замена
replaced_count = 0
for old_url, new_url in replacements:
    if old_url in content:
        content = content.replace(old_url, new_url, 1)  # Заменяем только первое вхождение
        replaced_count += 1
        print(f"  ✓ Заменено: {new_url.split('/')[-1]}")
    else:
        print(f"  ⚠ Не найдено: {old_url.split('/')[-1]}")

# Сохраняем результат
with open("$INDEX_TSX", "w", encoding="utf-8") as f:
    f.write(content)

print(f"\nВсего замен: {replaced_count}/15")
PYTHON_SCRIPT

log_info "URL портфолио обновлены ✓"

log_info "Пересобираем фронтенд..."
cd /var/www/yolonaiils
npm run build 2>&1 | grep -E "(built|error)" || true

log_info "Перезапускаем Nginx..."
systemctl restart nginx

echo ""
log_info "🎉 Готово! Проверьте сайт: http://$SERVER_IP"
log_info "📸 Портфолио: http://$SERVER_IP (главная страница)"
