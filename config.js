//=============================================================================
// 檔案：config.js
// 說明：ANG HR GitHub 前端設定檔（已填好版）
// 重點：GAS 只當 API；頁面切換一律走 GitHub 前端 admin.html / employee.html。
//=============================================================================
(function(window){
  'use strict';

  // 自動偵測目前 GitHub Pages / 本機資料夾位置，避免更換 Repository 後仍跳回舊網址。
  function detectFrontendBase(){
    var loc = window.location;
    if (!loc || loc.protocol === 'file:') return '.';
    var path = String(loc.pathname || '/');
    var basePath = path.endsWith('/') ? path : path.slice(0, path.lastIndexOf('/') + 1);
    return String(loc.origin || '') + basePath.replace(/\/+$/, '');
  }

  var FRONTEND_BASE_URL = detectFrontendBase();
  // OAuth callback 必須使用公開 HTTPS 網址，Android file:// 不可直接作第三方登入回呼。
  var GAS_API_URL = 'https://script.google.com/macros/s/AKfycbzNycUTGQG0gqgb8B6F7tndEhRXU7GAiKFFWZr0e8sDwL2kXU5tBGLlJR_iBdX7SCnH/exec';
  var GOOGLE_CLIENT_ID = '660707205594-74rvsq9s1h87v1s5pi9nvtms1e4qipat.apps.googleusercontent.com';
  var LINE_CHANNEL_ID = '2010402308';
  var BUILD_VERSION = 'v0.7.0-reset-www-android-first';

  function cleanBase(url){
    return String(url || '').trim().replace(/\/+$/, '');
  }

  function joinUrl(base, file){
    base = cleanBase(base || FRONTEND_BASE_URL);
    file = String(file || '').replace(/^\/+/, '');
    return base + '/' + file;
  }

  var frontendBaseUrl = cleanBase(FRONTEND_BASE_URL);

  window.ANG_HR_CONFIG = {
    appName: 'ANG HR System',
    contactEmail: 'ang0603.system@gmail.com',

    // API：這兩個是 GAS 後端，僅供 fetch / google.script.run bridge 呼叫。
    // 不可拿來當頁面跳轉網址。
    gasApiUrl: GAS_API_URL,
    apiBaseUrl: GAS_API_URL,
    workerApiUrl: '',

    // GitHub 前端：index / employee / admin 切換都走這裡。
    frontendBaseUrl: frontendBaseUrl,
    githubBaseUrl: frontendBaseUrl,
    indexPage: 'index.html',
    employeePage: 'employee.html',
    adminPage: 'admin.html',
    personalPage: 'personal.html',
    creatorPage: 'creator.html',
    appPage: 'app.html',
    indexPageUrl: joinUrl(frontendBaseUrl, 'index.html'),
    employeePageUrl: joinUrl(frontendBaseUrl, 'employee.html'),
    adminPageUrl: joinUrl(frontendBaseUrl, 'admin.html'),
    personalPageUrl: joinUrl(frontendBaseUrl, 'personal.html'),
    creatorPageUrl: joinUrl(frontendBaseUrl, 'creator.html'),
    appShellUrl: joinUrl(frontendBaseUrl, 'app.html'),

    // App 啟動入口固定走 GitHub app.html；GAS 僅作 API。
    webAppUrl: joinUrl(frontendBaseUrl, 'app.html'),
    buildVersion: BUILD_VERSION,

    googleClientId: GOOGLE_CLIENT_ID,
    googleWebClientId: GOOGLE_CLIENT_ID,
    lineChannelId: LINE_CHANNEL_ID,

    // Email 驗證採信箱連結回到 ANG HR，不在入口輸入驗證碼。
    emailVerificationMode: 'link',
    enabledLoginProviders: ['email', 'google', 'line'],

    themeColors: ['#FF87E0', '#CCA4FF', '#8089FF', '#59DDFF'],
    defaultCompanyId: '',
    defaultEmployeeId: '',

    platformCreatorEmployeeId: 'ANG8963',
    freePrivilegeOwnerId: 'ANG8963'
  };
})(window);
