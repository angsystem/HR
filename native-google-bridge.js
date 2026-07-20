(function () {
  'use strict';

<<<<<<< HEAD
  var ANG_NATIVE_BRIDGE_VERSION = '2026-06-17-native-gas-auto-verify';
=======
  var ANG_NATIVE_BRIDGE_VERSION = '2026-06-18-task10-auth-admin-register';
  if (window.__ANG_NATIVE_BRIDGE_VERSION === ANG_NATIVE_BRIDGE_VERSION) return;
  window.__ANG_NATIVE_BRIDGE_VERSION = ANG_NATIVE_BRIDGE_VERSION;
>>>>>>> 963afab45774e7c1639b63cee23c8a0ac597dcac

  var DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbzNycUTGQG0gqgb8B6F7tndEhRXU7GAiKFFWZr0e8sDwL2kXU5tBGLlJR_iBdX7SCnH/exec';

  function log() {
    try {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[ANG Native Bridge]');
      console.log.apply(console, args);
    } catch (e) {}
  }

  function warn() {
    try {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[ANG Native Bridge]');
      console.warn.apply(console, args);
    } catch (e) {}
  }

<<<<<<< HEAD
  function error() {
    try {
      var args = Array.prototype.slice.call(arguments);
      args.unshift('[ANG Native Bridge]');
      console.error.apply(console, args);
    } catch (e) {}
  }

=======
>>>>>>> 963afab45774e7c1639b63cee23c8a0ac597dcac
  function safeJsonParse(value, fallback) {
    try {
      if (value === null || value === undefined || value === '') return fallback || {};
      if (typeof value === 'object') return value;
      return JSON.parse(String(value));
    } catch (e) {
      return fallback || {};
    }
  }

  function safeSetStorage(key, value) {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (e) {}
  }

  function safeGetStorage(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      if (v === null || v === undefined || v === '') return fallback || '';
      return v;
    } catch (e) {
      return fallback || '';
    }
  }

<<<<<<< HEAD
  function getGasUrl() {
    try {
=======
  function safeSessionSet(key, value) {
    try {
      sessionStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    } catch (e) {}
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function getGasUrl() {
    try {
      if (window.ANG_DATA_URLS && window.ANG_DATA_URLS.gasApiUrl) return String(window.ANG_DATA_URLS.gasApiUrl);
>>>>>>> 963afab45774e7c1639b63cee23c8a0ac597dcac
      if (window.ANG_CONFIG && window.ANG_CONFIG.gasApiUrl) return String(window.ANG_CONFIG.gasApiUrl);
      if (window.CONFIG && window.CONFIG.gasApiUrl) return String(window.CONFIG.gasApiUrl);
      if (window.APP_CONFIG && window.APP_CONFIG.gasApiUrl) return String(window.APP_CONFIG.gasApiUrl);
      if (window.GAS_API_URL) return String(window.GAS_API_URL);
    } catch (e) {}
    return DEFAULT_GAS_URL;
  }

  function getDeviceId() {
<<<<<<< HEAD
    var saved = safeGetStorage('ang_device_id', '');
    if (saved) return saved;

    var id = 'web_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
=======
    var saved = safeGetStorage('ang_hr_device_id', '') || safeGetStorage('ang_device_id', '') || safeGetStorage('device_id', '');
    if (saved) return saved;
    var id = 'DEV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 10).toUpperCase();
    safeSetStorage('ang_hr_device_id', id);
>>>>>>> 963afab45774e7c1639b63cee23c8a0ac597dcac
    safeSetStorage('ang_device_id', id);
    return id;
  }

  function utf8ToBase64(text) {
    text = String(text || '');
    try {
      if (window.TextEncoder) {
        var bytes = new TextEncoder().encode(text);
        var binary = '';
        for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      }
      return btoa(unescape(encodeURIComponent(text)));
    } catch (e) {
      return btoa(text);
    }
  }

<<<<<<< HEAD
=======
  window.encodeUtf8Base64Text = window.encodeUtf8Base64Text || utf8ToBase64;

>>>>>>> 963afab45774e7c1639b63cee23c8a0ac597dcac
  function decodeJwtPayload(token) {
    try {
      token = String(token || '');
      var parts = token.split('.');
      if (parts.length < 2) return {};
      var payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (payload.length % 4) payload += '=';
      var json = decodeURIComponent(Array.prototype.map.call(atob(payload), function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return safeJsonParse(json, {});
    } catch (e) {
      return {};
    }
  }

<<<<<<< HEAD
  function normalizeProvider(raw) {
    raw = raw || {};
    var p = String(raw.provider || raw.method || raw.auth_provider || '').toLowerCase();
    if (p) return p;

    if (raw.line_user_id || raw.line_sub) return 'line';
    if (raw.google_user_id || raw.google_sub || raw.credential || raw.id_token || raw.token) return 'google';

    return 'google';
  }

  function getToken(raw) {
    raw = raw || {};
    return String(
      raw.id_token ||
      raw.credential ||
      raw.loginToken ||
      raw.token ||
      raw.google_id_token ||
      raw.line_id_token ||
      ''
    ).trim();
=======
  function getToken(raw) {
    raw = raw || {};
    return String(raw.id_token || raw.credential || raw.loginToken || raw.token || raw.google_id_token || raw.line_id_token || '').trim();
  }

  function normalizeProvider(raw) {
    raw = raw || {};
    var p = String(raw.provider || raw.method || raw.auth_provider || raw.type || '').toLowerCase();
    if (p) return p;
    if (raw.line_user_id || raw.line_sub || raw.user_id) return 'line';
    if (raw.google_user_id || raw.google_sub || raw.credential || raw.id_token || raw.loginToken || raw.token) return 'google';
    return 'google';
>>>>>>> 963afab45774e7c1639b63cee23c8a0ac597dcac
  }

  function getPendingAuth() {
    return safeJsonParse(
<<<<<<< HEAD
      safeGetStorage('ang_pending_auth', '') ||
      safeGetStorage('pending_auth', '') ||
      safeGetStorage('entry_pending_auth', ''),
=======
      safeGetStorage('ang_pending_auth', '') || safeGetStorage('pending_auth', '') || safeGetStorage('entry_pending_auth', ''),
>>>>>>> 963afab45774e7c1639b63cee23c8a0ac597dcac
      {}
    );
  }

<<<<<<< HEAD
  function buildGasPayload(raw) {
    raw = raw || {};

    var pending = raw.pending_auth || getPendingAuth();
    var provider = normalizeProvider(raw);
    var token = getToken(raw);

    var jwt = raw.jwt_payload || decodeJwtPayload(token);

    var payload = {};
    Object.keys(raw).forEach(function (k) {
      if (k === 'gas_response') return;
      payload[k] = raw[k];
    });

    payload.provider = provider;
    payload.action = provider === 'line' ? 'verifyNativeLineIdToken' : 'verifyNativeGoogleIdToken';

    if (token) {
      payload.id_token = token;
      payload.credential = token;
      payload.token = token;
    }

    payload.email = raw.email || jwt.email || '';
    payload.profile_name = raw.profile_name || jwt.name || raw.name || '';
    payload.google_user_id = raw.google_user_id || raw.google_sub || (provider === 'google' ? jwt.sub || '' : '');
    payload.line_user_id = raw.line_user_id || raw.line_sub || (provider === 'line' ? jwt.sub || '' : '');

    payload.flow = raw.flow || pending.flow || 'company_signup';
    payload.plan = raw.plan || pending.plan || '';
    payload.statusId = raw.statusId || pending.statusId || '';
    payload.company_id = raw.company_id || pending.company_id || pending.company || '';
    payload.device_id = raw.device_id || getDeviceId();
    payload.source = 'frontend_native_google_bridge';
    payload.bridge_version = ANG_NATIVE_BRIDGE_VERSION;

    return payload;
  }

  function normalizeAuthFromGas(raw) {
    raw = raw || {};

    var gas = raw.gas_response || raw.auth || raw.data || raw;

    if (gas && gas.gas_response) gas = gas.gas_response;

    var auth = {};
    Object.keys(gas || {}).forEach(function (k) {
      auth[k] = gas[k];
    });

    auth.ok = auth.ok === true || auth.success === true || auth.status === 'verified' || auth.status === 'success';
    auth.auth_passed = auth.auth_passed === true || auth.verified === true || auth.status === 'verified' || auth.ok === true;

    auth.provider = auth.provider || raw.provider || '';
    auth.email = auth.email || raw.email || '';
    auth.profile_name = auth.profile_name || auth.name || raw.profile_name || raw.name || '';
    auth.name = auth.name || auth.profile_name || '';
    auth.company_id = auth.company_id || auth.company || '';
    auth.employee_id = auth.employee_id || auth.emp_id || auth.id || '';
    auth.role = auth.role || '';

    return auth;
  }

  function saveAuthState(auth, raw) {
    auth = auth || {};
    raw = raw || {};

    safeSetStorage('ang_last_gas_response', raw);
    safeSetStorage('ang_last_auth_raw', raw);

    if (auth.auth_passed !== true) {
      safeSetStorage('ang_auth_failed', auth);
      return false;
    }

    safeSetStorage('ang_auth_state', auth);
    safeSetStorage('isLoggedIn', 'true');

    if (auth.provider) safeSetStorage('ang_auth_provider', auth.provider);
    if (auth.email) safeSetStorage('loginEmail', auth.email);
    if (auth.company_id) safeSetStorage('ang_company_id', auth.company_id);
    if (auth.role) safeSetStorage('ang_role', auth.role);

    if (auth.employee_id) {
      safeSetStorage('emp_logged_in', String(auth.employee_id).toUpperCase());
      safeSetStorage('loginId', String(auth.employee_id).toUpperCase());
    }

    if (auth.name || auth.profile_name) {
      safeSetStorage('emp_name', auth.name || auth.profile_name);
    }

    return true;
  }

  function dispatchAuthEvent(name, detail) {
    try {
      window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
    } catch (e) {}
  }

  function receiveGasResult(result) {
    result = result || {};

    safeSetStorage('ang_last_native_gas_result', result);

    var auth = normalizeAuthFromGas(result);
    var saved = saveAuthState(auth, result);

    window.__ANG_LAST_GAS_RESPONSE = result;
    window.__ANG_AUTH_STATE = auth;

    if (saved) {
      dispatchAuthEvent('ANG_HR_AUTH_PASSED', auth);
      log('GAS 驗證成功', auth);
    } else {
      dispatchAuthEvent('ANG_HR_AUTH_FAILED', auth);
      warn('GAS 驗證未通過', auth);
    }

    return auth;
  }

  function verifyByAndroidNative(payload) {
    payload = payload || {};

    var text = JSON.stringify(payload);
    var b64 = utf8ToBase64(text);

    if (window.ANGHRApp && typeof window.ANGHRApp.verifyNativeAuthWithGas === 'function') {
      window.ANGHRApp.verifyNativeAuthWithGas(b64);
      return true;
    }

    if (window.AndroidBridge && typeof window.AndroidBridge.verifyNativeAuthWithGas === 'function') {
      window.AndroidBridge.verifyNativeAuthWithGas(b64);
      return true;
=======
  function resolveStatusId(raw) {
    raw = raw || {};
    var pending = raw.pending_auth || getPendingAuth() || {};
    if (raw.statusId) return raw.statusId;
    if (pending.statusId) return pending.statusId;
    if (pending.flow === 'admin_login') return 'adminLoginStatus';
    if (pending.plan) return String(pending.plan).toLowerCase() + 'PlanStatus';
    if (raw.flow === 'admin_login') return 'adminLoginStatus';
    if (raw.plan) return String(raw.plan).toLowerCase() + 'PlanStatus';
    return 'adminLoginStatus';
  }

  function setStatusSafe(statusId, type, message) {
    try {
      if (typeof window.setStatus === 'function') {
        window.setStatus(statusId, type, message);
        return;
      }
      var box = document.getElementById(statusId);
      if (!box) return;
      box.className = 'status show ' + (type || 'info');
      box.innerText = message || '';
    } catch (e) {}
  }

  function closeDebugPanel() {
    try {
      var panel = document.getElementById('nativeDebugPanel');
      if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    } catch (e) {}
  }

  function normalizeNativeInput(raw) {
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch (e) {
        raw = { id_token: raw, credential: raw, token: raw, provider: 'google' };
      }
    }
    raw = raw || {};
    var token = getToken(raw);
    var jwt = raw.jwt_payload || decodeJwtPayload(token);
    var provider = normalizeProvider(raw);
    var normalized = {};
    Object.keys(raw).forEach(function (key) { normalized[key] = raw[key]; });
    normalized.ok = raw.ok !== false;
    normalized.provider = provider;
    if (token) {
      normalized.id_token = token;
      normalized.credential = token;
      normalized.loginToken = token;
      normalized.token = token;
    }
    normalized.email = raw.email || jwt.email || '';
    normalized.profile_name = raw.profile_name || raw.displayName || raw.name || jwt.name || '';
    normalized.name = normalized.profile_name;
    normalized.google_user_id = raw.google_user_id || raw.google_sub || (provider === 'google' ? jwt.sub || '' : '');
    normalized.line_user_id = raw.line_user_id || raw.user_id || raw.line_sub || (provider === 'line' ? jwt.sub || '' : '');
    normalized.jwt_payload = jwt || {};
    return normalized;
  }

  function buildGasPayload(raw) {
    raw = normalizeNativeInput(raw || {});
    var pending = raw.pending_auth || getPendingAuth() || {};
    var provider = normalizeProvider(raw);
    var token = getToken(raw);
    var jwt = raw.jwt_payload || decodeJwtPayload(token);
    var payload = {};
    Object.keys(raw).forEach(function (k) {
      if (k === 'gas_response' || k === 'gasResponse') return;
      payload[k] = raw[k];
    });
    payload.provider = provider;
    payload.action = provider === 'line' ? 'verifyNativeLineIdToken' : 'verifyNativeGoogleIdToken';
    if (token) {
      payload.id_token = token;
      payload.credential = token;
      payload.loginToken = token;
      payload.token = token;
    }
    payload.email = raw.email || jwt.email || '';
    payload.profile_name = raw.profile_name || jwt.name || raw.name || '';
    payload.google_user_id = raw.google_user_id || raw.google_sub || (provider === 'google' ? jwt.sub || '' : '');
    payload.line_user_id = raw.line_user_id || raw.line_sub || raw.user_id || (provider === 'line' ? jwt.sub || '' : '');
    payload.flow = raw.flow || pending.flow || 'company_signup';
    payload.plan = raw.plan || pending.plan || '';
    payload.statusId = raw.statusId || pending.statusId || resolveStatusId(raw);
    payload.company_id = raw.company_id || pending.company_id || pending.company || '';
    payload.company = payload.company_id;
    payload.device_id = raw.device_id || getDeviceId();
    payload.user_agent = navigator.userAgent || '';
    payload.source = 'frontend_native_bridge_register_flow';
    payload.bridge_version = ANG_NATIVE_BRIDGE_VERSION;
    return payload;
  }

  function callGasApi(action, payload, timeoutMs) {
    var gasUrl = getGasUrl();
    if (!gasUrl) return Promise.reject(new Error('尚未設定 GAS API URL'));
    return new Promise(function (resolve, reject) {
      var callbackName = 'angGasJsonp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      var script = document.createElement('script');
      var done = false;
      function cleanup() {
        try { delete window[callbackName]; } catch (err) { window[callbackName] = undefined; }
        try { if (script && script.parentNode) script.parentNode.removeChild(script); } catch (e) {}
      }
      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        cleanup();
        reject(new Error('GAS 連線逾時'));
      }, timeoutMs || 25000);
      window[callbackName] = function (res) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        cleanup();
        resolve(res || {});
      };
      script.onerror = function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        cleanup();
        reject(new Error('無法連線 GAS API'));
      };
      var url = new URL(gasUrl, window.location.href);
      var body = Object.assign({}, payload || {}, { action: action });
      url.searchParams.set('action', action);
      url.searchParams.set('callback', callbackName);
      url.searchParams.set('payload', JSON.stringify(body));
      script.src = url.toString();
      document.head.appendChild(script);
    });
  }

  function verifyByAndroidNative(payload) {
    payload = payload || {};
    var b64 = utf8ToBase64(JSON.stringify(payload));
    var bridges = [window.ANGHRApp, window.AndroidBridge, window.AndroidNative, window.WebAppInterface];
    for (var i = 0; i < bridges.length; i++) {
      var bridge = bridges[i];
      if (bridge && typeof bridge.verifyNativeAuthWithGas === 'function') {
        bridge.verifyNativeAuthWithGas(b64);
        return true;
      }
>>>>>>> 963afab45774e7c1639b63cee23c8a0ac597dcac
    }

    return false;
  }

<<<<<<< HEAD
  function verifyByJsonp(payload) {
    return new Promise(function (resolve) {
      var callbackName = 'ANG_JSONP_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      var script = document.createElement('script');

      var gasUrl = getGasUrl();
      var params = [
        'action=' + encodeURIComponent(payload.action || 'verifyNativeGoogleIdToken'),
        'payload=' + encodeURIComponent(JSON.stringify(payload)),
        'callback=' + encodeURIComponent(callbackName)
      ];

      window[callbackName] = function (res) {
        try {
          delete window[callbackName];
        } catch (e) {
          window[callbackName] = undefined;
        }

        try {
          if (script && script.parentNode) script.parentNode.removeChild(script);
        } catch (e2) {}

        resolve(res || {});
      };

      script.onerror = function () {
        try {
          delete window[callbackName];
        } catch (e) {
          window[callbackName] = undefined;
        }

        resolve({
          ok: false,
          message: 'JSONP 呼叫 GAS 失敗',
          source: 'native-google-bridge'
        });
      };

      script.src = gasUrl + (gasUrl.indexOf('?') >= 0 ? '&' : '?') + params.join('&');
      document.head.appendChild(script);
    });
  }

  function verifyNativeAuthWithGas(raw) {
    raw = raw || {};

    safeSetStorage('ang_last_native_auth_result', raw);
    window.__ANG_LAST_NATIVE_AUTH_RESULT = raw;

    if (raw.gas_response) {
      return receiveGasResult(raw);
    }

    var payload = buildGasPayload(raw);

    safeSetStorage('ang_last_gas_payload', payload);
    window.__ANG_LAST_GAS_PAYLOAD = payload;

    log('準備送 GAS 驗證', {
      provider: payload.provider,
      action: payload.action,
      email: payload.email,
      flow: payload.flow,
      plan: payload.plan,
      token_exists: !!getToken(payload)
    });

    var calledNative = verifyByAndroidNative(payload);

    if (calledNative) {
      safeSetStorage('ang_gas_verify_status', {
        ok: true,
        mode: 'android_native_http',
        message: '已交給 Android 原生 HTTP 呼叫 GAS',
        savedAt: Date.now()
      });
      return null;
    }

    verifyByJsonp(payload).then(function (res) {
      receiveGasResult({
        ok: true,
        provider: payload.provider,
        action: payload.action,
        gas_response: res,
        source: 'frontend_jsonp_gas'
      });
=======
  function saveVerifyAuth(gas) {
    gas = gas || {};
    safeSetStorage('ang_last_gas_response', gas);
    safeSetStorage('ang_verify_token', gas.verify_token || '');
    safeSetStorage('ang_last_verify_token', gas.verify_token || '');
    safeSetStorage('ang_verified_email', gas.email || '');
    safeSetStorage('ang_verified_name', gas.profile_name || gas.name || '');
    safeSetStorage('ang_verified_plan', gas.plan || '');
    safeSetStorage('ang_verified_provider', gas.provider || gas.method || '');
    safeSessionSet('ang_verify_token', gas.verify_token || '');
    safeSessionSet('ang_verified_email', gas.email || '');
  }

  function getVerifiedDataFromGasResult(result) {
    result = result || {};
    var gas = result.gas_response || result.gasResponse || result;
    if (gas && gas.gas_response) gas = gas.gas_response;
    if (gas && gas.gasResponse) gas = gas.gasResponse;
    return gas || {};
  }

  function isCompanySignupGas(gas) {
    gas = gas || {};
    var flow = String(gas.flow || '').toLowerCase();
    return !!gas.verify_token && (flow === 'company_signup' || !!gas.plan || !flow);
  }

  function injectRegisterStyle() {
    if (document.getElementById('angRegisterOverlayStyle')) return;
    var style = document.createElement('style');
    style.id = 'angRegisterOverlayStyle';
    style.textContent = [
      '.ang-register-overlay{position:fixed;inset:0;z-index:999999;background:rgba(2,6,23,.76);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);display:flex;align-items:flex-end;justify-content:center;padding:16px;box-sizing:border-box;color:#fff;font-family:"PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif;}',
      '.ang-register-card{width:min(100%,430px);max-height:92vh;overflow:auto;border-radius:28px;background:linear-gradient(180deg,rgba(15,23,42,.98),rgba(15,23,42,.94));border:1px solid rgba(255,255,255,.14);box-shadow:0 24px 70px rgba(0,0,0,.48);padding:20px;box-sizing:border-box;}',
      '.ang-register-title{font-size:24px;line-height:1.2;font-weight:1000;margin:0 0 8px;letter-spacing:.02em;}',
      '.ang-register-sub{font-size:13px;line-height:1.55;color:#cbd5e1;font-weight:800;margin:0 0 14px;}',
      '.ang-register-badge-row{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px;}',
      '.ang-register-badge{border-radius:999px;padding:7px 10px;background:rgba(89,221,255,.13);border:1px solid rgba(89,221,255,.22);font-size:12px;font-weight:1000;color:#e0f2fe;}',
      '.ang-register-authbox{margin:0 0 14px;padding:12px;border-radius:18px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);display:grid;gap:6px;font-size:13px;line-height:1.45;font-weight:900;color:#e5e7eb;}',
      '.ang-register-authbox b{color:#fff;}',
      '.ang-register-field{margin:12px 0;}',
      '.ang-register-label{font-size:13px;font-weight:1000;color:#e5e7eb;margin-bottom:7px;}',
      '.ang-register-input{width:100%;min-height:50px;border-radius:16px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.08);color:#fff;padding:12px 14px;box-sizing:border-box;font-size:16px;font-weight:900;outline:none;}',
      '.ang-register-input::placeholder{color:rgba(226,232,240,.55);font-weight:800;}',
      '.ang-register-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}',
      '.ang-register-actions{display:grid;gap:10px;margin-top:16px;}',
      '.ang-register-btn{min-height:54px;border:0;border-radius:18px;padding:13px 16px;font-size:16px;font-weight:1000;cursor:pointer;letter-spacing:.03em;}',
      '.ang-register-btn.primary{background:linear-gradient(90deg,#00d9ff 0%,#7c3cff 58%,#b000ff 100%);color:#fff;box-shadow:0 10px 28px rgba(124,60,255,.28);}',
      '.ang-register-btn.secondary{background:rgba(255,255,255,.08);color:#fff;border:1px solid rgba(255,255,255,.16);}',
      '.ang-register-status{display:none;margin-top:12px;border-radius:16px;padding:11px 12px;font-size:13px;line-height:1.45;font-weight:900;}',
      '.ang-register-status.show{display:block;}',
      '.ang-register-status.info{background:rgba(59,130,246,.18);color:#bfdbfe;border:1px solid rgba(59,130,246,.25);}',
      '.ang-register-status.success{background:rgba(16,185,129,.18);color:#a7f3d0;border:1px solid rgba(16,185,129,.25);}',
      '.ang-register-status.error{background:rgba(239,68,68,.18);color:#fecaca;border:1px solid rgba(239,68,68,.25);}',
      '.ang-register-result{margin-top:14px;padding:14px;border-radius:18px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);font-size:14px;line-height:1.65;font-weight:900;color:#e5e7eb;}',
      '@media (max-width:430px){.ang-register-overlay{padding:10px;align-items:flex-end}.ang-register-card{border-radius:26px 26px 0 0;padding:18px}.ang-register-grid{grid-template-columns:1fr}.ang-register-title{font-size:22px}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function setRegisterStatus(type, message) {
    var box = document.getElementById('angRegisterStatus');
    if (!box) return;
    box.className = 'ang-register-status show ' + (type || 'info');
    box.textContent = message || '';
  }

  function setRegisterResult(html) {
    var box = document.getElementById('angRegisterResult');
    if (!box) return;
    box.innerHTML = html || '';
    box.style.display = html ? 'block' : 'none';
  }

  function normalizePlan(plan) {
    plan = String(plan || '').toLowerCase().trim();
    if (plan === 'plus' || plan === 'premium' || plan === 'basic') return plan;
    return 'basic';
  }

  function planLabel(plan) {
    plan = normalizePlan(plan);
    if (plan === 'premium') return 'Premium 完整方案';
    if (plan === 'plus') return 'Plus 推薦方案';
    return 'Basic 實施方案';
  }

  function adminUrl(companyId, employeeId, sessionToken) {
    var base = new URL('admin.html', window.location.href);
    if (companyId) base.searchParams.set('company_id', companyId);
    if (employeeId) base.searchParams.set('id', employeeId);
    if (sessionToken) base.searchParams.set('session_token', sessionToken);
    base.searchParams.set('source', 'verified_admin_login');
    return base.toString();
  }

  function adminLoginByVerifiedAuth(gas, companyId) {
    gas = gas || safeJsonParse(safeGetStorage('ang_last_gas_response', ''), {});
    var token = gas.verify_token || safeGetStorage('ang_verify_token', '') || safeGetStorage('ang_last_verify_token', '');
    var cid = String(companyId || gas.company_id || gas.company || '').trim().toUpperCase();
    if (!token) { setStatusSafe('adminLoginStatus','error','缺少驗證 token，請重新驗證。'); return; }
    if (!cid) { setStatusSafe('adminLoginStatus','error','請先輸入公司代碼。'); return; }
    setStatusSafe('adminLoginStatus','info','驗證成功，正在檢查後台管理員資料...');
    callGasApi('adminLoginByVerifiedAuth',{
      verify_token: token,
      company_id: cid,
      company: cid,
      provider: gas.provider || gas.method || '',
      email: gas.email || safeGetStorage('ang_verified_email',''),
      device_id: getDeviceId(),
      source: 'entry_admin_verified_auth'
    },30000).then(function(res){
      if (!res || !res.ok) {
        setStatusSafe('adminLoginStatus','error',(res && (res.message || res.msg)) || '登入失敗：此驗證身分沒有後台資料。');
        return;
      }
      safeSetStorage('ang_company_id',res.company_id || cid);
      safeSetStorage('ang_company_name',res.company_name || '');
      safeSetStorage('ang_role',res.role || '');
      safeSetStorage('loginId',res.employee_id || '');
      safeSetStorage('emp_logged_in',res.employee_id || '');
      safeSetStorage('emp_name',res.name || '');
      safeSetStorage('ang_admin_session_token',res.session_token || '');
      safeSetStorage('isLoggedIn','true');
      setStatusSafe('adminLoginStatus','success','後台登入成功，正在進入企業管理。');
      setTimeout(function(){ window.location.href = res.next_url || adminUrl(res.company_id || cid,res.employee_id || '',res.session_token || ''); },450);
    }).catch(function(err){
      setStatusSafe('adminLoginStatus','error',err && err.message ? err.message : '後台登入連線失敗');
    });
  }

  function methodLabel(provider) {
    provider = String(provider || '').toLowerCase();
    if (provider === 'line') return 'LINE 驗證';
    if (provider === 'email') return 'Email 驗證';
    return 'Google 驗證';
  }

  function showCompanyRegisterForm(gas) {
    gas = gas || {};
    closeDebugPanel();
    injectRegisterStyle();
    saveVerifyAuth(gas);

    var existing = document.getElementById('angRegisterOverlay');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    var plan = normalizePlan(gas.plan || safeGetStorage('ang_verified_plan', 'premium'));
    var email = gas.email || safeGetStorage('ang_verified_email', '');
    var name = gas.profile_name || gas.name || safeGetStorage('ang_verified_name', '');
    var provider = gas.provider || gas.method || safeGetStorage('ang_verified_provider', 'google');

    var overlay = document.createElement('div');
    overlay.id = 'angRegisterOverlay';
    overlay.className = 'ang-register-overlay';
    overlay.innerHTML =
      '<div class="ang-register-card">' +
        '<h2 class="ang-register-title">建立公司資料</h2>' +
        '<p class="ang-register-sub">驗證已完成，請補齊公司與負責人資料。送出後會建立公司帳號與 Creator 管理者。</p>' +
        '<div class="ang-register-badge-row">' +
          '<span class="ang-register-badge">' + escapeHtml(planLabel(plan)) + '</span>' +
          '<span class="ang-register-badge">' + escapeHtml(methodLabel(provider)) + '</span>' +
          '<span class="ang-register-badge">' + escapeHtml(email || '已取得驗證身分') + '</span>' +
        '</div>' +
        '<div class="ang-register-authbox">' +
          '<div>註冊方式：<b>' + escapeHtml(methodLabel(provider)) + '</b></div>' +
          '<div>帳號名稱：<b>' + escapeHtml(name || '-') + '</b></div>' +
          '<div>帳號（Email）：<b>' + escapeHtml(email || '未提供') + '</b></div>' +
        '</div>' +
        '<div class="ang-register-field"><div class="ang-register-label">公司名稱 *</div><input id="angRegCompanyName" class="ang-register-input" type="text" autocomplete="organization" placeholder="例如：矽品精密" /></div>' +
        '<div class="ang-register-field"><div class="ang-register-label">負責人 / 申請人姓名 *</div><input id="angRegAdminName" class="ang-register-input" type="text" autocomplete="name" placeholder="姓名" value="' + escapeHtml(name) + '" /></div>' +
        '<div class="ang-register-grid">' +
          '<div class="ang-register-field"><div class="ang-register-label">電話 *</div><input id="angRegPhone" class="ang-register-input" type="tel" inputmode="tel" autocomplete="tel" placeholder="09xxxxxxxx" /></div>' +
          '<div class="ang-register-field"><div class="ang-register-label">出生年月日 *</div><input id="angRegBirthDate" class="ang-register-input" type="date" /></div>' +
        '</div>' +
        '<div class="ang-register-grid">' +
          '<div class="ang-register-field"><div class="ang-register-label">統一編號</div><input id="angRegTaxId" class="ang-register-input" type="text" inputmode="numeric" placeholder="可空白" /></div>' +
          '<div class="ang-register-field"><div class="ang-register-label">免付費特權碼</div><input id="angRegPrivilegeId" class="ang-register-input" type="text" placeholder="ANG8963-A，可空白" /></div>' +
        '</div>' +
        '<div class="ang-register-field"><div class="ang-register-label">公司地址</div><input id="angRegAddress" class="ang-register-input" type="text" autocomplete="street-address" placeholder="可空白" /></div>' +
        '<div class="ang-register-grid">' +
          '<div class="ang-register-field"><div class="ang-register-label">付款 / 授權方式</div><select id="angRegPaymentMethod" class="ang-register-input"><option value="trial_later">試用期後再設定</option><option value="google_play">Google Play / 信用卡付款</option><option value="credit_card">信用卡付款</option><option value="auth_code">我有 ANG 授權碼</option><option value="free_privilege">我有免付費特權碼</option><option value="test_authorization">測試授權（不扣款）</option></select></div>' +
          '<div class="ang-register-field"><div class="ang-register-label">ANG 授權碼</div><input id="angRegAuthorizationCode" class="ang-register-input" type="text" placeholder="可空白" /></div>' +
        '</div>' +
        '<p class="ang-register-sub">建立成功後會顯示試用期間、預計收費日與試用後預估月費。加購包會併入每月月租；取消或降級時，啟用中員工數必須小於或等於調整後名額。</p>' +
        '<div class="ang-register-actions">' +
          '<button id="angRegSubmitBtn" type="button" class="ang-register-btn primary">建立公司並進入後台</button>' +
          '<button id="angRegCloseBtn" type="button" class="ang-register-btn secondary">先不要送出</button>' +
        '</div>' +
        '<div id="angRegisterStatus" class="ang-register-status"></div>' +
        '<div id="angRegisterResult" class="ang-register-result" style="display:none;"></div>' +
      '</div>';

    document.body.appendChild(overlay);

    var submitBtn = document.getElementById('angRegSubmitBtn');
    var closeBtn = document.getElementById('angRegCloseBtn');
    if (submitBtn) submitBtn.addEventListener('click', function () { submitCompanyRegister(gas); });
    if (closeBtn) closeBtn.addEventListener('click', function () {
      try { localStorage.removeItem('ang_pending_auth'); localStorage.removeItem('ang_last_native_auth_result'); localStorage.removeItem('ang_last_native_gas_result'); localStorage.removeItem('ang_last_gas_response'); localStorage.removeItem('ang_verify_token'); localStorage.removeItem('ang_last_verify_token'); sessionStorage.removeItem('ang_verify_token'); } catch(_e) {}
      var statusId = resolveStatusId(gas);
      setStatusSafe(statusId, 'info', '已取消填寫，正在回入口讓你重選驗證方式。');
      setTimeout(function(){ window.location.reload(); },350);
    });

    setRegisterStatus('success', '驗證成功，請填寫資料建立公司。');
    setTimeout(function () {
      var input = document.getElementById('angRegCompanyName');
      if (input) input.focus();
    }, 150);
  }

  function fieldValue(id) {
    var el = document.getElementById(id);
    return String(el ? el.value || '' : '').trim();
  }

  function submitCompanyRegister(gas) {
    gas = gas || safeJsonParse(safeGetStorage('ang_last_gas_response', ''), {});
    var verifyToken = gas.verify_token || safeGetStorage('ang_verify_token', '') || safeGetStorage('ang_last_verify_token', '');
    var plan = normalizePlan(gas.plan || safeGetStorage('ang_verified_plan', 'premium'));
    var companyName = fieldValue('angRegCompanyName');
    var adminName = fieldValue('angRegAdminName');
    var phone = fieldValue('angRegPhone');
    var birthDate = fieldValue('angRegBirthDate');
    var taxId = fieldValue('angRegTaxId');
    var address = fieldValue('angRegAddress');
    var privilegeId = fieldValue('angRegPrivilegeId').toUpperCase().replace(/\s+/g, '');
    var paymentMethod = fieldValue('angRegPaymentMethod') || 'trial_later';
    var authorizationCode = fieldValue('angRegAuthorizationCode').toUpperCase().replace(/\s+/g, '');

    if (!verifyToken) { setRegisterStatus('error', '缺少 verify_token，請重新 Google 驗證。'); return; }
    if (!companyName) { setRegisterStatus('error', '請輸入公司名稱。'); return; }
    if (!adminName) { setRegisterStatus('error', '請輸入負責人 / 申請人姓名。'); return; }
    if (!phone) { setRegisterStatus('error', '請輸入電話。'); return; }
    if (!birthDate) { setRegisterStatus('error', '請輸入出生年月日。'); return; }

    var submitBtn = document.getElementById('angRegSubmitBtn');
    if (submitBtn) submitBtn.disabled = true;
    setRegisterResult('');
    setRegisterStatus('info', '正在建立公司資料，請稍候...');

    var payload = {
      action: 'registerCompany',
      verify_token: verifyToken,
      verify_method: gas.provider || gas.method || 'google',
      plan: plan,
      company_name: companyName,
      admin_name: adminName,
      phone: phone,
      birth_date: birthDate,
      tax_id: taxId,
      address: address,
      privilege_id: privilegeId,
      payment_method: paymentMethod,
      authorization_code: authorizationCode,
      email: gas.email || safeGetStorage('ang_verified_email', ''),
      device_id: getDeviceId(),
      source: 'frontend_register_overlay'
    };

    callGasApi('registerCompany', payload, 30000).then(function (res) {
      if (!res || !res.ok) {
        if (submitBtn) submitBtn.disabled = false;
        setRegisterStatus('error', (res && (res.message || res.msg)) || '建立公司失敗');
        return;
      }
      handleCompanyRegisterSuccess(res);
    }).catch(function (err) {
      if (submitBtn) submitBtn.disabled = false;
      setRegisterStatus('error', err && err.message ? err.message : '建立公司連線失敗');
    });
  }

  function buildAdminUrl(companyId, employeeId) {
    var base = new URL('admin.html', window.location.href);
    if (companyId) base.searchParams.set('company_id', companyId);
    if (employeeId) base.searchParams.set('id', employeeId);
    base.searchParams.set('source', 'company_register_success');
    return base.toString();
  }

  function handleCompanyRegisterSuccess(res) {
    var companyId = String(res.company_id || '').trim().toUpperCase();
    var employeeId = String(res.employee_id || '').trim().toUpperCase();
    var password = String(res.password || '').trim();
    var companyName = String(res.company_name || '').trim();
    var plan = normalizePlan(res.plan || '');
    var adminUrl = buildAdminUrl(companyId, employeeId);

    safeSetStorage('ang_company_id', companyId);
    safeSetStorage('ang_company_name', companyName);
    safeSetStorage('ang_plan', plan);
    safeSetStorage('ang_role', res.role || 'Creator');
    safeSetStorage('loginId', employeeId);
    safeSetStorage('emp_logged_in', employeeId);
    safeSetStorage('creator_password', password);
    safeSetStorage('isLoggedIn', 'true');

    setRegisterStatus('success', '公司建立完成。');
    setRegisterResult(
      '<div><strong>公司代碼：</strong>' + escapeHtml(companyId || '-') + '</div>' +
      '<div><strong>公司名稱：</strong>' + escapeHtml(companyName || '-') + '</div>' +
      '<div><strong>方案：</strong>' + escapeHtml(planLabel(plan)) + '</div>' +
      '<div><strong>試用開始：</strong>' + escapeHtml(res.trial_started_at || res.created_at || '-') + '</div>' +
      '<div><strong>試用結束：</strong>' + escapeHtml(res.trial_ends_at || res.first_month_ends_at || '-') + '</div>' +
      '<div><strong>預計開始收費日：</strong>' + escapeHtml(res.next_charge_at || '-') + '</div>' +
      '<div><strong>試用後預估月費：</strong>' + escapeHtml(String(res.monthly_total || '-')) + '</div>' +
      '<div><strong>管理者帳號：</strong>' + escapeHtml(employeeId || '-') + '</div>' +
      '<div><strong>初始密碼：</strong>' + escapeHtml(password || '-') + '</div>' +
      '<div style="margin-top:10px;color:#bfdbfe;">請先截圖或複製帳號密碼，再進入企業管理後台。</div>' +
      '<div style="display:grid;gap:10px;margin-top:12px;">' +
        '<button type="button" id="angCopyCompanyResultBtn" class="ang-register-btn secondary">複製公司登入資料</button>' +
        '<button type="button" id="angOpenAdminBtn" class="ang-register-btn primary">進入企業管理後台</button>' +
      '</div>'
    );

    var copyBtn = document.getElementById('angCopyCompanyResultBtn');
    var openBtn = document.getElementById('angOpenAdminBtn');
    var copyText = [
      'ANG HR 公司建立完成',
      '公司代碼：' + (companyId || '-'),
      '公司名稱：' + (companyName || '-'),
      '方案：' + planLabel(plan),
      '管理者帳號：' + (employeeId || '-'),
      '初始密碼：' + (password || '-'),
      '試用開始：' + (res.trial_started_at || res.created_at || '-'),
      '試用結束：' + (res.trial_ends_at || res.first_month_ends_at || '-'),
      '預計開始收費日：' + (res.next_charge_at || '-'),
      '試用後預估月費：' + (res.monthly_total || '-')
    ].join('\n');
    if (copyBtn) copyBtn.onclick = function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(copyText).then(function () { setRegisterStatus('success', '已複製公司登入資料。'); });
      } else {
        window.prompt('複製以下內容', copyText);
      }
    };
    if (openBtn) openBtn.onclick = function () { window.location.href = adminUrl; };

    try { localStorage.removeItem('ang_pending_auth'); } catch (e) {}
  }

  function receiveGasResult(result) {
    result = result || {};
    safeSetStorage('ang_last_native_gas_result', result);
    window.__ANG_LAST_GAS_RESPONSE = result;
    closeDebugPanel();

    var gas = getVerifiedDataFromGasResult(result);
    if (gas && (gas.ok === true || gas.verify_token)) {
      saveVerifyAuth(gas);
      var statusId = resolveStatusId(gas);
      setStatusSafe(statusId, 'success', (gas.provider === 'line' ? 'LINE' : 'Google') + ' 驗證成功。');
      if (String(gas.flow || '').toLowerCase() === 'admin_login') {
        adminLoginByVerifiedAuth(gas,gas.company_id || gas.company || '');
        log('GAS 驗證成功，進入管理員登入', gas);
        return gas;
      }
      if (isCompanySignupGas(gas)) {
        showCompanyRegisterForm(gas);
      }
      log('GAS 驗證成功', gas);
      return gas;
    }

    var errMsg = (gas && (gas.message || gas.msg)) || 'GAS 驗證失敗';
    setStatusSafe(resolveStatusId(gas), 'error', errMsg);
    warn('GAS 驗證失敗', gas);
    return gas;
  }

  function verifyNativeAuthWithGas(raw) {
    raw = normalizeNativeInput(raw || {});
    safeSetStorage('ang_last_native_auth_result', raw);
    window.__ANG_LAST_NATIVE_AUTH_RESULT = raw;
    closeDebugPanel();

    var statusId = resolveStatusId(raw);
    if (!raw.ok) {
      setStatusSafe(statusId, 'error', raw.message || 'App 原生驗證失敗');
      return null;
    }

    if (raw.gas_response || raw.gasResponse) return receiveGasResult(raw);

    var token = getToken(raw);
    if (!token) {
      setStatusSafe(statusId, 'error', 'App 有回傳，但 token 是空的');
      return null;
    }

    var payload = buildGasPayload(raw);
    safeSetStorage('ang_last_gas_payload', payload);
    window.__ANG_LAST_GAS_PAYLOAD = payload;
    setStatusSafe(statusId, 'info', '已收到 App 原生 ' + (payload.provider === 'line' ? 'LINE' : 'Google') + ' 回傳，正在送 GAS 驗證...');
    log('準備 GAS 驗證', { provider: payload.provider, action: payload.action, email: payload.email, flow: payload.flow, plan: payload.plan });

    if (verifyByAndroidNative(payload)) {
      setTimeout(function () {
        var latest = safeJsonParse(safeGetStorage('ang_last_native_gas_result', ''), {});
        if (!latest || (!latest.gas_response && !latest.gasResponse && latest.ok !== true && !latest.verify_token)) {
          setStatusSafe(statusId, 'info', '仍在等待 GAS 回傳...');
        }
      }, 12000);
      return null;
    }

    callGasApi(payload.action, payload, 25000).then(function (res) {
      receiveGasResult({ ok: true, provider: payload.provider, action: payload.action, gas_response: res, source: 'frontend_jsonp_gas' });
    }).catch(function (err) {
      setStatusSafe(statusId, 'error', err && err.message ? err.message : 'GAS 驗證通訊失敗');
>>>>>>> 963afab45774e7c1639b63cee23c8a0ac597dcac
    });

    return null;
  }

<<<<<<< HEAD
  window.ANG_NATIVE_GAS_RESULT_RECEIVER = function (res) {
    return receiveGasResult(res || {});
  };

  window.ANG_DEEP_LINK_AUTH_RECEIVER = function (auth, raw) {
    return receiveGasResult(raw || auth || {});
  };

  window.handleNativeAuthResult = function (res) {
    return verifyNativeAuthWithGas(res || {});
  };

  window.ANG_NATIVE_LOGIN_RECEIVER = function (res) {
    return verifyNativeAuthWithGas(res || {});
  };

  window.handleAppNativeLogin = function (idToken) {
    return verifyNativeAuthWithGas({
      provider: 'google',
      id_token: idToken,
      credential: idToken,
      token: idToken,
      source: 'handleAppNativeLogin'
    });
  };

  window.ANG_VERIFY_NATIVE_AUTH_WITH_GAS = verifyNativeAuthWithGas;

  window.addEventListener('ANG_HR_NATIVE_AUTH', function (event) {
    verifyNativeAuthWithGas((event && event.detail) || {});
  });

=======
  window.ANG_NATIVE_GAS_RESULT_RECEIVER = function (res) { return receiveGasResult(res || {}); };
  window.ANG_DEEP_LINK_AUTH_RECEIVER = function (auth, raw) { return receiveGasResult(raw || auth || {}); };
  window.ANG_NATIVE_LOGIN_RECEIVER = function (res) { return verifyNativeAuthWithGas(res || {}); };
  window.handleNativeAuthResult = function (res) { return verifyNativeAuthWithGas(res || {}); };
  window.handleNativeGoogleResult = function (payload) { payload = payload || {}; payload.provider = 'google'; return verifyNativeAuthWithGas(payload); };
  window.handleNativeLineResult = function (payload) { payload = payload || {}; payload.provider = 'line'; return verifyNativeAuthWithGas(payload); };
  window.onNativeGoogleLoginSuccess = function (idToken, email) {
    return window.handleNativeGoogleResult({ ok: true, provider: 'google', id_token: idToken, credential: idToken, token: idToken, email: email || '' });
  };
  window.onGoogleSignInSuccess = window.onNativeGoogleLoginSuccess;
  window.handleAppNativeGoogleLogin = window.onNativeGoogleLoginSuccess;
  window.onNativeLineLoginSuccess = function (idToken, userId, displayName) {
    return window.handleNativeLineResult({ ok: true, provider: 'line', id_token: idToken, credential: idToken, token: idToken, line_user_id: userId || '', profile_name: displayName || '' });
  };
  window.handleAppNativeLineLogin = window.onNativeLineLoginSuccess;
  window.onNativeGoogleLoginFailure = function (message) { setStatusSafe(resolveStatusId({}), 'error', message || 'Google 原生驗證失敗'); };
  window.onGoogleSignInError = window.onNativeGoogleLoginFailure;
  window.onNativeLineLoginFailure = function (message) { setStatusSafe(resolveStatusId({}), 'error', message || 'LINE 原生驗證失敗'); };
  window.handleAppNativeLogin = function (idToken) {
    return verifyNativeAuthWithGas({ provider: 'google', id_token: idToken, credential: idToken, token: idToken, source: 'handleAppNativeLogin' });
  };
  window.ANG_VERIFY_NATIVE_AUTH_WITH_GAS = verifyNativeAuthWithGas;

  window.ANG_SHOW_COMPANY_REGISTER_FORM = showCompanyRegisterForm;
  window.ANG_ADMIN_LOGIN_BY_VERIFIED_AUTH = adminLoginByVerifiedAuth;
  window.ANG_RECEIVE_GAS_RESULT = receiveGasResult;


  window.addEventListener('ANG_HR_NATIVE_AUTH', function (event) { verifyNativeAuthWithGas((event && event.detail) || {}); });
>>>>>>> 963afab45774e7c1639b63cee23c8a0ac597dcac
  window.addEventListener('ANG_HR_DEEP_LINK_AUTH', function (event) {
    var detail = (event && event.detail) || {};
    receiveGasResult(detail.raw || detail.auth || detail || {});
  });

  setTimeout(function () {
<<<<<<< HEAD
    var lastNative = safeJsonParse(safeGetStorage('ang_last_native_auth_result', ''), {});
    var lastGas = safeJsonParse(safeGetStorage('ang_last_native_gas_result', ''), {});

    if (lastGas && lastGas.gas_response) {
      receiveGasResult(lastGas);
      return;
    }

    if (lastNative && (lastNative.token_exists || lastNative.credential || lastNative.id_token || lastNative.token)) {
      if (!lastNative.gas_response) {
        verifyNativeAuthWithGas(lastNative);
      }
    }
  }, 500);
=======
    closeDebugPanel();
    var lastGas = safeJsonParse(safeGetStorage('ang_last_native_gas_result', ''), {});
    if (lastGas && (lastGas.gas_response || lastGas.gasResponse || lastGas.verify_token)) {
      receiveGasResult(lastGas);
      return;
    }
    var lastNative = safeJsonParse(safeGetStorage('ang_last_native_auth_result', ''), {});
    if (lastNative && (lastNative.credential || lastNative.id_token || lastNative.loginToken || lastNative.token)) {
      if (!lastNative.gas_response && !lastNative.gasResponse) verifyNativeAuthWithGas(lastNative);
    }
  }, 700);
>>>>>>> 963afab45774e7c1639b63cee23c8a0ac597dcac

  log('已載入', ANG_NATIVE_BRIDGE_VERSION);
})();
