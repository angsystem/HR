(function () {
  'use strict';

  var cfg = window.ANG_HR_CONFIG || {};
  var params = new URLSearchParams(window.location.search || '');
  var isLineUA = /\bLine\//i.test(navigator.userAgent || '');
  var isMiniMode = params.get('lineMini') === '1' || params.has('liff.state') || isLineUA;
  var isPreview = params.get('preview') === '1';
  var liffId = String(cfg.lineLiffId || params.get('liffId') || '').trim();

  if (!isMiniMode) return;

  document.documentElement.setAttribute('data-ang-line-mini-app', '1');

  function makeOverlay() {
    var box = document.createElement('div');
    box.id = 'angLineMiniBoot';
    box.style.cssText = [
      'position:fixed','inset:0','z-index:2147483647','display:flex','align-items:center','justify-content:center',
      'background:linear-gradient(180deg,#07140f 0%,#0f2a1f 55%,#122f24 100%)','color:#fff',
      'font-family:"PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif','padding:24px','box-sizing:border-box'
    ].join(';');
    box.innerHTML = '<div style="width:min(100%,420px);text-align:center">'
      + '<div style="font-size:34px;font-weight:900;letter-spacing:.04em;margin-bottom:10px">ANG HR</div>'
      + '<div id="angLineMiniStatus" style="font-size:16px;font-weight:800;line-height:1.65;opacity:.94">正在透過 LINE 確認身分…</div>'
      + '<div style="margin:22px auto 0;width:44px;height:44px;border-radius:50%;border:4px solid rgba(255,255,255,.22);border-top-color:#fff;animation:angLineSpin .85s linear infinite"></div>'
      + '<div style="margin-top:18px;font-size:12px;opacity:.62">LINE MINI App</div>'
      + '</div>';
    var style = document.createElement('style');
    style.textContent = '@keyframes angLineSpin{to{transform:rotate(360deg)}}';
    document.head.appendChild(style);
    document.body.appendChild(box);
    return box;
  }

  function setStatus(text) {
    var el = document.getElementById('angLineMiniStatus');
    if (el) el.textContent = text;
  }

  function save(key, value) {
    try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); } catch (e) {}
    try { sessionStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); } catch (e) {}
  }

  function jsonpVerify(idToken, profile) {
    return new Promise(function (resolve, reject) {
      var gasUrl = cfg.gasApiUrl || cfg.apiBaseUrl || '';
      if (!gasUrl) return reject(new Error('尚未設定 GAS API URL'));
      var callback = 'angLineMiniCb_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      var script = document.createElement('script');
      var timer = setTimeout(function () {
        cleanup();
        reject(new Error('LINE 驗證逾時'));
      }, 25000);
      function cleanup() {
        clearTimeout(timer);
        try { delete window[callback]; } catch (e) { window[callback] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      }
      window[callback] = function (res) {
        cleanup();
        resolve(res || {});
      };
      script.onerror = function () {
        cleanup();
        reject(new Error('無法連線 ANG HR 驗證服務'));
      };
      var payload = {
        action: 'verifyNativeLineIdToken',
        provider: 'line',
        id_token: idToken,
        token: idToken,
        line_id_token: idToken,
        line_user_id: profile && profile.userId || '',
        profile_name: profile && profile.displayName || '',
        source: 'line_mini_app',
        flow: 'employee_login',
        user_agent: navigator.userAgent || ''
      };
      var url = new URL(gasUrl, window.location.href);
      url.searchParams.set('action', 'verifyNativeLineIdToken');
      url.searchParams.set('callback', callback);
      url.searchParams.set('payload', JSON.stringify(payload));
      script.src = url.toString();
      document.head.appendChild(script);
    });
  }

  function normalizeResult(raw) {
    var data = raw || {};
    if (data.gas_response) data = data.gas_response;
    if (data.gasResponse) data = data.gasResponse;
    return data || {};
  }

  function goAfterLogin(data) {
    data = normalizeResult(data);
    if (data.verify_token) save('ang_verify_token', data.verify_token);
    if (data.session_token) save('ang_session_token', data.session_token);
    if (data.email) save('ang_verified_email', data.email);
    if (data.profile_name || data.name) save('ang_verified_name', data.profile_name || data.name);
    save('ang_verified_provider', 'line');
    save('ang_line_mini_auth', data);

    var target = data.redirect_url || data.redirectUrl || data.frontend_url || cfg.employeePageUrl || './employee.html';
    window.location.replace(target);
  }

  function showNeedsBinding(data) {
    setStatus('這個 LINE 尚未綁定 ANG HR 帳號，將進入帳號綁定流程。');
    save('ang_line_pending_bind', normalizeResult(data));
    setTimeout(function () {
      var target = cfg.indexPageUrl || './index.html';
      var sep = target.indexOf('?') >= 0 ? '&' : '?';
      window.location.replace(target + sep + 'bindLine=1');
    }, 900);
  }

  async function start() {
    makeOverlay();

    if (isPreview && !liffId) {
      setStatus('LINE 自動登入入口已啟用（預覽模式）');
      setTimeout(function () {
        setStatus('正式版只要填入 LIFF ID，就會在這裡自動驗證並直接進員工首頁。');
      }, 850);
      return;
    }

    if (!liffId) {
      setStatus('尚未設定 LIFF ID；目前先保留原登入頁。');
      setTimeout(function () {
        var overlay = document.getElementById('angLineMiniBoot');
        if (overlay) overlay.remove();
      }, 1200);
      return;
    }

    if (!window.liff) {
      setStatus('LINE SDK 載入失敗，改用原登入頁。');
      return;
    }

    try {
      await window.liff.init({ liffId: liffId });
      if (!window.liff.isLoggedIn()) {
        window.liff.login({ redirectUri: window.location.href });
        return;
      }

      setStatus('LINE 身分已確認，正在登入 ANG HR…');
      var idToken = window.liff.getIDToken();
      if (!idToken) throw new Error('LINE 沒有回傳 ID Token');
      var profile = {};
      try { profile = await window.liff.getProfile(); } catch (e) {}

      var result = normalizeResult(await jsonpVerify(idToken, profile));
      var ok = result.ok === true || result.success === true || !!result.verify_token || !!result.session_token;
      var needsBind = result.need_bind === true || result.needs_binding === true || result.binding_required === true || result.code === 'ACCOUNT_NOT_BOUND';

      if (ok && !needsBind) {
        setStatus('登入成功，正在開啟員工首頁…');
        setTimeout(function () { goAfterLogin(result); }, 250);
        return;
      }
      if (needsBind) {
        showNeedsBinding(result);
        return;
      }
      throw new Error(result.message || result.error || '找不到已綁定的 ANG HR 帳號');
    } catch (err) {
      console.warn('[ANG HR LINE MINI App]', err);
      setStatus('LINE 自動登入未完成：' + (err && err.message ? err.message : '未知錯誤'));
      setTimeout(function () {
        var overlay = document.getElementById('angLineMiniBoot');
        if (overlay) overlay.remove();
      }, 1800);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
}());
