(function () {
  'use strict';

  var VERSION = '20260814-app-entry-parity-v1';
  var initialized = false;
  var introCentered = false;
  var raf = 0;
  var drag = null;

  function q(sel, root) {
    try { return (root || document).querySelector(sel); } catch (_) { return null; }
  }
  function qa(sel, root) {
    try { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); } catch (_) { return []; }
  }
  function landing() { return q('.landing'); }
  function carousel() { return q('.manager-carousel'); }
  function cards() {
    var c = carousel();
    if (!c) return [];
    return qa(':scope > .manager-card', c);
  }
  function isNight() {
    var l = landing();
    if (!l) return false;
    return l.classList.contains('night') ||
      l.getAttribute('data-theme') === 'dark' ||
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      document.body.getAttribute('data-theme') === 'dark';
  }
  function logoSource() {
    return isNight() ? './branding/ANG-HR-icon-night-1024.png' : './branding/ANG-HR-icon-day-1024.png';
  }

  function ensureLogo(l) {
    var img = q('.ang-app-logo', l);
    if (!img) {
      img = document.createElement('img');
      img.className = 'ang-app-logo';
      img.alt = 'ANG HR';
      img.decoding = 'async';
      l.appendChild(img);
    }
    var src = logoSource();
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
  }

  function ensureEncouragement(l) {
    var e = q('.ang-app-encouragement', l);
    if (!e) {
      e = document.createElement('div');
      e.className = 'ang-app-encouragement';
      e.setAttribute('aria-hidden', 'true');
      e.innerHTML = '<span>今天的你，也值得一句做得很好。</span>';
      l.appendChild(e);
    }
  }

  function findNativeThemeButton() {
    var selectors = [
      '[data-theme-toggle]',
      'button[aria-label*="主題"]',
      'button[aria-label*="日夜"]',
      'button[aria-label*="深色"]',
      'button[aria-label*="淺色"]',
      'button[title*="主題"]',
      'button[title*="日夜"]'
    ];
    for (var i = 0; i < selectors.length; i += 1) {
      var el = q(selectors[i]);
      if (el && !el.classList.contains('ang-app-theme-toggle')) return el;
    }
    return null;
  }

  function fallbackToggleTheme() {
    var l = landing();
    if (!l) return;
    var nextNight = !isNight();
    l.classList.toggle('night', nextNight);
    l.classList.toggle('day', !nextNight);
    l.setAttribute('data-theme', nextNight ? 'dark' : 'light');
    try {
      localStorage.setItem('ang_hr_theme', nextNight ? 'dark' : 'light');
      localStorage.setItem('theme', nextNight ? 'dark' : 'light');
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('ANG_HR_THEME_CHANGED', { detail: { theme: nextNight ? 'dark' : 'light' } }));
    schedule();
  }

  function syncThemeButton(button) {
    if (!button) return;
    button.textContent = isNight() ? '☾' : '☀';
    button.setAttribute('aria-label', isNight() ? '切換日光模式' : '切換暗夜模式');
    button.title = button.getAttribute('aria-label');
  }

  function ensureControls(l) {
    var row = q('.ang-app-top-controls', l);
    if (!row) {
      row = document.createElement('div');
      row.className = 'ang-app-top-controls';
      row.innerHTML = '<span aria-hidden="true"></span><button type="button" class="ang-app-theme-toggle" aria-label="切換日夜模式">☀</button>';
      l.appendChild(row);
      q('.ang-app-theme-toggle', row).addEventListener('click', function () {
        var nativeButton = findNativeThemeButton();
        if (nativeButton) {
          nativeButton.click();
          window.setTimeout(schedule, 40);
          window.setTimeout(schedule, 220);
        } else {
          fallbackToggleTheme();
        }
      });
    }
    syncThemeButton(q('.ang-app-theme-toggle', row));
  }

  function patchCopy() {
    var l = landing();
    if (!l) return;

    var intro = q('.manager-card.intro', l);
    if (intro) {
      var title = q('.manager-welcome-title', intro);
      if (title && title.textContent !== 'ANG HR 系統') title.textContent = 'ANG HR 系統';

      var directions = qa('.gesture-directions .swipe-direction', intro);
      if (directions[0]) {
        var leftText = q('em', directions[0]);
        if (leftText && leftText.textContent !== '左滑登入系統') leftText.textContent = '左滑登入系統';
      }
      if (directions[1]) {
        var rightText = q('em', directions[1]);
        if (rightText && rightText.textContent !== '右滑查看方案') rightText.textContent = '右滑查看方案';
      }
    }

    var login = q('.manager-card.login-unified', l);
    if (login) {
      var h = q('.login-card-title h2,h2', login);
      if (h && h.textContent !== '登入系統') h.textContent = '登入系統';

      var input = q('input[aria-label="帳號或 Email"],input[aria-label="Email或帳號"],input[aria-label="Email、帳號或公司代號"],input[aria-label="Email或使用者代號"],input[type="email"],input[type="text"]', login);
      if (input && !input.matches('[type="password"]')) {
        input.setAttribute('placeholder', '帳號或 Email');
        input.setAttribute('aria-label', '帳號或 Email');
        input.setAttribute('autocomplete', 'username');
      }
      var verify = q('.login-verify-button', login);
      if (verify && !/驗證碼/.test(verify.textContent || '') && verify.textContent !== '驗證') verify.textContent = '驗證';
    }
  }

  function centerLeft(c, card) {
    return Math.max(0, card.offsetLeft - (c.clientWidth - card.clientWidth) / 2);
  }

  function centeredCard() {
    var c = carousel(), list = cards();
    if (!c || !list.length) return null;
    var center = c.scrollLeft + c.clientWidth / 2;
    var best = list[0], distance = Infinity;
    list.forEach(function (card) {
      var d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      if (d < distance) { distance = d; best = card; }
    });
    return best;
  }

  function centerIntroOnce() {
    if (introCentered) return;
    var c = carousel();
    var intro = q('.manager-card.intro');
    if (!c || !intro) return;
    introCentered = true;
    c.scrollTo({ left: centerLeft(c, intro), behavior: 'auto' });
  }

  function ensureDots(l) {
    var list = cards();
    if (!list.length) return;
    var dots = q('.ang-app-dots', l);
    if (!dots) {
      dots = document.createElement('div');
      dots.className = 'ang-app-dots';
      dots.setAttribute('aria-hidden', 'true');
      l.appendChild(dots);
    }
    if (dots.children.length !== list.length) {
      dots.innerHTML = list.map(function () { return '<i></i>'; }).join('');
    }
    syncDots();
  }

  function syncDots() {
    var list = cards();
    var active = centeredCard();
    var dots = q('.ang-app-dots');
    if (!dots || !active) return;
    var index = list.indexOf(active);
    qa('i', dots).forEach(function (dot, i) { dot.classList.toggle('active', i === index); });
  }

  function ensureDragZone(l) {
    var zone = q('.ang-app-drag-zone', l);
    if (!zone) {
      zone = document.createElement('div');
      zone.className = 'ang-app-drag-zone';
      zone.setAttribute('aria-label', '上下滑動展開或收合卡片');
      l.appendChild(zone);
      zone.addEventListener('pointerdown', function (ev) {
        if (!ev.isPrimary || ev.button > 0) return;
        var active = centeredCard();
        if (!active) return;
        zone.setPointerCapture && zone.setPointerCapture(ev.pointerId);
        drag = {
          pointerId: ev.pointerId,
          card: active,
          startX: ev.clientX,
          startY: ev.clientY,
          lastX: ev.clientX,
          lastY: ev.clientY
        };
        ev.preventDefault();
      });
      zone.addEventListener('pointermove', function (ev) {
        if (!drag || ev.pointerId !== drag.pointerId) return;
        drag.lastX = ev.clientX;
        drag.lastY = ev.clientY;
        ev.preventDefault();
      });
      zone.addEventListener('pointerup', finishDrag);
      zone.addEventListener('pointercancel', function () { drag = null; });
    }
    positionDragZone();
  }

  function finishDrag(ev) {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    var state = drag;
    drag = null;
    var dx = ev.clientX - state.startX;
    var dy = ev.clientY - state.startY;
    var card = state.card;
    if (!card || !document.documentElement.contains(card)) return;

    if (Math.abs(dy) >= 32 && Math.abs(dy) > Math.abs(dx)) {
      if (dy < 0 && card.classList.contains('collapsed')) toggleCard(card);
      if (dy > 0 && card.classList.contains('expanded')) toggleCard(card);
      schedule();
      return;
    }
    if (Math.abs(dx) >= Math.max(44, window.innerWidth * .13)) {
      moveAdjacent(card, dx < 0 ? 1 : -1);
      return;
    }
    toggleCard(card);
  }

  function toggleCard(card) {
    var toggle = q('.manager-card-toggle', card);
    if (toggle) toggle.click();
    else card.click();
  }

  function moveAdjacent(card, direction) {
    var c = carousel(), list = cards();
    if (!c || !card || !list.length) return;
    var index = list.indexOf(card);
    if (index < 0) return;
    var target = list[Math.max(0, Math.min(list.length - 1, index + direction))] || card;
    if (card.classList.contains('expanded')) toggleCard(card);
    window.setTimeout(function () {
      c.scrollTo({ left: centerLeft(c, target), behavior: 'smooth' });
    }, 50);
  }

  function positionDragZone() {
    var zone = q('.ang-app-drag-zone');
    var active = centeredCard();
    if (!zone || !active) return;
    var r = active.getBoundingClientRect();
    zone.style.left = Math.max(0, r.left) + 'px';
    zone.style.top = Math.max(0, r.top) + 'px';
    zone.style.width = Math.max(0, r.width) + 'px';
    zone.hidden = r.width < 10 || r.bottom < 0 || r.top > window.innerHeight;
  }

  function bindCarousel() {
    var c = carousel();
    if (!c || c.dataset.appParityBound === VERSION) return;
    c.dataset.appParityBound = VERSION;
    var timer = 0;
    c.addEventListener('scroll', function () {
      syncDots();
      positionDragZone();
      clearTimeout(timer);
      timer = window.setTimeout(function () {
        syncDots();
        positionDragZone();
      }, 120);
    }, { passive: true });
  }

  function patch() {
    var l = landing();
    if (!l) return;
    l.dataset.appEntryParity = VERSION;
    ensureLogo(l);
    ensureEncouragement(l);
    ensureControls(l);
    patchCopy();
    centerIntroOnce();
    ensureDots(l);
    ensureDragZone(l);
    bindCarousel();
    syncThemeButton(q('.ang-app-theme-toggle', l));
  }

  function schedule() {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      patch();
    });
  }

  function start() {
    if (initialized) return;
    initialized = true;
    patch();
    var root = q('#root') || document.body;
    new MutationObserver(schedule).observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'aria-expanded', 'hidden']
    });
    window.addEventListener('resize', schedule, { passive: true });
    window.addEventListener('orientationchange', schedule, { passive: true });
    window.addEventListener('pageshow', schedule, { passive: true });
    window.addEventListener('ANG_HR_THEME_CHANGED', schedule);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}());
