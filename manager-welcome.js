(function () {
  var googleOAuthClientId = '466961332869-vrmkuerdbi4m68ep7dc17202b0ucsjoo.apps.googleusercontent.com';
  var googleTokenClient = null;

  function setGoogleLoginStatus(message, isError) {
    var card = document.querySelector('.manager-card.login-unified');
    var button = card && card.querySelector('.google-login');
    if (!button) return;
    button.classList.toggle('google-login-error', !!isError);
    button.setAttribute('title', message || '');
    var label = button.querySelector('span');
    if (label && message) label.textContent = message;
  }

  function applyVerifiedGoogleAccount(profile) {
    if (!profile || !profile.email) return;
    var email = String(profile.email).trim().toLowerCase();
    if (validLoginIdentifiers.indexOf(email) === -1) validLoginIdentifiers.push(email);
    var card = document.querySelector('.manager-card.login-unified');
    var input = card && card.querySelector('input[aria-label="Email、帳號或公司代號"], input[aria-label="Email或使用者代號"], input[aria-label="Email或帳號"]');
    if (input) {
      var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, email);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    try { sessionStorage.setItem('ang.google.profile', JSON.stringify({ email: email, name: profile.name || '', picture: profile.picture || '' })); } catch (_) {}
    setGoogleLoginStatus('已驗證', false);
    syncLoginVerificationState(true);
  }

  function handleGoogleToken(response) {
    if (!response || response.error || !response.access_token) {
      setGoogleLoginStatus('重試', true);
      return;
    }
    fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: 'Bearer ' + response.access_token }
    }).then(function (result) {
      if (!result.ok) throw new Error('Google profile request failed');
      return result.json();
    }).then(applyVerifiedGoogleAccount).catch(function () {
      setGoogleLoginStatus('重試', true);
    });
  }

  function loadGoogleIdentity() {
    if (window.google && google.accounts && google.accounts.oauth2) return Promise.resolve();
    if (window.__angGoogleIdentityPromise) return window.__angGoogleIdentityPromise;
    window.__angGoogleIdentityPromise = new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return window.__angGoogleIdentityPromise;
  }

  function startGoogleLogin(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setGoogleLoginStatus('連線中', false);
    loadGoogleIdentity().then(function () {
      if (!googleTokenClient) {
        googleTokenClient = google.accounts.oauth2.initTokenClient({
          client_id: googleOAuthClientId,
          scope: 'openid email profile',
          callback: handleGoogleToken
        });
      }
      googleTokenClient.requestAccessToken({ prompt: 'select_account' });
    }).catch(function () {
      setGoogleLoginStatus('重試', true);
    });
  }

  var validLoginIdentifiers = [
    'ang-beta-basic', 'basic@ang-beta.test',
    'ang-beta-pro', 'pro@ang-beta.test',
    'ang-beta-premium', 'premium@ang-beta.test',
    'ang-solo-01', 'solo@ang-beta.test',
    'ang-performance-01', 'performance@ang-beta.test',
    'free-personal-lite', 'personal-lite@ang-beta.test',
    'free-business-lite', 'business-lite@ang-beta.test'
  ];

  function getGasApiUrl() {
    return String((window.ANG_HR_CONFIG && (window.ANG_HR_CONFIG.gasApiUrl || window.ANG_HR_CONFIG.apiBaseUrl)) || '').trim();
  }

  function getDeviceId() {
    var saved = localStorage.getItem('ang_hr_device_id') || localStorage.getItem('ang_device_id');
    if (!saved) saved = 'DEV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 10).toUpperCase();
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
    var status = card.querySelector('.login-auth-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'login-auth-status';
      status.setAttribute('aria-live', 'polite');
      card.querySelector('.unified-login-body').appendChild(status);
    }
    status.className = 'login-auth-status ' + (type || 'info');
    status.textContent = message || '';
  }

  function startOAuth(provider, event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    var card = document.querySelector('.manager-card.login-unified');
    var gasUrl = getGasApiUrl();
    if (!gasUrl) { setLoginAuthStatus(card, 'error', '驗證服務尚未設定'); return; }
    var actionMap = { google: 'requestGoogleAuth', line: 'requestLineAuth', apple: 'requestAppleAuth' };
    var returnUrl = new URL(window.location.href);
    returnUrl.search = '';
    returnUrl.hash = '';
    returnUrl.searchParams.set('auth_done', '1');
    returnUrl.searchParams.set('provider', provider);
    returnUrl.searchParams.set('flow', 'admin_login');
    var body = {
      action: actionMap[provider], provider: provider, flow: 'admin_login',
      device_id: getDeviceId(), deviceId: getDeviceId(), source: 'current_entry_login',
      returnUrl: returnUrl.toString(), return_url: returnUrl.toString(),
      redirectUri: returnUrl.toString(), redirect_uri: returnUrl.toString(),
      callbackUrl: returnUrl.toString(), callback_url: returnUrl.toString(), direct: '1'
    };
    localStorage.setItem('ang_pending_auth', JSON.stringify({ provider: provider, flow: 'admin_login', savedAt: Date.now() }));
    setLoginAuthStatus(card, 'info', '正在開啟 ' + provider.toUpperCase() + ' 安全驗證…');
    var url = new URL(gasUrl, window.location.href);
    Object.keys(body).forEach(function (key) { if (body[key] !== '') url.searchParams.set(key, String(body[key])); });
    window.location.href = url.toString();
  }

  function handleAuthCallback() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('auth_done') !== '1') return;
    ['verify_token', 'token', 'session_token', 'email', 'employee_id', 'company_id', 'role'].forEach(function (key) {
      var value = params.get(key);
      if (value) localStorage.setItem('ang_' + key, value);
    });
    localStorage.removeItem('ang_pending_auth');
    setTimeout(function () {
      var card = document.querySelector('.manager-card.login-unified');
      if (!card) return;
      card.classList.add('login-identifier-valid');
      setLoginAuthStatus(card, 'success', '驗證成功，登入狀態已接收');
      if (card.classList.contains('collapsed')) {
        var toggle = card.querySelector('.manager-card-toggle');
        if (toggle) toggle.click();
      }
    }, 250);
  }

  function syncLoginVerificationState(allowExpand) {
    var card = document.querySelector('.manager-card.login-unified');
    var input = card && card.querySelector('input[aria-label="Email、帳號或公司代號"], input[aria-label="Email或使用者代號"], input[aria-label="Email或帳號"]');
    if (!card || !input) return false;

    input.setAttribute('aria-label', 'Email或帳號');
    input.setAttribute('placeholder', '輸入 Email 或帳號');

    var isValid = validLoginIdentifiers.indexOf(input.value.trim().toLowerCase()) !== -1;
    if (allowExpand === true && isValid && card.classList.contains('collapsed')) {
      var toggle = card.querySelector('.manager-card-toggle');
      if (toggle) toggle.click();
    }
    card.classList.toggle('login-identifier-valid', isValid);
    return true;
  }

  async function handleLoginVerification(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    var card = document.querySelector('.manager-card.login-unified');
    var input = card && card.querySelector('input[aria-label="Email、帳號或公司代號"], input[aria-label="Email或使用者代號"], input[aria-label="Email或帳號"]');
    var guide = card && card.querySelector('.email-verification-guide');
    if (!card || !input) return false;

    var value = input.value.trim();
    card.classList.remove('login-verification-empty', 'login-verification-missing');
    if (!value) {
      card.classList.add('login-verification-empty');
      if (guide) guide.hidden = true;
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return false;
    }

    input.removeAttribute('aria-invalid');
    var verifyButton = card.querySelector('.login-verify-button');
    if (verifyButton) verifyButton.disabled = true;
    setLoginAuthStatus(card, 'info', '正在寄出驗證碼…');
    try {
      var response = await callGasApi('requestEmailCode', {
        email: value, identifier: value, account: value, flow: 'admin_login',
        device_id: getDeviceId(), source: 'current_entry_login'
      });
      if (!response || response.ok === false) throw new Error((response && (response.message || response.msg)) || '驗證碼寄送失敗');
      if (guide) guide.hidden = false;
      card.classList.add('login-identifier-valid');
      setLoginAuthStatus(card, 'success', (response.message || response.msg) || '驗證碼已寄出，請查看信箱');
      if (card.classList.contains('collapsed')) {
        var toggle = card.querySelector('.manager-card-toggle');
        if (toggle) toggle.click();
      }
      return true;
    } catch (err) {
      card.classList.add('login-verification-missing');
      if (guide) guide.hidden = true;
      setLoginAuthStatus(card, 'error', err && err.message ? err.message : '驗證服務連線失敗');
      return false;
    } finally {
      if (verifyButton) verifyButton.disabled = false;
    }
  }

  function addLoginActions() {
    var body = document.querySelector('.manager-card.login-unified .unified-login-body');
    if (!body) return false;

    if (!body.querySelector('.login-verify-button')) {
      var verifyButton = document.createElement('button');
      verifyButton.type = 'button';
      verifyButton.className = 'login-verify-button';
      verifyButton.textContent = '驗證';
      verifyButton.addEventListener('click', handleLoginVerification);
      body.appendChild(verifyButton);
    }

    if (!body.querySelector('.social-login-row')) {
      var socialRow = document.createElement('div');
      socialRow.className = 'social-login-row';
      socialRow.setAttribute('aria-label', '其他登入方式');
      socialRow.innerHTML = [
        '<button type="button" class="google-login" aria-label="使用 Google 登入"><svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.3 7.22 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.11 0 9.83 0 12s.43 3.89 1.19 5.42l4.09-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.17 2.7 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg><span>Google</span></button>',
        '<button type="button" class="line-login" aria-label="使用 LINE 登入"><svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.631-.63.631H17.61v1.124h1.755zm-3.666 4.16c.071.132.031.3-.1.381-.059.034-.127.051-.195.051-.088 0-.174-.031-.24-.09l-2.316-2.072v1.942c0 .345-.282.629-.63.629-.345 0-.627-.284-.627-.629V8.108c0-.345.282-.63.627-.63.348 0 .63.285.63.63v4.062l2.158-1.933c.12-.108.3-.1.411.02.108.121.1.301-.01.412l-2.022 1.812 2.302 2.061zm-6.273-5.419c.345 0 .627.285.627.63v4.062c0 .345-.282.629-.627.629-.349 0-.63-.284-.63-.629V8.604c0-.345.281-.63.63-.63zm-3.601 3.432H4.499V8.604c0-.345-.282-.63-.627-.63-.349 0-.63.285-.63.63v4.692c0 .345.281.629.63.629h2.158c.349 0 .63-.285.63-.63 0-.345-.281-.629-.63-.629zM12 0C5.373 0 0 4.627 0 10.325c0 5.011 4.185 9.215 9.843 10.021.384.07.495.168.495.385 0 .19-.077.728-.117 1.341-.038.599-.176 2.247.773 2.743.95.496 1.724-.438 2.91-1.391 1.186-.953 6.326-5.174 7.202-6.195 1.547-1.785 2.394-4.116 2.394-6.507C24 4.627 18.627 0 12 0z"/></svg><span>LINE</span></button>',
        '<button type="button" class="apple-login" aria-label="使用 Apple 登入"><svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.95 6.07c.56-.69.94-1.65.84-2.61-.83.04-1.84.55-2.43 1.24-.52.6-.98 1.58-.85 2.52.93.07 1.88-.47 2.44-1.15z"/></svg><span>Apple</span></button>'
      ].join('');
      body.appendChild(socialRow);
      var googleButton = socialRow.querySelector('.google-login');
      if (googleButton) googleButton.addEventListener('click', startGoogleLogin);
    }

    var googleButton = body.querySelector('.google-login');
    var lineButton = body.querySelector('.line-login');
    var appleButton = body.querySelector('.apple-login');
    if (googleButton && !googleButton.__angAuthBound) { googleButton.__angAuthBound = true; googleButton.addEventListener('click', function (event) { startOAuth('google', event); }); }
    if (lineButton && !lineButton.__angAuthBound) { lineButton.__angAuthBound = true; lineButton.addEventListener('click', function (event) { startOAuth('line', event); }); }
    if (appleButton && !appleButton.__angAuthBound) { appleButton.__angAuthBound = true; appleButton.addEventListener('click', function (event) { startOAuth('apple', event); }); }

    if (!body.querySelector('.email-verification-guide')) {
      var guide = document.createElement('section');
      guide.className = 'email-verification-guide';
      guide.hidden = true;
      guide.setAttribute('aria-live', 'polite');
      guide.innerHTML = [
        '<strong>驗證信已寄出，請前往信箱</strong>',
        '<div class="verification-guide-steps">',
        '<span><i aria-hidden="true">✉</i><b>1</b><em>打開 Email 信箱</em></span>',
        '<span><i aria-hidden="true">#</i><b>2</b><em>查看 ANG HR 驗證碼</em></span>',
        '<span><i aria-hidden="true">✓</i><b>3</b><em>回來輸入驗證碼</em></span>',
        '</div>',
        '<small>若沒有看到信件，請檢查垃圾郵件匣。</small>'
      ].join('');
      body.appendChild(guide);
    }
    return true;
  }

  function syncPlanCardCopy() {
    var freeTitle = document.querySelector('.manager-card.free h2');
    if (!freeTitle) return false;
    if (freeTitle.textContent !== 'Lite Free') freeTitle.textContent = 'Lite Free';
    return true;
  }

  function observeCardRestores() {
    var carousel = document.querySelector('.manager-carousel');
    if (!carousel || carousel.__angRestoreObserver) return;

    carousel.__angRestoreObserver = new MutationObserver(function () {
      var intro = document.querySelector('.manager-card.intro');
      if (intro && intro.classList.contains('collapsed')) addWelcomeMessage();
      addLoginActions();
      syncPlanCardCopy();
    });
    carousel.__angRestoreObserver.observe(carousel, { childList: true, subtree: true });
  }

  function addWelcomeMessage() {
    var encouragement = document.querySelector('.manager-card.intro .encouragement-message');
    if (!encouragement) return false;

    if (!encouragement.previousElementSibling?.classList.contains('manager-welcome-message')) {
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
      document.querySelector('main.landing').appendChild(logoMessage);
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

  function observeUntilReady() {
    if (addWelcomeMessage() && syncLoginVerificationState() && addLoginActions() && syncPlanCardCopy()) {
      observeCardRestores();
      return;
    }
    var observer = new MutationObserver(function () {
      if (addWelcomeMessage() && syncLoginVerificationState() && addLoginActions() && syncPlanCardCopy()) {
        observer.disconnect();
        observeCardRestores();
      }
    });
    observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
  }

  document.addEventListener('input', function (event) {
    if (event.target.matches('input[aria-label="Email、帳號或公司代號"], input[aria-label="Email或使用者代號"], input[aria-label="Email或帳號"]')) {
      setTimeout(syncLoginVerificationState, 0);
      setTimeout(syncLoginVerificationState, 60);
      setTimeout(syncLoginVerificationState, 180);
    }
  });

  document.addEventListener('click', function (event) {
    var card = event.target.closest('.manager-card.login-unified.login-identifier-valid');
    if (card && event.target.closest('.manager-card-toggle')) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  document.addEventListener('click', function (event) {
    var card = event.target.closest('.manager-card.collapsed.free, .manager-card.collapsed.personal, .manager-card.collapsed.business');
    if (!card || event.target.closest('.manager-card-toggle, .card-main-action')) return;

    setTimeout(function () {
      if (!card.classList.contains('collapsed')) return;
      var toggle = card.querySelector('.manager-card-toggle');
      if (toggle) toggle.click();
    }, 0);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { observeUntilReady(); handleAuthCallback(); });
  else { observeUntilReady(); handleAuthCallback(); }
}());
