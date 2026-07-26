//=============================================================================
// 檔案：line-mini-app-config.js
// 說明：ANG HR LINE MINI App 專用設定
// 注意：Developing／Review／Published 各有不同 LIFF ID，請勿混用。
//=============================================================================
(function (window) {
  'use strict';

  var params = new URLSearchParams(window.location.search || '');
  var requestedEnvironment = String(params.get('miniapp_env') || '').toLowerCase();
  var allowedEnvironments = ['developing', 'review', 'published'];
  var environment = allowedEnvironments.indexOf(requestedEnvironment) >= 0
    ? requestedEnvironment
    : 'developing';

  window.ANG_HR_LINE_MINI_APP_CONFIG = {
    appName: 'ANG HR',
    environment: environment,

    // 建立 LINE MINI App Channel 後，把三組 LIFF ID 填入。
    // Developing：開發者與測試者使用
    // Review：送審環境
    // Published：正式使用者環境
    liffIds: {
      developing: '',
      review: '',
      published: ''
    },

    endpointUrls: {
      developing: 'https://angsystem.github.io/HR/line-mini-app.html?miniapp_env=developing',
      review: 'https://angsystem.github.io/HR/line-mini-app.html?miniapp_env=review',
      published: 'https://angsystem.github.io/HR/line-mini-app.html?miniapp_env=published'
    },

    autoLoginInExternalBrowser: true,
    exposeDebugInfo: environment !== 'published',

    // 後端必須驗證 ID token，前端取得的 profile／userId 不可直接作為登入依據。
    backendVerifyAction: 'verifyLineMiniAppIdToken'
  };
}(window));
