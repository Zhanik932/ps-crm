# PS-CRM

## Настройка учетных данных

Для работы проекта необходимо настроить учетные данные:

1. Создайте копию файла example.credentials.json с именем credentials.json
```bash
cp example.credentials.json credentials.json
```

2. Замените все placeholder'ы (YOUR_*_HERE) в файле credentials.json на ваши реальные данные из Google Cloud Console:
   - YOUR_PROJECT_ID_HERE
   - YOUR_PRIVATE_KEY_ID_HERE
   - YOUR_PRIVATE_KEY_HERE
   - YOUR_SERVICE_ACCOUNT_EMAIL
   - YOUR_CLIENT_ID_HERE
   - YOUR_CERT_URL_HERE

3. Файл credentials.json добавлен в .gitignore и не будет отправлен в репозиторий
