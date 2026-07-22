(function () {
  'use strict';

  var PENDING_PLAN_KEY = 'ang_hr_pending_plan';
  var ENTRY_INTENT_KEY = 'ang_hr_entry_intent';
  var AUTH_MISSING_PATTERN = /not[_ -]?found|missing|unknown[_ -]?account|unregistered|not[_ -]?registered|no[_ -]?account|找不到|查無|不存在|未註冊|沒有這個帳號|沒有此帳號/i;
  var VERSION = '20260722-index-card-rules-v1';
  var gesture = null;
  var suppressClickUntil = 0;

  var PLAN_THEMES = {
    business_basic: {
      metal: '#b87333', metalRgb: '184,115,51',
      main: '#2f73d9', mainRgb: '47,115,217', label: 'Business Basic'
    },
    business_pro: {
      metal: '#c8ced8', metalRgb: '200,206,216',
      main: '#e94e9b', mainRgb: '233,78,155', label: 'Business Pro'
    },
    business_premium: {
      metal: '#d8ad43', metalRgb: '216,173,67',
      main: '#48207a', mainRgb: '72,32,122', label: 'Business Premium'
    },
    personal_solo: {
      metal: '#c8ced8', metalRgb: '200,206,216',
      main: '#7863d9', mainRgb: '120,99,217', label: 'Personal Solo'
    },
    personal_performance: {
      metal: '#d8ad43', metalRgb: '216,173,67',
      main: '#c94db5', mainRgb: '201,77,181', label: 'Personal Performance'
    },
    personal_lite: {
      metal: '#c8ced8', metalRgb: '200,206,216',
      main: '#d6b94e', mainRgb: '214,185,78', label: 'Personal Lite'
    },
    business_lite: {
      metal: '#b87333', metalRgb: '184,115,51',
      main: '#5e7bd8', mainRgb: '94,123,216', label: 'Business Lite'
    }
  };

  function safeParse(value, fallback) {
    try { return JSON.parse(value); } catch (_) { return fallback; }
  }

  function getPendingPlan() {
    var raw = '';
    try { raw = sessionStorage.getItem(PENDING_PLAN_KEY) || localStorage.getItem(PENDING_PLAN_KEY) || ''; } catch (_) {}
    var plan = safeParse(raw, null);
    if (!plan || !plan.plan_code) return null;
    if (plan.selectedAt && Date.now() - Number(plan.selectedAt) > 30 * 60 * 1000) {
      clearPendingPlan();
      return null;
    }
    return plan;
  }

  function clearPendingPlan() {
    try {
      sessionStorage.removeItem(PENDING_PLAN_KEY);
      localStorage.removeItem(PENDING_PLAN_KEY);
      sessionStorage.setItem(ENTRY_INTENT_KEY, 'login');
    } catch (_) {}
    applyPlanTheme();
  }

  function getLoginCard() {
    return document.querySelector('.manager-card.login-unified');
  }

  function getCarousel() {
    return document.querySelector('.manager-carousel');
  }

  function centerLeft(carousel, card) {
    return Math.max(0, card.offsetLeft - (carousel.clientWidth - card.clientWidth) / 2);
  }

  function centerCard(card, behavior) {
    var carousel = card && card.closest('.manager-carousel');
    if (!carousel || !card) return;
    carousel.style.scrollSnapType = 'none';
    carousel.scrollTo({ left: centerLeft(carousel, card), behavior: behavior || 'smooth' });
    window.setTimeout(function () {
      carousel.style.scrollSnapType = '';
      carousel.style.scrollBehavior = '';
    }, behavior === 'auto' ? 0 : 430);
  }

  function collapseCard(card) {
    if (!card || !card.classList.contains('expanded')) return;
    var toggle = card.querySelector('.manager-card-toggle');
    if (toggle) toggle.click();
  }

  function showLockedHint(card) {
    if (!card) return;
    var body = card.querySelector('.unified-login-body');
    if (!body) return;
    var status = body.querySelector('.login-auth-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'login-auth-status info';
      status.setAttribute('aria-live', 'polite');
      body.appendChild(status);
    }
    status.className = 'login-auth-status info';
    status.textContent = '請先完成驗證；目前只鎖住向上展開，仍可左右滑動。';
  }

  function applyPlanTheme() {
    var card = getLoginCard();
    if (!card) return false;
    var plan = getPendingPlan();
    var theme = plan && PLAN_THEMES[String(plan.plan_code || '').toLowerCase()];

    if (!theme) {
      if (card.classList.contains('login-from-plan')) card.classList.remove('login-from-plan');
      if (card.dataset.pendingPlan) delete card.dataset.pendingPlan;
      if (card.dataset.planThemeVersion) delete card.dataset.planThemeVersion;
      ['--login-metal', '--login-main', '--login-metal-rgb', '--login-main-rgb'].forEach(function (name) {
        if (card.style.getPropertyValue(name)) card.style.removeProperty(name);
      });
      return true;
    }

    var themeChanged = card.dataset.pendingPlan !== String(plan.plan_code) || card.dataset.planThemeVersion !== VERSION;
    if (!card.classList.contains('login-from-plan')) card.classList.add('login-from-plan');
    if (themeChanged) {
      card.dataset.pendingPlan = String(plan.plan_code);
      card.dataset.planThemeVersion = VERSION;
      card.style.setProperty('--login-metal', theme.metal);
      card.style.setProperty('--login-main', theme.main);
      card.style.setProperty('--login-metal-rgb', theme.metalRgb);
      card.style.setProperty('--login-main-rgb', theme.mainRgb);
    }

    var description = card.querySelector('.login-description');
    var descriptionText = '已選擇 ' + (plan.label || theme.label) + '；既有會員直接登入，尚無帳號則完成驗證後直接註冊。';
    if (description && !card.classList.contains('login-system-confirmed') && description.textContent !== descriptionText) {
      description.textContent = descriptionText;
    }
    return true;
  }

  function isInteractive(target) {
    return !!(target && target.closest && target.closest('input, textarea, select, a, .login-verify-button, .social-login-row button, .post-verify-flow button, .plan-payment-form button, .plan-basic-profile-form button'));
  }

  function shouldOwnGesture(card, target) {
    if (!card || isInteractive(target)) return false;
    if (card.classList.contains('expanded')) return true;
    return card.classList.contains('login-unified') && !card.classList.contains('login-system-confirmed');
  }

  function removeGestureListeners() {
    window.removeEventListener('pointermove', onOwnedPointerMove, true);
    window.removeEventListener('pointerup', onOwnedPointerUp, true);
    window.removeEventListener('pointercancel', onOwnedPointerCancel, true);
  }

  function onOwnedPointerDown(event) {
    if (!event.isPrimary || event.button > 0) return;
    var card = event.target && event.target.closest ? event.target.closest('.manager-card') : null;
    if (!shouldOwnGesture(card, event.target)) return;
    var carousel = card.closest('.manager-carousel');
    if (!carousel) return;

    gesture = {
      pointerId: event.pointerId,
      card: card,
      carousel: carousel,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      startScrollLeft: carousel.scrollLeft,
      axis: null,
      moved: false,
      crossedHalf: false,
      wasExpanded: card.classList.contains('expanded'),
      preVerificationLogin: card.classList.contains('login-unified') && !card.classList.contains('login-system-confirmed')
    };

    carousel.style.scrollSnapType = 'none';
    carousel.style.scrollBehavior = 'auto';
    window.addEventListener('pointermove', onOwnedPointerMove, { capture: true, passive: false });
    window.addEventListener('pointerup', onOwnedPointerUp, true);
    window.addEventListener('pointercancel', onOwnedPointerCancel, true);

    /* 阻止舊版登入鎖在 pointerdown 階段把左右手勢也一起攔掉。 */
    event.stopImmediatePropagation();
  }

  function onOwnedPointerMove(event) {
    if (!gesture || event.pointerId !== gesture.pointerId) return;
    var dx = event.clientX - gesture.startX;
    var dy = event.clientY - gesture.startY;
    gesture.lastX = event.clientX;
    gesture.lastY = event.clientY;

    if (!gesture.axis && Math.max(Math.abs(dx), Math.abs(dy)) >= 9) {
      gesture.axis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
    }
    if (!gesture.axis) return;
    gesture.moved = true;

    if (gesture.axis === 'x') {
      event.preventDefault();
      event.stopImmediatePropagation();
      gesture.carousel.scrollLeft = gesture.startScrollLeft - dx;

      var halfPage = Math.max(1, window.innerWidth * 0.5);
      if (gesture.wasExpanded && !gesture.crossedHalf && Math.abs(dx) >= halfPage) {
        gesture.crossedHalf = true;
        collapseCard(gesture.card);
      }
      return;
    }

    if (gesture.preVerificationLogin) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  function finishOwnedGesture(event, cancelled) {
    if (!gesture || (event && event.pointerId !== gesture.pointerId)) return;
    var state = gesture;
    gesture = null;
    removeGestureListeners();

    var dx = (event ? event.clientX : state.lastX) - state.startX;
    var dy = (event ? event.clientY : state.lastY) - state.startY;
    var cards = Array.prototype.slice.call(state.carousel.children || []);
    var index = cards.indexOf(state.card);

    if (state.moved) suppressClickUntil = Date.now() + 320;

    if (!cancelled && state.axis === 'x') {
      if (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }

      if (state.wasExpanded) {
        if (state.crossedHalf) {
          var expandedDirection = dx < 0 ? 1 : -1;
          var expandedTarget = cards[Math.max(0, Math.min(cards.length - 1, index + expandedDirection))] || state.card;
          collapseCard(state.card);
          centerCard(expandedTarget, 'smooth');
        } else {
          centerCard(state.card, 'smooth');
        }
      } else {
        /* 驗證前登入卡仍可正常左右切換；只鎖向上展開。 */
        var threshold = Math.min(92, Math.max(42, state.carousel.clientWidth * 0.16));
        var direction = Math.abs(dx) >= threshold ? (dx < 0 ? 1 : -1) : 0;
        var target = cards[Math.max(0, Math.min(cards.length - 1, index + direction))] || state.card;
        centerCard(target, 'smooth');
      }
    } else if (!cancelled && state.axis === 'y') {
      if (state.preVerificationLogin && dy < -42) {
        showLockedHint(state.card);
        collapseCard(state.card);
      } else if (state.wasExpanded && dy > 42) {
        collapseCard(state.card);
      }
      centerCard(state.card, 'smooth');
    } else {
      centerCard(state.card, 'auto');
    }

    window.setTimeout(function () {
      state.carousel.style.scrollSnapType = '';
      state.carousel.style.scrollBehavior = '';
    }, 440);
  }

  function onOwnedPointerUp(event) {
    finishOwnedGesture(event, false);
  }

  function onOwnedPointerCancel(event) {
    finishOwnedGesture(event, true);
  }

  function textFromAuthError(card) {
    if (!card) return '';
    var status = card.querySelector('.login-auth-status.error');
    var legacy = card.querySelector('.beta-auth-error');
    return String((status && status.textContent) || (legacy && legacy.textContent) || '').trim();
  }

  function isMissingAccountText(text) {
    return AUTH_MISSING_PATTERN.test(String(text || ''));
  }

  function removeMissingPanel(card) {
    if (!card) return;
    card.classList.remove('login-account-missing');
    var panel = card.querySelector('.ang-account-missing-panel');
    if (panel) panel.remove();
  }

  function resetGeneralLogin(card) {
    if (!card) return;
    removeMissingPanel(card);
    card.classList.remove('login-verification-missing', 'login-verification-empty');
    var input = card.querySelector('input[aria-label="Email或帳號"], input[aria-label="Email、帳號或公司代號"], input[aria-label="Email或使用者代號"]');
    if (input) {
      input.removeAttribute('aria-invalid');
      input.focus();
    }
    var status = card.querySelector('.login-auth-status');
    if (status) {
      status.className = 'login-auth-status info';
      status.textContent = '請重新輸入帳號或 Email，再按一次驗證。';
    }
    var legacy = card.querySelector('.beta-auth-error');
    if (legacy) legacy.textContent = '';
  }

  function goToPlans(card) {
    clearPendingPlan();
    removeMissingPanel(card);
    collapseCard(card);
    window.setTimeout(function () {
      var target = document.querySelector('.manager-card.free') || document.querySelector('.manager-card.personal') || document.querySelector('.manager-card.business');
      if (target) centerCard(target, 'smooth');
    }, 130);
  }

  function renderMissingAccountPanel(card) {
    if (!card || getPendingPlan()) return;
    card.classList.add('login-account-missing');
    var body = card.querySelector('.unified-login-body');
    if (!body) return;
    var panel = body.querySelector('.ang-account-missing-panel');
    if (!panel) {
      panel = document.createElement('section');
      panel.className = 'ang-account-missing-panel';
      panel.setAttribute('role', 'alertdialog');
      panel.setAttribute('aria-label', '找不到帳號');
      panel.innerHTML = [
        '<strong>找不到這個帳號或 Email</strong>',
        '<p>要再試一次，還是前往查看方案？</p>',
        '<div class="ang-account-missing-actions">',
        '<button type="button" data-account-action="retry">再試一次</button>',
        '<button type="button" data-account-action="plans">查看方案</button>',
        '</div>'
      ].join('');
      body.appendChild(panel);
    }
  }

  function convertPlanMissingToRegistration(card, text) {
    if (!card || !getPendingPlan() || !isMissingAccountText(text)) return false;
    removeMissingPanel(card);
    card.classList.remove('login-account-missing', 'login-verification-missing');
    var status = card.querySelector('.login-auth-status');
    if (status) {
      status.className = 'login-auth-status info';
      status.textContent = '尚無會員資料；完成這次驗證後，將直接建立帳號並註冊所選方案。';
    }
    var legacy = card.querySelector('.beta-auth-error');
    if (legacy) legacy.textContent = '';
    return true;
  }

  function syncAuthDecision() {
    var card = getLoginCard();
    if (!card) return false;
    var text = textFromAuthError(card);
    if (!text || !isMissingAccountText(text)) return true;

    if (getPendingPlan()) convertPlanMissingToRegistration(card, text);
    else renderMissingAccountPanel(card);
    return true;
  }

  function eventLooksVerified(detail) {
    if (!detail) return false;
    return detail.verified === true || detail.success === true || detail.ok === true || !!(detail.verify_token || detail.verifyToken || detail.token || detail.email || detail.user_id || detail.userId);
  }

  function handleAuthFailed(event) {
    var detail = event && event.detail ? event.detail : {};
    var text = String(detail.message || detail.error || detail.errorMessage || detail.status || '').trim();
    var card = getLoginCard();
    if (!isMissingAccountText(text)) return;

    if (getPendingPlan()) {
      window.setTimeout(function () {
        convertPlanMissingToRegistration(card, text);
        if (eventLooksVerified(detail) || detail.accountExists === false || detail.account_exists === false || isMissingAccountText(text)) {
          var verifiedDetail = Object.assign({}, detail, {
            verified: true,
            success: true,
            accountExists: false,
            account_exists: false,
            message: '驗證完成，將直接建立新帳號並註冊所選方案'
          });
          window.dispatchEvent(new CustomEvent('ANG_HR_AUTH_VERIFIED', { detail: verifiedDetail }));
        }
      }, 0);
    } else {
      window.setTimeout(function () { renderMissingAccountPanel(card); }, 0);
    }
  }

  function handleIntentClick(event) {
    var target = event.target;
    if (!target || !target.closest) return;

    var action = target.closest('[data-account-action]');
    if (action) {
      event.preventDefault();
      event.stopPropagation();
      var card = getLoginCard();
      if (action.dataset.accountAction === 'retry') resetGeneralLogin(card);
      if (action.dataset.accountAction === 'plans') goToPlans(card);
      return;
    }

    var generalLogin = target.closest('.feature-panel-actions button');
    if (generalLogin && /登入系統/.test(generalLogin.textContent || '')) {
      clearPendingPlan();
      try { sessionStorage.setItem(ENTRY_INTENT_KEY, 'login'); } catch (_) {}
      return;
    }

    var planAction = target.closest('.personal-lite, .business-lite, .personal-select-action, .business-select-action');
    if (planAction) {
      try { sessionStorage.setItem(ENTRY_INTENT_KEY, 'plan'); } catch (_) {}
      window.setTimeout(function () {
        applyPlanTheme();
        removeMissingPanel(getLoginCard());
      }, 0);
    }
  }

  function suppressDraggedClick(event) {
    if (Date.now() >= suppressClickUntil) return;
    if (!event.target.closest('.manager-card')) return;
    event.preventDefault();
    event.stopPropagation();
  }

  function observeEntry() {
    var root = document.getElementById('root') || document.body;
    if (!root || root.__angIndexRulesObserver) return;
    root.__angIndexRulesObserver = new MutationObserver(function () {
      window.requestAnimationFrame(function () {
        applyPlanTheme();
        syncAuthDecision();
      });
    });
    root.__angIndexRulesObserver.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'aria-pressed']
    });
  }

  function start() {
    applyPlanTheme();
    syncAuthDecision();
    observeEntry();
  }

  document.addEventListener('pointerdown', onOwnedPointerDown, true);
  document.addEventListener('click', suppressDraggedClick, true);
  document.addEventListener('click', handleIntentClick, false);
  document.addEventListener('input', function (event) {
    if (!event.target.closest('.manager-card.login-unified')) return;
    removeMissingPanel(getLoginCard());
  }, true);
  window.addEventListener('ANG_HR_AUTH_FAILED', handleAuthFailed);
  window.addEventListener('ANG_HR_AUTH_VERIFIED', function () {
    window.setTimeout(function () {
      removeMissingPanel(getLoginCard());
      applyPlanTheme();
    }, 0);
  });
  window.addEventListener('pageshow', start);
  window.addEventListener('storage', function (event) {
    if (event.key === PENDING_PLAN_KEY) applyPlanTheme();
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}());
