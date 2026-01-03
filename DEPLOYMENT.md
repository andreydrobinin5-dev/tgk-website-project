# 🚀 Деплой YOLO NAIILS на VPS

Полная инструкция по развертыванию проекта на VPS с Ubuntu 24.04.

---

## 📋 Содержание

1. [Быстрый старт](#быстрый-старт)
2. [Настройка GitHub Actions](#настройка-github-actions)
3. [Ручной деплой через скрипт](#ручной-деплой-через-скрипт)
4. [Troubleshooting](#troubleshooting)

---

## ⚡ Быстрый старт

### Вариант 1: Автоматический деплой через GitHub Actions

**Преимущества:**
- ✅ Автоматический деплой при каждом commit в `main`
- ✅ Проверка кода (TypeScript, ESLint, Python)
- ✅ Сканирование безопасности
- ✅ Telegram уведомления

**Шаги:**

1. **Добавьте секреты в GitHub:**
   - Откройте ваш репозиторий → Settings → Secrets and variables → Actions
   - Нажмите "New repository secret" и добавьте:

   ```bash
   VPS_HOST
   Значение: 193.233.230.139
   
   VPS_USER
   Значение: root
   
   VPS_SSH_KEY
   Значение: <ваш приватный SSH ключ>
   # Получить: cat ~/.ssh/id_rsa
   # Или создать новый: ssh-keygen -t rsa -b 4096 -C "github-actions"
   
   TELEGRAM_BOT_TOKEN
   Значение: <ваш токен от BotFather>
   # Получить: напишите @BotFather в Telegram → /newbot
   
   TELEGRAM_CHAT_ID
   Значение: <ваш chat ID>
   # Получить: напишите @userinfobot в Telegram
   ```

2. **Добавьте публичный SSH ключ на VPS:**
   ```bash
   # На вашем компьютере:
   cat ~/.ssh/id_rsa.pub
   
   # Скопируйте вывод и на VPS выполните:
   echo "ваш_публичный_ключ" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

3. **Сделайте commit в main:**
   ```bash
   git add .
   git commit -m "feat: enable CI/CD"
   git push origin main
   ```

4. **Готово!** GitHub Actions автоматически задеплоит проект.

---

### Вариант 2: Ручной деплой через скрипт

**Используйте, если:**
- Первый раз разворачиваете проект
- Нужна полная установка с нуля (PostgreSQL, Nginx, PM2)

**Шаги:**

1. **Подключитесь к VPS:**
   ```bash
   ssh root@193.233.230.139
   ```

2. **Скачайте скрипт:**
   ```bash
   wget https://raw.githubusercontent.com/ваш-username/yolonaiils/main/deploy_local_storage.sh
   chmod +x deploy_local_storage.sh
   ```

3. **Запустите скрипт:**
   ```bash
   ./deploy_local_storage.sh
   ```

4. **Следуйте инструкциям:**
   - Введите URL GitHub репозитория
   - Настройте базу данных (или оставьте значения по умолчанию)
   - Введите Telegram токены для уведомлений
   - Подтвердите установку

5. **Скрипт автоматически:**
   - Установит Node.js 20, PostgreSQL, Nginx, PM2, Python
   - Создаст базу данных
   - Клонирует проект
   - Загрузит 15 фото портфолио
   - Соберет фронтенд
   - Запустит API через PM2
   - Настроит Nginx

6. **После установки откройте:**
   - Сайт: `http://193.233.230.139`
   - Админка: `http://193.233.230.139/admin`

---

## 🔧 Настройка GitHub Actions

### Структура CI/CD Pipeline

Файл: `.github/workflows/ci.yml`

**3 этапа:**

1. **Build & Test** (всегда запускается):
   - Проверка TypeScript (`tsc --noEmit`)
   - ESLint анализ
   - Сборка проекта (`npm run build`)
   - Проверка Python кода (flake8, black, mypy)

2. **Security Scan** (всегда запускается):
   - npm audit (проверка уязвимостей в зависимостях)
   - TruffleHog (поиск секретов в коде)

3. **Deploy to VPS** (только для `main` ветки):
   - SSH подключение к VPS
   - `git pull origin main`
   - `npm install && npm run build`
   - Перезапуск API через PM2
   - Telegram уведомление об успехе/ошибке

### Как работают секреты

GitHub Actions использует секреты через `${{ secrets.SECRET_NAME }}`:

```yaml
- name: Deploy to VPS
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.VPS_HOST }}      # 193.233.230.139
    username: ${{ secrets.VPS_USER }}  # root
    key: ${{ secrets.VPS_SSH_KEY }}    # приватный ключ SSH
```

⚠️ **Безопасность:**
- Секреты **никогда** не видны в логах GitHub Actions
- Доступны только в вашем репозитории
- Можно обновлять в любой момент через UI

---

## 🛠️ Ручное управление проектом на VPS

### Полезные команды

```bash
# Подключение к VPS
ssh root@193.233.230.139

# Просмотр логов API
pm2 logs yolonaiils-api

# Перезапуск API
pm2 restart yolonaiils-api

# Проверка статуса
pm2 status

# Просмотр логов Nginx
tail -f /var/log/nginx/yolonaiils_error.log

# Просмотр логов развертывания
tail -f /root/yolonaiils_deploy.log

# Проверка базы данных
psql postgresql://yolouser:ваш_пароль@localhost:5432/yolonaiils
```

### Обновление проекта вручную

```bash
cd /var/www/yolonaiils
git pull origin main
npm install
npm run build
pm2 restart yolonaiils-api
```

### Проверка хранилища файлов

```bash
# Просмотр загруженных фото портфолио
ls -lah /var/www/yolonaiils_storage/portfolio

# Очистка старых файлов (старше 90 дней)
find /var/www/yolonaiils_storage -type f -mtime +90 -delete

# Проверка размера хранилища
du -sh /var/www/yolonaiils_storage
```

---

## 🐛 Troubleshooting

### Проблема: API не отвечает

**Проверка:**
```bash
curl http://localhost:8000/health
pm2 logs yolonaiils-api --lines 50
```

**Решение:**
```bash
pm2 restart yolonaiils-api
# Если не помогло:
pm2 delete yolonaiils-api
cd /var/www/yolonaiils/api_server
source venv/bin/activate
pm2 start "venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000" --name yolonaiils-api
```

---

### Проблема: Ошибка "sed: unknown command"

**Причина:** Неправильное экранирование URL в скрипте деплоя.

**Решение:** Обновите скрипт до последней версии:
```bash
cd /var/www/yolonaiils
git pull origin main
```

**Исправленная версия** использует:
```bash
sed -i "s|https://cdn\.poehali\.dev/files/...|$new_url|" file.tsx
```

Вместо:
```bash
sed -i "0,/$old_url/{s|...|}" file.tsx  # ❌ Ошибка
```

---

### Проблема: Фото портфолио не загружаются

**Проверка:**
```bash
ls -lah /var/www/yolonaiils_storage/portfolio
curl http://193.233.230.139/storage/portfolio/portfolio_01.jpg
```

**Решение:**
```bash
# Повторная загрузка фото
cd /var/www/yolonaiils_storage/portfolio
wget -O portfolio_01.jpg "https://cdn.poehali.dev/files/photo_2025-12-27_00-41-42.jpg"
# ... повторите для всех 15 фото

# Проверка прав доступа
chown -R www-data:www-data /var/www/yolonaiils_storage
chmod -R 755 /var/www/yolonaiils_storage
```

---

### Проблема: GitHub Actions не может подключиться к VPS

**Проверка секретов:**
1. Settings → Secrets and variables → Actions
2. Убедитесь, что `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` добавлены

**Проверка SSH:**
```bash
# На VPS:
cat ~/.ssh/authorized_keys
# Должен содержать публичный ключ, соответствующий VPS_SSH_KEY
```

**Тест подключения:**
```bash
# На вашем компьютере:
ssh -i ~/.ssh/id_rsa root@193.233.230.139 "echo 'SSH works!'"
```

---

### Проблема: База данных не создалась

**Проверка PostgreSQL:**
```bash
sudo systemctl status postgresql
sudo -u postgres psql -c "\l"  # Список баз данных
```

**Решение:**
```bash
# Пересоздание базы данных
sudo -u postgres psql <<EOF
DROP DATABASE IF EXISTS yolonaiils;
CREATE DATABASE yolonaiils;
CREATE USER yolouser WITH PASSWORD 'ваш_пароль';
GRANT ALL PRIVILEGES ON DATABASE yolonaiils TO yolouser;
EOF
```

---

## 📊 Мониторинг

### Проверка здоровья системы

```bash
# API Health Check
curl http://193.233.230.139/health
# Ожидаемый ответ: {"status":"healthy","service":"yolonaiils-api","storage":"local"}

# Frontend
curl -I http://193.233.230.139
# Ожидаемый ответ: HTTP/1.1 200 OK

# Database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM time_slots;"
```

### Автоматические уведомления

После настройки Telegram секретов вы будете получать уведомления:
- ✅ Успешный деплой с информацией о коммите
- ❌ Ошибка деплоя с ссылкой на GitHub Actions

---

## 📝 Дополнительные ресурсы

- [ARCHITECTURE.md](./ARCHITECTURE.md) — техническая документация
- [CONTRIBUTING.md](./CONTRIBUTING.md) — гайд для контрибьюторов
- [GitHub Actions Docs](https://docs.github.com/en/actions) — документация по CI/CD
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/) — управление процессами

---

## ❓ Нужна помощь?

- 📧 Email: support@yolonaiils.com
- 💬 Telegram: @yolonaiils_support
- 🐛 Issues: [GitHub Issues](https://github.com/ваш-username/yolonaiils/issues)

---

**Версия:** 2.0  
**Последнее обновление:** 03.01.2026  
**Статус деплоя:** [![CI/CD](https://github.com/ваш-username/yolonaiils/actions/workflows/ci.yml/badge.svg)](https://github.com/ваш-username/yolonaiils/actions)
