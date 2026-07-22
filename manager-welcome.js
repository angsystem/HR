(function () {
  'use strict';

  var PENDING_PLAN_KEY = 'ang_hr_pending_plan';
  var ACCESS_CONTEXTS_KEY = 'ang_hr_access_contexts';
  var ACTIVE_CONTEXT_KEY = 'ang_hr_active_context';
  var AUTH_CONFIRMATION_KEY = 'ang.login.account-confirmation';

  function safeJsonParse(value, fallback) {
    try { return JSON.parse(value); } catch (_) { return fallback; }
  }

  function getPendingPlan() {
    var plan = safeJsonParse(sessionStorage.getItem(PENDING_PLAN_KEY) || localStorage.getItem(PENDING_PLAN_KEY) || '', null);
    if (!plan || !plan.plan_code) return null;
    if (plan.selectedAt && Date.now() - Number(plan.selectedAt) > 30 * 60 * 1000) {
      sessionStorage.removeItem(PENDING_PLAN_KEY);
      localStorage.removeItem(PENDING_PLAN_KEY);
      return null;
    }
    return plan;
  }

  function savePendingPlan(plan) {
    if (!plan || !plan.plan_code) return;
    plan.selectedAt = Date.now();
    sessionStorage.setItem(PENDING_PLAN_KEY, JSON.stringify(plan));
    localStorage.setItem(PENDING_PLAN_KEY, JSON.stringify(plan));
  }

  function clearPendingPlan() {
    sessionStorage.removeItem(PENDING_PLAN_KEY);
    localStorage.removeItem(PENDING_PLAN_KEY);
  }


  var LOGIN_INPUT_SELECTOR = [
    'input[aria-label="Email、帳號或公司代號"]',
    'input[aria-label="Email或使用者代號"]',
    'input[aria-label="Email或帳號"]'
  ].join(', ');

  function getLoginCard() {
    return document.querySelector('.manager-card.login-unified');
  }

  function getLoginInput(card) {
    return card && card.querySelector(LOGIN_INPUT_SELECTOR);
  }

  function getGasApiUrl() {
    return String((window.ANG_HR_CONFIG && (window.ANG_HR_CONFIG.gasApiUrl || window.ANG_HR_CONFIG.apiBaseUrl)) || '').trim();
  }

  function getDeviceId() {
    var saved = localStorage.getItem('ang_hr_device_id') || localStorage.getItem('ang_device_id');
    if (!saved) {
      saved = 'DEV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 10).toUpperCase();
    }
    localStorage.setItem('ang_hr_device_id', saved);
    localStorage.setItem('ang_device_id', saved);
    return saved;
  }

  function callGasApi(action, payload, timeoutMs) {
    var gasUrl = getGasApiUrl();
    if (!gasUrl) return Promise.reject(new Error('尚未設定驗證 API'));

    return new Promise(function (resolve, reject) {
      var callbackName = 'angEntryAuth_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      var script = document.createElement('script');
      var done = false;

      function cleanup() {
        try { delete window[callbackName]; } catch (err) { window[callbackName] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        cleanup();
        reject(new Error('驗證連線逾時'));
      }, timeoutMs || 20000);

      window[callbackName] = function (response) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        cleanup();
        resolve(response || {});
      };

      script.onerror = function () {
        if (done) return;
        done = true;
        clearTimeout(timer);
        cleanup();
        reject(new Error('無法連線驗證服務'));
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



  function responseAccountExists(response) {
    if (!response) return null;
    var values = [
      response.accountExists, response.account_exists, response.userExists, response.user_exists,
      response.exists, response.found, response.registered, response.isRegistered, response.is_registered
    ];
    for (var i = 0; i < values.length; i += 1) {
      var parsed = parseBooleanFlag(values[i]);
      if (parsed !== null) return parsed;
    }
    if (responseConfirmsAccount(response)) return true;
    return null;
  }

  function responseHasAccountRecord(response) {
    if (!response) return false;
    var explicit = [response.accountExists, response.account_exists, response.userExists, response.user_exists, response.exists, response.found, response.registered, response.isRegistered, response.is_registered];
    for (var i = 0; i < explicit.length; i += 1) {
      if (parseBooleanFlag(explicit[i]) === true) return true;
      if (parseBooleanFlag(explicit[i]) === false) return false;
    }
    if (response.user_id || response.userId || response.employee_id || response.employeeId || response.member_id || response.memberId || response.person_id || response.personId || response.account_id || response.accountId || response.company_id || response.companyId) return true;
    var arrays = ['access_options','accessOptions','contexts','workspaces','accounts','memberships','companies','subscriptions','plans'];
    for (var j = 0; j < arrays.length; j += 1) if (Array.isArray(response[arrays[j]]) && response[arrays[j]].length) return true;
    if (response.data && response.data !== response && typeof response.data === 'object') return responseHasAccountRecord(response.data);
    return false;
  }

  function valueOf(record, keys) {
    if (!record) return '';
    for (var i = 0; i < keys.length; i += 1) {
      var value = record[keys[i]];
      if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
    }
    return '';
  }

  function normalizeAccessOptions(response) {
    var root = response && response.data && typeof response.data === 'object' ? response.data : (response || {});
    var candidates = [];
    ['access_options', 'accessOptions', 'contexts', 'workspaces', 'accounts', 'memberships', 'companies', 'subscriptions', 'plans'].forEach(function (key) {
      if (Array.isArray(root[key])) candidates = candidates.concat(root[key]);
      if (Array.isArray(response && response[key])) candidates = candidates.concat(response[key]);
    });

    if (!candidates.length && (root.company_id || root.companyId || root.plan_code || root.planCode || root.role)) candidates.push(root);
    if (!candidates.length && response && (response.company_id || response.companyId || response.plan_code || response.planCode || response.role)) candidates.push(response);

    var seen = {};
    return candidates.map(function (record, index) {
      if (!record || typeof record !== 'object') return null;
      var companyId = valueOf(record, ['company_id', 'companyId', 'company_code', 'companyCode']);
      var companyName = valueOf(record, ['company_name', 'companyName', 'company_label', 'companyLabel']);
      var planCode = valueOf(record, ['plan_code', 'planCode', 'plan', 'subscription_plan']);
      var planLabel = valueOf(record, ['plan_label', 'planLabel', 'plan_name', 'planName']);
      var role = valueOf(record, ['role', 'member_role', 'memberRole']);
      var family = valueOf(record, ['plan_family', 'planFamily', 'family']);
      var type = valueOf(record, ['scope_type', 'scopeType', 'type', 'kind']);
      var userId = valueOf(record, ['user_id', 'userId', 'employee_id', 'employeeId', 'person_id', 'personId']);
      var token = valueOf(record, ['session_token', 'sessionToken', 'token', 'loginToken']);
      var title = companyName || companyId || planLabel || planCode || valueOf(record, ['label', 'name', 'title']);
      if (!title) return null;
      if (!type) type = companyId ? 'company' : 'plan';
      if (!family && /^personal/i.test(planCode)) family = 'personal';
      if (!family && /^business/i.test(planCode)) family = 'business';
      var key = [type, companyId, planCode, role, userId, title].join('|').toLowerCase();
      if (seen[key]) return null;
      seen[key] = true;
      return {
        id: key || String(index),
        type: type,
        title: title,
        subtitle: [planLabel || planCode, role].filter(Boolean).join('｜'),
        company_id: companyId,
        company_name: companyName,
        plan_code: planCode,
        plan_label: planLabel,
        plan_family: family,
        role: role,
        user_id: userId,
        token: token,
        raw: record
      };
    }).filter(Boolean);
  }

  function rememberAccessOptions(options) {
    if (!Array.isArray(options) || !options.length) return;
    try { localStorage.setItem(ACCESS_CONTEXTS_KEY, JSON.stringify(options)); } catch (_) {}
  }

  function routeForAccess(option) {
    var role = String(option.role || '').toLowerCase();
    var family = String(option.plan_family || '').toLowerCase();
    var type = String(option.type || '').toLowerCase();
    if (type.indexOf('plan') !== -1 || family === 'personal' || /^personal_/.test(option.plan_code || '')) return './personal.html';
    if (/owner|creator|admin|manager|deputy|supervisor|leader/.test(role)) return './admin.html';
    return './employee.html';
  }

  function activateAccessOption(option) {
    if (!option) return;
    try {
      localStorage.setItem(ACTIVE_CONTEXT_KEY, JSON.stringify(option));
      if (option.company_id) {
        ['ang_hr_active_company_id', 'ang_company_id', 'company_id'].forEach(function (key) { localStorage.setItem(key, option.company_id); });
      }
      if (option.user_id) {
        ['ang_hr_active_employee_id', 'ang_user_id', 'ang_employee_id', 'employee_id'].forEach(function (key) { localStorage.setItem(key, option.user_id); });
      }
      if (option.token) {
        ['ang_hr_active_login_token', 'ang_token', 'ang_employee_token', 'session_token'].forEach(function (key) { localStorage.setItem(key, option.token); });
      }
      if (option.role) localStorage.setItem('ang_user_role', option.role);
      if (option.plan_code) localStorage.setItem('ang_hr_active_plan_code', option.plan_code);
    } catch (_) {}

    var target = new URL(routeForAccess(option), window.location.href);
    if (option.company_id) target.searchParams.set('company_id', option.company_id);
    if (option.user_id) {
      target.searchParams.set('id', option.user_id);
      target.searchParams.set('employee_id', option.user_id);
    }
    if (option.token) target.searchParams.set('token', option.token);
    if (option.role) target.searchParams.set('role', option.role);
    if (option.plan_code) target.searchParams.set('plan', option.plan_code);
    target.searchParams.set('_ts', String(Date.now()));
    window.location.href = target.toString();
  }

  function getPostVerifyFlow(card) {
    var body = card && card.querySelector('.unified-login-body');
    if (!body) return null;
    var flow = body.querySelector('.post-verify-flow');
    if (!flow) {
      flow = document.createElement('section');
      flow.className = 'post-verify-flow';
      flow.hidden = true;
      body.appendChild(flow);
    }
    return flow;
  }

  function renderAccessOptions(card, response) {
    var flow = getPostVerifyFlow(card);
    if (!flow) return;
    var options = normalizeAccessOptions(response);
    rememberAccessOptions(options);

    if (options.length === 1) {
      flow.hidden = false;
      flow.className = 'post-verify-flow direct-routing';
      flow.innerHTML = '<strong>已找到可使用的公司／方案</strong><small>只有一個入口，正在直接進入…</small>';
      window.setTimeout(function () { activateAccessOption(options[0]); }, 420);
      return;
    }

    flow.hidden = false;
    flow.className = 'post-verify-flow access-choice-flow';
    if (!options.length) {
      flow.innerHTML = [
        '<strong>帳號驗證完成</strong>',
        '<small>目前尚未收到公司或方案清單，請重新整理帳號權限後再進入。</small>',
        '<button type="button" class="refresh-access-options">重新讀取公司／方案</button>'
      ].join('');
      return;
    }

    flow.innerHTML = '<strong>選擇要進入的公司或方案</strong><small>進入系統後仍可再次切換，不必登出。</small><div class="access-option-list"></div>';
    var list = flow.querySelector('.access-option-list');
    options.forEach(function (option, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'access-option';
      button.dataset.accessIndex = String(index);
      button.innerHTML = '<b>' + escapeHtml(option.title) + '</b><span>' + escapeHtml(option.subtitle || (option.type === 'company' ? '公司工作區' : '個人方案')) + '</span><i>進入 →</i>';
      button.addEventListener('click', function () { activateAccessOption(option); });
      list.appendChild(button);
    });
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function verifiedAuthPayload(response) {
    var saved = safeJsonParse(sessionStorage.getItem(AUTH_CONFIRMATION_KEY) || '', {});
    return Object.assign({}, saved.response || {}, response || {});
  }

  function showBasicProfileStage(card, response, plan) {
    var flow = getPostVerifyFlow(card);
    if (!flow) return;
    card.classList.add('login-plan-registration', 'registration-basic-stage');
    card.classList.remove('registration-payment-stage');
    flow.hidden = false;
    flow.className = 'post-verify-flow plan-registration-flow basic-profile-stage';
    flow.innerHTML = [
      '<div class="registration-stage-title"><b>2</b><span><strong>基本資料</strong><small>最後一步，完成後立即開通。</small></span></div>',
      '<form class="plan-basic-profile-form">',
      '<label>姓名<input required name="display_name" autocomplete="name" placeholder="輸入姓名"></label>',
      '<label>手機<input required name="phone" autocomplete="tel" inputmode="tel" placeholder="輸入手機號碼"></label>',
      plan && plan.family === 'business' ? '<label>公司／團隊名稱<input required name="company_name" autocomplete="organization" placeholder="輸入公司或團隊名稱"></label>' : '',
      '<button type="submit">完成註冊與開通</button>',
      '<small class="registration-status" aria-live="polite"></small>',
      '</form>'
    ].join('');
  }

  function advancePaymentToProfile(card, response, plan) {
    if (!card) return;
    card.classList.add('registration-card-fly');
    window.setTimeout(function () {
      card.classList.remove('registration-card-fly');
      showBasicProfileStage(card, response, plan);
    }, 520);
  }

  function showPlanRegistrationFlow(card, response) {
    var plan = getPendingPlan();
    if (!card || !plan) return;
    var flow = getPostVerifyFlow(card);
    if (!flow) return;

    card.classList.add('login-plan-registration');
    if (plan.is_free) {
      showBasicProfileStage(card, response, plan);
      return;
    }

    card.classList.add('registration-payment-stage');
    card.classList.remove('registration-basic-stage');
    flow.hidden = false;
    flow.className = 'post-verify-flow plan-registration-flow payment-stage';
    flow.innerHTML = [
      '<div class="registration-stage-title"><b>1</b><span><strong>付款資訊</strong><small>' + escapeHtml(plan.label || plan.plan_code) + '｜' + escapeHtml(plan.price || '') + '</small></span></div>',
      '<form class="plan-payment-form">',
      '<label>持卡人姓名<input required name="cardholder" autocomplete="cc-name" placeholder="CARDHOLDER NAME"></label>',
      '<label>信用卡號<input required name="card_number" autocomplete="cc-number" inputmode="numeric" maxlength="23" placeholder="0000 0000 0000 0000"></label>',
      '<div class="payment-row"><label>有效期限<input required name="expiry" autocomplete="cc-exp" inputmode="numeric" maxlength="7" placeholder="MM / YY"></label><label>安全碼<input required name="cvc" autocomplete="cc-csc" inputmode="numeric" maxlength="4" placeholder="CVC"></label></div>',
      '<small class="secure-payment-note">信用卡資料必須由正式付款服務安全代碼化；ANG HR 不會把完整卡號存入瀏覽器或試算表。</small>',
      '<button type="submit">確認付款</button>',
      '<small class="registration-status" aria-live="polite"></small>',
      '</form>'
    ].join('');
  }

  function setPlanRegistrationVerified(card, response, message) {
    if (!card) return;
    card.classList.remove('login-verifying', 'login-awaiting-verification', 'login-verification-empty', 'login-verification-missing', 'login-identifier-valid');
    card.classList.add('login-system-confirmed', 'login-registration-verified');
    card.dataset.accountConfirmed = 'registration';
    var input = getLoginInput(card);
    if (input) card.dataset.confirmedIdentifier = input.value.trim().toLowerCase();
    try {
      sessionStorage.setItem(AUTH_CONFIRMATION_KEY, JSON.stringify({
        identifier: input ? input.value.trim() : '', confirmedAt: Date.now(), response: response || {}, registration: true
      }));
    } catch (_) {}
    setLoginAuthStatus(card, 'success', message || '驗證完成，正在建立新帳號');
    if (card.classList.contains('collapsed')) {
      var toggle = card.querySelector('.manager-card-toggle');
      if (toggle) toggle.click();
    }
    window.setTimeout(function () { showPlanRegistrationFlow(card, response || {}); }, 180);
  }

  function advanceAfterVerification(card, response) {
    var pendingPlan = getPendingPlan();
    var accountExists = responseAccountExists(response);
    if (pendingPlan && !responseHasAccountRecord(response)) {
      showPlanRegistrationFlow(card, response || {});
      return;
    }
    renderAccessOptions(card, response || {});
  }

  function planFromClick(target) {
    var button = target && target.closest ? target.closest('.personal-lite, .business-lite, .personal-select-action, .business-select-action') : null;
    if (!button) return null;
    if (button.classList.contains('personal-lite')) return { plan_code: 'personal_lite', label: 'Personal Lite', family: 'personal', is_free: true, price: 'Free', source: 'plan_card' };
    if (button.classList.contains('business-lite')) return { plan_code: 'business_lite', label: 'Business Lite', family: 'business', is_free: true, price: 'Free', source: 'plan_card' };
    if (button.classList.contains('personal-select-action')) {
      var personalBody = button.closest('.personal-card-body');
      var performance = personalBody && personalBody.classList.contains('performance');
      return { plan_code: performance ? 'personal_performance' : 'personal_solo', label: performance ? 'Personal Performance' : 'Personal Solo', family: 'personal', is_free: false, price: performance ? 'NT$149 / 月' : 'NT$69 / 月', source: 'plan_card' };
    }
    var businessBody = button.closest('.business-card-body');
    var tier = businessBody && businessBody.classList.contains('premium') ? 'premium' : (businessBody && businessBody.classList.contains('pro') ? 'pro' : 'basic');
    var prices = { basic: 'NT$299 / 月', pro: 'NT$599 / 月', premium: 'NT$999 / 月' };
    return { plan_code: 'business_' + tier, label: 'Business ' + tier.charAt(0).toUpperCase() + tier.slice(1), family: 'business', is_free: false, price: prices[tier], source: 'plan_card' };
  }

  function installCarouselCentering() {
    var carousel = document.querySelector('.manager-carousel');
    if (!carousel || carousel.__angCenteringInstalled) return !!carousel;
    carousel.__angCenteringInstalled = true;
    var timer = null;
    function centerNearest(behavior) {
      var cards = Array.prototype.slice.call(carousel.children || []);
      if (!cards.length) return;
      var midpoint = carousel.scrollLeft + carousel.clientWidth / 2;
      var best = cards[0];
      var distance = Infinity;
      cards.forEach(function (card) {
        var cardMid = card.offsetLeft + card.clientWidth / 2;
        var next = Math.abs(midpoint - cardMid);
        if (next < distance) { distance = next; best = card; }
      });
      var left = Math.max(0, best.offsetLeft - (carousel.clientWidth - best.clientWidth) / 2);
      carousel.scrollTo({ left: left, behavior: behavior || 'smooth' });
    }
    carousel.addEventListener('scroll', function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { centerNearest('smooth'); }, 120);
    }, { passive: true });
    ['pointerup', 'touchend'].forEach(function (name) {
      carousel.addEventListener(name, function () { window.setTimeout(function () { centerNearest('smooth'); }, 20); }, { passive: true });
    });
    window.addEventListener('resize', function () { window.setTimeout(function () { centerNearest('auto'); }, 50); });
    return true;
  }

  function installLoginDragLock(card) {
    if (!card || card.__angDragLockInstalled) return !!card;
    card.__angDragLockInstalled = true;
    card.addEventListener('pointerdown', function (event) {
      if (card.classList.contains('login-system-confirmed')) return;
      if (event.target.closest('input, .login-verify-button, .social-login-row button')) return;
      event.preventDefault();
      event.stopPropagation();
      setLoginAuthStatus(card, 'info', '請先完成驗證並確認帳號後，卡片才會解鎖');
    }, true);
    card.querySelectorAll('input, .login-verify-button, .social-login-row button').forEach(function (control) {
      if (control.__angPointerIsolated) return;
      control.__angPointerIsolated = true;
      control.addEventListener('pointerdown', function (event) { event.stopPropagation(); });
    });
    return true;
  }

  function setLoginAuthStatus(card, type, message) {
    if (!card) return;
    var body = card.querySelector('.unified-login-body');
    if (!body) return;

    var status = body.querySelector('.login-auth-status');
    if (!status) {
      status = document.createElement('div');
      status.className = 'login-auth-status';
      status.setAttribute('aria-live', 'polite');
      body.appendChild(status);
    }

    status.className = 'login-auth-status ' + (type || 'info');
    status.textContent = message || '';
  }

  function responseMessage(response) {
    return String((response && (response.message || response.msg || response.errorMessage || response.error)) || '').trim();
  }

  function parseBooleanFlag(value) {
    if (value === true || value === 1 || value === '1') return true;
    if (value === false || value === 0 || value === '0') return false;

    var normalized = String(value === undefined || value === null ? '' : value).trim().toLowerCase();
    if (['true', 'yes', 'y', 'verified', 'exists', 'found', 'registered'].indexOf(normalized) !== -1) return true;
    if (['false', 'no', 'n', 'missing', 'not_found', 'unregistered'].indexOf(normalized) !== -1) return false;
    return null;
  }

  function responseExplicitlyRejectsAccount(response) {
    if (!response) return false;
    if (response.ok === false || response.success === false) return true;

    var explicitValues = [
      response.accountExists,
      response.account_exists,
      response.userExists,
      response.user_exists,
      response.exists,
      response.found,
      response.registered,
      response.isRegistered,
      response.is_registered
    ];

    for (var i = 0; i < explicitValues.length; i += 1) {
      if (parseBooleanFlag(explicitValues[i]) === false) return true;
    }

    var text = [response.status, response.result, response.code, responseMessage(response)]
      .join(' ')
      .trim()
      .toLowerCase();

    return /not[_ -]?found|missing|unknown[_ -]?account|unregistered|not[_ -]?registered|找不到|不存在|未註冊/.test(text);
  }

  function responseConfirmsAccount(response) {
    if (!response || responseExplicitlyRejectsAccount(response)) return false;

    var explicitValues = [
      response.accountExists,
      response.account_exists,
      response.userExists,
      response.user_exists,
      response.exists,
      response.found,
      response.registered,
      response.isRegistered,
      response.is_registered
    ];

    for (var i = 0; i < explicitValues.length; i += 1) {
      if (parseBooleanFlag(explicitValues[i]) === true) return true;
    }

    /* 只有 ANG HR 後端系統 ID、明確內部紀錄，或可登入憑證，才算「系統帳號已確認」。 */
    if (
      response.user_id || response.userId || response.employee_id || response.employeeId ||
      response.member_id || response.memberId || response.person_id || response.personId ||
      response.account_id || response.accountId || response.ang_id || response.angId ||
      response.verify_token || response.verifyToken || response.session_token || response.sessionToken || response.token
    ) return true;

    var records = [response.user, response.account, response.employee, response.member];
    for (var recordIndex = 0; recordIndex < records.length; recordIndex += 1) {
      var record = records[recordIndex];
      if (!record || typeof record !== 'object') continue;
      if (
        record.user_id || record.userId || record.employee_id || record.employeeId ||
        record.member_id || record.memberId || record.person_id || record.personId ||
        record.account_id || record.accountId || record.ang_id || record.angId ||
        record.company_id || record.companyId
      ) return true;
    }

    var status = String(response.status || response.result || response.code || '').trim().toLowerCase();
    return /^(account[_ -]?(?:verified|exists|found)|user[_ -]?(?:exists|found)|member[_ -]?found|registered[_ -]?user)$/.test(status);
  }

  function responseIndicatesVerificationSent(response) {
    if (!response || responseExplicitlyRejectsAccount(response)) return false;
    if (response.ok === true || response.success === true) return true;

    var status = String(response.status || response.result || response.code || '').trim().toLowerCase();
    var message = responseMessage(response).toLowerCase();
    return /sent|delivered|pending|mail|link/.test(status + ' ' + message) || /已寄出|已傳送|請查看信箱|驗證連結/.test(message);
  }

  function setLoginConfirmed(card, response, message) {
    if (!card) return;

    card.classList.remove('login-verifying', 'login-awaiting-verification', 'login-provider-selected', 'login-verification-empty', 'login-verification-missing', 'login-identifier-valid');
    card.classList.add('login-system-confirmed');
    card.dataset.accountConfirmed = 'true';

    var input = getLoginInput(card);
    if (input) card.dataset.confirmedIdentifier = input.value.trim().toLowerCase();

    var button = card.querySelector('.login-verify-button');
    if (button) {
      button.disabled = false;
      button.textContent = '已確認';
    }

    try {
      sessionStorage.setItem(AUTH_CONFIRMATION_KEY, JSON.stringify({
        identifier: input ? input.value.trim() : '',
        confirmedAt: Date.now(),
        response: response || {}
      }));
    } catch (_) {}

    setLoginAuthStatus(card, 'success', message || responseMessage(response) || '帳號已確認');

    if (card.classList.contains('collapsed')) {
      var toggle = card.querySelector('.manager-card-toggle');
      if (toggle) toggle.click();
    }

    window.setTimeout(function () { advanceAfterVerification(card, response || {}); }, 180);
  }

  function clearLoginConfirmation(card, keepStatus) {
    if (!card) return;
    card.classList.remove('login-system-confirmed', 'login-identifier-valid', 'login-verifying', 'login-awaiting-verification', 'login-provider-selected');
    delete card.dataset.accountConfirmed;
    delete card.dataset.confirmedIdentifier;

    var button = card.querySelector('.login-verify-button');
    if (button) {
      button.disabled = false;
      button.textContent = '驗證';
    }

    var guide = card.querySelector('.email-verification-guide');
    if (guide) guide.hidden = true;
    var flow = getPostVerifyFlow(card);
    if (flow) { flow.hidden = true; flow.innerHTML = ''; }
    card.classList.remove('login-plan-registration', 'login-registration-verified', 'registration-payment-stage', 'registration-basic-stage');

    if (!keepStatus) setLoginAuthStatus(card, 'info', '');
  }

  function syncLoginVerificationState() {
    var card = getLoginCard();
    var input = getLoginInput(card);
    if (!card || !input) return false;

    input.setAttribute('aria-label', 'Email或帳號');
    input.setAttribute('placeholder', '輸入 Email 或帳號');

    var current = input.value.trim().toLowerCase();
    if (card.dataset.confirmedIdentifier && current !== card.dataset.confirmedIdentifier) {
      clearLoginConfirmation(card, false);
    }

    return true;
  }

  async function handleLoginVerification(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    var card = getLoginCard();
    var input = getLoginInput(card);
    var guide = card && card.querySelector('.email-verification-guide');
    if (!card || !input) return false;

    var value = input.value.trim();
    clearLoginConfirmation(card, true);
    card.classList.remove('login-verification-empty', 'login-verification-missing');

    if (!value) {
      card.classList.add('login-verification-empty');
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      setLoginAuthStatus(card, 'error', '請先輸入 Email 或帳號');
      return false;
    }

    input.removeAttribute('aria-invalid');
    card.classList.add('login-verifying');

    var verifyButton = card.querySelector('.login-verify-button');
    if (verifyButton) {
      verifyButton.disabled = true;
      verifyButton.textContent = '確認中';
    }

    setLoginAuthStatus(card, 'info', '正在確認此帳號是否存在 ANG HR…');

    try {
      var pendingPlan = getPendingPlan();
      var verificationFlow = pendingPlan ? 'plan_signup' : 'account_login';
      /* Email 一律採點連結驗證；方案入口允許「驗證即註冊」。 */
      var response = await callGasApi('requestEmailCode', {
        email: value,
        identifier: value,
        account: value,
        flow: verificationFlow,
        plan: pendingPlan ? pendingPlan.plan_code : '',
        plan_code: pendingPlan ? pendingPlan.plan_code : '',
        allow_registration: !!pendingPlan,
        create_account_after_verify: !!pendingPlan,
        delivery: 'link',
        verification_mode: 'magic_link',
        device_id: getDeviceId(),
        deviceId: getDeviceId(),
        source: 'current_entry_login',
        returnUrl: window.location.href.split('#')[0],
        return_url: window.location.href.split('#')[0]
      });

      if (responseExplicitlyRejectsAccount(response) && !pendingPlan) {
        throw new Error(responseMessage(response) || 'ANG HR 系統中找不到這個帳號');
      }

      if (guide) guide.hidden = false;

      if (responseConfirmsAccount(response)) {
        setLoginConfirmed(card, response, responseMessage(response) || '帳號已確認；若使用 Email，請到信箱點擊驗證連結');
        return true;
      }

      if (responseIndicatesVerificationSent(response) || (pendingPlan && response && (response.ok === true || response.success === true))) {
        card.classList.remove('login-verifying');
        card.classList.add('login-awaiting-verification');
        setLoginAuthStatus(card, 'info', responseMessage(response) || (pendingPlan ? '驗證連結已寄出；完成驗證後會直接建立帳號' : '驗證連結已寄出；完成驗證並確認為 ANG HR 帳號後才會轉綠'));
        return true;
      }

      throw new Error(responseMessage(response) || (pendingPlan ? '目前無法寄出註冊驗證連結' : '後端尚未確認這個帳號存在 ANG HR'));
    } catch (err) {
      card.classList.remove('login-verifying');
      card.classList.add('login-verification-missing');
      if (guide) guide.hidden = true;
      setLoginAuthStatus(card, 'error', err && err.message ? err.message : '驗證服務連線失敗');
      return false;
    } finally {
      if (verifyButton && !card.classList.contains('login-system-confirmed')) {
        verifyButton.disabled = false;
        verifyButton.textContent = card.classList.contains('login-awaiting-verification') ? '重新寄送' : '驗證';
      }
    }
  }

  function startOAuth(provider, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    var card = getLoginCard();
    if (card) {
      card.classList.add('login-provider-selected');
      setLoginAuthStatus(card, 'info', '正在開啟 ' + provider.toUpperCase() + ' 安全驗證…');
    }

    if (provider === 'facebook' && window.ANG_FACEBOOK_AUTH && typeof window.ANG_FACEBOOK_AUTH.start === 'function') {
      window.ANG_FACEBOOK_AUTH.start();
      return;
    }

    var gasUrl = getGasApiUrl();
    if (!gasUrl) {
      setLoginAuthStatus(card, 'error', '驗證服務尚未設定');
      return;
    }

    var actionMap = {
      google: 'requestGoogleAuth',
      line: 'requestLineAuth',
      facebook: 'requestFacebookAuth',
      apple: 'requestAppleAuth'
    };

    var returnUrl = new URL(window.location.href);
    returnUrl.search = '';
    returnUrl.hash = '';
    returnUrl.searchParams.set('auth_done', '1');
    returnUrl.searchParams.set('provider', provider);
    returnUrl.searchParams.set('flow', 'admin_login');

    var pendingPlan = getPendingPlan();
    var authFlow = pendingPlan ? 'plan_signup' : 'account_login';
    var body = {
      action: actionMap[provider],
      provider: provider,
      flow: authFlow,
      plan: pendingPlan ? pendingPlan.plan_code : '',
      plan_code: pendingPlan ? pendingPlan.plan_code : '',
      allow_registration: !!pendingPlan,
      device_id: getDeviceId(),
      deviceId: getDeviceId(),
      source: 'current_entry_login',
      returnUrl: returnUrl.toString(),
      return_url: returnUrl.toString(),
      redirectUri: returnUrl.toString(),
      redirect_uri: returnUrl.toString(),
      callbackUrl: returnUrl.toString(),
      callback_url: returnUrl.toString(),
      direct: '1'
    };

    localStorage.setItem('ang_pending_auth', JSON.stringify({ provider: provider, flow: authFlow, plan: pendingPlan ? pendingPlan.plan_code : '', savedAt: Date.now() }));

    var url = new URL(gasUrl, window.location.href);
    Object.keys(body).forEach(function (key) {
      if (body[key] !== '' && body[key] !== undefined && body[key] !== null) {
        url.searchParams.set(key, String(body[key]));
      }
    });
    window.location.href = url.toString();
  }

  function handleAuthCallback() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('auth_done') !== '1') return;

    var error = params.get('error') || params.get('error_message') || params.get('message');
    var callbackData = {};
    [
      'verify_token', 'token', 'session_token', 'email', 'user_id', 'employee_id', 'member_id', 'company_id', 'role',
      'account_exists', 'user_exists', 'registered', 'verified', 'success', 'provider'
    ].forEach(function (key) {
      var value = params.get(key);
      if (value) {
        callbackData[key] = value;
        localStorage.setItem('ang_' + key, value);
      }
    });

    localStorage.removeItem('ang_pending_auth');

    setTimeout(function () {
      var card = getLoginCard();
      if (!card) return;

      if (error && !/success|verified/i.test(error)) {
        setLoginAuthStatus(card, 'error', error);
        return;
      }

      var pendingPlan = getPendingPlan();
      var callbackIdentityVerified = !!(
        callbackData.verify_token || callbackData.token || callbackData.session_token ||
        parseBooleanFlag(callbackData.verified) === true || parseBooleanFlag(callbackData.success) === true
      );
      var callbackConfirmed = !!(
        callbackData.verify_token || callbackData.token || callbackData.session_token ||
        callbackData.user_id || callbackData.employee_id || callbackData.member_id ||
        parseBooleanFlag(callbackData.account_exists) === true ||
        parseBooleanFlag(callbackData.user_exists) === true ||
        parseBooleanFlag(callbackData.registered) === true
      );

      if (!callbackConfirmed && !(pendingPlan && callbackIdentityVerified)) {
        setLoginAuthStatus(card, 'error', '驗證已返回，但尚未確認此帳號存在 ANG HR');
        return;
      }

      var input = getLoginInput(card);
      if (input && callbackData.email) {
        var setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(input, callbackData.email);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }

      if (pendingPlan && !responseHasAccountRecord(callbackData)) {
        setPlanRegistrationVerified(card, callbackData, '驗證完成，將直接建立新帳號');
      } else {
        setLoginConfirmed(card, callbackData, '驗證成功，已確認 ANG HR 帳號');
      }

      try {
        var cleanUrl = new URL(window.location.href);
        ['auth_done', 'provider', 'flow', 'verify_token', 'token', 'session_token', 'email', 'user_id', 'employee_id', 'member_id', 'company_id', 'role', 'account_exists', 'user_exists', 'registered', 'verified', 'success', 'error', 'error_message', 'message'].forEach(function (key) {
          cleanUrl.searchParams.delete(key);
        });
        window.history.replaceState({}, document.title, cleanUrl.toString());
      } catch (_) {}
    }, 250);
  }

  function googleIcon() {
    return '<svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.19v3.15C3.17 21.3 7.22 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.19C.43 8.11 0 9.83 0 12s.43 3.89 1.19 5.42l4.09-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.22 0 3.17 2.7 1.19 6.58l4.09 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>';
  }

  function lineIcon() {
    return '<svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.631-.63.631H17.61v1.124h1.755zm-3.666 4.16c.071.132.031.3-.1.381-.059.034-.127.051-.195.051-.088 0-.174-.031-.24-.09l-2.316-2.072v1.942c0 .345-.282.629-.63.629-.345 0-.627-.284-.627-.629V8.108c0-.345.282-.63.627-.63.348 0 .63.285.63.63v4.062l2.158-1.933c.12-.108.3-.1.411.02.108.121.1.301-.01.412l-2.022 1.812 2.302 2.061zm-6.273-5.419c.345 0 .627.285.627.63v4.062c0 .345-.282.629-.627.629-.349 0-.63-.284-.63-.629V8.604c0-.345.281-.63.63-.63zm-3.601 3.432H4.499V8.604c0-.345-.282-.63-.627-.63-.349 0-.63.285-.63.63v4.692c0 .345.281.629.63.629h2.158c.349 0 .63-.285.63-.63 0-.345-.281-.629-.63-.629zM12 0C5.373 0 0 4.627 0 10.325c0 5.011 4.185 9.215 9.843 10.021.384.07.495.168.495.385 0 .19-.077.728-.117 1.341-.038.599-.176 2.247.773 2.743.95.496 1.724-.438 2.91-1.391 1.186-.953 6.326-5.174 7.202-6.195 1.547-1.785 2.394-4.116 2.394-6.507C24 4.627 18.627 0 12 0z"/></svg>';
  }

  function facebookIcon() {
    return '<svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.6 22v-9h3l.45-3.5H13.6V7.27c0-1.01.28-1.7 1.74-1.7h1.86V2.44c-.32-.04-1.43-.14-2.72-.14-2.69 0-4.53 1.64-4.53 4.66V9.5H6.9V13h3.05v9h3.65z"/></svg>';
  }

  function appleIcon() {
    return '<svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.95 6.07c.56-.69.94-1.65.84-2.61-.83.04-1.84.55-2.43 1.24-.52.6-.98 1.58-.85 2.52.93.07 1.88-.47 2.44-1.15z"/></svg>';
  }

  function bindProvider(button, provider) {
    if (!button || button.__angAuthBound) return;
    button.__angAuthBound = true;
    button.addEventListener('click', function (event) {
      startOAuth(provider, event);
    });
  }

  function addLoginActions() {
    var card = getLoginCard();
    var body = card && card.querySelector('.unified-login-body');
    if (!body) return false;

    var pendingPlan = getPendingPlan();
    var description = body.querySelector('.login-description');
    if (description) description.textContent = pendingPlan
      ? '完成 Email 或第三方驗證；若尚無帳號，這次驗證會直接建立帳號。'
      : '輸入 Email 或帳號確認是否存在；完成驗證後選擇要進入的公司或方案。';

    var passwordLabel = body.querySelector('.login-email');
    if (passwordLabel) {
      passwordLabel.hidden = true;
      passwordLabel.setAttribute('aria-hidden', 'true');
    }
    var legacyLoginAction = body.querySelector('.card-main-action');
    if (legacyLoginAction) {
      legacyLoginAction.hidden = true;
      legacyLoginAction.setAttribute('aria-hidden', 'true');
      legacyLoginAction.tabIndex = -1;
    }

    var hint = body.querySelector('.email-verification-hint');
    if (!hint) {
      hint = document.createElement('section');
      hint.className = 'email-verification-hint';
      body.appendChild(hint);
    }
    hint.innerHTML = '<strong>Email 驗證</strong><span>按下驗證後，到信箱點擊 ANG HR 連結；不需要輸入密碼或驗證碼。</span>';

    if (!body.querySelector('.login-verify-button')) {
      var verifyButton = document.createElement('button');
      verifyButton.type = 'button';
      verifyButton.className = 'login-verify-button';
      verifyButton.textContent = '驗證';
      verifyButton.addEventListener('click', handleLoginVerification);
      body.appendChild(verifyButton);
    }

    var socialRow = body.querySelector('.social-login-row');
    if (!socialRow) {
      socialRow = document.createElement('div');
      socialRow.className = 'social-login-row';
      socialRow.setAttribute('aria-label', '其他登入方式');
      body.appendChild(socialRow);
    }

    var providers = [
      { key: 'google', className: 'google-login', label: 'Google', icon: googleIcon() },
      { key: 'line', className: 'line-login', label: 'LINE', icon: lineIcon() },
      { key: 'facebook', className: 'facebook-login', label: 'Facebook', icon: facebookIcon() },
      { key: 'apple', className: 'apple-login', label: 'Apple', icon: appleIcon() }
    ];

    providers.forEach(function (provider) {
      var button = socialRow.querySelector('.' + provider.className + ', [data-provider="' + provider.key + '"]');
      if (!button) {
        button = document.createElement('button');
        socialRow.appendChild(button);
      }
      button.type = 'button';
      button.className = provider.className;
      button.setAttribute('data-provider', provider.key);
      if (provider.key === 'facebook') button.setAttribute('data-ang-facebook-login', 'true');
      button.setAttribute('aria-label', '使用 ' + provider.label + ' 登入');
      button.setAttribute('title', provider.label);
      button.innerHTML = provider.icon + '<span>' + provider.label + '</span>';
      bindProvider(button, provider.key);
      socialRow.appendChild(button);
    });

    socialRow.setAttribute('data-provider-order', 'google-line-facebook-apple');

    var guide = body.querySelector('.email-verification-guide');
    if (!guide) {
      guide = document.createElement('section');
      guide.className = 'email-verification-guide';
      guide.hidden = true;
      guide.setAttribute('aria-live', 'polite');
      body.appendChild(guide);
    }

    guide.innerHTML = [
      '<strong>請前往 Email 信箱完成驗證</strong>',
      '<div class="verification-guide-steps">',
      '<span><i aria-hidden="true">✉</i><b>1</b><em>打開 Email 信箱</em></span>',
      '<span><i aria-hidden="true">↗</i><b>2</b><em>點擊 ANG HR 驗證連結</em></span>',
      '<span><i aria-hidden="true">✓</i><b>3</b><em>自動返回 ANG HR</em></span>',
      '</div>',
      '<small>不需要另外輸入驗證碼；若沒有看到信件，請檢查垃圾郵件匣。</small>'
    ].join('');

    getPostVerifyFlow(card);
    installLoginDragLock(card);
    syncLoginVerificationState();
    return true;
  }

  function replaceExactText(root, oldText, newText) {
    if (!root) return false;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim() === oldText) {
        node.nodeValue = node.nodeValue.replace(oldText, newText);
        return true;
      }
    }
    return false;
  }

  function syncPlanCardCopy() {
    var card = document.querySelector('.manager-card.free');
    if (!card) return false;

    var top = card.querySelector('.plan-card-top');
    var eyebrow = top && top.querySelector('span');
    var price = top && top.querySelector('b');
    var title = card.querySelector('h2');

    card.dataset.planCategory = 'lite';
    card.dataset.planPrice = 'free';
    if (eyebrow && eyebrow.textContent !== '方案類別') eyebrow.textContent = '方案類別';
    if (price && price.textContent !== 'Free') price.textContent = 'Free';
    if (title && title.textContent !== 'Lite') title.textContent = 'Lite';

    var personal = card.querySelector('.personal-lite');
    var business = card.querySelector('.business-lite');
    replaceExactText(personal, 'Personal Lite', 'Personal');
    replaceExactText(business, 'Business Lite', 'Business');

    return true;
  }

  function addWelcomeMessage() {
    var encouragement = document.querySelector('.manager-card.intro .encouragement-message');
    if (!encouragement) return false;

    if (!encouragement.previousElementSibling || !encouragement.previousElementSibling.classList.contains('manager-welcome-message')) {
      var message = document.createElement('div');
      message.className = 'manager-welcome-message';
      message.innerHTML = '<span class="manager-welcome-title">歡迎回到 ANG HR 系統</span>';
      encouragement.parentNode.insertBefore(message, encouragement);

      var prompt = document.createElement('span');
      prompt.className = 'manager-welcome-prompt';
      prompt.textContent = '請滑動卡片選擇登入或查看方案';
      encouragement.insertAdjacentElement('afterend', prompt);
    }

    var logoMessage = document.querySelector('.manager-logo-encouragement');
    if (!logoMessage) {
      logoMessage = document.createElement('div');
      logoMessage.className = 'manager-logo-encouragement';
      logoMessage.setAttribute('aria-live', 'polite');
      var landing = document.querySelector('main.landing');
      if (!landing) return false;
      landing.appendChild(logoMessage);

      new MutationObserver(function () {
        var liveText = logoMessage.querySelector('span');
        if (!liveText) {
          liveText = document.createElement('span');
          logoMessage.replaceChildren(liveText);
        }
        liveText.textContent = encouragement.textContent;
      }).observe(encouragement, { childList: true, characterData: true, subtree: true });
    }

    var logoText = logoMessage.querySelector('span');
    if (!logoText) {
      logoText = document.createElement('span');
      logoMessage.replaceChildren(logoText);
    }
    logoText.textContent = encouragement.textContent;
    return true;
  }

  function applyAllEntryPatches() {
    var welcomeReady = addWelcomeMessage();
    var loginReady = addLoginActions();
    var planReady = syncPlanCardCopy();
    var centerReady = installCarouselCentering();
    return welcomeReady && loginReady && planReady && centerReady;
  }

  function observeCardRestores() {
    var carousel = document.querySelector('.manager-carousel');
    if (!carousel || carousel.__angRestoreObserver) return;

    carousel.__angRestoreObserver = new MutationObserver(function () {
      window.requestAnimationFrame(applyAllEntryPatches);
    });

    carousel.__angRestoreObserver.observe(carousel, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-pressed']
    });
  }

  function observeUntilReady() {
    if (applyAllEntryPatches()) {
      observeCardRestores();
      return;
    }

    var observer = new MutationObserver(function () {
      if (applyAllEntryPatches()) {
        observer.disconnect();
        observeCardRestores();
      }
    });

    observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
  }

  document.addEventListener('input', function (event) {
    if (event.target.matches(LOGIN_INPUT_SELECTOR)) {
      setTimeout(syncLoginVerificationState, 0);
    }
  });

  /* 未輸入／未確認帳號時，不允許直接把登入卡拉開。 */
  document.addEventListener('click', function (event) {
    var card = event.target.closest('.manager-card.login-unified');
    if (!card || card.classList.contains('login-system-confirmed')) return;
    if (event.target.closest('.login-verify-button, .social-login-row button, input')) return;
    if (event.target.closest('.manager-card-toggle')) {
      event.preventDefault();
      event.stopPropagation();
      setLoginAuthStatus(card, 'info', '請先輸入帳號按「驗證」，或選擇下方驗證方式');
    }
  }, true);

  document.addEventListener('click', function (event) {
    var selectedPlan = planFromClick(event.target);
    if (selectedPlan) savePendingPlan(selectedPlan);
  }, true);

  document.addEventListener('click', function (event) {
    var card = event.target.closest('.manager-card.collapsed.free, .manager-card.collapsed.personal, .manager-card.collapsed.business');
    if (!card || event.target.closest('.manager-card-toggle, .card-main-action, button')) return;

    setTimeout(function () {
      if (!card.classList.contains('collapsed')) return;
      var toggle = card.querySelector('.manager-card-toggle');
      if (toggle) toggle.click();
    }, 0);
  });

  window.addEventListener('ANG_HR_AUTH_VERIFIED', function (event) {
    var detail = event && event.detail ? event.detail : {};
    var pendingPlan = getPendingPlan();
    if (pendingPlan && !responseHasAccountRecord(detail) && (parseBooleanFlag(detail.verified) === true || parseBooleanFlag(detail.success) === true || detail.verify_token || detail.token)) {
      setPlanRegistrationVerified(getLoginCard(), detail, responseMessage(detail) || '驗證完成，將直接建立新帳號');
    } else if (responseConfirmsAccount(detail)) {
      setLoginConfirmed(getLoginCard(), detail, responseMessage(detail) || '驗證成功，已確認 ANG HR 帳號');
    }
  });

  window.addEventListener('ANG_HR_AUTH_FAILED', function (event) {
    var detail = event && event.detail ? event.detail : {};
    setLoginAuthStatus(getLoginCard(), 'error', detail.message || '驗證失敗');
  });

  document.addEventListener('submit', async function (event) {
    var paymentForm = event.target.closest && event.target.closest('.plan-payment-form');
    if (paymentForm) {
      event.preventDefault();
      if (!paymentForm.reportValidity()) return;
      var card = getLoginCard();
      var plan = getPendingPlan();
      var status = paymentForm.querySelector('.registration-status');
      var submit = paymentForm.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      if (status) status.textContent = '正在連接安全付款服務…';
      try {
        var result = null;
        if (window.ANG_HR_PAYMENT && typeof window.ANG_HR_PAYMENT.start === 'function') {
          result = await window.ANG_HR_PAYMENT.start({ plan: plan, form: paymentForm, auth: verifiedAuthPayload({}) });
        } else {
          result = await callGasApi('createPlanCheckout', {
            plan: plan ? plan.plan_code : '', plan_code: plan ? plan.plan_code : '',
            verify_token: valueOf(verifiedAuthPayload({}), ['verify_token', 'verifyToken', 'token']),
            return_url: window.location.href.split('#')[0] + '?payment_success=1'
          });
        }
        var paid = result && (parseBooleanFlag(result.paid) === true || parseBooleanFlag(result.success) === true || /paid|success/.test(String(result.status || '').toLowerCase()));
        var checkoutUrl = result && (result.checkout_url || result.checkoutUrl || result.payment_url || result.paymentUrl);
        if (checkoutUrl) { window.location.href = checkoutUrl; return; }
        if (!paid) throw new Error(responseMessage(result) || '付款服務尚未完成設定，無法送出信用卡資料');
        advancePaymentToProfile(card, result, plan);
      } catch (err) {
        if (status) status.textContent = err && err.message ? err.message : '付款失敗，請稍後再試';
        if (submit) submit.disabled = false;
      }
      return;
    }

    var profileForm = event.target.closest && event.target.closest('.plan-basic-profile-form');
    if (profileForm) {
      event.preventDefault();
      if (!profileForm.reportValidity()) return;
      var card = getLoginCard();
      var plan = getPendingPlan();
      var status = profileForm.querySelector('.registration-status');
      var submit = profileForm.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      if (status) status.textContent = '正在建立帳號與開通方案…';
      var data = new FormData(profileForm);
      try {
        var result = await callGasApi('completePlanRegistration', {
          plan: plan ? plan.plan_code : '', plan_code: plan ? plan.plan_code : '',
          display_name: String(data.get('display_name') || '').trim(),
          phone: String(data.get('phone') || '').trim(),
          company_name: String(data.get('company_name') || '').trim(),
          verify_token: valueOf(verifiedAuthPayload({}), ['verify_token', 'verifyToken', 'token']),
          device_id: getDeviceId()
        });
        if (!result || responseExplicitlyRejectsAccount(result)) throw new Error(responseMessage(result) || '帳號建立失敗');
        clearPendingPlan();
        card.classList.add('registration-complete');
        if (status) status.textContent = '完成，正在進入 ANG HR…';
        var options = normalizeAccessOptions(result);
        if (options.length) {
          rememberAccessOptions(options);
          window.setTimeout(function () { activateAccessOption(options[0]); }, 450);
        } else {
          window.setTimeout(function () { renderAccessOptions(card, result); }, 350);
        }
      } catch (err) {
        if (status) status.textContent = err && err.message ? err.message : '建立帳號失敗，請稍後再試';
        if (submit) submit.disabled = false;
      }
    }
  });

  document.addEventListener('click', function (event) {
    var refresh = event.target.closest && event.target.closest('.refresh-access-options');
    if (!refresh) return;
    var confirmation = safeJsonParse(sessionStorage.getItem(AUTH_CONFIRMATION_KEY) || '', {});
    renderAccessOptions(getLoginCard(), confirmation.response || {});
  });

  window.addEventListener('ANG_HR_PAYMENT_SUCCESS', function (event) {
    var detail = event && event.detail ? event.detail : {};
    advancePaymentToProfile(getLoginCard(), detail, getPendingPlan());
  });

  function handlePaymentCallback() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('payment_success') !== '1') return;
    window.setTimeout(function () { advancePaymentToProfile(getLoginCard(), {}, getPendingPlan()); }, 300);
  }

  function start() {
    observeUntilReady();
    handleAuthCallback();
    handlePaymentCallback();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}());


/* ANG HR v0.7.0｜入口詳細介紹、方案標語與驗證狀態 */
(function () {
  'use strict';

  var BUSINESS_SLOGANS = {
    basic: '核心管理・簡單開始',
    pro: '進階協作・管理更完整',
    premium: '完整權限・彈性最高'
  };

  var PLAN_SUMMARIES = {
    free: '免費也能先完成基礎打卡、排班與工時管理。需要更多資料、薪資、權限或分析時，再升級方案或搭配 Module。',
    solo: '把個人的排班、工時、打卡、薪資、收入、請假、提醒與日常紀錄集中管理。',
    performance: '包含 Solo 全部功能，再加入目標與 KPI、績效週期、自評、評核、一對一回饋、趨勢分析與績效報表。',
    basic: '適合剛開始數位化管理的店家與團隊，聚焦員工主檔、排班、定位打卡、出勤紀錄與基本管理。',
    pro: '包含 Basic 核心功能，再加入請假補卡審核、公告、薪資、加班津貼、支援打卡點、更多主管權限與報表。',
    premium: '包含 Pro 全部功能，再加入多公司／多分店、完整七層權限、進階分析、自訂流程、安全稽核與最高擴充彈性。'
  };

  function setText(node, text) {
    if (node && node.textContent !== text) node.textContent = text;
  }

  function selectedPlanKey(card) {
    if (!card) return '';
    if (card.classList.contains('free')) return 'free';
    if (card.classList.contains('personal')) {
      var personal = card.querySelector('.personal-option[aria-pressed="true"], .personal-option.selected');
      return personal && personal.classList.contains('performance-option') ? 'performance' : 'solo';
    }
    if (card.classList.contains('business')) {
      var business = card.querySelector('.business-option[aria-pressed="true"], .business-option.selected');
      if (business && business.classList.contains('premium-option')) return 'premium';
      if (business && business.classList.contains('pro-option')) return 'pro';
      return 'basic';
    }
    return '';
  }

  function patchBusinessSlogans() {
    var options = document.querySelectorAll('.manager-card.business .business-option');
    for (var i = 0; i < options.length; i += 1) {
      var key = options[i].classList.contains('premium-option') ? 'premium' : (options[i].classList.contains('pro-option') ? 'pro' : 'basic');
      var span = options[i].querySelector('span');
      setText(span, BUSINESS_SLOGANS[key]);
      options[i].setAttribute('aria-label', (options[i].querySelector('strong') ? options[i].querySelector('strong').textContent : key) + '：' + BUSINESS_SLOGANS[key]);
    }
  }

  function patchCardCopy() {
    var freeCard = document.querySelector('.manager-card.free');
    var personalCard = document.querySelector('.manager-card.personal');
    var businessCard = document.querySelector('.manager-card.business');
    var freeP = freeCard && freeCard.querySelector('.free-card-body > p');
    var personalP = personalCard && personalCard.querySelector('.personal-card-body > p');
    var businessP = businessCard && businessCard.querySelector('.business-card-body > p');
    setText(freeP, '先從需要的功能開始；之後可升級方案，或依需求搭配 Module。');
    setText(personalP, '從 Solo 的個人工時管理，到 Performance 的目標、績效與成長分析。');
    setText(businessP, '依管理深度選擇方案；人數與額外功能可用 Module 彈性增加。');
  }

  function patchPlanSummary(card) {
    if (!card || card.classList.contains('intro') || card.classList.contains('login-unified')) return;
    var body = card.querySelector('.manager-card-body');
    if (!body) return;
    var key = selectedPlanKey(card);
    if (!PLAN_SUMMARIES[key]) return;
    var summary = body.querySelector('.ang-v070-plan-summary');
    if (!summary) {
      summary = document.createElement('div');
      summary.className = 'ang-v070-plan-summary';
      var options = body.querySelector('.lite-options, .personal-options, .business-options');
      if (options) body.insertBefore(summary, options);
      else body.appendChild(summary);
    }
    summary.setAttribute('data-plan', key);
    setText(summary, PLAN_SUMMARIES[key]);
  }

  function featureSpans(items) {
    return items.map(function (item) { return '<span>' + item + '</span>'; }).join('');
  }

  function overviewMarkup() {
    var business = ['員工主檔','排班發布','GPS／QR／NFC','支援打卡點','週／月選休','請假補卡','加班津貼','薪資估算','公告留言','公司／分店','七層權限','營運報表','資料上傳','歷史紀錄','工作區切換','安全稽核'];
    var performance = ['個人排班','工時打卡','薪資收入','週領／月領','行事曆提醒','請假補卡','目標 KPI','績效週期','自評／評核','一對一回饋','趨勢分析','績效報表','資料備份','日夜模式'];
    return [
      '<div class="ang-overview-kicker">ANG HR v0.7.0｜完整功能總覽</div>',
      '<h2>一套系統，照現在的需要開始</h2>',
      '<p class="ang-overview-lead">ANG HR 將 Business 企業管理與 Personal Performance 個人成長整合在同一平台。從排班、打卡、請假、薪資，到權限、分店、績效與報表，都能逐步開啟。</p>',
      '<div class="ang-overview-columns">',
        '<section class="ang-overview-section"><strong>Business 企業管理</strong><small>涵蓋 Basic、Pro、Premium 的主要能力。</small><div class="ang-overview-feature-grid">', featureSpans(business), '</div></section>',
        '<section class="ang-overview-section"><strong>Personal Performance</strong><small>包含 Solo 的日常管理與完整績效成長功能。</small><div class="ang-overview-feature-grid">', featureSpans(performance), '</div></section>',
      '</div>',
      '<section class="ang-overview-module"><b>＋</b><div><strong>方案 + Modules，可合在一起使用</strong><small>先選最符合現在的方案，再加需要的 Module，不必為單一功能直接購買最大方案。模組可彼此搭配，也能與原方案合併。現在先介紹「人數模組」：需要幾人就增加幾人，不必一開始買大量名額；其他功能模組後續上架。</small></div></section>',
      '<div class="ang-overview-actions"><button type="button" data-ang-go-card="login">登入系統</button><button type="button" data-ang-go-card="personal">Personal</button><button type="button" data-ang-go-card="business">Business</button></div>'
    ].join('');
  }

  function patchOverview() {
    var card = document.querySelector('.manager-card.intro.expanded');
    var modal = card && card.querySelector('.feature-modal-inline');
    if (!modal) return;
    if (modal.getAttribute('data-ang-v070') === 'true') return;
    modal.setAttribute('data-ang-v070', 'true');
    modal.classList.add('ang-v070-overview');
    modal.innerHTML = overviewMarkup();
  }

  function centerCard(key) {
    var carousel = document.querySelector('.manager-carousel');
    var target = document.querySelector('.manager-card[data-manager-card="' + key + '"]');
    if (!carousel || !target) return;
    var intro = document.querySelector('.manager-card.intro.expanded .manager-card-toggle');
    if (intro) intro.click();
    window.setTimeout(function () {
      var left = target.offsetLeft - (carousel.clientWidth - target.clientWidth) / 2;
      carousel.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
    }, 60);
  }

  function applyV070() {
    var landing = document.querySelector('main.landing');
    if (landing) landing.setAttribute('data-ang-version', '0.7.0');
    patchBusinessSlogans();
    patchCardCopy();
    var cards = document.querySelectorAll('.manager-card.free, .manager-card.personal, .manager-card.business');
    for (var i = 0; i < cards.length; i += 1) patchPlanSummary(cards[i]);
    patchOverview();
  }

  function syncFailureFromStatus() {
    var card = document.querySelector('.manager-card.login-unified');
    if (!card || card.classList.contains('login-system-confirmed')) return;
    var error = card.querySelector('.login-auth-status.error');
    if (error && String(error.textContent || '').trim()) card.classList.add('login-system-failed');
  }

  document.addEventListener('click', function (event) {
    var go = event.target.closest && event.target.closest('[data-ang-go-card]');
    if (go) {
      event.preventDefault();
      centerCard(go.getAttribute('data-ang-go-card'));
      return;
    }
    if (event.target.closest && event.target.closest('.login-verify-button, .social-login-row button')) {
      var card = document.querySelector('.manager-card.login-unified');
      if (card) card.classList.remove('login-system-failed');
    }
  }, true);

  document.addEventListener('input', function (event) {
    if (event.target.matches && event.target.matches('input[aria-label="Email或帳號"], input[aria-label="Email、帳號或公司代號"], input[aria-label="Email或使用者代號"]')) {
      var card = document.querySelector('.manager-card.login-unified');
      if (card) card.classList.remove('login-system-failed');
    }
  });

  window.addEventListener('ANG_HR_AUTH_FAILED', function () {
    var card = document.querySelector('.manager-card.login-unified');
    if (card) {
      card.classList.remove('login-system-confirmed');
      card.classList.add('login-system-failed');
    }
  });

  window.addEventListener('ANG_HR_AUTH_VERIFIED', function () {
    var card = document.querySelector('.manager-card.login-unified');
    if (card) card.classList.remove('login-system-failed');
  });

  function startV070() {
    applyV070();
    var root = document.getElementById('root') || document.body;
    var observer = new MutationObserver(function () {
      window.requestAnimationFrame(function () {
        applyV070();
        syncFailureFromStatus();
      });
    });
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class','aria-pressed'] });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startV070);
  else startV070();
}());


/* ANG HR v0.7.0｜互動式圖文介紹＋展開後 Email 說明 */
(function () {
  'use strict';

  var PLAN_DETAILS = {
    free: { kicker:'LITE｜FREE', title:'先從真正需要的功能開始', body:'免費方案保留基礎打卡、排班與工時紀錄，先把每天會用到的流程建立起來，再依需要升級或加 Module。', tags:['基礎打卡','排班','工時紀錄','40 天歷史'], icon:'free' },
    solo: { kicker:'PERSONAL｜SOLO', title:'一個人的工作，也值得被好好管理', body:'把個人排班、打卡、工時、請假、薪資收入、週領與月領紀錄集中在同一個地方，不需要主管審核。', tags:['個人排班','薪資收入','提醒行事曆','請假補卡'], icon:'solo' },
    performance: { kicker:'PERSONAL｜PERFORMANCE', title:'從記錄工作，進一步看見成長', body:'包含 Solo 的日常管理，再加入目標、KPI、績效週期、自評、評核、一對一回饋、趨勢與報表。', tags:['KPI 目標','績效週期','成長趨勢','完整報表'], icon:'performance' },
    basic: { kicker:'BUSINESS｜BASIC', title:'核心管理先上線，團隊立即能用', body:'聚焦員工主檔、排班、定位打卡、出勤與基本管理，適合第一次把紙本或群組流程搬進系統的店家與團隊。', tags:['員工主檔','排班發布','GPS／QR','基本出勤'], icon:'business' },
    pro: { kicker:'BUSINESS｜PRO', title:'把審核、薪資與跨店協作接起來', body:'包含 Basic 核心功能，再加入請假補卡審核、公告、薪資、加班津貼、臨時支援打卡點、更多主管權限與報表。', tags:['審核流程','薪資津貼','支援打卡點','管理報表'], icon:'pro' },
    premium: { kicker:'BUSINESS｜PREMIUM', title:'完整權限與最高擴充彈性', body:'包含 Pro 全部功能，再加入多公司／多分店、七層權限、進階分析、自訂流程、安全稽核與完整的企業管理能力。', tags:['多公司分店','七層權限','進階分析','安全稽核'], icon:'premium' }
  };

  var OVERVIEW_DETAILS = {
    overview: { accent:'#5fd7ed', kicker:'ANG HR v0.7.0｜完整總覽', title:'從一個人的工時，到整間公司的管理', body:'Business 與 Personal Performance 幾乎涵蓋 ANG HR 的完整核心能力：排班、打卡、請假、薪資、權限、分店、績效、提醒與報表，都在同一個平台裡逐步開啟。', tags:['排班與打卡','薪資與出勤','權限與分店','績效與報表','提醒與公告','資料與安全'], note:'不用一開始把所有功能都買齊；先選最符合現在的方案，再依需求擴充。', icon:'overview' },
    business: { accent:'#4fa6e8', kicker:'BUSINESS｜企業管理', title:'讓每天的管理流程真正串在一起', body:'從員工主檔、排班發布、GPS／QR／NFC 打卡，到週月選休、請假補卡、加班津貼、薪資估算、公司分店、七層權限與營運報表。', tags:['員工主檔','排班發布','GPS／QR／NFC','請假補卡','薪資估算','多公司分店','七層權限','營運報表'], note:'Basic、Pro、Premium 的差異是管理深度，不再用固定「含幾人」限制方案。', icon:'business' },
    performance: { accent:'#d85ca7', kicker:'PERSONAL｜PERFORMANCE', title:'不只記錄工作，也看見自己的成長', body:'包含 Solo 的個人排班、工時、打卡、收入、請假與提醒，再加入目標 KPI、績效週期、自評、評核、一對一回饋、趨勢分析與績效報表。', tags:['個人排班','工時收入','行事曆提醒','目標 KPI','自評評核','一對一回饋','趨勢分析','績效報表'], note:'個人功能屬於本人帳號；即使離開公司，自費購買的個人模組仍保留。', icon:'performance' },
    modules: { accent:'#8c73e6', kicker:'PLANS + MODULES｜彈性擴充', title:'方案不用買到最大，缺什麼再加什麼', body:'方案可以和 Module 合在一起使用。公司先選符合目前管理需求的方案，再加真正需要的人數或功能，不必為了單一需求直接升到最大方案。', tags:['方案可搭模組','模組可彼此搭配','依需求逐步增加','避免買用不到的功能'], note:'目前先介紹「人數模組」：需要幾人就增加幾人，不必一開始購買大量名額；其他功能模組之後上架。', icon:'modules' }
  };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];
    });
  }

  function svg(kind) {
    var common='fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"';
    if (kind === 'modules') return '<svg viewBox="0 0 160 120" aria-hidden="true"><g '+common+'><rect x="20" y="18" width="48" height="40" rx="10"/><rect x="92" y="18" width="48" height="40" rx="10"/><rect x="20" y="72" width="48" height="30" rx="10"/><path d="M98 87h36M116 69v36"/><path d="M68 38h24M44 58v14M116 58v11"/></g></svg>';
    if (kind === 'performance') return '<svg viewBox="0 0 160 120" aria-hidden="true"><g '+common+'><circle cx="60" cy="54" r="34"/><circle cx="60" cy="54" r="18"/><path d="M60 54l28-28M82 26h16v16"/><path d="M101 96l14-18 12 9 17-25"/><path d="M101 96h43"/></g></svg>';
    if (kind === 'business' || kind === 'pro' || kind === 'premium') return '<svg viewBox="0 0 160 120" aria-hidden="true"><g '+common+'><path d="M24 101V28l55-16 55 16v73"/><path d="M15 101h130"/><path d="M45 42h18M96 42h18M45 62h18M96 62h18M45 82h18M96 82h18"/><path d="M72 101V76h16v25"/></g></svg>';
    if (kind === 'solo') return '<svg viewBox="0 0 160 120" aria-hidden="true"><g '+common+'><circle cx="80" cy="42" r="20"/><path d="M42 102c3-25 17-38 38-38s35 13 38 38"/><rect x="19" y="15" width="31" height="25" rx="6"/><path d="M27 27h15M110 20h30M110 32h20"/></g></svg>';
    if (kind === 'free') return '<svg viewBox="0 0 160 120" aria-hidden="true"><g '+common+'><rect x="20" y="22" width="120" height="78" rx="16"/><path d="M20 44h120M48 14v18M112 14v18"/><path d="M48 62h19M82 62h30M48 80h38"/><circle cx="118" cy="79" r="12"/><path d="M112 79l4 4 8-9"/></g></svg>';
    return '<svg viewBox="0 0 160 120" aria-hidden="true"><g '+common+'><rect x="18" y="20" width="124" height="80" rx="18"/><path d="M40 76l20-18 17 12 30-32 14 12"/><path d="M40 42h22M40 55h12"/><circle cx="118" cy="39" r="10"/></g></svg>';
  }

  function selectedPlanKey(card) {
    if (card.classList.contains('free')) return 'free';
    if (card.classList.contains('personal')) {
      var p=card.querySelector('.personal-option[aria-pressed="true"],.personal-option.selected');
      return p && p.classList.contains('performance-option') ? 'performance' : 'solo';
    }
    var b=card.querySelector('.business-option[aria-pressed="true"],.business-option.selected');
    if (b && b.classList.contains('premium-option')) return 'premium';
    if (b && b.classList.contains('pro-option')) return 'pro';
    return 'basic';
  }

  function tagsMarkup(tags) {
    return tags.map(function (tag) { return '<span>'+esc(tag)+'</span>'; }).join('');
  }

  function installPlanDetail(card) {
    if (!card || !(card.classList.contains('free') || card.classList.contains('personal') || card.classList.contains('business'))) return;
    var body=card.querySelector('.manager-card-body');
    if (!body) return;
    var key=selectedPlanKey(card), data=PLAN_DETAILS[key];
    if (!data) return;
    var box=body.querySelector('.ang-plan-detail-v2');
    if (!box) {
      box=document.createElement('section');
      box.className='ang-plan-detail-v2';
      var options=body.querySelector('.lite-options,.personal-options,.business-options');
      if (options) body.insertBefore(box,options); else body.appendChild(box);
    }
    if (box.getAttribute('data-plan')===key) return;
    box.setAttribute('data-plan',key);
    box.innerHTML='<div class="ang-plan-detail-visual">'+svg(data.icon)+'</div><div class="ang-plan-detail-copy"><span class="ang-plan-detail-kicker">'+esc(data.kicker)+'</span><strong>'+esc(data.title)+'</strong><p>'+esc(data.body)+'</p><div class="ang-plan-detail-tags">'+tagsMarkup(data.tags)+'</div></div>';
  }

  function overviewDisplay(data) {
    return '<div class="ang-overview-visual">'+svg(data.icon)+'</div><div class="ang-overview-copy"><span class="ang-overview-kicker">'+esc(data.kicker)+'</span><h2>'+esc(data.title)+'</h2><p>'+esc(data.body)+'</p><div class="ang-overview-highlight-grid">'+tagsMarkup(data.tags)+'</div><div class="ang-overview-note">'+esc(data.note)+'</div></div>';
  }

  function renderOverview(modal,key) {
    key=OVERVIEW_DETAILS[key] ? key : 'overview';
    var display=modal.querySelector('[data-ang-overview-display]');
    if (!display) return;
    var data=OVERVIEW_DETAILS[key];
    modal.style.setProperty('--ang-overview-accent',data.accent);
    display.innerHTML=overviewDisplay(data);
    display.setAttribute('data-view',key);
    var buttons=modal.querySelectorAll('[data-ang-overview-key]');
    for (var i=0;i<buttons.length;i++) {
      var active=buttons[i].getAttribute('data-ang-overview-key')===key;
      buttons[i].setAttribute('aria-selected',active?'true':'false');
      buttons[i].tabIndex=active?0:-1;
    }
  }

  function installOverview() {
    var modal=document.querySelector('.manager-card.intro.expanded .feature-modal-inline');
    if (!modal) return;
    if (modal.getAttribute('data-ang-overview-v2')==='true') return;
    modal.setAttribute('data-ang-overview-v2','true');
    modal.classList.add('ang-overview-v2');
    modal.innerHTML='<section class="ang-overview-display" data-ang-overview-display aria-live="polite"></section><div class="ang-overview-options-head"><strong>功能特色</strong><small>選擇一項，上方顯示完整圖文介紹</small></div><div class="ang-overview-options" role="tablist" aria-label="ANG HR 功能特色"><button type="button" class="ang-overview-option" role="tab" data-ang-overview-key="overview"><i>◎</i><strong>完整總覽</strong><small>核心能力</small></button><button type="button" class="ang-overview-option" role="tab" data-ang-overview-key="business"><i>▦</i><strong>Business</strong><small>企業管理</small></button><button type="button" class="ang-overview-option" role="tab" data-ang-overview-key="performance"><i>↗</i><strong>Performance</strong><small>個人成長</small></button><button type="button" class="ang-overview-option" role="tab" data-ang-overview-key="modules"><i>＋</i><strong>Modules</strong><small>彈性擴充</small></button></div>';
    renderOverview(modal,'overview');
  }

  function syncLoginGuide() {
    var card=document.querySelector('.manager-card.login-unified');
    if (!card) return;
    var guide=card.querySelector('.email-verification-guide');
    if (!guide) return;
    if (card.classList.contains('expanded') && card.classList.contains('login-system-confirmed')) {
      guide.hidden=false;
      guide.innerHTML='<strong>驗證已完成</strong><div class="verification-guide-steps"><span><i aria-hidden="true">✓</i><b>1</b><em>帳號已確認</em></span><span><i aria-hidden="true">▦</i><b>2</b><em>選擇公司或方案</em></span><span><i aria-hidden="true">↗</i><b>3</b><em>進入 ANG HR</em></span></div><small>只有一個公司或方案時會直接進入；有多個時才顯示選擇。方案註冊則會接續付款與基本資料。</small>';
    }
  }

  function apply() {
    var cards=document.querySelectorAll('.manager-card.free,.manager-card.personal,.manager-card.business');
    for (var i=0;i<cards.length;i++) installPlanDetail(cards[i]);
    installOverview();
    syncLoginGuide();
  }

  document.addEventListener('click',function(event){
    var button=event.target.closest && event.target.closest('[data-ang-overview-key]');
    if (!button) return;
    var modal=button.closest('.feature-modal-inline');
    if (!modal) return;
    event.preventDefault();
    renderOverview(modal,button.getAttribute('data-ang-overview-key'));
  });

  function start() {
    apply();
    var root=document.getElementById('root')||document.body;
    var queued=false;
    new MutationObserver(function(){
      if (queued) return;
      queued=true;
      window.requestAnimationFrame(function(){ queued=false; apply(); });
    }).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-pressed']});
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
}());
