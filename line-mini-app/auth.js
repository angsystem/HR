// ANG HR LINE MINI App：只處理 LINE／LIFF 身分，不直接碰其他客戶端
(function (window) {
  'use strict';

  var config = window.ANG_HR_MINI_CONFIG || {};
  var lineApi = window.ANG_HR_LINE_API;
  var environment = config.environment || 'developing';
  var liffId = config.liffIds && config.liffIds[environment]
    ? String(config.liffIds[environment]).trim()
    : '';

  function createError(code, message) {
    var error = new Error(message);
    error.code = code;
    return error;
  }

  async function initialize() {
    if (!lineApi) throw createError('LINE_API_MISSING', 'LINE API 轉接檔尚未載入。');
    if (!liffId) throw createError('LIFF_ID_MISSING', '尚未填入 ' + environment + ' 環境的 LIFF ID。');
    if (!window.liff || typeof window.liff.init !== 'function') {
      throw createError('LIFF_SDK_UNAVAILABLE', 'LIFF SDK 載入失敗。');
    }

    await window.liff.init({ liffId: liffId });

    if (!window.liff.isLoggedIn()) {
      if (typeof window.liff.isInClient === 'function' && !window.liff.isInClient()) {
        window.liff.login({ redirectUri: window.location.href.split('#')[0] });
        return new Promise(function () {});
      }
      throw createError('LINE_LOGIN_REQUIRED', '請先完成 LINE 登入。');
    }

    var idToken = window.liff.getIDToken();
    if (!idToken) throw createError('LINE_ID_TOKEN_MISSING', 'LINE 身分憑證不存在。');

    var backendSession = await lineApi.authenticate(idToken);
    var profile = null;
    try {
      profile = await window.liff.getProfile();
    } catch (error) {
      profile = null;
    }

    return {
      client: 'line',
      channel: 'line-mini-app',
      environment: environment,
      isInClient: typeof window.liff.isInClient === 'function' && window.liff.isInClient(),
      profile: profile,
      session: backendSession.session || backendSession.data || backendSession,
      raw: backendSession
    };
  }

  window.ANG_HR_MINI_AUTH = { initialize: initialize };
}(window));
