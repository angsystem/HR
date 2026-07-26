// ANG HR LINE MINI App：LINE 專用設定
(function (window) {
  'use strict';

  var params = new URLSearchParams(window.location.search || '');
  var requestedEnvironment = String(params.get('env') || 'developing').toLowerCase();
  var allowed = ['developing', 'review', 'published'];
  var environment = allowed.indexOf(requestedEnvironment) >= 0 ? requestedEnvironment : 'developing';

  window.ANG_HR_MINI_CONFIG = {
    appName: 'ANG HR',
    client: 'line',
    channel: 'line-mini-app',
    apiVersion: 'v1',
    environment: environment,
    version: '2026.07.26-line-split-v1',

    // LINE Developers Console 建立後填入；三個環境不可混用。
    liffIds: {
      developing: '',
      review: '',
      published: ''
    },

    // LINE 只共用資料與互動 API，不載入 Web／Flutter 的入口與程式。
    gasApiUrl: 'https://script.google.com/macros/s/AKfycbzNycUTGQG0gqgb8B6F7tndEhRXU7GAiKFFWZr0e8sDwL2kXU5tBGLlJR_iBdX7SCnH/exec',

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
