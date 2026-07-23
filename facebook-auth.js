(function (window, document) {
  'use strict';

  var STATE_KEY = 'ang_facebook_oauth_state';

  function getConfig() {
    return window.ANG_HR_CONFIG || {};
  }

  function randomState() {
    var bytes = new Uint8Array(24);
    window.crypto.getRandomValues(bytes);
    return Array.prototype.map.call(bytes, function (value) {
      return value.toString(16).padStart(2, '0');
    }).join('');
  }

  function isAndroidApp() {
    return !!(window.ANGHRApp && typeof window.ANGHRApp.startFacebookLogin === 'function');
  }

  function startWebLogin() {
    var config = getConfig();
    if (!config.facebookAppId || !config.facebookRedirectUri) {
      throw new Error('Facebook 登入尚未完成設定');
    }

    var state = randomState();
    sessionStorage.setItem(STATE_KEY, state);

    var query = new URLSearchParams({
      client_id: config.facebookAppId,
      redirect_uri: config.facebookRedirectUri,
      response_type: 'code',
      scope: (config.facebookPermissions || ['public_profile', 'email']).join(','),
      state: state
    });

    window.location.assign('https://www.facebook.com/v23.0/dialog/oauth?' + query.toString());
  }

  function start() {
    try {
      if (isAndroidApp()) window.ANGHRApp.startFacebookLogin();
      else startWebLogin();
    } catch (error) {
      window.dispatchEvent(new CustomEvent('ANG_HR_AUTH_FAILED', {
        detail: { provider: 'facebook', message: error.message }
      }));
    }
  }

  function facebookMarkup() {
    return [
      '<svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
      '<path fill="currentColor" d="M13.6 22v-9h3l.45-3.5H13.6V7.27c0-1.01.28-1.7 1.74-1.7h1.86V2.44c-.32-.04-1.43-.14-2.72-.14-2.69 0-4.53 1.64-4.53 4.66V9.5H6.9V13h3.05v9h3.65z"/>',
      '</svg>',
      '<span>Facebook</span>'
    ].join('');
  }

  function normaliseButton(button) {
    if (!button) return null;
    button.type = 'button';
    button.classList.remove('google-login', 'line-login', 'apple-login');
    button.classList.add('facebook-login');
    button.setAttribute('data-ang-facebook-login', 'true');
    button.setAttribute('data-provider', 'facebook');
    button.setAttribute('aria-label', '使用 Facebook 登入');
    button.setAttribute('title', 'Facebook');
    button.innerHTML = facebookMarkup();
    return button;
  }

  function findProvider(row, provider) {
    return row && row.querySelector('.' + provider + '-login, [data-provider="' + provider + '"]');
  }

  function findSocialRow() {
    var direct = document.querySelector('.social-login-row, [data-social-login], [data-auth-providers]');
    if (direct) return direct;

    var buttons = document.querySelectorAll('button, [role="button"]');
    for (var i = 0; i < buttons.length; i += 1) {
      var label = [buttons[i].className, buttons[i].getAttribute('aria-label'), buttons[i].textContent].join(' ').toLowerCase();
      if (/google|line|apple/.test(label) && buttons[i].parentElement) return buttons[i].parentElement;
    }
    return null;
  }

  function installButton() {
    var row = findSocialRow();
    if (!row) return false;

    var google = findProvider(row, 'google');
    var line = findProvider(row, 'line');
    var apple = findProvider(row, 'apple');
    var facebook = findProvider(row, 'facebook') || row.querySelector('[data-ang-facebook-login]');

    if (!facebook) {
      facebook = document.createElement('button');
    }
    normaliseButton(facebook);

    [google, line, facebook, apple].forEach(function (button) {
      if (button) row.appendChild(button);
    });

    row.setAttribute('data-provider-order', 'google-line-facebook-apple');
    row.style.setProperty('grid-template-columns', 'repeat(4, minmax(0, 1fr))', 'important');
    return true;
  }

  window.ANG_FACEBOOK_AUTH = { start: start, installButton: installButton };

  var queued = false;
  function queueInstall() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(function () {
      queued = false;
      installButton();
    });
  }

  var observer = new MutationObserver(queueInstall);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', installButton);
  installButton();

  document.addEventListener('click', function (event) {
    var button = event.target && event.target.closest
      ? event.target.closest('[data-ang-facebook-login], .facebook-login, [data-provider="facebook"]')
      : null;
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    start();
  }, true);
})(window, document);
