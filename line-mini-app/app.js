// ANG HR LINE MINI App：獨立前端應用
(function (window, document) {
  'use strict';

  var config = window.ANG_HR_MINI_CONFIG || {};
  var app = document.getElementById('app');
  var state = {
    identity: null,
    route: 'home',
    busy: false,
    message: ''
  };

  var employeeItems = [
    { route: 'clock', icon: '✓', title: '打卡', subtitle: '定位、NFC、QR' },
    { route: 'schedule', icon: '日', title: '排班', subtitle: '查看班表與月曆' },
    { route: 'leave', icon: '休', title: '請假', subtitle: '申請與紀錄' },
    { route: 'payroll', icon: '$', title: '薪資', subtitle: '薪資與工時明細' }
  ];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getSession() {
    return state.identity && state.identity.session ? state.identity.session : {};
  }

  function getRole() {
    var session = getSession();
    return String(session.role || session.userRole || session.companyRole || 'employee').toLowerCase();
  }

  function canManage() {
    return ['owner', 'deputy_owner', 'manager', 'assistant_manager', 'supervisor', 'section_leader', 'team_leader'].indexOf(getRole()) >= 0;
  }

  function getDisplayName() {
    var session = getSession();
    var profile = state.identity && state.identity.profile ? state.identity.profile : {};
    return session.displayName || session.name || session.employeeName || profile.displayName || 'ANG HR 使用者';
  }

  function getCompanyName() {
    var session = getSession();
    return session.companyName || session.company_name || 'ANG HR';
  }

  function getSessionToken() {
    var session = getSession();
    return session.sessionToken || session.token || session.accessToken || '';
  }

  async function callApi(action, payload) {
    var body = new URLSearchParams();
    body.set('action', action);
    body.set('source', 'line-mini-app');
    body.set('environment', config.environment || 'developing');

    var sessionToken = getSessionToken();
    if (sessionToken) body.set('session_token', sessionToken);

    Object.keys(payload || {}).forEach(function (key) {
      var value = payload[key];
      if (value !== undefined && value !== null) body.set(key, String(value));
    });

    var response = await fetch(config.gasApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: body.toString(),
      redirect: 'follow'
    });

    if (!response.ok) throw new Error('後端連線失敗。');
    var result = await response.json();
    if (!result || result.ok !== true) {
      throw new Error(result && result.message ? result.message : '操作失敗。');
    }
    return result;
  }

  function setRoute(route) {
    var allowed = Object.keys(config.routes || {}).map(function (key) { return config.routes[key]; });
    state.route = allowed.indexOf(route) >= 0 ? route : 'home';
    window.location.hash = state.route;
    render();
  }

  function header(title, subtitle) {
    return [
      '<header class="topbar">',
      state.route !== 'home' ? '<button class="icon-button" type="button" data-action="back" aria-label="返回">‹</button>' : '<span class="topbar-spacer"></span>',
      '<div class="topbar-title"><strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(subtitle || getCompanyName()) + '</span></div>',
      '<button class="avatar-button" type="button" data-action="profile" aria-label="帳號">' + escapeHtml(getDisplayName().slice(0, 1)) + '</button>',
      '</header>'
    ].join('');
  }

  function navigation() {
    var items = [
      { route: 'home', label: '首頁', icon: '⌂' },
      { route: 'clock', label: '打卡', icon: '✓' },
      { route: 'schedule', label: '排班', icon: '日' },
      { route: 'leave', label: '請假', icon: '休' }
    ];

    return '<nav class="bottom-nav" aria-label="主要功能">' + items.map(function (item) {
      var active = state.route === item.route ? ' active' : '';
      return '<button type="button" class="nav-item' + active + '" data-route="' + item.route + '"><span>' + item.icon + '</span><small>' + item.label + '</small></button>';
    }).join('') + '</nav>';
  }

  function renderHome() {
    var managementCard = canManage()
      ? '<button type="button" class="management-card" data-route="manage"><span><strong>企業管理</strong><small>員工、排班、請假與薪資管理</small></span><b>進入 ›</b></button>'
      : '';

    return header('你好，' + getDisplayName(), getCompanyName()) +
      '<main class="page home-page">' +
        '<section class="status-card"><div><span class="eyebrow">今日狀態</span><strong>尚未打卡</strong><small>請選擇適合的打卡方式</small></div><button type="button" class="primary-button" data-route="clock">立即打卡</button></section>' +
        '<section><h2>常用功能</h2><div class="feature-grid">' + employeeItems.map(function (item) {
          return '<button type="button" class="feature-card" data-route="' + item.route + '"><span class="feature-icon">' + item.icon + '</span><strong>' + item.title + '</strong><small>' + item.subtitle + '</small></button>';
        }).join('') + '</div></section>' +
        managementCard +
        '<section class="notice-card"><span class="eyebrow">下一個班次</span><strong>尚未取得班表資料</strong><small>完成後端班表 API 串接後會顯示日期、時間與地點。</small></section>' +
      '</main>' + navigation();
  }

  function renderClock() {
    return header('打卡', '選擇打卡方式') +
      '<main class="page">' +
        '<section class="clock-hero"><span id="clockTime">--:--:--</span><small id="clockDate">讀取時間中</small></section>' +
        '<div class="action-stack">' +
          '<button type="button" class="action-card" data-action="manual-clock"><span class="action-icon">◎</span><span><strong>手動定位打卡</strong><small>需要允許目前位置</small></span><b>›</b></button>' +
          '<button type="button" class="action-card" data-action="scan-qr"><span class="action-icon">▦</span><span><strong>掃描 QR Code</strong><small>動態 QR，不要求定位</small></span><b>›</b></button>' +
          '<button type="button" class="action-card" data-action="check-nfc"><span class="action-icon">N</span><span><strong>NFC 感應打卡</strong><small>由 NFC 標籤開啟本頁並驗證</small></span><b>›</b></button>' +
        '</div>' +
        '<div id="actionMessage" class="inline-message" aria-live="polite"></div>' +
      '</main>' + navigation();
  }

  function renderPlaceholder(title, description, cards) {
    return header(title, getCompanyName()) +
      '<main class="page">' +
        '<section class="section-intro"><h2>' + escapeHtml(title) + '</h2><p>' + escapeHtml(description) + '</p></section>' +
        '<div class="list-stack">' + cards.map(function (card) {
          return '<article class="list-card"><div><strong>' + escapeHtml(card.title) + '</strong><small>' + escapeHtml(card.subtitle) + '</small></div><span>' + escapeHtml(card.value || '›') + '</span></article>';
        }).join('') + '</div>' +
      '</main>' + navigation();
  }

  function renderManage() {
    if (!canManage()) return renderPlaceholder('無管理權限', '目前帳號沒有企業管理權限。', []);
    return header('企業管理', getCompanyName()) +
      '<main class="page">' +
        '<section class="management-hero"><span class="eyebrow">管理身分</span><strong>' + escapeHtml(getRole()) + '</strong><small>獨立 MINI App 管理介面</small></section>' +
        '<div class="feature-grid">' + [
          ['員工', '名單與帳號'], ['排班', '建立與調整'], ['請假', '審核與紀錄'], ['薪資', '結算與明細'], ['地點', '定位與打卡點'], ['QR', '動態打卡碼']
        ].map(function (item) {
          return '<button type="button" class="feature-card"><span class="feature-icon">' + item[0].slice(0, 1) + '</span><strong>' + item[0] + '</strong><small>' + item[1] + '</small></button>';
        }).join('') + '</div>' +
      '</main>' + navigation();
  }

  function renderProfile() {
    var session = getSession();
    app.innerHTML = header('帳號', getCompanyName()) +
      '<main class="page">' +
        '<section class="profile-card"><div class="large-avatar">' + escapeHtml(getDisplayName().slice(0, 1)) + '</div><strong>' + escapeHtml(getDisplayName()) + '</strong><small>' + escapeHtml(session.account || session.personId || session.person_id || 'LINE MINI App 使用者') + '</small></section>' +
        '<div class="list-stack"><article class="list-card"><div><strong>目前身分</strong><small>' + escapeHtml(getRole()) + '</small></div></article><article class="list-card"><div><strong>執行環境</strong><small>' + escapeHtml(config.environment || 'developing') + '</small></div></article></div>' +
        '<button type="button" class="secondary-button full-width" data-action="back">返回</button>' +
      '</main>' + navigation();
    bindEvents();
  }

  function renderError(error) {
    var code = error && error.code ? error.code : 'MINI_APP_START_FAILED';
    var message = error && error.message ? error.message : 'LINE MINI App 無法啟動。';
    app.innerHTML = '<main class="center-screen"><div class="error-mark">!</div><h1>暫時無法進入</h1><p>' + escapeHtml(message) + '</p><code>' + escapeHtml(code) + '</code><button type="button" class="primary-button" data-action="reload">重新嘗試</button></main>';
    bindEvents();
  }

  function render() {
    if (!state.identity) return;
    var route = state.route;
    if (route === 'home') app.innerHTML = renderHome();
    else if (route === 'clock') app.innerHTML = renderClock();
    else if (route === 'schedule') app.innerHTML = renderPlaceholder('排班', '查看個人班表與每月出勤安排。', [
      { title: '本週班表', subtitle: '等待班表 API 串接', value: '查看' },
      { title: '月曆', subtitle: '班別、休假與活動', value: '開啟' }
    ]);
    else if (route === 'leave') app.innerHTML = renderPlaceholder('請假', '建立請假申請並查看審核狀態。', [
      { title: '新增請假', subtitle: '選擇假別與日期', value: '申請' },
      { title: '申請紀錄', subtitle: '待審核、核准、退回', value: '查看' }
    ]);
    else if (route === 'payroll') app.innerHTML = renderPlaceholder('薪資', '查看工時、薪資與加班明細。', [
      { title: '本月薪資', subtitle: '等待薪資 API 串接', value: '--' },
      { title: '工時明細', subtitle: '正常、加班與休假', value: '查看' }
    ]);
    else if (route === 'manage') app.innerHTML = renderManage();
    else app.innerHTML = renderHome();

    bindEvents();
    updateClock();
    processNfcToken();
  }

  function showActionMessage(message, isError) {
    var target = document.getElementById('actionMessage');
    if (!target) return;
    target.textContent = message;
    target.className = 'inline-message show' + (isError ? ' error' : ' success');
  }

  async function manualClock() {
    if (!navigator.geolocation) {
      showActionMessage('這個裝置不支援定位。', true);
      return;
    }
    showActionMessage('正在取得目前位置…', false);
    navigator.geolocation.getCurrentPosition(async function (position) {
      try {
        await callApi('clockByLocation', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        showActionMessage('定位打卡成功。', false);
      } catch (error) {
        showActionMessage(error.message || '定位打卡失敗。', true);
      }
    }, function (error) {
      showActionMessage(error.message || '無法取得定位，請確認權限。', true);
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  }

  async function scanQr() {
    if (!window.liff || typeof window.liff.scanCodeV2 !== 'function') {
      showActionMessage('目前 LINE／裝置不支援內建 QR 掃描。', true);
      return;
    }
    try {
      var scan = await window.liff.scanCodeV2();
      var token = scan && scan.value ? scan.value : '';
      if (!token) throw new Error('沒有讀取到 QR Code。');
      await callApi('clockByQr', { qr_token: token });
      showActionMessage('QR Code 打卡成功。', false);
    } catch (error) {
      showActionMessage(error.message || 'QR Code 打卡失敗。', true);
    }
  }

  async function processNfcToken(forceMessage) {
    if (state.route !== 'clock') return;
    var params = new URLSearchParams(window.location.search || '');
    var token = params.get('nfc_token') || params.get('nfc');
    if (!token) {
      if (forceMessage) showActionMessage('請將手機靠近公司的 NFC 標籤。', false);
      return;
    }
    if (params.get('nfc_processed') === '1') return;

    try {
      await callApi('clockByNfc', { nfc_token: token });
      params.set('nfc_processed', '1');
      var nextUrl = window.location.pathname + '?' + params.toString() + window.location.hash;
      window.history.replaceState({}, '', nextUrl);
      showActionMessage('NFC 打卡成功。', false);
    } catch (error) {
      showActionMessage(error.message || 'NFC 打卡失敗。', true);
    }
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
    document.querySelectorAll('[data-route]').forEach(function (button) {
      button.addEventListener('click', function () { setRoute(button.getAttribute('data-route')); });
    });
    document.querySelectorAll('[data-action="back"]').forEach(function (button) {
      button.addEventListener('click', function () { setRoute('home'); });
    });
    document.querySelectorAll('[data-action="profile"]').forEach(function (button) {
      button.addEventListener('click', renderProfile);
    });
    var reload = document.querySelector('[data-action="reload"]');
    if (reload) reload.addEventListener('click', function () { window.location.reload(); });
    var manual = document.querySelector('[data-action="manual-clock"]');
    if (manual) manual.addEventListener('click', manualClock);
    var qr = document.querySelector('[data-action="scan-qr"]');
    if (qr) qr.addEventListener('click', scanQr);
    var nfc = document.querySelector('[data-action="check-nfc"]');
    if (nfc) nfc.addEventListener('click', function () { processNfcToken(true); });
  }

  async function start() {
    try {
      state.identity = await window.ANG_HR_MINI_AUTH.initialize();
      var hashRoute = String(window.location.hash || '').replace(/^#/, '');
      state.route = hashRoute || 'home';
      render();
      window.setInterval(updateClock, 1000);
    } catch (error) {
      renderError(error);
    }
  }

  window.addEventListener('hashchange', function () {
    var route = String(window.location.hash || '').replace(/^#/, '') || 'home';
    if (route !== state.route) {
      state.route = route;
      render();
    }
  });

  start();
}(window, document));
