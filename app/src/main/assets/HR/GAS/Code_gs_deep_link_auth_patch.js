/** ANG HR Deep Link Auth Patch */
var ANG_APP_DEEP_LINK_URL = 'anghr://oauth-success';
var ANG_WEB_FRONTEND_URL = 'https://angsystem.github.io/HR/index.html';

function getAndroidDeepLinkUrl_() {
  try {
    return PropertiesService.getScriptProperties().getProperty('ANDROID_DEEP_LINK_URL') || ANG_APP_DEEP_LINK_URL;
  } catch (err) {
    return ANG_APP_DEEP_LINK_URL;
  }
}

function getWebFrontendUrl_() {
  try {
    return PropertiesService.getScriptProperties().getProperty('WEB_FRONTEND_URL') || PropertiesService.getScriptProperties().getProperty('FRONTEND_URL') || ANG_WEB_FRONTEND_URL;
  } catch (err) {
    return ANG_WEB_FRONTEND_URL;
  }
}
var ANG_AUTH_CODE_TTL_SECONDS = 5 * 60;

function createDeepLinkAuthCode_(data) {
  data = data || {};
  var code = Utilities.getUuid().replace(/-/g, '') + String(Date.now());
  CacheService.getScriptCache().put('ANG_AUTH_CODE_' + code, JSON.stringify({
    ok: true,
    auth_passed: true,
    provider: data.provider || '',
    email: data.email || '',
    role: data.role || '',
    company_id: data.company_id || data.companyId || '',
    employee_id: data.employee_id || data.emp_id || data.id || '',
    name: data.name || data.employee_name || data.displayName || data.profile_name || '',
    next: data.next || '',
    next_url: data.next_url || '',
    token: data.token || '',
    source: data.source || 'gas_deep_link_auth',
    created_at: new Date().toISOString()
  }), ANG_AUTH_CODE_TTL_SECONDS);
  return code;
}

function buildAndroidAuthRedirectUrl_(authData) {
  var code = createDeepLinkAuthCode_(authData || {});
  var provider = encodeURIComponent((authData && authData.provider) || '');
  var state = encodeURIComponent((authData && authData.state) || '');
  return getAndroidDeepLinkUrl_() + '?code=' + encodeURIComponent(code) + '&provider=' + provider + '&state=' + state;
}

function verifyAuthToken(payload) {
  payload = normalizeDeepLinkPayload_(payload);
  var code = String(payload.code || '').trim();
  var token = String(payload.token || '').trim();
  if (!code && !token) return { ok:false, auth_passed:false, message:'缺少 code 或 token', source:'verifyAuthToken' };
  if (code) {
    var cache = CacheService.getScriptCache();
    var key = 'ANG_AUTH_CODE_' + code;
    var raw = cache.get(key);
    if (!raw) return { ok:false, auth_passed:false, message:'驗證代碼不存在、已過期或已使用', source:'verifyAuthToken' };
    cache.remove(key);
    var data = {};
    try { data = JSON.parse(raw); } catch (err) { data = {}; }
    data.ok = true;
    data.auth_passed = true;
    data.verified = true;
    data.source = 'verifyAuthToken';
    data.device_id = payload.device_id || '';
    data.company_id = data.company_id || payload.company_id || '';
    data.login_at = new Date().toISOString();
    return data;
  }
  if (token) return verifyLegacyAuthToken_(token, payload);
}

function verifyLegacyAuthToken_(token, payload) {
  return { ok:false, auth_passed:false, message:'目前尚未接 legacy token 驗證，請改用一次性 code', source:'verifyLegacyAuthToken', token_exists:!!token, company_id:payload && payload.company_id || '', device_id:payload && payload.device_id || '' };
}

function normalizeDeepLinkPayload_(payload) {
  if (!payload) return {};
  if (typeof payload === 'string') { try { return JSON.parse(payload); } catch (err) { return { token: payload }; } }
  return payload;
}

function routeDeepLinkAuthPost_(e) {
  var p = e && e.parameter ? e.parameter : {};
  var action = String(p.action || '').trim();
  if (action !== 'verifyAuthToken') return null;
  var payload = {};
  if (p.payload) { try { payload = JSON.parse(p.payload); } catch (err) { payload = {}; } } else { payload = p; }
  return jsonOutput_(verifyAuthToken(payload));
}

function jsonOutput_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj || {})).setMimeType(ContentService.MimeType.JSON);
}

function redirectToAndroidAppAfterAuth_(authData) {
  var url = buildAndroidAuthRedirectUrl_(authData || {});
  return HtmlService.createHtmlOutput('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ANG HR 驗證完成</title></head><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:24px;"><h2>ANG HR 驗證完成</h2><p>正在返回 ANG HR App...</p><p><a href="' + url + '">沒有自動返回時，請點這裡回到 App</a></p><script>location.href=' + JSON.stringify(url) + ';</script></body></html>');
}
