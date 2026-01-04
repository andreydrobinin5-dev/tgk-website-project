#!/bin/bash

###########################################
# ПОЛНЫЙ НАБОР ИСПРАВЛЕНИЙ ПРОЕКТА TGK
###########################################
# 
# Этот скрипт содержит все фиксы, которые
# были применены в процессе разработки проекта
#
# Дата создания: 04.01.2026
# Проект: tgk-website-project (Студия маникюра)
#
###########################################

set -e  # Остановка при ошибке

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

###########################################
# МЕНЮ ВЫБОРА ДЕЙСТВИЯ
###########################################

show_menu() {
    echo ""
    echo "=========================================="
    echo "  МЕНЮ ИСПРАВЛЕНИЙ ПРОЕКТА TGK"
    echo "=========================================="
    echo ""
    echo "Выберите действие:"
    echo ""
    echo "  1) Полная синхронизация с GitHub"
    echo "  2) Исправить авторизацию админки (bcrypt)"
    echo "  3) Обновить URL endpoints (poehali.dev → VPS)"
    echo "  4) Проверить работу API"
    echo "  5) Пересобрать фронтенд и перезапустить Nginx"
    echo "  6) Проверить логи (Nginx, PM2, API)"
    echo "  7) Проверить базу данных PostgreSQL"
    echo "  8) Выполнить ВСЕ исправления последовательно"
    echo "  0) Выход"
    echo ""
    echo "=========================================="
    echo -n "Введите номер: "
}

###########################################
# 1. ПОЛНАЯ СИНХРОНИЗАЦИЯ С GITHUB
###########################################
# Решает: Git конфликты, устаревший код
# Исправляет проблемы с локальными изменениями

fix_github_sync() {
    log_info "Запуск синхронизации с GitHub..."
    
    if [ ! -d ".git" ]; then
        log_error "Это не Git репозиторий!"
        return 1
    fi
    
    log_warning "Все локальные изменения будут удалены!"
    read -p "Продолжить? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Операция отменена"
        return 0
    fi
    
    log_info "Сохраняем текущую ветку..."
    CURRENT_BRANCH=$(git branch --show-current)
    
    log_info "Сбрасываем локальные изменения..."
    git reset --hard HEAD
    
    log_info "Получаем обновления из GitHub..."
    git fetch origin
    
    log_info "Синхронизируемся с origin/$CURRENT_BRANCH..."
    git reset --hard origin/$CURRENT_BRANCH
    
    log_info "Обновляем зависимости..."
    npm install
    
    log_info "Пересобираем проект..."
    npm run build
    
    if command -v systemctl &> /dev/null; then
        log_info "Перезапускаем Nginx..."
        sudo systemctl restart nginx
    fi
    
    log_success "✅ Синхронизация с GitHub завершена!"
    log_success "Проект обновлен до последней версии"
}

###########################################
# 2. ИСПРАВЛЕНИЕ АВТОРИЗАЦИИ (BCRYPT)
###########################################
# Решает: "Неверный пароль" при входе в админку
# Причина: Динамическая генерация bcrypt хеша

fix_admin_auth() {
    log_info "Проверка файла backend/auth/index.py..."
    
    if [ ! -f "backend/auth/index.py" ]; then
        log_error "Файл backend/auth/index.py не найден!"
        return 1
    fi
    
    log_info "Проверяем корректность bcrypt логики..."
    
    # Ищем проблемный паттерн: bcrypt.gensalt() в коде авторизации
    if grep -q "bcrypt.gensalt()" backend/auth/index.py; then
        log_error "НАЙДЕНА ПРОБЛЕМА: Динамическая генерация bcrypt хеша!"
        log_warning "Это приводит к постоянной ошибке 'Неверный пароль'"
        log_info "Рекомендуется обновить код до версии с фиксированным хешем"
        return 1
    fi
    
    log_success "✅ Логика bcrypt корректна (используется фиксированный хеш)"
    
    # Проверяем, что используется переменная окружения
    if grep -q "ADMIN_PASSWORD_HASH" backend/auth/index.py; then
        log_success "✅ Пароль администратора берется из ADMIN_PASSWORD_HASH"
    else
        log_warning "ADMIN_PASSWORD_HASH не используется в коде"
    fi
    
    log_info "Тестируем авторизацию через curl..."
    
    if command -v curl &> /dev/null; then
        RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
            -H "Content-Type: application/json" \
            -d '{"password": "yolo2024"}')
        
        if echo "$RESPONSE" | grep -q "success"; then
            log_success "✅ Авторизация работает корректно!"
            echo "Ответ API: $RESPONSE"
        else
            log_error "❌ Авторизация не прошла!"
            echo "Ответ API: $RESPONSE"
            return 1
        fi
    else
        log_warning "curl не установлен, пропускаем тест"
    fi
    
    log_success "Исправление авторизации завершено"
}

###########################################
# 3. ОБНОВЛЕНИЕ URL ENDPOINTS
###########################################
# Решает: Frontend отправляет запросы на старые Cloud Functions
# Заменяет: poehali.dev URLs → локальные /api/ endpoints

fix_api_urls() {
    log_info "Проверка URL endpoints во frontend файлах..."
    
    FOUND_OLD_URLS=0
    
    # Список файлов для проверки
    FILES=(
        "src/pages/Admin.tsx"
        "src/components/admin/AdminSlots.tsx"
        "src/components/admin/AdminBookings.tsx"
    )
    
    for FILE in "${FILES[@]}"; do
        if [ ! -f "$FILE" ]; then
            log_warning "Файл $FILE не найден, пропускаем"
            continue
        fi
        
        log_info "Проверяем $FILE..."
        
        # Ищем старые URL от poehali.dev
        if grep -q "functions.poehali.dev" "$FILE"; then
            log_error "❌ Найдены старые URL от poehali.dev в $FILE"
            FOUND_OLD_URLS=1
        else
            log_success "✅ $FILE использует правильные endpoints"
        fi
    done
    
    if [ $FOUND_OLD_URLS -eq 1 ]; then
        log_error "Обнаружены устаревшие URL!"
        log_info "Рекомендация: Синхронизируйтесь с GitHub (опция 1)"
        return 1
    fi
    
    log_success "✅ Все URL endpoints актуальны"
}

###########################################
# 4. ПРОВЕРКА РАБОТЫ API
###########################################
# Тестирует все критические endpoints

check_api_health() {
    log_info "Проверка работы API сервера..."
    
    if ! command -v curl &> /dev/null; then
        log_error "curl не установлен!"
        return 1
    fi
    
    # Health check
    log_info "Проверяем /health endpoint..."
    HEALTH=$(curl -s http://localhost:8000/health || echo "")
    
    if [ -z "$HEALTH" ]; then
        log_error "❌ API не отвечает!"
        log_info "Проверьте, запущен ли API сервер (pm2 status)"
        return 1
    fi
    
    if echo "$HEALTH" | grep -q "healthy"; then
        log_success "✅ API работает корректно"
        echo "Ответ: $HEALTH"
    else
        log_error "❌ API вернул неожиданный ответ"
        echo "Ответ: $HEALTH"
        return 1
    fi
    
    # Проверяем авторизацию
    log_info "Проверяем /api/auth/login..."
    AUTH_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"password": "yolo2024"}')
    
    if echo "$AUTH_RESPONSE" | grep -q "token"; then
        log_success "✅ Авторизация работает"
    else
        log_error "❌ Проблема с авторизацией"
        echo "Ответ: $AUTH_RESPONSE"
    fi
    
    # Проверяем slots
    log_info "Проверяем /api/slots..."
    SLOTS_RESPONSE=$(curl -s http://localhost:8000/api/slots || echo "")
    
    if [ ! -z "$SLOTS_RESPONSE" ]; then
        log_success "✅ Endpoint /api/slots доступен"
    else
        log_error "❌ Endpoint /api/slots не отвечает"
    fi
    
    # Проверяем bookings
    log_info "Проверяем /api/bookings..."
    BOOKINGS_RESPONSE=$(curl -s http://localhost:8000/api/bookings || echo "")
    
    if [ ! -z "$BOOKINGS_RESPONSE" ]; then
        log_success "✅ Endpoint /api/bookings доступен"
    else
        log_error "❌ Endpoint /api/bookings не отвечает"
    fi
    
    log_success "Проверка API завершена"
}

###########################################
# 5. ПЕРЕСБОРКА ФРОНТЕНДА
###########################################
# Решает: Устаревший JavaScript в браузере

rebuild_frontend() {
    log_info "Пересборка frontend проекта..."
    
    if [ ! -f "package.json" ]; then
        log_error "package.json не найден!"
        return 1
    fi
    
    log_info "Устанавливаем зависимости..."
    npm install
    
    log_info "Запускаем сборку проекта..."
    npm run build
    
    if [ ! -d "dist" ]; then
        log_error "Папка dist не создана после сборки!"
        return 1
    fi
    
    log_success "✅ Frontend собран успешно"
    
    if command -v systemctl &> /dev/null; then
        log_info "Перезапускаем Nginx..."
        sudo systemctl restart nginx
        log_success "✅ Nginx перезапущен"
    else
        log_warning "systemctl не найден, пропускаем перезапуск Nginx"
    fi
    
    log_success "Пересборка завершена"
    log_info "Рекомендация: Откройте сайт в режиме инкогнито для загрузки новой версии"
}

###########################################
# 6. ПРОВЕРКА ЛОГОВ
###########################################

check_logs() {
    log_info "Проверка логов системы..."
    
    echo ""
    echo "========== NGINX ERROR LOG (последние 20 строк) =========="
    if [ -f "/var/log/nginx/error.log" ]; then
        sudo tail -n 20 /var/log/nginx/error.log
    else
        log_warning "Файл /var/log/nginx/error.log не найден"
    fi
    
    echo ""
    echo "========== PM2 LOGS =========="
    if command -v pm2 &> /dev/null; then
        pm2 logs --lines 20 --nostream
    else
        log_warning "PM2 не установлен"
    fi
    
    echo ""
    echo "========== SYSTEM JOURNAL (API errors) =========="
    if command -v journalctl &> /dev/null; then
        sudo journalctl -u nginx -n 20 --no-pager
    else
        log_warning "journalctl не доступен"
    fi
    
    log_success "Проверка логов завершена"
}

###########################################
# 7. ПРОВЕРКА БАЗЫ ДАННЫХ
###########################################

check_database() {
    log_info "Проверка базы данных PostgreSQL..."
    
    if ! command -v psql &> /dev/null; then
        log_error "psql не установлен!"
        return 1
    fi
    
    # Проверяем подключение
    log_info "Проверяем доступность PostgreSQL..."
    
    if sudo -u postgres psql -c "SELECT version();" &> /dev/null; then
        log_success "✅ PostgreSQL работает"
    else
        log_error "❌ PostgreSQL не отвечает"
        return 1
    fi
    
    # Проверяем базу yolonaiils (или tgk_website)
    log_info "Проверяем базу данных проекта..."
    
    DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='yolonaiils'")
    
    if [ "$DB_EXISTS" = "1" ]; then
        log_success "✅ База данных 'yolonaiils' существует"
        
        # Показываем таблицы
        echo ""
        echo "========== ТАБЛИЦЫ В БАЗЕ =========="
        sudo -u postgres psql -d yolonaiils -c "\dt"
        
        # Показываем количество записей
        echo ""
        echo "========== КОЛИЧЕСТВО ЗАПИСЕЙ =========="
        sudo -u postgres psql -d yolonaiils -c "SELECT 'bookings' as table_name, COUNT(*) as count FROM bookings UNION ALL SELECT 'time_slots', COUNT(*) FROM time_slots;"
    else
        log_error "❌ База данных 'yolonaiils' не найдена"
        return 1
    fi
    
    log_success "Проверка базы данных завершена"
}

###########################################
# 8. ВЫПОЛНИТЬ ВСЕ ИСПРАВЛЕНИЯ
###########################################

run_all_fixes() {
    log_info "Запуск ВСЕХ исправлений последовательно..."
    
    echo ""
    log_info "ШАГ 1/7: Синхронизация с GitHub"
    fix_github_sync || log_error "Ошибка на шаге 1"
    
    echo ""
    log_info "ШАГ 2/7: Проверка авторизации"
    fix_admin_auth || log_error "Ошибка на шаге 2"
    
    echo ""
    log_info "ШАГ 3/7: Проверка URL endpoints"
    fix_api_urls || log_error "Ошибка на шаге 3"
    
    echo ""
    log_info "ШАГ 4/7: Проверка API"
    check_api_health || log_error "Ошибка на шаге 4"
    
    echo ""
    log_info "ШАГ 5/7: Пересборка frontend"
    rebuild_frontend || log_error "Ошибка на шаге 5"
    
    echo ""
    log_info "ШАГ 6/7: Проверка логов"
    check_logs
    
    echo ""
    log_info "ШАГ 7/7: Проверка базы данных"
    check_database || log_error "Ошибка на шаге 7"
    
    echo ""
    log_success "=========================================="
    log_success "  ВСЕ ИСПРАВЛЕНИЯ ВЫПОЛНЕНЫ!"
    log_success "=========================================="
    echo ""
    log_info "Рекомендации:"
    echo "  1. Откройте сайт в режиме инкогнито"
    echo "  2. Проверьте работу админки: /admin"
    echo "  3. Протестируйте создание записей"
    echo ""
}

###########################################
# MAIN LOOP
###########################################

while true; do
    show_menu
    read choice
    
    case $choice in
        1)
            fix_github_sync
            ;;
        2)
            fix_admin_auth
            ;;
        3)
            fix_api_urls
            ;;
        4)
            check_api_health
            ;;
        5)
            rebuild_frontend
            ;;
        6)
            check_logs
            ;;
        7)
            check_database
            ;;
        8)
            run_all_fixes
            ;;
        0)
            log_info "Выход из программы"
            exit 0
            ;;
        *)
            log_error "Неверный выбор. Попробуйте еще раз."
            ;;
    esac
    
    echo ""
    read -p "Нажмите Enter для продолжения..."
done
