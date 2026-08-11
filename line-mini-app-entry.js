(function () {
  'use strict';

  var cfg = window.ANG_HR_CONFIG || {};
  var params = new URLSearchParams(window.location.search || '');
  var isLineUA = /\bLine\//i.test(navigator.userAgent || '');
  var manualMode = params.get('lineManual') === '1';
  var isMiniMode = !manualMode && (params.get('lineMini') === '1' || params.has('liff.state') || isLineUA);
  var liffId = String(cfg.lineLiffId || params.get('liffId') || '').trim();

  if (!isMiniMode) return;
  document.documentElement.setAttribute('data-ang-line-mini-app', '1');

  var STORAGE = {
    company: ['ang_hr_active_company_id','ang_company_id','company_id'],
    employee: ['ang_hr_active_employee_id','ang_employee_id','employee_id','loginId','emp_logged_in'],
    token: ['ang_hr_active_login_token','ang_employee_token','session_token','loginToken','emp_login_token'],
    role: ['ang_user_role','ang_employee_role','role'],
    device: ['ang_hr_device_id','ang_device_id','device_id']
  };

  function makeOverlay() {
    var old = document.getElementById('angLineMiniBoot');
    if (old) old.remove();
    var box = document.createElement('div');
    box.id = 'angLineMiniBoot';
    box.style.cssText = [
      'position:fixed','inset:0','z-index:2147483647','display:flex','align-items:center','justify-content:center',
      'background:linear-gradient(180deg,#07140f 0%,#0f2a1f 55%,#122f24 100%)','color:#fff',
      'font-family:"PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif','padding:24px','box-sizing:border-box'
    ].join(';');
    box.innerHTML = '<div id="angLineMiniCard" style="width:min(100%,420px);text-align:center">'
      + '<div style="font-size:34px;font-weight:900;letter-spacing:.04em;margin-bottom:10px">ANG HR</div>'
      + '<div id="angLineMiniStatus" style="font-size:16px;font-weight:800;line-height:1.65;opacity:.94">正在透過 LINE 確認身分…</div>'
      + '<div id="angLineMiniSpinner" style="margin:22px auto 0;width:44px;height:44px;border-radius:50%;border:4px solid rgba(255,255,255,.22);border-top-color:#fff;animation:angLineSpin .85s linear infinite"></div>'
      + '<div style="margin-top:18px;font-size:12px;opacity:.62">LINE MINI App</div>'
      + '</div>';
    if (!document.getElementById('angLineMiniStyle')) {
      var style = document.createElement('style');
      style.id = 'angLineMiniStyle';
      style.textContent = '@keyframes angLineSpin{to{transform:rotate(360deg)}}.ang-line-choice{width:100%;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.10);color:#fff;border-radius:16px;padding:13px 14px;text-align:left;font:800 14px inherit;margin-top:8px}.ang-line-choice b,.ang-line-choice small{display:block}.ang-line-choice small{margin-top:4px;opacity:.7;font-size:11px}.ang-line-secondary{width:100%;margin-top:12px;border:0;border-radius:16px;padding:13px;background:rgba(255,255,255,.12);color:#fff;font:900 14px inherit}';
      document.head.appendChild(style);
    }
    document.body.appendChild(box);
    return box;
  }

  function setStatus(text) {
    var el = document.getElementById('angLineMiniStatus');
    if (el) el.textContent = text;
  }

  function setBusy(busy) {
    var el = document.getElementById('angLineMiniSpinner');
    if (el) el.style.display = busy === false ? 'none' : '';
  }

  function save(key, value) {
    if (value === undefined || value === null || value === '') return;
    var text = typeof value === 'string' ? value : JSON.stringify(value);
    try { localStorage.setItem(key, text); } catch (e) {}
    try { sessionStorage.setItem(key, text); } catch (e) {}
  }

  function saveMany(keys, value) {
    if (!value) return;
    keys.forEach(function (key) { save(key, value); });
  }

  function firstStored(keys) {
    for (var i = 0; i < keys.length; i++) {
      try {
        var v = localStorage.getItem(keys[i]);
        if (v) return String(v).trim();
      } catch (e) {}
    }
    return '';
  }

  function getDeviceId() {
    var id = firstStored(STORAGE.device);
    if (!id) id = 'DEV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 10).toUpperCase();
    saveMany(STORAGE.device, id);
    return id;
  }

  function normalizeResult(raw) {
    var data = raw || {};
    if (data.gas_response) data = data.gas_response;
    if (data.gasResponse) data = data.gasResponse;
    if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
      data = Object.assign({}, data, data.data);
    }
    return data || {};
  }

  function callGas(action, payload, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var gasUrl = cfg.gasApiUrl || cfg.apiBaseUrl || '';
      if (!gasUrl) return reject(new Error('尚未設定 GAS API URL'));
      var callback = 'angLineMiniCb_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      var script = document.createElement('script');
      var timer = setTimeout(function () { cleanup(); reject(new Error('ANG HR 驗證逾時')); }, timeoutMs || 25000);
      function cleanup() {
        clearTimeout(timer);
        try { delete window[callback]; } catch (e) { window[callback] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      }
      window[callback] = function (res) { cleanup(); resolve(normalizeResult(res || {})); };
      script.onerror = function () { cleanup(); reject(new Error('無法連線 ANG HR 驗證服務')); };
      var body = Object.assign({}, payload || {}, { action: action });
      var url = new URL(gasUrl, window.location.href);
      url.searchParams.set('action', action);
      url.searchParams.set('callback', callback);
      url.searchParams.set('payload', JSON.stringify(body));
      script.src = url.toString();
      document.head.appendChild(script);
    });
  }

  function roleRank(role) {
    var r = String(role || '').trim().toLowerCase();
    if (/creator|root|platform/.test(r)) return 9;
    if (/owner|deputy_owner/.test(r)) return 8;
    if (/admin/.test(r)) return 7;
    if (/manager/.test(r) && !/assistant/.test(r)) return 6;
    if (/assistant_manager/.test(r)) return 5;
    if (/supervisor/.test(r)) return 4;
    if (/section_leader/.test(r)) return 3;
    if (/team_leader/.test(r)) return 2;
    return 1;
  }

  function storedSession() {
    return {
      company_id: firstStored(STORAGE.company).toUpperCase(),
      employee_id: firstStored(STORAGE.employee).toUpperCase(),
      token: firstStored(STORAGE.token),
      role: firstStored(STORAGE.role),
      device_id: getDeviceId()
    };
  }

  async function verifyStoredSession(expected) {
    var s = storedSession();
    if (!s.employee_id || !s.token) return null;
    if (expected && expected.company_id && s.company_id && s.company_id !== String(expected.company_id).toUpperCase()) return null;
    if (expected && expected.employee_id && s.employee_id !== String(expected.employee_id).toUpperCase()) return null;
    var payload = { company_id:s.company_id, id:s.employee_id, employee_id:s.employee_id, token:s.token, role:s.role, device_id:s.device_id };
    try {
      var r = await callGas('angGetPermissionSnapshot', payload, 12000);
      if (r && r.ok !== false && (r.employee_id || r.id || r.role || r.permissions)) return Object.assign({}, s, r);
    } catch (e) {}
    try {
      var r2 = await callGas('verifyEmployeeSession', payload, 12000);
      if (r2 && r2.ok !== false && (r2.employee_id || r2.id || r2.role || r2.valid === true)) return Object.assign({}, s, r2);
    } catch (e2) {}
    return null;
  }

  function persistSession(data) {
    data = normalizeResult(data);
    var company = String(data.company_id || data.companyId || '').trim().toUpperCase();
    var employee = String(data.employee_id || data.employeeId || data.id || data.user_id || '').trim().toUpperCase();
    var token = String(data.session_token || data.sessionToken || data.loginToken || data.hr_token || '').trim();
    var role = String(data.role || data.user_role || '').trim();
    if (company) saveMany(STORAGE.company, company);
    if (employee) saveMany(STORAGE.employee, employee);
    if (token) saveMany(STORAGE.token, token);
    if (role) saveMany(STORAGE.role, role);
    saveMany(STORAGE.device, data.device_id || getDeviceId());
    if (data.name || data.profile_name) save('emp_name', data.name || data.profile_name);
    save('isLoggedIn', '1');
    save('ang_line_mini_session', data);
    return { company_id:company, employee_id:employee, token:token, role:role, device_id:data.device_id || getDeviceId() };
  }

  function openHr(data) {
    var s = persistSession(data);
    if (!s.employee_id || !s.token) throw new Error('HR session 尚未建立');
    var management = roleRank(s.role) >= 2;
    var target = data.next_url || data.nextUrl || data.redirect_url || data.redirectUrl || (management ? cfg.adminPageUrl : cfg.employeePageUrl) || (management ? './admin.html' : './employee.html');
    var url = new URL(target, window.location.href);
    if (s.company_id) url.searchParams.set('company_id', s.company_id);
    url.searchParams.set('id', s.employee_id);
    url.searchParams.set('employee_id', s.employee_id);
    url.searchParams.set('token', s.token);
    url.searchParams.set('session_token', s.token);
    if (s.role) url.searchParams.set('role', s.role);
    if (s.device_id) url.searchParams.set('device_id', s.device_id);
    url.searchParams.set('lineMini', '1');
    window.location.replace(url.toString());
  }

  function saveVerifiedLine(result, profile) {
    if (result.verify_token) {
      save('ang_verify_token', result.verify_token);
      save('ang_last_verify_token', result.verify_token);
    }
    if (result.email) save('ang_verified_email', result.email);
    if (result.profile_name || result.name || (profile && profile.displayName)) save('ang_verified_name', result.profile_name || result.name || profile.displayName);
    if (result.line_user_id || (profile && profile.userId)) save('ang_line_user_id', result.line_user_id || profile.userId);
    save('ang_verified_provider', 'line');
    save('ang_line_mini_auth', result);
  }

  async function createVerifiedSession(company, verifyToken) {
    company = company || {};
    var payload = {
      verify_token: verifyToken,
      company_id: company.company_id || '',
      company: company.company_id || '',
      employee_id: company.employee_id || '',
      id: company.employee_id || '',
      device_id: getDeviceId(),
      provider: 'line',
      source: 'line_mini_app'
    };

    // 已綁定員工若 GAS 有新版第三方登入 action，直接建立正式 HR session。
    try {
      var employeeLogin = await callGas('employeeLoginByVerifiedAuth', payload, 18000);
      if (employeeLogin && employeeLogin.ok !== false && employeeLogin.session_token) return employeeLogin;
    } catch (e) {}

    // 主管層沿用現有正式 verified admin login，後端會建立 7 天 HR session。
    if (roleRank(company.role) >= 2) {
      try {
        var adminLogin = await callGas('adminLoginByVerifiedAuth', payload, 18000);
        if (adminLogin && adminLogin.ok !== false && adminLogin.session_token) return adminLogin;
      } catch (e2) {}
    }

    return null;
  }

  function manualLogin(reason, company) {
    setBusy(false);
    save('ang_line_pending_bind', {
      reason: reason || '',
      company: company || null,
      verify_token: firstStored(['ang_verify_token','ang_last_verify_token'])
    });
    setStatus(reason || 'LINE 身分已確認，請完成 ANG HR 帳號登入／首次開通。');
    var card = document.getElementById('angLineMiniCard');
    if (!card) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ang-line-secondary';
    btn.textContent = '使用 ANG HR 登入／首次開通';
    btn.addEventListener('click', function () {
      var target = new URL(cfg.indexPageUrl || './index.html', window.location.href);
      target.searchParams.set('lineManual', '1');
      if (company && company.company_id) target.searchParams.set('company_id', company.company_id);
      if (company && company.employee_id) target.searchParams.set('employee_id', company.employee_id);
      target.searchParams.set('provider', 'line');
      window.location.replace(target.toString());
    });
    card.appendChild(btn);
  }

  async function chooseCompany(company, verifyToken) {
    setBusy(true);
    setStatus('正在建立 ANG HR 工作階段…');

    var existing = await verifyStoredSession(company);
    if (existing) {
      openHr(Object.assign({}, company, existing, { session_token:existing.token || existing.session_token }));
      return;
    }

    var created = await createVerifiedSession(company, verifyToken);
    if (created && created.session_token) {
      openHr(Object.assign({}, company, created));
      return;
    }

    manualLogin('LINE 已辨識到你的 ANG HR 員工資料，但目前後端尚未建立可直接重登的員工 session。請完成一次 ANG HR 登入／首次開通。', company);
  }

  function renderCompanyPicker(companies, verifyToken) {
    setBusy(false);
    setStatus('你的 LINE 對應到多個 ANG HR 工作區，請選擇要進入的公司。');
    var card = document.getElementById('angLineMiniCard');
    if (!card) return;
    var wrap = document.createElement('div');
    wrap.style.marginTop = '14px';
    companies.forEach(function (company) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ang-line-choice';
      btn.innerHTML = '<b>' + escapeHtml(company.company_name || company.company_id || 'ANG HR') + '</b><small>' + escapeHtml([company.employee_id, company.role].filter(Boolean).join('｜')) + '</small>';
      btn.addEventListener('click', function () { chooseCompany(company, verifyToken); });
      wrap.appendChild(btn);
    });
    card.appendChild(wrap);
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (ch) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }

  async function start() {
    makeOverlay();

    if (!liffId) {
      manualLogin('尚未設定 LIFF ID，改用原 ANG HR 登入。');
      return;
    }
    if (!window.liff) {
      manualLogin('LINE SDK 載入失敗，改用原 ANG HR 登入。');
      return;
    }

    try {
      await window.liff.init({ liffId: liffId });
      if (!window.liff.isLoggedIn()) {
        window.liff.login({ redirectUri: window.location.href });
        return;
      }

      setStatus('LINE 身分已確認，正在核對 ANG HR 綁定資料…');
      var idToken = window.liff.getIDToken();
      if (!idToken) throw new Error('LINE 沒有回傳 ID Token');
      var profile = {};
      try { profile = await window.liff.getProfile(); } catch (e) {}

      var verified = await callGas('verifyNativeLineIdToken', {
        provider:'line', id_token:idToken, token:idToken, line_id_token:idToken,
        line_user_id:profile.userId || '', profile_name:profile.displayName || '',
        source:'line_mini_app', flow:'employee_login', device_id:getDeviceId(), user_agent:navigator.userAgent || ''
      },25000);

      if (!verified || verified.ok === false || !verified.verify_token) {
        throw new Error((verified && (verified.message || verified.error)) || 'LINE 身分驗證失敗');
      }
      saveVerifiedLine(verified, profile);

      var matches = await callGas('getEmployeeCompaniesByVerifiedAuth', {
        verify_token:verified.verify_token, provider:'line', device_id:getDeviceId(), source:'line_mini_app'
      },20000);
      var companies = matches && Array.isArray(matches.companies) ? matches.companies : [];

      if (!companies.length) {
        manualLogin('LINE 驗證成功，但目前尚未找到已綁定的 ANG HR 員工帳號。請完成帳號登入／首次開通。');
        return;
      }
      save('ang_line_companies', companies);

      if (companies.length === 1) {
        await chooseCompany(companies[0], verified.verify_token);
        return;
      }
      renderCompanyPicker(companies.slice(0,3), verified.verify_token);
    } catch (err) {
      console.warn('[ANG HR LINE MINI App]', err);
      manualLogin('LINE 自動登入未完成：' + (err && err.message ? err.message : '未知錯誤'));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
}());
