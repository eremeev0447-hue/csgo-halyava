// ─── ТАБЫ ───────────────────────────────────────────────────
function showTab(n) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + n).classList.add('active');
  document.querySelectorAll('.tab-button')[n].classList.add('active');
}

// ─── FAQ: аккордеон ─────────────────────────────────────────
function toggleFaq(i) {
  const answer = document.getElementById('faq-answer-' + i);
  const arrow = document.getElementById('arrow-' + i);
  const isOpen = answer.classList.contains('open');
  document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
  document.querySelectorAll('.faq-arrow').forEach(a => a.style.transform = '');
  if (!isOpen) {
    answer.classList.add('open');
    arrow.style.transform = 'rotate(180deg)';
  }
}

// ─── МОДАЛЬНОЕ ОКНО ─────────────────────────────────────────
function openCard(id) {
  const card = window.__CARDS__.find(c => String(c._id) === String(id));
  if (!card) return;

  // Обновляем URL без перезагрузки
  const url = new URL(window.location.href);
  url.searchParams.set('card', id);
  history.replaceState(null, '', url.toString());

  let promoHtml = '';
  if (card.promoCode) {
    promoHtml = `
      <div class="promo-btn" onclick="copyPromo('${escHtml(card.promoCode)}', this)">
        🎁 СКОПИРОВАТЬ ПРОМОКОД: <strong>${escHtml(card.promoCode)}</strong>
      </div>`;
  }

  document.getElementById('modal-body').innerHTML = `
    <h2 style="font-size:1.8rem; margin-bottom:10px; font-family:'Oswald',sans-serif;">${escHtml(card.title)}</h2>
    <img src="${escHtml(card.image)}" style="width:100%; max-height:200px; object-fit:contain; margin:15px 0; background:#0a0a0a; border-radius:10px; padding:12px;">
    <p style="font-size:1.2rem; margin-bottom:8px;"><strong>${escHtml(card.description)}</strong></p>
    ${card.subtext ? `<p style="color:#aaa; margin-bottom:12px;">${escHtml(card.subtext)}</p>` : ''}
    ${card.promoText ? `<p style="color:#ffd700; margin-bottom:12px;">${escHtml(card.promoText)}</p>` : ''}
    ${promoHtml}
    <a href="${escHtml(card.link)}" target="_blank" class="btn" style="margin-top:10px;">ПОЛУЧИТЬ ХАЛЯВУ</a>
  `;

  document.getElementById('cardModal').style.display = 'block';
}

function closeModal() {
  document.getElementById('cardModal').style.display = 'none';
  const url = new URL(window.location.href);
  url.searchParams.delete('card');
  history.replaceState(null, '', url.toString());
}

function copyPromo(code, el) {
  navigator.clipboard.writeText(code).then(() => {
    const orig = el.innerHTML;
    el.innerHTML = `✅ Скопировано: <strong>${escHtml(code)}</strong>`;
    setTimeout(() => { el.innerHTML = orig; }, 2000);
  });
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.onclick = function(e) {
  if (e.target === document.getElementById('cardModal')) closeModal();
};

// Копирование промокода прямо с главной страницы
function copyPromoMain(code, el) {
  navigator.clipboard.writeText(code).then(() => {
    const orig = el.innerHTML;
    el.innerHTML = '✅ Скопировано: <strong>' + escHtml(code) + '</strong>';
    setTimeout(() => { el.innerHTML = orig; }, 2000);
  });
}
