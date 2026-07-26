//=============================================================================
// 檔案：line-mini-app-bridge.js
// 說明：初始化 LIFF，將 LINE MINI App 身分資訊提供給 ANG HR 前端。
//=============================================================================
(function (window, document) {
  'use strict';

  var config = window.ANG_HR_LINE_MINI_APP_CONFIG || {};
  var environment = config.environment || 'developing';
  var liffId = config.liffIds && config.liffIds[environment]
    ? String(config.liffIds[environment]).trim()
    : '';

  function emit(name, detail) {
    document.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
  }

  function cleanRedirectUrl() {
    var url = new URL(window.location.href);
    ['code', 'state', 'liff.state', 'error', 'error_description'].forEach(function (key) {
      url.searchParams.delete(key);
    });
    return url.toString();
  }

  function publishStatus(status, payload) {
    var detail = Object.assign({
      status: status,
      environment: environment,
      isLineMiniApp: true
    }, payload || {});

    window.ANG_HR_LINE_MINI_APP_STATUS = detail;
    emit('anghr:line-mini-app-status', detail);
    return detail;
  }

  async function initialize() {
    if (!liffId) {
      return publishStatus('setup_required', {
        ok: false,
        code: 'LIFF_ID_MISSING',
        message: '尚未填入 ' + environment + ' 環境的 LIFF ID。'
      });
    }

    if (!window.liff || typeof window.liff.init !== 'function') {
      return publishStatus('error', {
        ok: false,
        code: 'LIFF_SDK_UNAVAILABLE',
        message: 'LIFF SDK 載入失敗。'
      });
    }

    publishStatus('initializing', { ok: false });

    try {
      await window.liff.init({ liffId: liffId });

      if (!window.liff.isLoggedIn()) {
        var isInClient = typeof window.liff.isInClient === 'function' && window.liff.isInClient();
        if (!isInClient && config.autoLoginInExternalBrowser) {
          window.liff.login({ redirectUri: cleanRedirectUrl() });
          return publishStatus('redirecting_to_line_login', { ok: false });
        }

        return publishStatus('login_required', {
          ok: false,
          code: 'LINE_LOGIN_REQUIRED',
          message: '需要先完成 LINE 登入。'
        });
      }

      var context = typeof window.liff.getContext === 'function'
        ? window.liff.getContext()
        : null;
      var profile = typeof window.liff.getProfile === 'function'
        ? await window.liff.getProfile()
        : null;
      var idToken = typeof window.liff.getIDToken === 'function'
        ? window.liff.getIDToken()
        : '';
      var decodedIdToken = typeof window.liff.getDecodedIDToken === 'function'
        ? window.liff.getDecodedIDToken()
        : null;

      // 僅存於目前分頁工作階段；正式登入仍須把 idToken 交給 GAS 驗證。
      try {
        window.sessionStorage.setItem('ANG_HR_LINE_MINI_APP_ENV', environment);
        window.sessionStorage.setItem('ANG_HR_LINE_MINI_APP_ID_TOKEN', idToken || '');
        window.sessionStorage.setItem('ANG_HR_LINE_MINI_APP_PROFILE', JSON.stringify(profile || {}));
      } catch (storageError) {
        console.warn('[ANG HR MINI App] 無法寫入 sessionStorage：', storageError);
      }

      var identity = {
        environment: environment,
        liffId: liffId,
        context: context,
        profile: profile,
        idToken: idToken,
        decodedIdToken: decodedIdToken,
        isInClient: typeof window.liff.isInClient === 'function' && window.liff.isInClient()
      };

      window.ANG_HR_LINE_IDENTITY = identity;
      emit('anghr:line-identity-ready', identity);

      return publishStatus('ready', {
        ok: true,
        identity: identity
      });
    } catch (error) {
      console.error('[ANG HR MINI App] LIFF 初始化失敗：', error);
      return publishStatus('error', {
        ok: false,
        code: error && error.code ? error.code : 'LIFF_INIT_FAILED',
        message: error && error.message ? error.message : 'LIFF 初始化失敗。'
      });
    }
  }

  window.ANG_HR_LIFF_READY = initialize();
}(window, document));
