// ANG HR LINE MINI App 獨立設定
(function (window) {
  'use strict';

  var params = new URLSearchParams(window.location.search || '');
  var requestedEnvironment = String(params.get('env') || 'developing').toLowerCase();
  var allowed = ['developing', 'review', 'published'];
  var environment = allowed.indexOf(requestedEnvironment) >= 0 ? requestedEnvironment : 'developing';

  window.ANG_HR_MINI_CONFIG = {
    appName: 'ANG HR',
    environment: environment,
    version: '2026.07.26-mini-v2',

    // LINE Developers Console 建立後填入。三個環境不可混用。
    liffIds: {
      developing: '',
      review: '',
      published: ''
    },

    // 僅共用 ANG HR 後端 API，不共用原本 Web 入口與前端畫面。
    gasApiUrl: 'https://script.google.com/macros/s/AKfycbzNycUTGQG0gqgb8B6F7tndEhRXU7GAiKFFWZr0e8sDwL2kXU5tBGLlJR_iBdX7SCnH/exec',
    verifyAction: 'verifyLineMiniAppIdToken',

    routes: {
      home: 'home',
      clock: 'clock',
      schedule: 'schedule',
      leave: 'leave',
      payroll: 'payroll',
      manage: 'manage'
    },

    features: {
      nfc: true,
      qr: true,
      locationClock: true,
      management: true
    }
  };
}(window));
