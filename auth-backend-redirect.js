(function (window, document) {
  'use strict';

  var VERSION = '20260725-backend-direct-return-v1';
  if (window.__ANG_AUTH_BACKEND_REDIRECT_VERSION === VERSION) return;
  window.__ANG_AUTH_BACKEND_REDIRECT_VERSION = VERSION;

  var PENDING_PLAN_KEY = 'ang_hr_pending_plan';
  var emailCountdownTimer = 0;

  function getConfig() {
    return window.ANG_HR_CONFIG || {};
  }

  function cleanBase(value) {
    return String(value || '').trim().replace(/\/+$/, '');
  }

  function getGasUrl() {
    var config = getConfig();
    return String(config.gasApiUrl || config.apiBaseUrl || '').trim();
  }

  function getPublicFrontendBase() {
    var config = getConfig();
    var candidates = [
      config.oauthCallbackBaseUrl,
      config.publicFrontendBaseUrl,
      config.githubBaseUrl,
      config.frontendBaseUrl
    ];

    for (var i = 0; i < candidates.length; i += 1) {
      var candidate = cleanBase(candidates[i]);
      if (/^https:\/\//i.test(candidate)) return candidate;
    }

    return 'https://angsystem.github.io/HR';
  }

  function getPublicIndexUrl(extraParams) {
    var config = getConfig();
    var indexPage = String(config.indexPage || 'index.html').replace(/^\/+/, '');
    var url = new URL(indexPage, getPublicFrontendBase() + '/');

    Object.keys(extraParams || {}).forEach(function (key) {
      var value = extraParams[key];
      if (value !== '' && value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  }

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (_) {
      return fallback;
    }
  }

  function getPendingPlan() {
    var raw = '';
    try {
      raw = sessionStorage.getItem(PENDING_PLAN_KEY) || localStorage.getItem(PENDING_PLAN_KEY) || '';
    } catch (_) {}

    var plan = safeJsonParse(raw, null);
    if (!plan || !plan.plan_code) return null;
    return plan;
  }

  function getDeviceId() {
    var saved = '';
    try {
      saved = localStorage.getItem('ang_hr_device_id') || localStorage.getItem('ang_device_id') || '';
    } catch (_) {}

    if (!saved) {
      saved = 'DEV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 10).toUpperCase();
    }

    try {
      localStorage.setItem('ang_hr_device_id', saved);
      localStorage.setItem('ang_device_id', saved);
    } catch (_) {}

    return saved;
  }

  function getLoginCard() {
    return document.querySelector('.manager-card.login-unified');
  }

  function getLoginInput(card) {
    return card && card.querySelector([
      'input[aria-label="帳號或 Email"]',
      'input[aria-label="Email、帳號或公司代號"]',
      'input[aria-label="Email或使用者代號"]',
      'input[aria-label="Email或帳號"]'
    ].join(', '));
  }

  function setStatus(type, message) {
    var card = getLoginCard();
    var body = card && card.querySelector('.unified-login-body');
    if (!body) return;

    var status = body.querySelector('.login-auth-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'login-auth-status';
      status.setAttribute('aria-live', 'polite');
      body.appendChild(status);
    }

    status.className = 'login-auth-status ' + (type || 'info');
    status.textContent = message || '';
  }

  function responseMessage(response) {
    return String((response && (response.message || response.msg || response.errorMessage || response.error)) || '').trim();
  }

  function callGasApi(action, payload, timeoutMs) {
    var gasUrl = getGasUrl();
    if (!gasUrl) return Promise.reject(new Error('尚未設定驗證 API'));

    return new Promise(function (resolve, reject) {
      var callbackName = 'angBackendReturn_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      var script = document.createElement('script');
      var finished = false;

      function cleanup() {
        try { delete window[callbackName]; } catch (_) { window[callbackName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      var timer = window.setTimeout(function () {
        if (finished) return;
        finished = true;
        cleanup();
        reject(new Error('驗證連線逾時'));
      }, timeoutMs || 20000);

      window[callbackName] = function (response) {
        if (finished) return;
        finished = true;
        window.clearTimeout(timer);
        cleanup();
        resolve(response || {});
      };

      script.onerror = function () {
        if (finished) return;
        finished = true;
        window.clearTimeout(timer);
        cleanup();
        reject(new Error('無法連線驗證服務'));
      };

      var url = new URL(gasUrl, window.location.href);
      var body = Object.assign({}, payload || {}, { action: action });
      url.searchParams.set('action', action);
      url.searchParams.set('callback', callbackName);
      url.searchParams.set('payload', JSON.stringify(body));
      script.src = url.toString();
      document.head.appendChild(script);
    });
  }

  function savePendingAuth(provider, flow, plan, returnUrl) {
    try {
      localStorage.setItem('ang_pending_auth', JSON.stringify({
        provider: provider,
        flow: flow,
        plan: plan || '',
        return_url: returnUrl,
        savedAt: Date.now(),
        route_version: VERSION
      }));
    } catch (_) {}
  }

  function navigateOAuthTopLevel_(url) {
    var target = String(url || '').trim();
    if (!target) return;

    try {
      if (window.top && window.top !== window) {
        window.top.location.replace(target);
        return;
      }
    } catch (_) {}

    window.location.replace(target);
  }

  function startProvider(provider) {
    var gasUrl = getGasUrl();
    if (!gasUrl) {
      setStatus('error', '驗證服務尚未設定');
      return;
    }

    var actionMap = {
      google: 'requestGoogleAuth',
      line: 'requestLineAuth'
    };
    var action = actionMap[provider];
    if (!action) return;

    var pendingPlan = getPendingPlan();
    var flow = pendingPlan ? 'plan_signup' : 'account_login';
    var planCode = pendingPlan ? pendingPlan.plan_code : '';
    var returnUrl = getPublicIndexUrl({
      auth_done: '1',
      provider: provider,
      flow: flow,
      plan: planCode
    });

    var body = {
      action: action,
      provider: provider,
      flow: flow,
      plan: planCode,
      plan_code: planCode,
      allow_registration: !!pendingPlan,
      device_id: getDeviceId(),
      deviceId: getDeviceId(),
      source: 'backend_direct_return_restore',
      returnUrl: returnUrl,
      return_url: returnUrl,
      direct: '1'
    };

    savePendingAuth(provider, flow, planCode, returnUrl);
    setStatus('info', '正在前往 ' + provider.toUpperCase() + ' 驗證；完成後會由後端直接送回 ANG HR…');

    var url = new URL(gasUrl, window.location.href);
    Object.keys(body).forEach(function (key) {
      var value = body[key];
      if (value !== '' && value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });

    navigateOAuthTopLevel_(url.toString());
  }

  function stopEmailCountdown(button) {
    if (emailCountdownTimer) window.clearInterval(emailCountdownTimer);
    emailCountdownTimer = 0;
    if (button) button.__angBackendCountdown = false;
  }

  function startEmailCountdown(button, seconds) {
    if (!button) return;
    stopEmailCountdown(button);

    var left = Math.max(1, Math.ceil(Number(seconds || 60)));
    button.__angBackendCountdown = true;
    button.disabled = true;
    button.textContent = '已發送（' + left + '）';

    emailCountdownTimer = window.setInterval(function () {
      left -= 1;
      if (left > 0) {
        button.textContent = '已發送（' + left + '）';
        return;
      }

      stopEmailCountdown(button);
      button.disabled = false;
      button.textContent = '重新發送驗證連結';
    }, 1000);
  }

  function sendEmailVerification(button) {
    var card = getLoginCard();
    var input = getLoginInput(card);
    var value = String((input && input.value) || '').trim();

    if (!value) {
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        input.focus();
      }
      setStatus('error', '請先輸入帳號或 Email');
      return;
    }

    if (input) input.removeAttribute('aria-invalid');
    button.disabled = true;
    button.textContent = '發送中';
    setStatus('info', '正在由後端建立 Email 驗證連結…');

    var pendingPlan = getPendingPlan();
    var flow = pendingPlan ? 'plan_signup' : 'account_login';
    var planCode = pendingPlan ? pendingPlan.plan_code : '';
    var returnUrl = getPublicIndexUrl({
      provider: 'email',
      flow: flow,
      plan: planCode
    });

    callGasApi('requestEmailCode', {
      email: value,
      identifier: value,
      account: value,
      flow: flow,
      plan: planCode,
      plan_code: planCode,
      allow_registration: !!pendingPlan,
      create_account_after_verify: !!pendingPlan,
      delivery: 'link',
      verification_mode: 'magic_link',
      device_id: getDeviceId(),
      deviceId: getDeviceId(),
      source: 'backend_direct_return_restore',
      returnUrl: returnUrl,
      return_url: returnUrl,
      direct: '1'
    }, 20000).then(function (response) {
      var cooldown = Number(response && (response.resend_after_seconds || response.cooldown_seconds) || 60);
      var message = responseMessage(response);

      if (response && response.ok === false && !cooldown) {
        throw new Error(message || '目前無法寄出驗證連結');
      }

      var guide = card && card.querySelector('.email-verification-guide');
      if (guide) guide.hidden = false;
      setStatus('info', message || (pendingPlan
        ? '驗證連結已寄出；點擊後由後端確認並直接返回 ANG HR 建立帳號。'
        : '驗證連結已寄出；點擊後由後端確認並直接返回 ANG HR。'));
      startEmailCountdown(button, cooldown || 60);
    }).catch(function (error) {
      stopEmailCountdown(button);
      button.disabled = false;
      button.textContent = '發送驗證連結';
      setStatus('error', error && error.message ? error.message : '驗證服務連線失敗');
    });
  }

  function handleClick(event) {
    var target = event.target;
    if (!target || !target.closest) return;

    var providerButton = target.closest('.google-login, .line-login, [data-provider="google"], [data-provider="line"]');
    if (providerButton) {
      var provider = providerButton.getAttribute('data-provider') || (providerButton.classList.contains('line-login') ? 'line' : 'google');
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      startProvider(provider);
      return;
    }

    var emailButton = target.closest('.login-verify-button');
    if (emailButton) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      sendEmailVerification(emailButton);
    }
  }

  document.addEventListener('click', handleClick, true);
})(window, document);
