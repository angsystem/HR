(function (window, document) {
  'use strict';

  var config = window.ANG_HR_CONFIG || {};
  var STATE_KEY = 'ang_facebook_oauth_state';

  function randomState() {
    var bytes = new Uint8Array(24);
    window.crypto.getRandomValues(bytes);
<<<<<<< HEAD
    return Array.prototype.map.call(bytes, function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
=======
    return Array.prototype.map.call(bytes, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
>>>>>>> ed9dfc860d1949036dff35946aaaef4fa7d9c0bd
  }

  function isAndroidApp() {
    return !!(window.ANGHRApp && typeof window.ANGHRApp.startFacebookLogin === 'function');
  }

  function startWebLogin() {
<<<<<<< HEAD
    if (!config.facebookAppId || !config.facebookRedirectUri) {
      throw new Error('Facebook 登入尚未完成設定');
    }

    var state = randomState();
    sessionStorage.setItem(STATE_KEY, state);

=======
    if (!config.facebookAppId || !config.facebookRedirectUri) throw new Error('Facebook 登入尚未完成設定');
    var state = randomState();
    sessionStorage.setItem(STATE_KEY, state);
>>>>>>> ed9dfc860d1949036dff35946aaaef4fa7d9c0bd
    var query = new URLSearchParams({
      client_id: config.facebookAppId,
      redirect_uri: config.facebookRedirectUri,
      response_type: 'code',
      scope: (config.facebookPermissions || ['public_profile', 'email']).join(','),
      state: state
    });
<<<<<<< HEAD

=======
>>>>>>> ed9dfc860d1949036dff35946aaaef4fa7d9c0bd
    window.location.assign('https://www.facebook.com/v23.0/dialog/oauth?' + query.toString());
  }

  function start() {
    try {
      if (isAndroidApp()) window.ANGHRApp.startFacebookLogin();
      else startWebLogin();
    } catch (error) {
<<<<<<< HEAD
      window.dispatchEvent(new CustomEvent('ANG_HR_AUTH_FAILED', {
        detail: {
          provider: 'facebook',
          message: error.message
        }
      }));
=======
      window.dispatchEvent(new CustomEvent('ANG_HR_AUTH_FAILED', { detail: { provider: 'facebook', message: error.message } }));
>>>>>>> ed9dfc860d1949036dff35946aaaef4fa7d9c0bd
    }
  }

  window.ANG_FACEBOOK_AUTH = { start: start };

<<<<<<< HEAD
  function facebookMarkup() {
    return [
      '<svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true">',
      '<path fill="currentColor" d="M13.6 22v-9h3l.45-3.5H13.6V7.27c0-1.01.28-1.7 1.74-1.7h1.86V2.44c-.32-.04-1.43-.14-2.72-.14-2.69 0-4.53 1.64-4.53 4.66V9.5H6.9V13h3.05v9h3.65z"/>',
      '</svg>',
      '<span>Facebook</span>'
    ].join('');
  }

  function normaliseFacebookButton(button) {
    button.type = 'button';
    button.classList.remove('google-login', 'line-login', 'apple-login');
    button.classList.add('facebook-login');
    button.setAttribute('data-ang-facebook-login', 'true');
    button.setAttribute('aria-label', '使用 Facebook 登入');
    button.setAttribute('title', 'Facebook');
    button.innerHTML = facebookMarkup();
    return button;
  }

  function installButtons() {
    var row = document.querySelector('.social-login-row');
    if (!row) return;

    var google = row.querySelector('.google-login');
    var line = row.querySelector('.line-login');
    var apple = row.querySelector('.apple-login');
    var facebook = row.querySelector('.facebook-login, [data-ang-facebook-login]');

    if (!facebook) {
      facebook = document.createElement('button');
      row.appendChild(facebook);
    }

    normaliseFacebookButton(facebook);

    if (google) google.setAttribute('title', 'Google');
    if (line) line.setAttribute('title', 'LINE');
    if (apple) apple.setAttribute('title', 'Apple');

    [google, line, facebook, apple].forEach(function (button) {
      if (button) row.appendChild(button);
    });

    row.setAttribute('data-provider-order', 'google-line-facebook-apple');
    row.style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
  }

  var observer = new MutationObserver(installButtons);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  document.addEventListener('DOMContentLoaded', installButtons);
  installButtons();

  document.addEventListener('click', function (event) {
    var button = event.target && event.target.closest
      ? event.target.closest('[data-ang-facebook-login], .facebook-login')
      : null;

    if (!button) return;

=======
  function installButton() {
    if (document.querySelector('[data-ang-facebook-login]')) return;
    var buttons = document.querySelectorAll('button');
    var template = null;
    for (var i = 0; i < buttons.length; i += 1) {
      var label = String(buttons[i].textContent || '').trim().toLowerCase();
      if (label.indexOf('facebook') !== -1) {
        buttons[i].setAttribute('data-ang-facebook-login', 'true');
        return;
      }
      if (label.indexOf('line') !== -1 || label.indexOf('apple') !== -1) template = buttons[i];
    }
    if (!template || !template.parentNode) return;
    var button = template.cloneNode(true);
    button.setAttribute('data-ang-facebook-login', 'true');
    button.setAttribute('aria-label', '使用 Facebook 登入');
    var textNode = button.querySelector('span') || button;
    textNode.textContent = 'Facebook';
    template.parentNode.appendChild(button);
  }

  var observer = new MutationObserver(installButton);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', installButton);
  installButton();

  document.addEventListener('click', function (event) {
    var button = event.target && event.target.closest ? event.target.closest('button,[role="button"],a') : null;
    if (!button) return;
    var text = String(button.textContent || '').trim().toLowerCase();
    if (text.indexOf('facebook') === -1) return;
>>>>>>> ed9dfc860d1949036dff35946aaaef4fa7d9c0bd
    event.preventDefault();
    event.stopPropagation();
    start();
  }, true);
})(window, document);
