# 🌍 ExcellentWorld — Сайт Minecraft-сервера

**Домен:** [excellentworld.xyz](https://excellentworld.xyz)  
**IP сервера:** `mc.excellentworld.xyz`  
**Стек:** HTML5 + CSS3 + Node.js (Express) + [Aaio](https://aaio.so) (платежи)

---

## 📁 Структура проекта

```
excellentworld/
├── server.js              ← Express-бэкенд, роуты /api/buy и /api/webhook
├── package.json           ← Зависимости и скрипты
├── .gitignore
├── README.md
└── public/
    ├── index.html         ← Главная страница (герой + донаты + футер)
    ├── success.html       ← Страница после успешной оплаты
    ├── fail.html          ← Страница при неудачной оплате
    ├── css/
    │   └── style.css      ← Все стили (переменные, анимации, адаптив)
    └── js/
        └── main.js        ← Скролл-эффект, модалка, отправка формы
```

---

## 🚀 Быстрый старт

### 1. Установи зависимости

```bash
npm install
```

### 2. Настрой ключи Aaio

Открой `server.js` и найди блок в самом начале файла:

```js
const AAIO_MERCHANT_ID = 'ТВОЙ_MERCHANT_ID';
const AAIO_SECRET_KEY1 = 'ТВОЙ_SECRET_KEY_1';
const AAIO_API_KEY     = 'ТВОЙ_API_KEY';
```

Данные берутся из личного кабинета Aaio: **[aaio.so/cabinet/shop](https://aaio.so/cabinet/shop)**

| Параметр | Где взять |
|---|---|
| `MERCHANT_ID` | Раздел «Мои магазины» → ID магазина |
| `SECRET_KEY_1` | Там же → Секретный ключ №1 |
| `API_KEY` | Раздел «Настройки» → API-ключ |

### 3. Укажи URL своего сайта

В `server.js` найди строку:

```js
const SITE_URL = 'https://excellentworld.xyz';
```

При локальной разработке замени на `http://localhost:3000`.

### 4. Запусти сервер

```bash
# Продакшн
node server.js

# Разработка (с авто-перезагрузкой)
npm run dev
```

Сайт будет доступен на **http://localhost:3000**

---

## 💳 Как работает оплата

```
Пользователь нажимает «Купить»
        ↓
Вводит ник + email в модальном окне
        ↓
POST /api/buy  →  server.js формирует SHA-256 подпись
        ↓
Возвращается ссылка на страницу оплаты Aaio
        ↓
Редирект → Aaio сам предлагает метод (Карта / СБП / Google Pay / QIWI)
        ↓
После оплаты Aaio шлёт POST на /api/webhook
        ↓
Сервер проверяет подпись → выдаёт донат игроку
```

### Настройка вебхука в Aaio

В личном кабинете Aaio укажи URL уведомления:

```
https://excellentworld.xyz/api/webhook
```

---

## 🎁 Донат-пакеты и цены

| Пакет | Цена | Цвет |
|---|---|---|
| 🐉 Dragon | 1 490 ₽ | Фиолетово-розовый |
| 👑 Imperator | 990 ₽ | Красно-розовый ⭐ Лучший выбор |
| 🏆 Lord | 590 ₽ | Золотисто-белый |
| ⛏️ Miner | 290 ₽ | Сине-голубой |

Цены меняются в `server.js` в объекте `DONATE_PRICES`.

---

## ⚙️ Выдача доната после оплаты

После успешной оплаты Aaio вызывает `/api/webhook`. В `server.js` найди блок:

```js
// TODO: здесь добавь логику выдачи доната игроку
```

Варианты реализации:
- **RCON** — отправить команду напрямую на Minecraft-сервер
- **База данных** — записать заказ в MySQL/MongoDB, плагин подхватит
- **HTTP API** — если у сервера есть свой API (например, через плагин)

---

## 🌐 Деплой на VPS

```bash
# Установи PM2 для фоновой работы
npm install -g pm2

# Запусти приложение
pm2 start server.js --name excellentworld

# Автозапуск при перезагрузке сервера
pm2 startup
pm2 save
```

Для HTTPS используй **Nginx** как reverse-proxy:

```nginx
server {
    listen 80;
    server_name excellentworld.xyz www.excellentworld.xyz;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Затем подключи SSL через **Certbot**:

```bash
certbot --nginx -d excellentworld.xyz -d www.excellentworld.xyz
```

---

## 📬 Контакты

**Email:** kxjdjddnnddjjd@gmail.com  
© All rights reserved — ExcellentWorld
