(function (window, document) {
  'use strict';

  var config = window.ANG_HR_CONFIG || {};
  var STATE_KEY = 'ang_facebook_oauth_state';

  function randomState() {
    var bytes = new Uint8Array(24);
    window.crypto.getRandomValues(bytes);
    return Array.prototype.map.call(bytes, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  function isAndroidApp() {
    return !!(window.ANGHRApp && typeof window.ANGHRApp.startFacebookLogin === 'function');
  }

  function startWebLogin() {
    if (!config.facebookAppId || !config.facebookRedirectUri) throw new Error('Facebook 登入尚未完成設定');
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
      window.dispatchEvent(new CustomEvent('ANG_HR_AUTH_FAILED', { detail: { provider: 'facebook', message: error.message } }));
    }
  }

  window.ANG_FACEBOOK_AUTH = { start: start };

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
    event.preventDefault();
    event.stopPropagation();
    start();
  }, true);
})(window, document);
