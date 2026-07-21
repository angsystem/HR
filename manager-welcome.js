(function () {
  var validLoginIdentifiers = [
    'ang-beta-basic', 'basic@ang-beta.test',
    'ang-beta-pro', 'pro@ang-beta.test',
    'ang-beta-premium', 'premium@ang-beta.test',
    'ang-solo-01', 'solo@ang-beta.test',
    'ang-performance-01', 'performance@ang-beta.test',
    'free-personal-lite', 'personal-lite@ang-beta.test',
    'free-business-lite', 'business-lite@ang-beta.test'
  ];

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

  function handleLoginVerification(event) {
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
    var isValid = validLoginIdentifiers.indexOf(value.toLowerCase()) !== -1;
    if (!isValid) {
      card.classList.add('login-verification-missing');
      if (guide) guide.hidden = true;
      return false;
    }

    if (guide) guide.hidden = false;
    syncLoginVerificationState(true);
    return true;
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
    }

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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observeUntilReady);
  else observeUntilReady();
}());
