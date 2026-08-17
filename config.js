//=============================================================================
// 檔案：config.js
// 說明：ANG HR GitHub 前端設定檔（已填好版）
// 重點：GAS 負責驗證入口、OAuth callback 與後端判定；完成後直接送回 GitHub 前端。
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
  // App 的 www/file:// 不能作第三方驗證回程；OAuth、Email、LINE MINI App 一律回公開 HTTPS 前端。
  var OAUTH_CALLBACK_BASE_URL = 'https://angsystem.github.io/HR';
  var GAS_API_URL = 'https://script.google.com/macros/s/AKfycbzNycUTGQG0gqgb8B6F7tndEhRXU7GAiKFFWZr0e8sDwL2kXU5tBGLlJR_iBdX7SCnH/exec';
  var GOOGLE_CLIENT_ID = '660707205594-74rvsq9s1h87v1s5pi9nvtms1e4qipat.apps.googleusercontent.com';
  var LINE_CHANNEL_ID = '2010402308';
  var LINE_LIFF_IDS = {
    developing: '2011034600-oDPVcVyv',
    review: '2011034601-TDlqK0Zf',
    published: '2010402308-aEXeFYXe'
  };
  var LINE_LIFF_ENV = 'published';
  var LINE_LIFF_ID = LINE_LIFF_IDS[LINE_LIFF_ENV];
  var FACEBOOK_APP_ID = '1053775314267018';
  var BUILD_VERSION = 'v0.7.6-20260817-mobile-topbar-safe-area';

  function cleanBase(url){
    return String(url || '').trim().replace(/\/+$/, '');
  }

  function joinUrl(base, file){
    base = cleanBase(base || FRONTEND_BASE_URL);
    file = String(file || '').replace(/^\/+/, '');
    return base + '/' + file;
  }

  var frontendBaseUrl = cleanBase(FRONTEND_BASE_URL);
  var oauthCallbackBaseUrl = cleanBase(OAUTH_CALLBACK_BASE_URL);

  window.ANG_HR_CONFIG = {
    appName: 'ANG HR',
    contactEmail: 'ang0603.system@gmail.com',

    // GAS：驗證按鈕先進 GAS；Provider 回 GAS 完成判定，再由 GAS 直接跳回公開前端。
    gasApiUrl: GAS_API_URL,
    apiBaseUrl: GAS_API_URL,
    workerApiUrl: '',

    // GitHub 前端：一般頁面切換使用目前來源；驗證回程固定使用公開 HTTPS 網址。
    frontendBaseUrl: frontendBaseUrl,
    githubBaseUrl: frontendBaseUrl,
    publicFrontendBaseUrl: oauthCallbackBaseUrl,
    oauthCallbackBaseUrl: oauthCallbackBaseUrl,
    indexPage: 'index.html',
    employeePage: 'employee.html',
    adminPage: 'admin.html',
    personalPage: 'personal.html',
    creatorPage: 'creator.html',
    appPage: 'app.html',
    organizationPage: 'organization.html',
    indexPageUrl: joinUrl(frontendBaseUrl, 'index.html'),
    employeePageUrl: joinUrl(frontendBaseUrl, 'employee.html'),
    adminPageUrl: joinUrl(frontendBaseUrl, 'admin.html'),
    personalPageUrl: joinUrl(frontendBaseUrl, 'personal.html'),
    creatorPageUrl: joinUrl(frontendBaseUrl, 'creator.html'),
    organizationPageUrl: joinUrl(frontendBaseUrl, 'organization.html'),
    appShellUrl: joinUrl(frontendBaseUrl, 'app.html'),
    authReturnUrl: joinUrl(oauthCallbackBaseUrl, 'index.html'),

    // App 啟動入口仍走目前包內 app.html；只有驗證回程強制回 GitHub HTTPS。
    webAppUrl: joinUrl(frontendBaseUrl, 'app.html'),
    buildVersion: BUILD_VERSION,

    googleClientId: GOOGLE_CLIENT_ID,
    googleWebClientId: GOOGLE_CLIENT_ID,
    lineChannelId: LINE_CHANNEL_ID,
    lineLiffId: LINE_LIFF_ID,
    lineLiffEnvironment: LINE_LIFF_ENV,
    lineLiffIds: LINE_LIFF_IDS,
    lineMiniAppEndpoint: joinUrl(oauthCallbackBaseUrl, 'index.html'),
    lineMiniAppScopes: ['openid', 'profile', 'email'],
    facebookAppId: FACEBOOK_APP_ID,
    facebookPermissions: ['public_profile', 'email'],
    facebookRedirectUri: joinUrl(oauthCallbackBaseUrl, 'facebook-callback.html'),
    // 授權碼只能由後端配合 App Secret 交換；App Secret 絕不可放在 GitHub Pages。
    facebookTokenExchangeUrl: GAS_API_URL + '?action=facebookOAuthExchange',

    // Email 驗證採信箱連結回到 ANG HR，不在入口輸入驗證碼。
    emailVerificationMode: 'link',
    enabledLoginProviders: ['email', 'google', 'line', 'facebook'],

    themeColors: ['#FF87E0', '#CCA4FF', '#8089FF', '#59DDFF'],
    defaultCompanyId: '',
    defaultEmployeeId: '',

    platformCreatorEmployeeId: 'ANG8963',
    freePrivilegeOwnerId: 'ANG8963'
  };

  // 共用 Web RWD guard：修正登入後舊 768px desktop-grid 規則誤套到 touch-first 平板。
  try {
    if (window.document && !window.document.querySelector('link[data-ang-web-rwd-guard]')) {
      var rwdGuard = window.document.createElement('link');
      rwdGuard.rel = 'stylesheet';
      rwdGuard.href = joinUrl(frontendBaseUrl, 'web-rwd-tablet-guard-20260816.css') + '?v=' + encodeURIComponent(BUILD_VERSION);
      rwdGuard.setAttribute('data-ang-web-rwd-guard', '1');
      (window.document.head || window.document.documentElement).appendChild(rwdGuard);
    }
  } catch (e) {}

  // 所有正式 HR 頁面共用組織圖入口；launcher 自己會判斷頁面與登入狀態，不影響登入頁。
  try {
    if (window.document && !window.document.querySelector('script[data-ang-org-launcher]')) {
      var orgLauncher = window.document.createElement('script');
      orgLauncher.src = joinUrl(frontendBaseUrl, 'organization-launcher.js') + '?v=' + encodeURIComponent(BUILD_VERSION);
      orgLauncher.async = true;
      orgLauncher.setAttribute('data-ang-org-launcher', '1');
      (window.document.head || window.document.documentElement).appendChild(orgLauncher);
    }
  } catch (e) {}
})(window);
