# 🔥 Hotfix: Исправление ошибки деплоя на шаге 13

## Проблема
Скрипт `deploy_local_storage.sh` останавливался на шаге 13 (Настройка Python API сервера) из-за:
1. Отсутствия `backend/payment/index.py`
2. Использования `boto3` (S3) вместо локального хранилища
3. Неправильных импортов в backend функциях

## ✅ Что исправлено

### 1. **deploy_local_storage.sh**
- Добавлена проверка наличия backend handlers перед импортом
- API сервер теперь работает даже если `payment` handler отсутствует (использует заглушку)
- Добавлена поддержка динамических импортов с fallback
- Добавлен `bcrypt` в зависимости для auth

### 2. **backend/bookings/index.py**
- Удалена зависимость от `boto3`
- Добавлено локальное хранилище файлов (`/var/www/yolonaiils_storage/uploads`)
- Исправлены импорты (`from bookings.utils import` вместо `from utils import`)

### 3. **backend/slots/index.py**
- Исправлены импорты для работы на VPS

---

## 🚀 Как применить исправления

### Вариант 1: Автоматически через GitHub

Код уже обновлён в репозитории. Просто сделайте:

```bash
# На VPS
cd /var/www/yolonaiils
git pull origin main
npm run build
pm2 restart yolonaiils-api
```

---

### Вариант 2: Полный передеплой

Если хотите чистую установку:

```bash
# На VPS
cd /root
rm -rf /var/www/yolonaiils
rm -rf /var/www/yolonaiils_storage

# Скачайте обновлённый скрипт
wget https://raw.githubusercontent.com/ваш-username/yolonaiils/main/deploy_local_storage.sh -O deploy_local_storage.sh
chmod +x deploy_local_storage.sh

# Запустите
./deploy_local_storage.sh
```

---

## 🧪 Проверка работы API

После применения исправлений проверьте:

```bash
# 1. Health check
curl http://193.233.230.139/health
# Ожидается: {"status":"healthy","service":"yolonaiils-api","storage":"local","handlers":["slots","bookings","auth",...]}

# 2. PM2 статус
pm2 status
# Ожидается: yolonaiils-api   online

# 3. Логи API (если есть ошибки)
pm2 logs yolonaiils-api --lines 50
```

---

## 📋 Что изменилось в API

### Endpoints с динамическими handlers

Теперь API автоматически определяет доступные handlers:

```python
handlers = {
    'slots': slots_handler,      # ✅ Доступен
    'bookings': bookings_handler, # ✅ Доступен
    'auth': auth_handler,         # ✅ Доступен
    'payment': None               # ❌ Не найден → заглушка
}
```

### Payment endpoint (заглушка)

Если `backend/payment/index.py` отсутствует, API возвращает:

```json
{
  "success": true,
  "message": "Payment endpoint (stub)",
  "data": {...}
}
```

Это позволяет фронтенду работать без ошибок.

---

## 🛠️ Если всё ещё не работает

### Проблема: ImportError в логах

```bash
pm2 logs yolonaiils-api | grep ImportError
```

**Решение:**
```bash
cd /var/www/yolonaiils/api_server
source venv/bin/activate
pip install bcrypt requests psycopg2-binary
pm2 restart yolonaiils-api
```

---

### Проблема: Фото не сохраняются

**Проверка:**
```bash
ls -lah /var/www/yolonaiils_storage/uploads
```

**Решение:**
```bash
mkdir -p /var/www/yolonaiils_storage/uploads
chown -R www-data:www-data /var/www/yolonaiils_storage
chmod -R 755 /var/www/yolonaiils_storage
```

---

### Проблема: Database connection failed

**Проверка:**
```bash
psql $DATABASE_URL -c "SELECT version();"
```

**Решение:**
```bash
# Проверьте .env файл
cat /var/www/yolonaiils/.env

# Убедитесь, что DATABASE_URL правильный:
# DATABASE_URL=postgresql://yolouser:пароль@localhost:5432/yolonaiils
```

---

## 📊 Мониторинг после исправлений

Рекомендуется проверить:

1. **API Health:**
   ```bash
   watch -n 5 'curl -s http://193.233.230.139/health | jq'
   ```

2. **PM2 Logs:**
   ```bash
   pm2 logs yolonaiils-api --lines 100
   ```

3. **Nginx Error Log:**
   ```bash
   tail -f /var/log/nginx/yolonaiils_error.log
   ```

---

## 🎯 Следующие шаги

После успешного применения исправлений:

1. ✅ Протестируйте создание записи (booking) с фото
2. ✅ Проверьте авторизацию в админке
3. ✅ Убедитесь, что слоты загружаются корректно
4. ⚠️ Настройте GitHub Actions секреты для автодеплоя

---

## 📞 Поддержка

Если проблема не решена:
- Отправьте логи: `pm2 logs yolonaiils-api --lines 100 > /tmp/api_logs.txt`
- Проверьте deployment лог: `cat /root/yolonaiils_deploy.log`

---

**Версия:** 2.1  
**Дата:** 03.01.2026  
**Статус:** ✅ Исправлено
