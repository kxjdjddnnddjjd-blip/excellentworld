/**
 * ExcellentWorld — main.js
 * Логика: плавный фон при скролле, ховер-эффект заголовка, модальное окно, оплата
 */

/* ═══════════════════════════════════════════
   1. ПЛАВНЫЙ ПЕРЕХОД ФОНА ПРИ СКРОЛЛЕ
   Секция .hero — чёрная, секция .donate — белая.
   Страница имеет один общий фон (#hero), который интерполируется.
   Используем IntersectionObserver + scroll listener для плавности.
═══════════════════════════════════════════ */
(function initScrollBackground() {
  const heroEl   = document.getElementById('hero');
  const donateEl = document.getElementById('donate');

  /**
   * Считаем, насколько «вошёл» donate-блок в экран.
   * progress: 0 = donate ещё не виден, 1 = donate полностью на экране.
   */
  function updateBackground() {
    const viewH     = window.innerHeight;
    const donateTop = donateEl.getBoundingClientRect().top;

    // Прогресс от 0 до 1 — начинается когда верхний край donate
    // достигает нижнего края viewport, заканчивается когда достигает верхнего
    const progress = Math.min(1, Math.max(0, 1 - donateTop / viewH));

    // Интерполируем чёрный → белый
    const channel = Math.round(progress * 255);
    const rgb     = `rgb(${channel}, ${channel}, ${channel})`;

    // Применяем к обоим элементам, чтобы не было резкой границы
    heroEl.style.background = `rgb(0, 0, 0)`;
    donateEl.style.backgroundColor = rgb;

    // Текст заголовка «Поддержи сервер» и подпись — инвертируем при тёмном фоне
    document.body.style.setProperty('--scroll-progress', progress);
  }

  window.addEventListener('scroll', updateBackground, { passive: true });
  window.addEventListener('resize', updateBackground, { passive: true });
  updateBackground();
})();


/* ═══════════════════════════════════════════
   2. ХОВЕР НА ЗАГОЛОВКЕ — скрываем подсказку
═══════════════════════════════════════════ */
(function initHeroHover() {
  const title = document.getElementById('heroTitle');
  const hint  = document.getElementById('heroHint');
  let hinted  = false;

  if (!title || !hint) return;

  title.addEventListener('mouseenter', () => {
    if (!hinted) {
      hinted = true;
      hint.classList.add('hidden');
    }
  });
})();


/* ═══════════════════════════════════════════
   3. СТРЕЛКА ВНИЗ — скролл к донатам
═══════════════════════════════════════════ */
(function initScrollArrow() {
  const arrow  = document.getElementById('scrollArrow');
  const donate = document.getElementById('donate');
  if (!arrow || !donate) return;

  arrow.addEventListener('click', () => {
    donate.scrollIntoView({ behavior: 'smooth' });
  });
})();


/* ═══════════════════════════════════════════
   4. МОДАЛЬНОЕ ОКНО
═══════════════════════════════════════════ */
// Текущий выбранный донат
let currentDonate = { name: '', price: 0 };

// Иконки для каждого доната
const donateIcons = {
  Dragon:    '🐉',
  Imperator: '👑',
  Lord:      '🏆',
  Miner:     '⛏️',
};

/**
 * Открывает модальное окно с данными конкретного доната.
 * Вызывается прямо из onclick в HTML.
 */
function openModal(donateName, price) {
  currentDonate = { name: donateName, price };

  document.getElementById('modalDonateName').textContent = donateName;
  document.getElementById('modalPrice').textContent      = price.toLocaleString('ru-RU');
  document.getElementById('modalIcon').textContent       = donateIcons[donateName] || '🎁';

  // Очищаем форму
  document.getElementById('nickInput').value  = '';
  document.getElementById('emailInput').value = '';
  clearErrors();

  // Показываем оверлей
  document.getElementById('modalOverlay').classList.add('active');
  document.body.style.overflow = 'hidden'; // блокируем скролл страницы

  // Фокус на первое поле
  setTimeout(() => document.getElementById('nickInput').focus(), 350);
}

/** Закрывает модальное окно. */
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  document.body.style.overflow = '';
}

/** Закрывает модалку по клику на оверлей (но не на саму карточку). */
function closeModalOutside(e) {
  if (e.target === document.getElementById('modalOverlay')) {
    closeModal();
  }
}

/** Закрытие по Escape */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

/* ── Вспомогательные функции валидации ── */
function setError(fieldId, errId, message) {
  document.getElementById(fieldId).classList.add('error');
  document.getElementById(errId).textContent = message;
}

function clearError(fieldId, errId) {
  document.getElementById(fieldId).classList.remove('error');
  document.getElementById(errId).textContent = '';
}

function clearErrors() {
  clearError('nickInput', 'nickError');
  clearError('emailInput', 'emailError');
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


/* ═══════════════════════════════════════════
   5. ОТПРАВКА ФОРМЫ И ОПЛАТА
═══════════════════════════════════════════ */
async function submitPayment() {
  const nick  = document.getElementById('nickInput').value.trim();
  const email = document.getElementById('emailInput').value.trim();

  clearErrors();

  // Клиентская валидация
  let hasError = false;

  if (!nick) {
    setError('nickInput', 'nickError', 'Введи свой ник в Minecraft');
    hasError = true;
  } else if (nick.length < 3) {
    setError('nickInput', 'nickError', 'Ник должен быть не короче 3 символов');
    hasError = true;
  }

  if (!email) {
    setError('emailInput', 'emailError', 'Введи свой Email');
    hasError = true;
  } else if (!validateEmail(email)) {
    setError('emailInput', 'emailError', 'Некорректный формат Email');
    hasError = true;
  }

  if (hasError) return;

  // Блокируем кнопку и показываем спиннер
  const btn     = document.getElementById('payBtn');
  const btnText = document.getElementById('payBtnText');
  const spinner = document.getElementById('payBtnSpinner');

  btn.disabled = true;
  btnText.textContent = 'Создаём платёж...';
  spinner.classList.remove('hidden');

  try {
    const response = await fetch('/api/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nick,
        email,
        donate: currentDonate.name,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Ошибка сервера');
    }

    // Перенаправляем на страницу оплаты Aaio
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error('Не получили ссылку на оплату');
    }

  } catch (err) {
    console.error('Ошибка при оплате:', err);
    alert(`Ошибка: ${err.message}\n\nПожалуйста, попробуй ещё раз или напиши нам на kxjdjddnnddjjd@gmail.com`);
  } finally {
    // Восстанавливаем кнопку в любом случае
    btn.disabled = false;
    btnText.textContent = 'Перейти к оплате';
    spinner.classList.add('hidden');
  }
}

/* ── Живая валидация по blur ── */
document.getElementById('nickInput').addEventListener('blur', function () {
  if (this.value.trim().length > 0 && this.value.trim().length < 3) {
    setError('nickInput', 'nickError', 'Ник должен быть не короче 3 символов');
  } else if (this.value.trim()) {
    clearError('nickInput', 'nickError');
  }
});

document.getElementById('emailInput').addEventListener('blur', function () {
  if (this.value.trim() && !validateEmail(this.value.trim())) {
    setError('emailInput', 'emailError', 'Некорректный формат Email');
  } else if (this.value.trim()) {
    clearError('emailInput', 'emailError');
  }
});

