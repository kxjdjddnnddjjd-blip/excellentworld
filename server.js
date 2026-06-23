/**
 * ExcellentWorld — Minecraft Server Website
 * Бэкенд на Express.js с интеграцией платёжного агрегатора Aaio
 */

const express = require('express');
const crypto  = require('crypto');
const axios   = require('axios');
const cors    = require('cors');
const path    = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// НАСТРОЙКИ AAIO — ВСТАВЬ СВОИ ДАННЫЕ ЗДЕСЬ
// Получить их можно в личном кабинете: https://aaio.so/cabinet/shop
// ─────────────────────────────────────────────────────────────────────────────

const AAIO_MERCHANT_ID = 'ТВОЙ_MERCHANT_ID';   // Из раздела «Мои магазины»
const AAIO_SECRET_KEY1 = 'ТВОЙ_SECRET_KEY_1';  // Секретный ключ №1
const AAIO_API_KEY     = 'ТВОЙ_API_KEY';        // API-ключ (раздел «Настройки»)

// URL сайта — используется для redirect'а после оплаты
const SITE_URL = 'https://excellentworld.xyz';

// Цены донатов (в рублях)
const DONATE_PRICES = {
  dragon:    1490,
  imperator: 990,
  lord:      590,
  miner:     290,
};

// ─────────────────────────────────────────────────────────────────────────────

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/buy — создание платёжной ссылки через Aaio
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/buy', async (req, res) => {
  const { nick, email, donate } = req.body;

  // Валидация входных данных
  if (!nick || !email || !donate) {
    return res.status(400).json({ error: 'Заполни все поля' });
  }

  const donateName = donate.toLowerCase();
  const amount = DONATE_PRICES[donateName];

  if (!amount) {
    return res.status(400).json({ error: 'Неизвестный тип доната' });
  }

  // Уникальный номер заказа (timestamp + ник, чтобы не было коллизий)
  const orderId = `${donateName}_${nick}_${Date.now()}`;

  // Описание заказа для отображения на странице оплаты
  const description = `ExcellentWorld | Донат ${donate} для игрока ${nick}`;

  // ── Формирование подписи (sign) по документации Aaio ──
  // Алгоритм: SHA256 от строки "merchant_id:amount:currency:secret1:order_id"
  const currency = 'RUB';
  const signString = `${AAIO_MERCHANT_ID}:${amount}:${currency}:${AAIO_SECRET_KEY1}:${orderId}`;
  const sign = crypto.createHash('sha256').update(signString).digest('hex');

  // ── Параметры для редиректа на платёжную форму Aaio ──
  // Все методы (СБП, Карта, Google Pay, QIWI) доступны автоматически
  const params = new URLSearchParams({
    merchant_id:  AAIO_MERCHANT_ID,
    amount:       amount,
    currency:     currency,
    order_id:     orderId,
    sign:         sign,
    desc:         description,
    email:        email,
    lang:         'ru',
    success_url:  `${SITE_URL}/success.html`,
    fail_url:     `${SITE_URL}/fail.html`,
  });

  const paymentUrl = `https://aaio.so/merchant/pay?${params.toString()}`;

  return res.json({ url: paymentUrl });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/webhook — Aaio шлёт уведомление об успешной оплате
// Здесь можно выдавать донат игроку (через RCON, базу данных и т.д.)
// ─────────────────────────────────────────────────────────────────────────────
app.post('/api/webhook', (req, res) => {
  const {
    merchant_id, amount, currency, order_id, sign,
  } = req.body;

  // Проверяем подпись от Aaio, чтобы убедиться, что запрос легитимный
  const expected = crypto
    .createHash('sha256')
    .update(`${merchant_id}:${amount}:${currency}:${AAIO_SECRET_KEY1}:${order_id}`)
    .digest('hex');

  if (sign !== expected) {
    console.error('Неверная подпись вебхука!');
    return res.status(400).send('Bad sign');
  }

  // Всё хорошо — обрабатываем заказ
  console.log(`✅ Оплата подтверждена: заказ ${order_id}, сумма ${amount} ${currency}`);

  // TODO: здесь добавь логику выдачи доната игроку
  // Например: отправить команду на сервер через RCON, записать в БД и т.д.

  return res.send('OK'); // Aaio ждёт ответа «OK»
});

// Главная страница
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 ExcellentWorld сервер запущен на http://localhost:${PORT}`);
});
