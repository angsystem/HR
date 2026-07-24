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



  var ACCESS_CONTEXTS_KEY = 'ang_hr_access_contexts';
  var ACTIVE_CONTEXT_KEY = 'ang_hr_active_context';

  function readAccessContexts(){
    try {
      var list = JSON.parse(localStorage.getItem(ACCESS_CONTEXTS_KEY) || '[]');
      return Array.isArray(list) ? list : [];
    } catch(err){ return []; }
  }

  function setAccessContexts(list){
    if (!Array.isArray(list)) return;
    try { localStorage.setItem(ACCESS_CONTEXTS_KEY, JSON.stringify(list)); } catch(err) {}
    installContextSwitcher(true);
  }

  function contextRoute(context){
    context = context || {};
    var family = String(context.plan_family || context.family || '').toLowerCase();
    var planCode = String(context.plan_code || context.plan || '').toLowerCase();
    var role = String(context.role || '').toLowerCase();
    var type = String(context.type || '').toLowerCase();
    if (type.indexOf('plan') !== -1 || family === 'personal' || planCode.indexOf('personal_') === 0) return './personal.html';
    if (/owner|creator|admin|manager|deputy|supervisor|leader/.test(role)) return './admin.html';
    return './employee.html';
  }

  function switchContext(context){
    if (!context) return;
    var companyId = String(context.company_id || context.companyId || '').trim().toUpperCase();
    var userId = String(context.user_id || context.userId || context.employee_id || context.employeeId || '').trim().toUpperCase();
    var token = String(context.token || context.session_token || context.sessionToken || '').trim();
    var role = String(context.role || '').trim();
    var planCode = String(context.plan_code || context.planCode || context.plan || '').trim();
    if (companyId) setStored(DEFAULT_KEYS.company, companyId);
    if (userId) setStored(DEFAULT_KEYS.user, userId);
    if (token) setStored(DEFAULT_KEYS.token, token);
    if (role) setStored(DEFAULT_KEYS.role, role);
    try {
      localStorage.setItem(ACTIVE_CONTEXT_KEY, JSON.stringify(context));
      if (planCode) localStorage.setItem('ang_hr_active_plan_code', planCode);
    } catch(err) {}
    var base = contextRoute(context);
    var url = new URL(base, window.location.href);
    if (companyId) url.searchParams.set('company_id', companyId);
    if (userId) { url.searchParams.set('id', userId); url.searchParams.set('employee_id', userId); }
    if (token) url.searchParams.set('token', token);
    if (role) url.searchParams.set('role', role);
    if (planCode) url.searchParams.set('plan', planCode);
    url.searchParams.set('_ts', String(Date.now()));
    window.location.href = url.toString();
  }

  function escapeContextText(value){
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function installContextSwitcher(force){
    var contexts = readAccessContexts();
    var existing = document.getElementById('ang-context-switcher-root');
    if (contexts.length <= 1) {
      if (existing) existing.remove();
      return;
    }
    if (existing && !force) return;
    if (existing) existing.remove();

    var root = document.createElement('div');
    root.id = 'ang-context-switcher-root';
    root.innerHTML = [
      '<button type="button" class="ang-context-switcher-button" aria-label="切換公司或方案">切換</button>',
      '<div class="ang-context-switcher-backdrop" hidden>',
      '<section class="ang-context-switcher-panel" role="dialog" aria-modal="true" aria-label="切換公司或方案">',
      '<button type="button" class="ang-context-switcher-close" aria-label="關閉">×</button>',
      '<strong>切換公司／方案</strong>',
      '<small>不必登出，切換後會重新載入對應資料與權限。</small>',
      '<div class="ang-context-switcher-list"></div>',
      '</section></div>'
    ].join('');

    var style = document.getElementById('ang-context-switcher-style');
    if (!style) {
      style = document.createElement('style');
      style.id = 'ang-context-switcher-style';
      style.textContent = [
        '#ang-context-switcher-root{position:fixed;right:12px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:2147483000;font-family:inherit}',
        '.ang-context-switcher-button{color:#fff;background:linear-gradient(135deg,#188b55,#0d5838);border:1px solid rgba(255,255,255,.34);border-radius:999px;padding:9px 12px;font-size:11px;font-weight:900;box-shadow:0 8px 24px rgba(0,45,28,.34)}',
        '.ang-context-switcher-backdrop{position:fixed;inset:0;background:rgba(4,10,8,.54);backdrop-filter:blur(8px);display:grid;place-items:end center;padding:16px 12px calc(16px + env(safe-area-inset-bottom));z-index:2147483001}',
        '.ang-context-switcher-backdrop[hidden]{display:none!important}',
        '.ang-context-switcher-panel{color:#183126;background:rgba(248,252,249,.96);border:1px solid rgba(33,126,78,.22);border-radius:22px;width:min(100%,420px);max-height:72vh;overflow:auto;padding:18px;box-shadow:0 24px 70px rgba(0,35,22,.35);position:relative}',
        '.ang-context-switcher-panel>strong,.ang-context-switcher-panel>small{display:block}.ang-context-switcher-panel>strong{font-size:17px}.ang-context-switcher-panel>small{margin-top:4px;color:#506459;font-size:10px;line-height:1.5}',
        '.ang-context-switcher-close{position:absolute;right:12px;top:10px;background:transparent;border:0;font-size:25px}',
        '.ang-context-switcher-list{display:grid;gap:8px;margin-top:14px}',
        '.ang-context-switcher-option{text-align:left;color:#183126;background:#fff;border:1px solid rgba(33,126,78,.18);border-radius:14px;padding:11px 12px;display:grid;grid-template-columns:1fr auto;gap:2px 10px}',
        '.ang-context-switcher-option b{font-size:12px}.ang-context-switcher-option span{font-size:9px;color:#607167}.ang-context-switcher-option i{grid-column:2;grid-row:1/3;align-self:center;font-style:normal;font-size:10px;font-weight:900}'
      ].join('');
      document.head.appendChild(style);
    }

    var backdrop = root.querySelector('.ang-context-switcher-backdrop');
    var list = root.querySelector('.ang-context-switcher-list');
    contexts.forEach(function(context){
      var title = context.title || context.company_name || context.company_id || context.plan_label || context.plan_code || 'ANG HR';
      var subtitle = context.subtitle || [context.plan_label || context.plan_code, context.role].filter(Boolean).join('｜') || '工作區';
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'ang-context-switcher-option';
      button.innerHTML = '<b>'+escapeContextText(title)+'</b><span>'+escapeContextText(subtitle)+'</span><i>切換 →</i>';
      button.addEventListener('click', function(){ switchContext(context); });
      list.appendChild(button);
    });
    root.querySelector('.ang-context-switcher-button').addEventListener('click', function(){ backdrop.hidden = false; });
    root.querySelector('.ang-context-switcher-close').addEventListener('click', function(){ backdrop.hidden = true; });
    backdrop.addEventListener('click', function(event){ if (event.target === backdrop) backdrop.hidden = true; });
    document.body.appendChild(root);
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
    buildSwitchUrl: buildSwitchUrl,
    getAccessContexts: readAccessContexts,
    setAccessContexts: setAccessContexts,
    switchContext: switchContext
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ syncIdentity(); installContextSwitcher(false); });
  else { syncIdentity(); installContextSwitcher(false); }
})(window, document);
