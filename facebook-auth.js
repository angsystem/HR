(function (window) {
  'use strict';

  var STATE_KEY = 'ang_facebook_oauth_state';

  function config() {
    return window.ANG_HR_CONFIG || {};
  }

  function randomState() {
    var bytes = new Uint8Array(24);
    window.crypto.getRandomValues(bytes);
    return Array.prototype.map.call(bytes, function (byte) {
      return byte.toString(16).padStart(2, '0');
    }).join('');
  }

  function startWebLogin() {
    var settings = config();
    if (!settings.facebookAppId || !settings.facebookRedirectUri) {
      throw new Error('Facebook 登入尚未完成設定');
    }

    var state = randomState();
    sessionStorage.setItem(STATE_KEY, state);
    var query = new URLSearchParams({
      client_id: settings.facebookAppId,
      redirect_uri: settings.facebookRedirectUri,
      response_type: 'code',
      scope: (settings.facebookPermissions || ['public_profile', 'email']).join(','),
      state: state
    });
    window.location.assign('https://www.facebook.com/v23.0/dialog/oauth?' + query.toString());
  }

  function start() {
    try {
      if (window.ANGHRApp && typeof window.ANGHRApp.startFacebookLogin === 'function') {
        window.ANGHRApp.startFacebookLogin();
      } else {
        startWebLogin();
      }
    } catch (error) {
      window.dispatchEvent(new CustomEvent('ANG_HR_AUTH_FAILED', {
        detail: { provider: 'facebook', message: error.message }
      }));
    }
  }

  window.ANG_FACEBOOK_AUTH = { start: start };
}(window));
