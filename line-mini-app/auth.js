// ANG HR LINE MINI App：唯一共用層＝驗證
(function (window) {
  'use strict';

  var config = window.ANG_HR_MINI_CONFIG || {};
  var environment = config.environment || 'developing';
  var liffId = config.liffIds && config.liffIds[environment]
    ? String(config.liffIds[environment]).trim()
    : '';

  function createError(code, message) {
    var error = new Error(message);
    error.code = code;
    return error;
  }

  async function verifyWithBackend(idToken) {
    if (!idToken) throw createError('LINE_ID_TOKEN_MISSING', 'LINE 身分憑證不存在。');

    var body = new URLSearchParams();
    body.set('action', config.verifyAction || 'verifyLineMiniAppIdToken');
    body.set('id_token', idToken);
    body.set('environment', environment);
    body.set('source', 'line-mini-app');

    var response = await fetch(config.gasApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: body.toString(),
      redirect: 'follow'
    });

    if (!response.ok) {
      throw createError('ANG_HR_BACKEND_HTTP_ERROR', 'ANG HR 後端暫時無法連線。');
    }

    var result;
    try {
      result = await response.json();
    } catch (error) {
      throw createError('ANG_HR_BACKEND_INVALID_RESPONSE', 'ANG HR 後端回傳格式不正確。');
    }

    if (!result || result.ok !== true) {
      throw createError(
        result && result.code ? result.code : 'ANG_HR_AUTH_FAILED',
        result && result.message ? result.message : 'ANG HR 帳號驗證失敗。'
      );
    }

    return result;
  }

  async function initialize() {
    if (!liffId) {
      throw createError('LIFF_ID_MISSING', '尚未填入 ' + environment + ' 環境的 LIFF ID。');
    }
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
    var backendSession = await verifyWithBackend(idToken);
    var profile = null;

    try {
      profile = await window.liff.getProfile();
    } catch (error) {
      profile = null;
    }

    return {
      environment: environment,
      isInClient: typeof window.liff.isInClient === 'function' && window.liff.isInClient(),
      profile: profile,
      session: backendSession.session || backendSession.data || backendSession,
      raw: backendSession
    };
  }

  window.ANG_HR_MINI_AUTH = {
    initialize: initialize,
    verifyWithBackend: verifyWithBackend
  };
}(window));
