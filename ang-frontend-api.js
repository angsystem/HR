//=============================================================================
// 檔案：ang-frontend-api.js
// 說明：ANG HR 前端共用 API 安全版
// 重點：不覆蓋既有畫面邏輯、不塞假資料、不讓公司切換 / 管理員工模式切換掉 token。
//=============================================================================
(function(window, document){
  'use strict';

  var DEFAULT_KEYS = {
    company: ['ang_hr_active_company_id','ang_company_id','company_id'],
    user: ['ang_hr_active_employee_id','ang_user_id','ang_employee_id','employee_id','loginId','emp_logged_in'],
    token: ['ang_hr_active_login_token','ang_token','ang_employee_token','session_token','emp_login_token','loginToken'],
    role: ['ang_user_role','ang_employee_role','role'],
    device: ['ang_hr_device_id','ang_device_id','device_id']
  };

  function getParam(name){
    try { return new URLSearchParams(window.location.search).get(name) || ''; }
    catch(err){ return ''; }
  }

  function firstStored(list){
    for (var i=0;i<list.length;i++) {
      try {
        var v = localStorage.getItem(list[i]);
        if (v) return String(v).trim();
      } catch(err) {}
    }
    return '';
  }

  function setStored(list, value){
    value = String(value || '').trim();
    if (!value) return;
    for (var i=0;i<list.length;i++) {
      try { localStorage.setItem(list[i], value); } catch(err) {}
    }
  }

  function getOrCreateDeviceId(){
    var saved = getParam('device_id') || getParam('deviceId') || firstStored(DEFAULT_KEYS.device);
    if (!saved) saved = 'DEV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2,10).toUpperCase();
    setStored(DEFAULT_KEYS.device, saved);
    return saved;
  }

  function getApiUrl(){
    var cfg = window.ANG_HR_CONFIG || {};
    var ctx = window.APP_CTX || window.CTX || {};
    return String(
      getParam('api') || getParam('gas') ||
      cfg.apiBaseUrl || cfg.workerApiUrl || cfg.gasApiUrl ||
      ctx.apiUrl || ''
    ).trim();
  }

  function syncIdentity(extra){
    extra = extra || {};
    var ctx = window.APP_CTX || window.CTX || {};
    var companyId = String(
      extra.company_id || extra.companyId || getParam('company_id') || getParam('companyId') ||
      ctx.company_id || ctx.companyId || ctx.company || firstStored(DEFAULT_KEYS.company) || ''
    ).trim().toUpperCase();
    var userId = String(
      extra.user_id || extra.userId || extra.employee_id || extra.employeeId || getParam('employee_id') || getParam('id') ||
      ctx.employee_id || ctx.employeeId || ctx.id || firstStored(DEFAULT_KEYS.user) || ''
    ).trim().toUpperCase();
    var token = String(
      extra.token || extra.session_token || extra.loginToken || getParam('session_token') || getParam('loginToken') || getParam('token') ||
      ctx.session_token || ctx.loginToken || ctx.token || firstStored(DEFAULT_KEYS.token) || ''
    ).trim();
    var role = String(
      extra.role || getParam('role') || ctx.role || firstStored(DEFAULT_KEYS.role) || ''
    ).trim();
    var deviceId = getOrCreateDeviceId();

    setStored(DEFAULT_KEYS.company, companyId);
    setStored(DEFAULT_KEYS.user, userId);
    setStored(DEFAULT_KEYS.token, token);
    setStored(DEFAULT_KEYS.role, role);
    setStored(DEFAULT_KEYS.device, deviceId);

    return { company_id: companyId, user_id: userId, id: userId, employee_id: userId, token: token, role: role, device_id: deviceId };
  }

  function sysAlert(title, text, icon, showCancel){
    icon = icon || 'info';
    if (window.Swal && Swal.fire) {
      return Swal.fire({
        title: title,
        text: text,
        icon: icon,
        showCancelButton: !!showCancel,
        confirmButtonText: '確認',
        cancelButtonText: '取消',
        background: 'var(--card)',
        color: 'var(--text)'
      });
    }
    if (showCancel) return Promise.resolve({ isConfirmed: window.confirm((title || '') + '\n' + (text || '')) });
    window.alert((title || '') + (text ? '\n' + text : ''));
    return Promise.resolve({ isConfirmed: true });
  }

  async function request(action, payload, options){
    payload = payload || {};
    options = options || {};
    var id = syncIdentity(payload);
    var apiUrl = String(options.url || getApiUrl() || '').trim();
    if (!apiUrl) {
      await sysAlert('API 未設定', '找不到 GAS API URL，請確認 config.js 的 gasApiUrl / apiBaseUrl。', 'error');
      return null;
    }

    var body = Object.assign({}, payload, {
      action: action,
      company_id: payload.company_id || id.company_id,
      companyId: payload.companyId || id.company_id,
      user_id: payload.user_id || payload.userId || payload.id || id.user_id,
      userId: payload.userId || payload.user_id || payload.id || id.user_id,
      id: payload.id || payload.user_id || payload.userId || id.user_id,
      employee_id: payload.employee_id || payload.employeeId || payload.id || id.user_id,
      token: payload.token || id.token,
      role: payload.role || id.role,
      device_id: payload.device_id || id.device_id,
      deviceId: payload.deviceId || id.device_id,
      payload: payload
    });

    var timer = null;
    var ctrl = null;
    try {
      if (window.AbortController) {
        ctrl = new AbortController();
        timer = setTimeout(function(){ try { ctrl.abort(); } catch(e) {} }, options.timeout || 25000);
      }
      if (!options.silent && window.Swal && Swal.fire) {
        Swal.fire({ title: options.loadingText || '處理中...', allowOutsideClick:false, didOpen:function(){ Swal.showLoading(); } });
      }
      var res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body),
        signal: ctrl ? ctrl.signal : undefined
      });
      var text = await res.text();
      if (timer) clearTimeout(timer);
      if (!options.silent && window.Swal && Swal.close) Swal.close();
      if (!res.ok) throw new Error('HTTP_' + res.status);
      var data = text ? JSON.parse(text) : {};
      if (!data.ok) {
        if (!options.silent) await sysAlert('任務失敗', data.message || '無法取得資料', 'error');
        return null;
      }
      return data.data !== undefined ? data.data : data;
    } catch(err) {
      if (timer) clearTimeout(timer);
      if (!options.silent && window.Swal && Swal.close) Swal.close();
      if (!options.silent) await sysAlert('連線異常', err && err.name === 'AbortError' ? '連線逾時，請重新操作。' : '系統與伺服器斷開連接，請確認網路狀態。', 'error');
      try { console.error('[ANG Engine] API 串接錯誤:', err); } catch(e) {}
      return null;
    }
  }

  async function verifySession(options){
    return request('angGetPermissionSnapshot', syncIdentity(), Object.assign({ silent:true, timeout:12000 }, options || {}));
  }

  function buildSwitchUrl(pageName, companyId){
    var ctx = syncIdentity({ company_id: companyId || '' });
    var page = String(pageName || 'employee').toLowerCase();
    var base = '';
    var cfg = window.ANG_HR_CONFIG || {};
    if (page === 'admin') base = cfg.adminPageUrl || cfg.adminPage || (window.CTX && window.CTX.adminPageUrl) || './admin.html';
    else base = cfg.employeePageUrl || cfg.employeePage || (window.CTX && window.CTX.employeePageUrl) || './employee.html';
    var qs = [
      'page=' + encodeURIComponent(page),
      'company_id=' + encodeURIComponent(companyId || ctx.company_id || ''),
      'id=' + encodeURIComponent(ctx.user_id || ''),
      'employee_id=' + encodeURIComponent(ctx.user_id || ''),
      'token=' + encodeURIComponent(ctx.token || ''),
      'role=' + encodeURIComponent(ctx.role || ''),
      'device_id=' + encodeURIComponent(ctx.device_id || ''),
      '_ts=' + Date.now()
    ];
    return String(base).split('#')[0] + (String(base).indexOf('?') > -1 ? '&' : '?') + qs.join('&');
  }

  window.ANG_API = {
    get url(){ return getApiUrl(); },
    get companyId(){ return syncIdentity().company_id; },
    get userId(){ return syncIdentity().user_id; },
    get token(){ return syncIdentity().token; },
    sysAlert: sysAlert,
    request: request,
    verifySession: verifySession,
    syncIdentity: syncIdentity,
    buildSwitchUrl: buildSwitchUrl
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ syncIdentity(); });
  else syncIdentity();
})(window, document);
