(function () {
  'use strict';

  var LOGIN_INPUT_SELECTOR = [
    'input[aria-label="Email、帳號或公司代號"]',
    'input[aria-label="Email或使用者代號"]',
    'input[aria-label="Email或帳號"]'
  ].join(', ');

  function getLoginCard() {
    return document.querySelector('.manager-card.login-unified');
  }

  function getLoginInput(card) {
    return card && card.querySelector(LOGIN_INPUT_SELECTOR);
  }

  function getGasApiUrl() {
    return String((window.ANG_HR_CONFIG && (window.ANG_HR_CONFIG.gasApiUrl || window.ANG_HR_CONFIG.apiBaseUrl)) || '').trim();
  }

  function getDeviceId() {
    var saved = localStorage.getItem('ang_hr_device_id') || localStorage.getItem('ang_device_id');
    if (!saved) {
      saved = 'DEV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 10).toUpperCase();
    }
    localStorage.setItem('ang_hr_device_id', saved);
    localStorage.setItem('ang_device_id', saved);
    return saved;
  }

  function callGasApi(action, payload, timeoutMs) {
    var gasUrl = getGasApiUrl();
    if (!gasUrl) return Promise.reject(new Error('尚未設定驗證 API'));

    return new Promise(function (resolve, reject) {
      var callbackName = 'angEntryAuth_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      var script = document.createElement('script');
      var done = false;

      function cleanup() {
        try { delete window[callbackName]; } catch (err) { window[callbackName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        cleanup();
        reject(new Error('驗證連線逾時'));
      }, timeoutMs || 20000);

      window[callbackName] = function (response) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        cleanup();
        resolve(response || {});
      };

      script.onerror = function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
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

  function setLoginAuthStatus(card, type, message) {
    if (!card) return;
    var body = card.querySelector('.unified-login-body');
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

  function responseConfirmsAccount(response) {
    if (!response || response.ok === false || response.success === false) return false;

    var explicitValues = [
      response.accountExists,
      response.account_exists,
      response.userExists,
      response.user_exists,
      response.exists,
      response.found,
      response.registered,
      response.isRegistered,
      response.is_registered
    ];

    for (var i = 0; i < explicitValues.length; i += 1) {
      if (explicitValues[i] === false || explicitValues[i] === 0 || explicitValues[i] === '0') return false;
      if (explicitValues[i] === true || explicitValues[i] === 1 || explicitValues[i] === '1') return true;
    }

    if (
      response.user || response.account || response.employee || response.profile ||
      response.employee_id || response.employeeId || response.company_id || response.companyId ||
      response.verify_token || response.verifyToken || response.session_token || response.sessionToken || response.token
    ) return true;

    var status = String(response.status || response.result || '').toLowerCase();
    if (/verified|exists|found|registered|sent|success|ok/.test(status)) return true;

    /* 舊 GAS 端點只會對系統內帳號回傳 ok:true。 */
    return response.ok === true || response.success === true;
  }

  function setLoginConfirmed(card, response, message) {
    if (!card) return;

    card.classList.remove('login-verifying', 'login-verification-empty', 'login-verification-missing', 'login-identifier-valid');
    card.classList.add('login-system-confirmed');
    card.dataset.accountConfirmed = 'true';

    var input = getLoginInput(card);
    if (input) card.dataset.confirmedIdentifier = input.value.trim().toLowerCase();

    var button = card.querySelector('.login-verify-button');
    if (button) {
      button.disabled = false;
      button.textContent = '已確認';
    }

    try {
      sessionStorage.setItem('ang.login.account-confirmation', JSON.stringify({
        identifier: input ? input.value.trim() : '',
        confirmedAt: Date.now(),
        response: response || {}
      }));
    } catch (_) {}

    setLoginAuthStatus(card, 'success', message || responseMessage(response) || '帳號已確認');

    if (card.classList.contains('collapsed')) {
      var toggle = card.querySelector('.manager-card-toggle');
      if (toggle) toggle.click();
    }
  }

  function clearLoginConfirmation(card, keepStatus) {
    if (!card) return;
    card.classList.remove('login-system-confirmed', 'login-identifier-valid', 'login-verifying');
    delete card.dataset.accountConfirmed;
    delete card.dataset.confirmedIdentifier;

    var button = card.querySelector('.login-verify-button');
    if (button) {
      button.disabled = false;
      button.textContent = '驗證';
    }

    var guide = card.querySelector('.email-verification-guide');
    if (guide) guide.hidden = true;

    if (!keepStatus) setLoginAuthStatus(card, 'info', '');
  }

  function syncLoginVerificationState() {
    var card = getLoginCard();
    var input = getLoginInput(card);
    if (!card || !input) return false;

    input.setAttribute('aria-label', 'Email或帳號');
    input.setAttribute('placeholder', '輸入 Email 或帳號');

    var current = input.value.trim().toLowerCase();
    if (card.dataset.confirmedIdentifier && current !== card.dataset.confirmedIdentifier) {
      clearLoginConfirmation(card, false);
    }

    return true;
  }

  async function handleLoginVerification(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    var card = getLoginCard();
    var input = getLoginInput(card);
    var guide = card && card.querySelector('.email-verification-guide');
    if (!card || !input) return false;

    var value = input.value.trim();
    clearLoginConfirmation(card, true);
    card.classList.remove('login-verification-empty', 'login-verification-missing');

    if (!value) {
      card.classList.add('login-verification-empty');
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      setLoginAuthStatus(card, 'error', '請先輸入 Email 或帳號');
      return false;
    }

    input.removeAttribute('aria-invalid');
    card.classList.add('login-verifying');

    var verifyButton = card.querySelector('.login-verify-button');
    if (verifyButton) {
      verifyButton.disabled = true;
      verifyButton.textContent = '確認中';
    }

    setLoginAuthStatus(card, 'info', '正在確認此帳號是否存在 ANG HR…');

    try {
      /* requestEmailCode 為既有後端 action 名稱；前端採「點連結回系統」流程，不要求輸入驗證碼。 */
      var response = await callGasApi('requestEmailCode', {
        email: value,
        identifier: value,
        account: value,
        flow: 'admin_login',
        delivery: 'link',
        verification_mode: 'magic_link',
        device_id: getDeviceId(),
        deviceId: getDeviceId(),
        source: 'current_entry_login',
        returnUrl: window.location.href.split('#')[0],
        return_url: window.location.href.split('#')[0]
      });

      if (!responseConfirmsAccount(response)) {
        throw new Error(responseMessage(response) || 'ANG HR 系統中找不到這個帳號');
      }

      if (guide) guide.hidden = false;
      setLoginConfirmed(card, response, responseMessage(response) || '帳號已確認；若使用 Email，請到信箱點擊驗證連結');
      return true;
    } catch (err) {
      card.classList.remove('login-verifying');
      card.classList.add('login-verification-missing');
      if (guide) guide.hidden = true;
      setLoginAuthStatus(card, 'error', err && err.message ? err.message : '驗證服務連線失敗');
      return false;
    } finally {
      if (verifyButton && !card.classList.contains('login-system-confirmed')) {
        verifyButton.disabled = false;
        verifyButton.textContent = '驗證';
      }
    }
  }

  function startOAuth(provider, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    var card = getLoginCard();
    if (card) {
      card.classList.add('login-provider-selected');
      setLoginAuthStatus(card, 'info', '正在開啟 ' + provider.toUpperCase() + ' 安全驗證…');
    }

    if (provider === 'facebook' && window.ANG_FACEBOOK_AUTH && typeof window.ANG_FACEBOOK_AUTH.start === 'function') {
      window.ANG_FACEBOOK_AUTH.start();
      return;
    }

    var gasUrl = getGasApiUrl();
    if (!gasUrl) {
      setLoginAuthStatus(card, 'error', '驗證服務尚未設定');
      return;
    }

    var actionMap = {
      google: 'requestGoogleAuth',
      line: 'requestLineAuth',
      facebook: 'requestFacebookAuth',
      apple: 'requestAppleAuth'
    };

    var returnUrl = new URL(window.location.href);
    returnUrl.search = '';
    returnUrl.hash = '';
    returnUrl.searchParams.set('auth_done', '1');
    returnUrl.searchParams.set('provider', provider);
    returnUrl.searchParams.set('flow', 'admin_login');

    var body = {
      action: actionMap[provider],
      provider: provider,
      flow: 'admin_login',
      device_id: getDeviceId(),
      deviceId: getDeviceId(),
      source: 'current_entry_login',
      returnUrl: returnUrl.toString(),
      return_url: returnUrl.toString(),
      redirectUri: returnUrl.toString(),
      redirect_uri: returnUrl.toString(),
      callbackUrl: returnUrl.toString(),
      callback_url: returnUrl.toString(),
      direct: '1'
    };

    localStorage.setItem('ang_pending_auth', JSON.stringify({ provider: provider, flow: 'admin_login', savedAt: Date.now() }));

    var url = new URL(gasUrl, window.location.href);
    Object.keys(body).forEach(function (key) {
      if (body[key] !== '' && body[key] !== undefined && body[key] !== null) {
        url.searchParams.set(key, String(body[key]));
      }
    });
    window.location.href = url.toString();
  }

  function handleAuthCallback() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('auth_done') !== '1') return;

    var error = params.get('error') || params.get('error_message') || params.get('message');
    var callbackData = {};
    [
      'verify_token', 'token', 'session_token', 'email', 'employee_id', 'company_id', 'role',
      'account_exists', 'verified', 'success', 'provider'
    ].forEach(function (key) {
      var value = params.get(key);
      if (value) {
        callbackData[key] = value;
        localStorage.setItem('ang_' + key, value);
      }
    });

    localStorage.removeItem('ang_pending_auth');

    setTimeout(function () {
      var card = getLoginCard();
      if (!card) return;

      if (error && !/success|verified/i.test(error)) {
        setLoginAuthStatus(card, 'error', error);
        return;
      }

      var callbackConfirmed = !!(
        callbackData.verify_token || callbackData.token || callbackData.session_token ||
        callbackData.employee_id || callbackData.company_id ||
        callbackData.account_exists === '1' || callbackData.verified === '1' || callbackData.success === '1'
      );

      if (!callbackConfirmed) {
        setLoginAuthStatus(card, 'error', '驗證已返回，但尚未確認此帳號存在 ANG HR');
        return;
      }

      var input = getLoginInput(card);
      if (input && callbackData.email) {
        var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(input, callbackData.email);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }

      setLoginConfirmed(card, callbackData, '驗證成功，已確認 ANG HR 帳號');

      try {
        var cleanUrl = new URL(window.location.href);
        ['auth_done', 'provider', 'flow', 'verify_token', 'token', 'session_token', 'email', 'employee_id', 'company_id', 'role', 'account_exists', 'verified', 'success', 'error', 'error_message', 'message'].forEach(function (key) {
          cleanUrl.searchParams.delete(key);
        });
        window.history.replaceState({}, document.title, cleanUrl.toString());
      } catch (_) {}
    }, 250);
  }

  function googleIcon() {
    return '<svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.3 7.22 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.11 0 9.83 0 12s.43 3.89 1.19 5.42l4.09-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.17 2.7 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>';
  }

  function lineIcon() {
    return '<svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.631-.63.631H17.61v1.124h1.755zm-3.666 4.16c.071.132.031.3-.1.381-.059.034-.127.051-.195.051-.088 0-.174-.031-.24-.09l-2.316-2.072v1.942c0 .345-.282.629-.63.629-.345 0-.627-.284-.627-.629V8.108c0-.345.282-.63.627-.63.348 0 .63.285.63.63v4.062l2.158-1.933c.12-.108.3-.1.411.02.108.121.1.301-.01.412l-2.022 1.812 2.302 2.061zm-6.273-5.419c.345 0 .627.285.627.63v4.062c0 .345-.282.629-.627.629-.349 0-.63-.284-.63-.629V8.604c0-.345.281-.63.63-.63zm-3.601 3.432H4.499V8.604c0-.345-.282-.63-.627-.63-.349 0-.63.285-.63.63v4.692c0 .345.281.629.63.629h2.158c.349 0 .63-.285.63-.63 0-.345-.281-.629-.63-.629zM12 0C5.373 0 0 4.627 0 10.325c0 5.011 4.185 9.215 9.843 10.021.384.07.495.168.495.385 0 .19-.077.728-.117 1.341-.038.599-.176 2.247.773 2.743.95.496 1.724-.438 2.91-1.391 1.186-.953 6.326-5.174 7.202-6.195 1.547-1.785 2.394-4.116 2.394-6.507C24 4.627 18.627 0 12 0z"/></svg>';
  }

  function facebookIcon() {
    return '<svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.6 22v-9h3l.45-3.5H13.6V7.27c0-1.01.28-1.7 1.74-1.7h1.86V2.44c-.32-.04-1.43-.14-2.72-.14-2.69 0-4.53 1.64-4.53 4.66V9.5H6.9V13h3.05v9h3.65z"/></svg>';
  }

  function appleIcon() {
    return '<svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.95 6.07c.56-.69.94-1.65.84-2.61-.83.04-1.84.55-2.43 1.24-.52.6-.98 1.58-.85 2.52.93.07 1.88-.47 2.44-1.15z"/></svg>';
  }

  function bindProvider(button, provider) {
    if (!button || button.__angAuthBound) return;
    button.__angAuthBound = true;
    button.addEventListener('click', function (event) {
      startOAuth(provider, event);
    });
  }

  function addLoginActions() {
    var card = getLoginCard();
    var body = card && card.querySelector('.unified-login-body');
    if (!body) return false;

    var description = body.querySelector('.login-description');
    if (description) description.textContent = '輸入 Email 或帳號確認是否存在；也可直接使用下方驗證方式。';

    var passwordLabel = body.querySelector('.login-email');
    if (passwordLabel) {
      var passwordInput = passwordLabel.querySelector('input');
      if (passwordLabel.firstChild && passwordLabel.firstChild.nodeType === Node.TEXT_NODE) {
        passwordLabel.firstChild.nodeValue = '密碼（或使用下方驗證方式）';
      }
      if (passwordInput) {
        passwordInput.setAttribute('aria-label', '密碼');
        passwordInput.setAttribute('placeholder', '輸入密碼');
      }
    }

    if (!body.querySelector('.login-verify-button')) {
      var verifyButton = document.createElement('button');
      verifyButton.type = 'button';
      verifyButton.className = 'login-verify-button';
      verifyButton.textContent = '驗證';
      verifyButton.addEventListener('click', handleLoginVerification);
      body.appendChild(verifyButton);
    }

    var socialRow = body.querySelector('.social-login-row');
    if (!socialRow) {
      socialRow = document.createElement('div');
      socialRow.className = 'social-login-row';
      socialRow.setAttribute('aria-label', '其他登入方式');
      body.appendChild(socialRow);
    }

    var providers = [
      { key: 'google', className: 'google-login', label: 'Google', icon: googleIcon() },
      { key: 'line', className: 'line-login', label: 'LINE', icon: lineIcon() },
      { key: 'facebook', className: 'facebook-login', label: 'Facebook', icon: facebookIcon() },
      { key: 'apple', className: 'apple-login', label: 'Apple', icon: appleIcon() }
    ];

    providers.forEach(function (provider) {
      var button = socialRow.querySelector('.' + provider.className + ', [data-provider="' + provider.key + '"]');
      if (!button) {
        button = document.createElement('button');
        socialRow.appendChild(button);
      }
      button.type = 'button';
      button.className = provider.className;
      button.setAttribute('data-provider', provider.key);
      if (provider.key === 'facebook') button.setAttribute('data-ang-facebook-login', 'true');
      button.setAttribute('aria-label', '使用 ' + provider.label + ' 登入');
      button.setAttribute('title', provider.label);
      button.innerHTML = provider.icon + '<span>' + provider.label + '</span>';
      bindProvider(button, provider.key);
      socialRow.appendChild(button);
    });

    socialRow.setAttribute('data-provider-order', 'google-line-facebook-apple');

    var guide = body.querySelector('.email-verification-guide');
    if (!guide) {
      guide = document.createElement('section');
      guide.className = 'email-verification-guide';
      guide.hidden = true;
      guide.setAttribute('aria-live', 'polite');
      body.appendChild(guide);
    }

    guide.innerHTML = [
      '<strong>帳號已確認；請前往 Email 信箱</strong>',
      '<div class="verification-guide-steps">',
      '<span><i aria-hidden="true">✉</i><b>1</b><em>打開 Email 信箱</em></span>',
      '<span><i aria-hidden="true">↗</i><b>2</b><em>點擊 ANG HR 驗證連結</em></span>',
      '<span><i aria-hidden="true">✓</i><b>3</b><em>自動返回 ANG HR</em></span>',
      '</div>',
      '<small>不需要另外輸入驗證碼；若沒有看到信件，請檢查垃圾郵件匣。</small>'
    ].join('');

    syncLoginVerificationState();
    return true;
  }

  function replaceExactText(root, oldText, newText) {
    if (!root) return false;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim() === oldText) {
        node.nodeValue = node.nodeValue.replace(oldText, newText);
        return true;
      }
    }
    return false;
  }

  function syncPlanCardCopy() {
    var card = document.querySelector('.manager-card.free');
    if (!card) return false;

    var top = card.querySelector('.plan-card-top');
    var eyebrow = top && top.querySelector('span');
    var price = top && top.querySelector('b');
    var title = card.querySelector('h2');

    if (eyebrow && eyebrow.textContent !== '方案類別') eyebrow.textContent = '方案類別';
    if (price && price.textContent !== 'Free') price.textContent = 'Free';
    if (title && title.textContent !== 'Lite') title.textContent = 'Lite';

    var personal = card.querySelector('.personal-lite');
    var business = card.querySelector('.business-lite');
    replaceExactText(personal, 'Personal Lite', 'Personal');
    replaceExactText(business, 'Business Lite', 'Business');

    return true;
  }

  function addWelcomeMessage() {
    var encouragement = document.querySelector('.manager-card.intro .encouragement-message');
    if (!encouragement) return false;

    if (!encouragement.previousElementSibling || !encouragement.previousElementSibling.classList.contains('manager-welcome-message')) {
      var message = document.createElement('div');
      message.className = 'manager-welcome-message';
      message.innerHTML = '<span class="manager-welcome-title">歡迎回到 ANG HR 系統</span>';
      encouragement.parentNode.insertBefore(message, encouragement);

      var prompt = document.createElement('span');
      prompt.className = 'manager-welcome-prompt';
      prompt.textContent = '請滑動卡片選擇登入或查看方案';
      encouragement.insertAdjacentElement('afterend', prompt);
    }

    var logoMessage = document.querySelector('.manager-logo-encouragement');
    if (!logoMessage) {
      logoMessage = document.createElement('div');
      logoMessage.className = 'manager-logo-encouragement';
      logoMessage.setAttribute('aria-live', 'polite');
      var landing = document.querySelector('main.landing');
      if (!landing) return false;
      landing.appendChild(logoMessage);

      new MutationObserver(function () {
        var liveText = logoMessage.querySelector('span');
        if (!liveText) {
          liveText = document.createElement('span');
          logoMessage.replaceChildren(liveText);
        }
        liveText.textContent = encouragement.textContent;
      }).observe(encouragement, { childList: true, characterData: true, subtree: true });
    }

    var logoText = logoMessage.querySelector('span');
    if (!logoText) {
      logoText = document.createElement('span');
      logoMessage.replaceChildren(logoText);
    }
    logoText.textContent = encouragement.textContent;
    return true;
  }

  function applyAllEntryPatches() {
    var welcomeReady = addWelcomeMessage();
    var loginReady = addLoginActions();
    var planReady = syncPlanCardCopy();
    return welcomeReady && loginReady && planReady;
  }

  function observeCardRestores() {
    var carousel = document.querySelector('.manager-carousel');
    if (!carousel || carousel.__angRestoreObserver) return;

    carousel.__angRestoreObserver = new MutationObserver(function () {
      window.requestAnimationFrame(applyAllEntryPatches);
    });

    carousel.__angRestoreObserver.observe(carousel, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-pressed']
    });
  }

  function observeUntilReady() {
    if (applyAllEntryPatches()) {
      observeCardRestores();
      return;
    }

    var observer = new MutationObserver(function () {
      if (applyAllEntryPatches()) {
        observer.disconnect();
        observeCardRestores();
      }
    });

    observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
  }

  document.addEventListener('input', function (event) {
    if (event.target.matches(LOGIN_INPUT_SELECTOR)) {
      setTimeout(syncLoginVerificationState, 0);
    }
  });

  /* 未輸入／未確認帳號時，不允許直接把登入卡拉開。 */
  document.addEventListener('click', function (event) {
    var card = event.target.closest('.manager-card.login-unified');
    if (!card || card.classList.contains('login-system-confirmed')) return;
    if (event.target.closest('.login-verify-button, .social-login-row button, input')) return;
    if (event.target.closest('.manager-card-toggle')) {
      event.preventDefault();
      event.stopPropagation();
      setLoginAuthStatus(card, 'info', '請先輸入帳號按「驗證」，或選擇下方驗證方式');
    }
  }, true);

  document.addEventListener('click', function (event) {
    var card = event.target.closest('.manager-card.collapsed.free, .manager-card.collapsed.personal, .manager-card.collapsed.business');
    if (!card || event.target.closest('.manager-card-toggle, .card-main-action, button')) return;

    setTimeout(function () {
      if (!card.classList.contains('collapsed')) return;
      var toggle = card.querySelector('.manager-card-toggle');
      if (toggle) toggle.click();
    }, 0);
  });

  window.addEventListener('ANG_HR_AUTH_VERIFIED', function (event) {
    var detail = event && event.detail ? event.detail : {};
    if (responseConfirmsAccount(detail)) {
      setLoginConfirmed(getLoginCard(), detail, responseMessage(detail) || '驗證成功，已確認 ANG HR 帳號');
    }
  });

  window.addEventListener('ANG_HR_AUTH_FAILED', function (event) {
    var detail = event && event.detail ? event.detail : {};
    setLoginAuthStatus(getLoginCard(), 'error', detail.message || '驗證失敗');
  });

  function start() {
    observeUntilReady();
    handleAuthCallback();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}());
