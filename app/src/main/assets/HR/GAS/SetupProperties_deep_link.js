/** ANG HR SetupProperties Deep Link / GitHub / GAS API 設定補充 */

const ANG_DEFAULT_FRONTEND_ROOT_URL = 'https://angsystem.github.io/HR/';
const ANG_DEFAULT_FRONTEND_INDEX_URL = 'https://angsystem.github.io/HR/index.html';

/**
 * 這個是你目前驗證網址裡出現的正式 GAS Web App /exec。
 * 若之後重新部署換 URL，改這一行或直接改 Script Properties 的 WEB_APP_URL。
 */
const ANG_DEFAULT_GAS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbzNycUTGQG0gqgb8B6F7tndEhRXU7GAiKFFWZr0e8sDwL2kXU5tBGLlJR_iBdX7SCnH/exec';

const ANG_DEFAULT_ANDROID_DEEP_LINK_URL = 'anghr://oauth-success';

function angSetupDeepLinkProperties() {
  const props = PropertiesService.getScriptProperties();

  const gasUrl = angResolveGasWebAppUrlForSetup_();
  const frontendRoot = angNormalizeFrontendRootUrlForSetup_(
    props.getProperty('FRONTEND_URL') ||
    props.getProperty('GITHUB_FRONTEND_URL') ||
    ANG_DEFAULT_FRONTEND_ROOT_URL
  );

  const frontendIndex = frontendRoot + 'index.html';

  props.setProperties({
    FRONTEND_URL: frontendRoot,
    GITHUB_FRONTEND_URL: frontendRoot,
    WEB_FRONTEND_URL: frontendIndex,
    ANG_ENTRY_INDEX_URL: frontendIndex,

    WEB_APP_URL: gasUrl,
    GAS_WEBAPP_URL: gasUrl,
    ANG_GAS_WEBAPP_URL: gasUrl,

    ANDROID_DEEP_LINK_URL: ANG_DEFAULT_ANDROID_DEEP_LINK_URL,
    AUTH_VERIFY_ACTION: 'verifyAuthToken'
  }, false);

  return {
    ok: true,
    message: 'ANG HR Deep Link / GitHub / GAS API properties 已重設',
    FRONTEND_URL: props.getProperty('FRONTEND_URL'),
    GITHUB_FRONTEND_URL: props.getProperty('GITHUB_FRONTEND_URL'),
    WEB_FRONTEND_URL: props.getProperty('WEB_FRONTEND_URL'),
    ANG_ENTRY_INDEX_URL: props.getProperty('ANG_ENTRY_INDEX_URL'),
    WEB_APP_URL: props.getProperty('WEB_APP_URL'),
    GAS_WEBAPP_URL: props.getProperty('GAS_WEBAPP_URL'),
    ANG_GAS_WEBAPP_URL: props.getProperty('ANG_GAS_WEBAPP_URL'),
    ANDROID_DEEP_LINK_URL: props.getProperty('ANDROID_DEEP_LINK_URL'),
    AUTH_VERIFY_ACTION: props.getProperty('AUTH_VERIFY_ACTION')
  };
}

function angResolveGasWebAppUrlForSetup_() {
  const props = PropertiesService.getScriptProperties();

  const candidates = [];

  try {
    candidates.push(String(props.getProperty('WEB_APP_URL') || '').trim());
    candidates.push(String(props.getProperty('GAS_WEBAPP_URL') || '').trim());
    candidates.push(String(props.getProperty('ANG_GAS_WEBAPP_URL') || '').trim());
  } catch (err) {}

  try {
    if (ScriptApp.getService && ScriptApp.getService().getUrl) {
      candidates.push(String(ScriptApp.getService().getUrl() || '').trim());
    }
  } catch (err2) {}

  candidates.push(ANG_DEFAULT_GAS_WEBAPP_URL);

  for (let i = 0; i < candidates.length; i++) {
    const clean = angNormalizeGasExecUrlForSetup_(candidates[i]);
    if (clean) return clean;
  }

  return ANG_DEFAULT_GAS_WEBAPP_URL;
}

function angNormalizeGasExecUrlForSetup_(url) {
  let s = String(url || '').trim();
  if (!s) return '';

  s = s.split('#')[0].split('?')[0];

  if (s.indexOf('/dev') > -1) {
    s = s.replace('/dev', '/exec');
  }

  if (
    s.indexOf('/home/projects') > -1 ||
    s.indexOf('/home/triggers') > -1 ||
    s.indexOf('/edit') > -1
  ) {
    return '';
  }

  if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/i.test(s)) {
    return '';
  }

  return s;
}

function angNormalizeFrontendRootUrlForSetup_(url) {
  let s = String(url || '').trim();
  if (!s) s = ANG_DEFAULT_FRONTEND_ROOT_URL;

  s = s.split('#')[0].split('?')[0];
  s = s.replace(/\\/g, '/');

  if (/script\.google\.com/i.test(s)) {
    s = ANG_DEFAULT_FRONTEND_ROOT_URL;
  }

  s = s.replace(/index\.html$/i, '');
  s = s.replace(/app\.html$/i, '');
  s = s.replace(/employee\.html$/i, '');
  s = s.replace(/admin\.html$/i, '');

  if (s.slice(-1) !== '/') s += '/';

  return s;
}

function angGetGasWebAppUrl_() {
  return angResolveGasWebAppUrlForSetup_();
}

function angGetFrontendRootUrl_() {
  const props = PropertiesService.getScriptProperties();
  return angNormalizeFrontendRootUrlForSetup_(
    props.getProperty('FRONTEND_URL') ||
    props.getProperty('GITHUB_FRONTEND_URL') ||
    ANG_DEFAULT_FRONTEND_ROOT_URL
  );
}

function angGetFrontendIndexUrl_() {
  return angGetFrontendRootUrl_() + 'index.html';
}

function angBuildGithubPlatformVerifyUrl_(params) {
  params = params || {};

  const frontendIndex = angGetFrontendIndexUrl_();
  const gasUrl = angGetGasWebAppUrl_();

  const query = {
    platform_email_verify: '1',
    action: params.action || 'platformCreatorEmailLinkVerify',
    challenge_id: params.challenge_id || params.challengeId || '',
    email: params.email || '',
    token: params.token || '',
    gas: gasUrl
  };

  const parts = [];
  Object.keys(query).forEach(function(key) {
    if (query[key] !== null && query[key] !== undefined && String(query[key]) !== '') {
      parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(query[key])));
    }
  });

  return frontendIndex + '?' + parts.join('&');
}

function angTestGithubGasVerifyUrl_() {
  return angBuildGithubPlatformVerifyUrl_({
    challenge_id: 'TEST_CHALLENGE',
    email: 'test@example.com',
    token: 'TEST_TOKEN'
  });
}


function angSetupDeepLinkPropertiesRun() {
  return angSetupDeepLinkProperties();
}

function angTestGithubGasVerifyUrl() {
  return angBuildGithubPlatformVerifyUrl_({
    challenge_id: 'TEST_CHALLENGE',
    email: 'test@example.com',
    token: 'TEST_TOKEN'
  });
}

/**
 * 檢查 OAuth 必要設定；只回傳是否存在，不會輸出 Secret 內容。
 */
function angCheckOAuthPropertiesRun() {
  const props = PropertiesService.getScriptProperties();
  const googleClientId = String(props.getProperty('GOOGLE_CLIENT_ID') || '').trim();
  const googleSecret = String(props.getProperty('GOOGLE_CLIENT_SECRET') || '').trim();
  const lineChannelId = String(props.getProperty('LINE_CHANNEL_ID') || '').trim();
  const lineSecret = String(props.getProperty('LINE_CHANNEL_SECRET') || '').trim();

  return {
    ok: !!(googleClientId && googleSecret && lineChannelId && lineSecret),
    frontend_url: props.getProperty('ANG_ENTRY_INDEX_URL') || ANG_DEFAULT_FRONTEND_INDEX_URL,
    gas_webapp_url: angResolveGasWebAppUrlForSetup_(),
    android_deep_link: props.getProperty('ANDROID_DEEP_LINK_URL') || ANG_DEFAULT_ANDROID_DEEP_LINK_URL,
    google: {
      client_id_set: !!googleClientId,
      client_secret_set: !!googleSecret
    },
    line: {
      channel_id_set: !!lineChannelId,
      channel_secret_set: !!lineSecret
    },
    message: (googleClientId && googleSecret && lineChannelId && lineSecret)
      ? 'Google／LINE OAuth 必要設定已齊全'
      : '仍有 OAuth Script Property 未設定'
  };
}


/** Facebook OAuth：請在 Script Properties 手動設定 FACEBOOK_APP_ID、FACEBOOK_APP_SECRET。 */
function angSetupFacebookRedirectPropertyRun(){
  var p=PropertiesService.getScriptProperties();
  var gas=p.getProperty('WEB_APP_URL')||p.getProperty('GAS_WEBAPP_URL')||ANG_DEFAULT_GAS_WEBAPP_URL;
  p.setProperty('FACEBOOK_REDIRECT_URI', gas+'?action=oauthCallback&provider=facebook');
  return {ok:true,FACEBOOK_REDIRECT_URI:p.getProperty('FACEBOOK_REDIRECT_URI'),FACEBOOK_APP_ID_set:!!p.getProperty('FACEBOOK_APP_ID'),FACEBOOK_APP_SECRET_set:!!p.getProperty('FACEBOOK_APP_SECRET')};
}
