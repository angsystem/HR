// ANG HR LINE MINI App：獨立畫面與互動，只呼叫 LINE 專用 api.js
(function (window, document) {
  'use strict';

  var config = window.ANG_HR_MINI_CONFIG || {};
  var lineApi = window.ANG_HR_LINE_API;
  var app = document.getElementById('app');
  var state = { identity: null, route: 'home' };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function session() {
    return state.identity && state.identity.session ? state.identity.session : {};
  }

  function sessionToken() {
    var value = session();
    return value.sessionToken || value.session_token || value.token || value.accessToken || '';
  }

  function role() {
    var value = session();
    return String(value.role || value.userRole || value.companyRole || 'employee').toLowerCase();
  }

  function canManage() {
    return ['owner', 'deputy_owner', 'manager', 'assistant_manager', 'supervisor', 'section_leader', 'team_leader'].indexOf(role()) >= 0;
  }

  function displayName() {
    var value = session();
    var profile = state.identity && state.identity.profile ? state.identity.profile : {};
    return value.displayName || value.name || value.employeeName || profile.displayName || 'ANG HR 使用者';
  }

  function companyName() {
    var value = session();
    return value.companyName || value.company_name || 'ANG HR';
  }

  function header(title, subtitle) {
    return '<header class="topbar">' +
      (state.route !== 'home' ? '<button class="icon-button" type="button" data-action="back" aria-label="返回">‹</button>' : '<span class="topbar-spacer"></span>') +
      '<div class="topbar-title"><strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(subtitle || companyName()) + '</span></div>' +
      '<button class="avatar-button" type="button" data-action="profile" aria-label="帳號">' + escapeHtml(displayName().slice(0, 1)) + '</button>' +
      '</header>';
  }

  function navigation() {
    var items = [
      ['home', '⌂', '首頁'], ['clock', '✓', '打卡'], ['schedule', '日', '排班'], ['leave', '休', '請假']
    ];
    return '<nav class="bottom-nav" aria-label="主要功能">' + items.map(function (item) {
      return '<button type="button" class="nav-item' + (state.route === item[0] ? ' active' : '') + '" data-route="' + item[0] + '"><span>' + item[1] + '</span><small>' + item[2] + '</small></button>';
    }).join('') + '</nav>';
  }

  function homeView() {
    var items = [
      ['clock', '✓', '打卡', '定位、NFC、QR'],
      ['schedule', '日', '排班', '查看班表與月曆'],
      ['leave', '休', '請假', '申請與紀錄'],
      ['payroll', '$', '薪資', '薪資與工時明細']
    ];
    var manage = canManage()
      ? '<button type="button" class="management-card" data-route="manage"><span><strong>企業管理</strong><small>員工、排班、請假與薪資管理</small></span><b>進入 ›</b></button>'
      : '';
    return header('你好，' + displayName(), companyName()) +
      '<main class="page home-page">' +
      '<section class="status-card"><div><span class="eyebrow">今日狀態</span><strong>尚未打卡</strong><small>請選擇適合的打卡方式</small></div><button type="button" class="primary-button" data-route="clock">立即打卡</button></section>' +
      '<section><h2>常用功能</h2><div class="feature-grid">' + items.map(function (item) {
        return '<button type="button" class="feature-card" data-route="' + item[0] + '"><span class="feature-icon">' + item[1] + '</span><strong>' + item[2] + '</strong><small>' + item[3] + '</small></button>';
      }).join('') + '</div></section>' + manage +
      '<section class="notice-card"><span class="eyebrow">資料來源</span><strong>LINE 專用 API</strong><small>畫面與驗證獨立，只共用 ANG HR 後端資料。</small></section>' +
      '</main>' + navigation();
  }

  function clockView() {
    return header('打卡', 'LINE MINI App') +
      '<main class="page"><section class="clock-hero"><span id="clockTime">--:--:--</span><small id="clockDate">讀取時間中</small></section>' +
      '<div class="action-stack">' +
      '<button type="button" class="action-card" data-action="manual-clock"><span class="action-icon">◎</span><span><strong>手動定位打卡</strong><small>需要允許目前位置</small></span><b>›</b></button>' +
      '<button type="button" class="action-card" data-action="scan-qr"><span class="action-icon">▦</span><span><strong>掃描 QR Code</strong><small>動態 QR，不要求定位</small></span><b>›</b></button>' +
      '<button type="button" class="action-card" data-action="check-nfc"><span class="action-icon">N</span><span><strong>NFC 感應打卡</strong><small>由 NFC 網址帶入 token</small></span><b>›</b></button>' +
      '</div><div id="actionMessage" class="inline-message" aria-live="polite"></div></main>' + navigation();
  }

  function listView(title, description, rows) {
    return header(title, companyName()) + '<main class="page"><section class="section-intro"><h2>' + escapeHtml(title) + '</h2><p>' + escapeHtml(description) + '</p></section>' +
      '<div class="list-stack">' + rows.map(function (row) {
        return '<article class="list-card"><div><strong>' + escapeHtml(row[0]) + '</strong><small>' + escapeHtml(row[1]) + '</small></div><span>' + escapeHtml(row[2] || '›') + '</span></article>';
      }).join('') + '</div></main>' + navigation();
  }

  function manageView() {
    if (!canManage()) return listView('無管理權限', '目前帳號沒有企業管理權限。', []);
    return header('企業管理', companyName()) + '<main class="page"><section class="management-hero"><span class="eyebrow">管理身分</span><strong>' + escapeHtml(role()) + '</strong><small>LINE 獨立管理介面</small></section>' +
      '<div class="feature-grid">' + ['員工', '排班', '請假', '薪資', '地點', 'QR'].map(function (name) {
        return '<button type="button" class="feature-card"><span class="feature-icon">' + name.slice(0, 1) + '</span><strong>' + name + '</strong><small>共用後端資料</small></button>';
      }).join('') + '</div></main>' + navigation();
  }

  function renderProfile() {
    var value = session();
    app.innerHTML = header('帳號', companyName()) + '<main class="page"><section class="profile-card"><div class="large-avatar">' + escapeHtml(displayName().slice(0, 1)) + '</div><strong>' + escapeHtml(displayName()) + '</strong><small>' + escapeHtml(value.account || value.personId || value.person_id || 'LINE 使用者') + '</small></section>' +
      '<div class="list-stack"><article class="list-card"><div><strong>目前身分</strong><small>' + escapeHtml(role()) + '</small></div></article><article class="list-card"><div><strong>客戶端</strong><small>LINE MINI App</small></div></article></div>' +
      '<button type="button" class="secondary-button full-width" data-action="back">返回</button></main>' + navigation();
    bindEvents();
  }

  function render() {
    if (!state.identity) return;
    if (state.route === 'clock') app.innerHTML = clockView();
    else if (state.route === 'schedule') app.innerHTML = listView('排班', 'LINE 端只顯示排班資料。', [['本週班表', '等待 getSchedule API', '查看'], ['月曆', '班別、休假與活動', '開啟']]);
    else if (state.route === 'leave') app.innerHTML = listView('請假', 'LINE 端只處理請假互動。', [['新增請假', '送出 submitLeave', '申請'], ['申請紀錄', '讀取 getLeaveRecords', '查看']]);
    else if (state.route === 'payroll') app.innerHTML = listView('薪資', 'LINE 端只顯示薪資資料。', [['本月薪資', '讀取 getPayroll', '--'], ['工時明細', '正常、加班與休假', '查看']]);
    else if (state.route === 'manage') app.innerHTML = manageView();
    else app.innerHTML = homeView();
    bindEvents();
    updateClock();
    processNfcToken(false);
  }

  function setRoute(route) {
    state.route = route || 'home';
    window.location.hash = state.route;
    render();
  }

  function showMessage(message, isError) {
    var target = document.getElementById('actionMessage');
    if (!target) return;
    target.textContent = message;
    target.className = 'inline-message show' + (isError ? ' error' : ' success');
  }

  function manualClock() {
    if (!navigator.geolocation) return showMessage('這個裝置不支援定位。', true);
    showMessage('正在取得目前位置…', false);
    navigator.geolocation.getCurrentPosition(async function (position) {
      try {
        await lineApi.clockByLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy });
        showMessage('定位打卡成功。', false);
      } catch (error) { showMessage(error.message || '定位打卡失敗。', true); }
    }, function (error) { showMessage(error.message || '無法取得定位。', true); }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  }

  async function scanQr() {
    if (!window.liff || typeof window.liff.scanCodeV2 !== 'function') return showMessage('目前裝置不支援 LINE QR 掃描。', true);
    try {
      var result = await window.liff.scanCodeV2();
      if (!result || !result.value) throw new Error('沒有讀取到 QR Code。');
      await lineApi.clockByQr(result.value);
      showMessage('QR Code 打卡成功。', false);
    } catch (error) { showMessage(error.message || 'QR Code 打卡失敗。', true); }
  }

  async function processNfcToken(showHint) {
    if (state.route !== 'clock') return;
    var params = new URLSearchParams(window.location.search || '');
    var token = params.get('nfc_token') || params.get('nfc');
    if (!token) return showHint ? showMessage('請將手機靠近公司的 NFC 標籤。', false) : undefined;
    if (params.get('nfc_processed') === '1') return;
    try {
      await lineApi.clockByNfc(token);
      params.set('nfc_processed', '1');
      window.history.replaceState({}, '', window.location.pathname + '?' + params.toString() + window.location.hash);
      showMessage('NFC 打卡成功。', false);
    } catch (error) { showMessage(error.message || 'NFC 打卡失敗。', true); }
  }

  function updateClock() {
    var time = document.getElementById('clockTime');
    var date = document.getElementById('clockDate');
    if (!time || !date) return;
    var now = new Date();
    time.textContent = new Intl.DateTimeFormat('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
    date.textContent = new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(now);
  }

  function bindEvents() {
    document.querySelectorAll('[data-route]').forEach(function (button) { button.addEventListener('click', function () { setRoute(button.getAttribute('data-route')); }); });
    document.querySelectorAll('[data-action="back"]').forEach(function (button) { button.addEventListener('click', function () { setRoute('home'); }); });
    document.querySelectorAll('[data-action="profile"]').forEach(function (button) { button.addEventListener('click', renderProfile); });
    var manual = document.querySelector('[data-action="manual-clock"]'); if (manual) manual.addEventListener('click', manualClock);
    var qr = document.querySelector('[data-action="scan-qr"]'); if (qr) qr.addEventListener('click', scanQr);
    var nfc = document.querySelector('[data-action="check-nfc"]'); if (nfc) nfc.addEventListener('click', function () { processNfcToken(true); });
  }

  async function start() {
    try {
      if (!lineApi) throw new Error('LINE API 檔案未載入。');
      state.identity = await window.ANG_HR_MINI_AUTH.initialize();
      lineApi.setSessionProvider(sessionToken);
      state.route = String(window.location.hash || '').replace(/^#/, '') || 'home';
      render();
      window.setInterval(updateClock, 1000);
    } catch (error) {
      app.innerHTML = '<main class="center-screen"><div class="error-mark">!</div><h1>暫時無法進入</h1><p>' + escapeHtml(error.message || 'LINE MINI App 無法啟動。') + '</p><code>' + escapeHtml(error.code || 'MINI_APP_START_FAILED') + '</code><button type="button" class="primary-button" onclick="location.reload()">重新嘗試</button></main>';
    }
  }

  window.addEventListener('hashchange', function () {
    var route = String(window.location.hash || '').replace(/^#/, '') || 'home';
    if (route !== state.route) { state.route = route; render(); }
  });

  start();
}(window, document));
