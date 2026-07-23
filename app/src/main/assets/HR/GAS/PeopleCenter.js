/************************************************************
 * ANG HR｜平台人員中心＋方案初始化
 *
 * 本檔只處理：
 * - 平台永久 PersonID
 * - 登入身分
 * - 公司隸屬
 * - 七種方案目錄與方案訂閱
 * - 裝置綁定
 * - 流水號
 *
 * 本次不建立任何加購模組資料表或購買邏輯。
 ************************************************************/

var ANG_PEOPLE_VERSION_ = '2026.07.22-plans';
var ANG_PEOPLE_MASTER_FALLBACK_ID_ = '1sv0j3S6VPnd7ucGvG0QKkC7s43gFuxZBDiAblb4Ri-M';
var ANG_PEOPLE_TIMEZONE_ = 'Asia/Taipei';

var ANG_PEOPLE_CREATOR_EMPLOYEE_NO_ = '0603';
var ANG_PEOPLE_CREATOR_EMPLOYEE_ID_ = 'ANG0603';
var ANG_PEOPLE_PLATFORM_CREATOR_ID_ = 'ANG8963';

var ANG_PEOPLE_SHEET_PEOPLE_ = '平台人員';
var ANG_PEOPLE_SHEET_IDENTITIES_ = '登入身分';
var ANG_PEOPLE_SHEET_MEMBERSHIPS_ = '公司隸屬';
var ANG_PEOPLE_SHEET_PLAN_CATALOG_ = '方案目錄';
var ANG_PEOPLE_SHEET_SUBSCRIPTIONS_ = '方案訂閱';
var ANG_PEOPLE_SHEET_DEVICES_ = '裝置綁定';
var ANG_PEOPLE_SHEET_SEQUENCES_ = '流水號';

var ANG_PEOPLE_HEADERS_ = [
  'person_id', 'person_serial', 'display_name', 'legal_name',
  'phone', 'email', 'identity_last4', 'identity_hash', 'identity_status',
  'account_status', 'created_at', 'updated_at', 'last_login_at', 'note'
];

var ANG_PEOPLE_IDENTITY_HEADERS_ = [
  'identity_id', 'person_id', 'provider', 'provider_user_id',
  'login_value', 'normalized_value', 'verified', 'verified_at',
  'linked_at', 'unlinked_at', 'status', 'note'
];

var ANG_PEOPLE_MEMBERSHIP_HEADERS_ = [
  'membership_id', 'person_id', 'company_id', 'company_code',
  'employee_no', 'employee_id', 'role', 'is_company_creator',
  'status', 'joined_at', 'left_at', 'history_expire_at',
  'created_at', 'updated_at', 'note'
];

var ANG_PEOPLE_PLAN_CATALOG_HEADERS_ = [
  'plan_code', 'plan_label', 'plan_family', 'plan_tier',
  'is_free', 'monthly_price', 'currency', 'employee_quota',
  'is_available', 'status', 'sort_order',
  'created_at', 'updated_at', 'note'
];

var ANG_PEOPLE_SUBSCRIPTION_HEADERS_ = [
  'subscription_id', 'scope_type', 'scope_id', 'person_id', 'company_id',
  'plan_code', 'status', 'started_at', 'expires_at', 'trial_ever_used',
  'source', 'created_at', 'updated_at', 'note'
];

var ANG_PEOPLE_DEVICE_HEADERS_ = [
  'device_binding_id', 'person_id', 'device_hash', 'platform', 'device_name',
  'is_primary', 'status', 'bound_at', 'last_used_at', 'unbound_at',
  'unbound_reason', 'note'
];

var ANG_PEOPLE_SEQUENCE_HEADERS_ = [
  'sequence_key', 'prefix', 'current_value', 'width', 'example', 'updated_at', 'note'
];


/** 一次初始化入口：在 Apps Script 編輯器手動執行。 */
function initANGHRPeoplePlans() {
  if (typeof angSetupMasterSpreadsheet === 'function') return angSetupMasterSpreadsheet();
  return angPeopleInitSystem();
}

/**
 * Apps Script 編輯器手動執行這個函式即可初始化。
 * 可重複執行，不會清除既有資料。
 */
function angPeopleInitSystem() {
  var ss = angPeopleMasterSpreadsheet_();

  angPeopleEnsureHeaders_(angPeopleEnsureSheet_(ss, ANG_PEOPLE_SHEET_PEOPLE_), ANG_PEOPLE_HEADERS_);
  angPeopleEnsureHeaders_(angPeopleEnsureSheet_(ss, ANG_PEOPLE_SHEET_IDENTITIES_), ANG_PEOPLE_IDENTITY_HEADERS_);
  angPeopleEnsureHeaders_(angPeopleEnsureSheet_(ss, ANG_PEOPLE_SHEET_MEMBERSHIPS_), ANG_PEOPLE_MEMBERSHIP_HEADERS_);
  angPeopleEnsureHeaders_(angPeopleEnsureSheet_(ss, ANG_PEOPLE_SHEET_PLAN_CATALOG_), ANG_PEOPLE_PLAN_CATALOG_HEADERS_);
  angPeopleEnsureHeaders_(angPeopleEnsureSheet_(ss, ANG_PEOPLE_SHEET_SUBSCRIPTIONS_), ANG_PEOPLE_SUBSCRIPTION_HEADERS_);
  angPeopleEnsureHeaders_(angPeopleEnsureSheet_(ss, ANG_PEOPLE_SHEET_DEVICES_), ANG_PEOPLE_DEVICE_HEADERS_);
  angPeopleEnsureHeaders_(angPeopleEnsureSheet_(ss, ANG_PEOPLE_SHEET_SEQUENCES_), ANG_PEOPLE_SEQUENCE_HEADERS_);

  angPeopleSeedSequences_(ss);
  angPeopleSeedPlanCatalog_(ss);
  angPeopleFormatSheets_(ss);
  SpreadsheetApp.flush();

  return {
    ok: true,
    version: ANG_PEOPLE_VERSION_,
    message: '平台人員中心與方案資料表已初始化',
    spreadsheet_id: ss.getId(),
    spreadsheet_url: ss.getUrl(),
    company_code_rule: '所有公司代號必須以 ANG 開頭',
    creator_employee_no: ANG_PEOPLE_CREATOR_EMPLOYEE_NO_,
    creator_employee_id: ANG_PEOPLE_CREATOR_EMPLOYEE_ID_,
    platform_creator_id: ANG_PEOPLE_PLATFORM_CREATOR_ID_,
    modules_created: false
  };
}

function angPeopleSeedPlanCatalog_(ss) {
  var sheet = angPeopleEnsureSheet_(ss, ANG_PEOPLE_SHEET_PLAN_CATALOG_);
  angPeopleEnsureHeaders_(sheet, ANG_PEOPLE_PLAN_CATALOG_HEADERS_);
  var now = angPeopleNow_();

  var plans = [
    ['personal_lite', 'Personal Lite', 'personal', 'lite', 'TRUE', 0, 'TWD', 1, 'TRUE', 'active', 10, '個人免費方案'],
    ['personal_solo', 'Personal Solo', 'personal', 'solo', 'FALSE', 69, 'TWD', 1, 'TRUE', 'active', 20, '個人 Solo 方案'],
    ['personal_performance', 'Personal Performance', 'personal', 'performance', 'FALSE', 149, 'TWD', 1, 'TRUE', 'active', 30, '個人 Performance 方案'],
    ['business_lite', 'Business Lite', 'business', 'lite', 'TRUE', 0, 'TWD', 5, 'TRUE', 'active', 110, '小團隊免費方案'],
    ['business_basic', 'Business Basic', 'business', 'basic', 'FALSE', 299, 'TWD', 5, 'TRUE', 'active', 120, 'Business Basic'],
    ['business_pro', 'Business Pro', 'business', 'pro', 'FALSE', 699, 'TWD', 10, 'TRUE', 'active', 130, 'Business Pro；舊版 Plus 會轉成此方案'],
    ['business_premium', 'Business Premium', 'business', 'premium', 'FALSE', 1299, 'TWD', 20, 'TRUE', 'active', 140, 'Business Premium']
  ];

  plans.forEach(function(p) {
    var existing = angPeopleFindOne_(sheet, 'plan_code', p[0]);
    var record = {
      plan_code: p[0],
      plan_label: p[1],
      plan_family: p[2],
      plan_tier: p[3],
      is_free: p[4],
      monthly_price: p[5],
      currency: p[6],
      employee_quota: p[7],
      is_available: p[8],
      status: p[9],
      sort_order: p[10],
      created_at: existing ? existing.created_at : now,
      updated_at: now,
      note: p[11]
    };
    if (existing) angPeoplePatchRow_(sheet, existing._row, record);
    else angPeopleAppend_(sheet, record);
  });
}

/**
 * 把舊方案代碼轉成新方案代碼。
 * familyHint 傳 personal 或 business，可避免 free/basic 等舊代碼歧義。
 */
function angPeopleCanonicalPlanCode_(value, familyHint) {
  var p = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  var family = String(familyHint || '').trim().toLowerCase();

  if (p === 'personal_lite' || p === 'personal_solo' || p === 'personal_performance') return p;
  if (p === 'business_lite' || p === 'business_basic' || p === 'business_pro' || p === 'business_premium') return p;

  if (p === 'solo') return 'personal_solo';
  if (p === 'performance') return 'personal_performance';

  if (p === 'free' || p === 'lite') return family === 'personal' ? 'personal_lite' : 'business_lite';
  if (p === 'basic') return 'business_basic';
  if (p === 'plus' || p === 'pro') return 'business_pro';
  if (p === 'premium') return 'business_premium';

  return p;
}

function angPeopleEnsureFromVerifiedAuth_(auth) {
  auth = auth || {};
  angPeopleInitSystem();

  var provider = String(auth.provider || auth.method || '').trim().toLowerCase();
  var email = angPeopleEmail_(auth.email || '');
  var phone = angPeoplePhone_(auth.phone || auth.owner_phone || '');
  var providerUserId = String(
    auth.provider_user_id ||
    (provider === 'google' ? (auth.google_user_id || auth.google_sub || auth.sub || '') : '') ||
    (provider === 'line' ? (auth.line_user_id || auth.line_sub || auth.sub || '') : '') ||
    (provider === 'apple' ? (auth.apple_user_id || auth.apple_sub || auth.sub || '') : '')
  ).trim();

  var person = angPeopleFindPersonByIdentity_(provider, providerUserId, email, phone);
  if (!person) {
    person = angPeopleCreatePerson_({
      display_name: auth.profile_name || auth.display_name || auth.name || auth.owner_name || '',
      legal_name: auth.legal_name || '',
      email: email,
      phone: phone,
      identity_last4: auth.identity_last4 || '',
      identity_hash: auth.identity_hash || '',
      identity_status: auth.identity_status || 'unverified',
      note: auth.note || ''
    });
  } else {
    angPeopleUpdatePersonContact_(person.person_id, {
      display_name: auth.profile_name || auth.display_name || auth.name || auth.owner_name || '',
      email: email,
      phone: phone,
      last_login_at: angPeopleNow_()
    });
  }

  if (provider) {
    var loginValue = provider === 'email' ? email : (provider === 'phone' ? phone : '');
    angPeopleLinkIdentity_({
      person_id: person.person_id,
      provider: provider,
      provider_user_id: providerUserId,
      login_value: loginValue,
      verified: true
    });
  } else if (email) {
    angPeopleLinkIdentity_({ person_id: person.person_id, provider: 'email', login_value: email, verified: true });
  }

  if (email && provider !== 'email') {
    angPeopleLinkIdentity_({ person_id: person.person_id, provider: 'email', login_value: email, verified: true });
  }
  if (phone) {
    angPeopleLinkIdentity_({ person_id: person.person_id, provider: 'phone', login_value: phone, verified: !!auth.phone_verified });
  }

  if (auth.device_id || auth.device_hash) {
    angPeopleBindDevice_({
      person_id: person.person_id,
      device_id: auth.device_id || '',
      device_hash: auth.device_hash || '',
      platform: auth.platform || auth.device_platform || '',
      device_name: auth.device_name || ''
    });
  }

  return angPeopleFindPersonById_(person.person_id) || person;
}

function angPeopleCreatePerson_(input) {
  input = input || {};
  var ss = angPeopleMasterSpreadsheet_();
  var sheet = angPeopleEnsureSheet_(ss, ANG_PEOPLE_SHEET_PEOPLE_);
  angPeopleEnsureHeaders_(sheet, ANG_PEOPLE_HEADERS_);

  var email = angPeopleEmail_(input.email || '');
  var phone = angPeoplePhone_(input.phone || '');
  var existing = angPeopleFindPersonByContact_(email, phone);
  if (existing) return existing;

  var personId = angPeopleNextId_('PERSON');
  var now = angPeopleNow_();
  var record = {
    person_id: personId,
    person_serial: Number(String(personId).replace(/\D/g, '')) || '',
    display_name: String(input.display_name || input.name || '').trim(),
    legal_name: String(input.legal_name || '').trim(),
    phone: phone,
    email: email,
    identity_last4: String(input.identity_last4 || '').trim(),
    identity_hash: String(input.identity_hash || '').trim(),
    identity_status: String(input.identity_status || 'unverified').trim(),
    account_status: String(input.account_status || 'active').trim(),
    created_at: now,
    updated_at: now,
    last_login_at: input.last_login_at || '',
    note: String(input.note || '').trim()
  };
  angPeopleAppend_(sheet, record);
  return record;
}

function angPeopleUpdatePersonContact_(personId, patch) {
  var sheet = angPeopleEnsureSheet_(angPeopleMasterSpreadsheet_(), ANG_PEOPLE_SHEET_PEOPLE_);
  var row = angPeopleFindOne_(sheet, 'person_id', String(personId || '').toUpperCase());
  if (!row) return null;
  patch = patch || {};
  var update = { updated_at: angPeopleNow_() };
  if (patch.display_name && !row.display_name) update.display_name = String(patch.display_name).trim();
  if (patch.email && !row.email) update.email = angPeopleEmail_(patch.email);
  if (patch.phone && !row.phone) update.phone = angPeoplePhone_(patch.phone);
  if (patch.last_login_at) update.last_login_at = patch.last_login_at;
  angPeoplePatchRow_(sheet, row._row, update);
  return Object.assign({}, row, update);
}

function angPeopleLinkIdentity_(input) {
  input = input || {};
  var personId = String(input.person_id || '').trim().toUpperCase();
  var provider = String(input.provider || '').trim().toLowerCase();
  var providerUserId = String(input.provider_user_id || '').trim();
  var loginValue = String(input.login_value || '').trim();
  if (!personId || !provider) return null;

  var normalizedValue = provider === 'email'
    ? angPeopleEmail_(loginValue)
    : provider === 'phone'
      ? angPeoplePhone_(loginValue)
      : providerUserId;
  if (!normalizedValue && !providerUserId) return null;

  var sheet = angPeopleEnsureSheet_(angPeopleMasterSpreadsheet_(), ANG_PEOPLE_SHEET_IDENTITIES_);
  angPeopleEnsureHeaders_(sheet, ANG_PEOPLE_IDENTITY_HEADERS_);
  var rows = angPeopleObjects_(sheet);
  var existing = null;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].provider || '').toLowerCase() !== provider) continue;
    if (String(rows[i].status || '').toLowerCase() === 'unlinked') continue;
    if ((providerUserId && String(rows[i].provider_user_id || '') === providerUserId) ||
        (normalizedValue && String(rows[i].normalized_value || '') === normalizedValue)) {
      existing = rows[i];
      break;
    }
  }

  if (existing && String(existing.person_id || '').toUpperCase() !== personId) {
    throw new Error('此登入身分已綁定其他 PersonID');
  }

  var now = angPeopleNow_();
  var record = {
    identity_id: existing ? existing.identity_id : angPeopleNextId_('IDENTITY'),
    person_id: personId,
    provider: provider,
    provider_user_id: providerUserId,
    login_value: loginValue,
    normalized_value: normalizedValue,
    verified: input.verified === false ? 'FALSE' : 'TRUE',
    verified_at: input.verified === false ? '' : (existing ? existing.verified_at || now : now),
    linked_at: existing ? existing.linked_at || now : now,
    unlinked_at: '',
    status: 'active',
    note: String(input.note || '').trim()
  };
  if (existing) angPeoplePatchRow_(sheet, existing._row, record);
  else angPeopleAppend_(sheet, record);
  return record;
}

function angPeopleBindDevice_(input) {
  input = input || {};
  var personId = String(input.person_id || '').trim().toUpperCase();
  if (!personId) return null;

  var hash = String(input.device_hash || '').trim();
  if (!hash && input.device_id) hash = angPeopleHash_(String(input.device_id));
  if (!hash) return null;

  var sheet = angPeopleEnsureSheet_(angPeopleMasterSpreadsheet_(), ANG_PEOPLE_SHEET_DEVICES_);
  angPeopleEnsureHeaders_(sheet, ANG_PEOPLE_DEVICE_HEADERS_);
  var rows = angPeopleObjects_(sheet);
  var existing = null;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].person_id || '').toUpperCase() === personId && String(rows[i].device_hash || '') === hash) {
      existing = rows[i];
      break;
    }
  }

  var now = angPeopleNow_();
  var record = {
    device_binding_id: existing ? existing.device_binding_id : angPeopleNextId_('DEVICE'),
    person_id: personId,
    device_hash: hash,
    platform: String(input.platform || '').trim(),
    device_name: String(input.device_name || '').trim(),
    is_primary: input.is_primary === false ? 'FALSE' : 'TRUE',
    status: 'active',
    bound_at: existing ? existing.bound_at || now : now,
    last_used_at: now,
    unbound_at: '',
    unbound_reason: '',
    note: String(input.note || '').trim()
  };
  if (existing) angPeoplePatchRow_(sheet, existing._row, record);
  else angPeopleAppend_(sheet, record);
  return record;
}

/** 建立公司 Creator 的公司隸屬與 Business 方案訂閱。 */
function angPeopleRegisterCompanyCreator_(input) {
  input = input || {};
  angPeopleInitSystem();

  var companyId = angPeopleCompanyCode_(input.company_id || input.company_code || '');
  if (!companyId) throw new Error('缺少公司代號');

  var personId = String(input.person_id || input.owner_person_id || '').trim().toUpperCase();
  if (!personId) {
    var person = angPeopleEnsureFromVerifiedAuth_({
      provider: input.auth_provider || input.provider || '',
      email: input.owner_email || input.email || '',
      phone: input.owner_phone || input.phone || '',
      profile_name: input.owner_name || input.name || '',
      google_user_id: input.google_user_id || input.google_sub || '',
      line_user_id: input.line_user_id || input.line_sub || '',
      device_id: input.device_id || ''
    });
    personId = person.person_id;
  }

  var membership = angPeopleUpsertMembership_({
    person_id: personId,
    company_id: companyId,
    company_code: companyId,
    employee_no: ANG_PEOPLE_CREATOR_EMPLOYEE_NO_,
    employee_id: ANG_PEOPLE_CREATOR_EMPLOYEE_ID_,
    role: 'owner',
    is_company_creator: true,
    status: 'active',
    note: '公司建立者；固定公司員編 0603'
  });

  var canonicalPlan = angPeopleCanonicalPlanCode_(input.plan_code || input.plan || 'business_basic', 'business');
  var subscription = angPeopleCreatePlanSubscription_({
    scope_type: 'company',
    scope_id: companyId,
    person_id: personId,
    company_id: companyId,
    plan_code: canonicalPlan,
    status: input.plan_status || 'active',
    started_at: input.started_at || input.trial_started_at || angPeopleNow_(),
    expires_at: input.expires_at || input.trial_ends_at || input.first_month_ends_at || '',
    source: input.plan_source || input.payment_status || (canonicalPlan === 'business_lite' ? 'free_plan' : 'first_month_free'),
    note: input.plan_note || ''
  });

  return {
    ok: true,
    person_id: personId,
    company_id: companyId,
    company_code: companyId,
    employee_no: ANG_PEOPLE_CREATOR_EMPLOYEE_NO_,
    employee_id: ANG_PEOPLE_CREATOR_EMPLOYEE_ID_,
    membership: membership,
    subscription: subscription
  };
}

/** 新增一般員工時呼叫；同一個人可在多間公司各有一筆隸屬。 */
function angPeopleUpsertEmployeeMembership_(input) {
  input = input || {};
  var personId = String(input.person_id || '').trim().toUpperCase();
  if (!personId) {
    var person = angPeopleCreatePerson_({
      display_name: input.name || input.employee_name || '',
      email: input.email || '',
      phone: input.phone || ''
    });
    personId = person.person_id;
  }

  if (input.email) angPeopleLinkIdentity_({ person_id: personId, provider: 'email', login_value: input.email, verified: !!input.email_verified });
  if (input.phone) angPeopleLinkIdentity_({ person_id: personId, provider: 'phone', login_value: input.phone, verified: !!input.phone_verified });

  return angPeopleUpsertMembership_({
    person_id: personId,
    company_id: input.company_id,
    company_code: input.company_code || input.company_id,
    employee_no: input.employee_no || angPeopleEmployeeNo_(input.employee_id),
    employee_id: input.employee_id,
    role: input.role || 'employee',
    is_company_creator: false,
    status: input.status || 'active',
    joined_at: input.joined_at || input.created_at || '',
    note: input.note || ''
  });
}

function angPeopleUpsertMembership_(input) {
  input = input || {};
  var personId = String(input.person_id || '').trim().toUpperCase();
  var companyCode = angPeopleCompanyCode_(input.company_code || input.company_id || '');
  var employeeId = String(input.employee_id || '').trim().toUpperCase();
  var employeeNo = angPeopleEmployeeNo_(input.employee_no || employeeId);
  if (!personId || !companyCode || !employeeId) throw new Error('公司隸屬缺少 person_id、company_code 或 employee_id');

  var sheet = angPeopleEnsureSheet_(angPeopleMasterSpreadsheet_(), ANG_PEOPLE_SHEET_MEMBERSHIPS_);
  angPeopleEnsureHeaders_(sheet, ANG_PEOPLE_MEMBERSHIP_HEADERS_);
  var rows = angPeopleObjects_(sheet);
  var existing = null;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].company_code || '').toUpperCase() === companyCode &&
        String(rows[i].employee_id || '').toUpperCase() === employeeId) {
      existing = rows[i];
      break;
    }
  }

  if (existing && String(existing.person_id || '').toUpperCase() !== personId) {
    throw new Error('此公司員工編號已綁定其他 PersonID');
  }

  var now = angPeopleNow_();
  var record = {
    membership_id: existing ? existing.membership_id : angPeopleNextId_('MEMBERSHIP'),
    person_id: personId,
    company_id: companyCode,
    company_code: companyCode,
    employee_no: employeeNo,
    employee_id: employeeId,
    role: String(input.role || 'employee').trim().toLowerCase(),
    is_company_creator: input.is_company_creator ? 'TRUE' : 'FALSE',
    status: String(input.status || 'active').trim().toLowerCase(),
    joined_at: existing ? existing.joined_at || now : (input.joined_at || now),
    left_at: input.left_at || '',
    history_expire_at: input.history_expire_at || '',
    created_at: existing ? existing.created_at || now : now,
    updated_at: now,
    note: String(input.note || '').trim()
  };
  if (existing) angPeoplePatchRow_(sheet, existing._row, record);
  else angPeopleAppend_(sheet, record);
  return record;
}

function angPeopleCreatePlanSubscription_(input) {
  input = input || {};
  var scopeType = String(input.scope_type || '').trim().toLowerCase();
  var scopeId = String(input.scope_id || '').trim().toUpperCase();
  var planCode = angPeopleCanonicalPlanCode_(input.plan_code || input.plan || '', scopeType === 'person' ? 'personal' : 'business');
  if (!scopeType || !scopeId || !planCode) throw new Error('方案訂閱缺少 scope_type、scope_id 或 plan_code');

  var sheet = angPeopleEnsureSheet_(angPeopleMasterSpreadsheet_(), ANG_PEOPLE_SHEET_SUBSCRIPTIONS_);
  angPeopleEnsureHeaders_(sheet, ANG_PEOPLE_SUBSCRIPTION_HEADERS_);
  var rows = angPeopleObjects_(sheet);
  var existing = null;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].scope_type || '').toLowerCase() === scopeType &&
        String(rows[i].scope_id || '').toUpperCase() === scopeId &&
        String(rows[i].plan_code || '').toLowerCase() === planCode &&
        ['active', 'scheduled', 'suspended'].indexOf(String(rows[i].status || '').toLowerCase()) >= 0) {
      existing = rows[i];
      break;
    }
  }

  var now = angPeopleNow_();
  var status = String(input.status || 'active').trim().toLowerCase();
  var source = String(input.source || '').trim().toLowerCase();
  var isTrial = source.indexOf('trial') >= 0 || source === 'first_month_free';

  if (isTrial && scopeType === 'person' && !existing) {
    var trialUsed = rows.some(function(row) {
      return String(row.scope_type || '').toLowerCase() === 'person' &&
        String(row.scope_id || '').toUpperCase() === scopeId &&
        String(row.plan_code || '').toLowerCase() === planCode &&
        String(row.trial_ever_used || '').toUpperCase() === 'TRUE';
    });
    if (trialUsed) throw new Error('此 PersonID 已使用過該方案免費體驗');
  }

  var record = {
    subscription_id: existing ? existing.subscription_id : angPeopleNextId_('SUBSCRIPTION'),
    scope_type: scopeType,
    scope_id: scopeId,
    person_id: String(input.person_id || (scopeType === 'person' ? scopeId : '')).trim().toUpperCase(),
    company_id: String(input.company_id || (scopeType === 'company' ? scopeId : '')).trim().toUpperCase(),
    plan_code: planCode,
    status: status,
    started_at: input.started_at || (status === 'active' ? now : ''),
    expires_at: input.expires_at || '',
    trial_ever_used: isTrial && ['active', 'expired', 'used', 'cancelled'].indexOf(status) >= 0 ? 'TRUE' : (existing ? existing.trial_ever_used || 'FALSE' : 'FALSE'),
    source: source || (planCode.indexOf('_lite') > -1 ? 'free_plan' : 'purchased'),
    created_at: existing ? existing.created_at || now : now,
    updated_at: now,
    note: String(input.note || '').trim()
  };
  if (existing) angPeoplePatchRow_(sheet, existing._row, record);
  else angPeopleAppend_(sheet, record);
  return record;
}

function angPeopleFindPersonByIdentity_(provider, providerUserId, email, phone) {
  var identitySheet = angPeopleEnsureSheet_(angPeopleMasterSpreadsheet_(), ANG_PEOPLE_SHEET_IDENTITIES_);
  var identities = angPeopleObjects_(identitySheet);
  provider = String(provider || '').toLowerCase();
  providerUserId = String(providerUserId || '');
  email = angPeopleEmail_(email || '');
  phone = angPeoplePhone_(phone || '');

  for (var i = 0; i < identities.length; i++) {
    var r = identities[i];
    if (String(r.status || '').toLowerCase() === 'unlinked') continue;
    var rp = String(r.provider || '').toLowerCase();
    var sameProvider = provider && rp === provider && providerUserId && String(r.provider_user_id || '') === providerUserId;
    var sameEmail = email && rp === 'email' && String(r.normalized_value || '') === email;
    var samePhone = phone && rp === 'phone' && String(r.normalized_value || '') === phone;
    if (sameProvider || sameEmail || samePhone) return angPeopleFindPersonById_(r.person_id);
  }
  return angPeopleFindPersonByContact_(email, phone);
}

function angPeopleFindPersonByContact_(email, phone) {
  var rows = angPeopleObjects_(angPeopleEnsureSheet_(angPeopleMasterSpreadsheet_(), ANG_PEOPLE_SHEET_PEOPLE_));
  email = angPeopleEmail_(email || '');
  phone = angPeoplePhone_(phone || '');
  for (var i = 0; i < rows.length; i++) {
    if (email && angPeopleEmail_(rows[i].email || '') === email) return rows[i];
    if (phone && angPeoplePhone_(rows[i].phone || '') === phone) return rows[i];
  }
  return null;
}

function angPeopleFindPersonById_(personId) {
  return angPeopleFindOne_(angPeopleEnsureSheet_(angPeopleMasterSpreadsheet_(), ANG_PEOPLE_SHEET_PEOPLE_), 'person_id', String(personId || '').toUpperCase());
}

function angPeopleSeedSequences_(ss) {
  var sheet = angPeopleEnsureSheet_(ss, ANG_PEOPLE_SHEET_SEQUENCES_);
  angPeopleEnsureHeaders_(sheet, ANG_PEOPLE_SEQUENCE_HEADERS_);
  var definitions = [
    ['PERSON', 'ANGP-', 0, 8, 'ANGP-00000001', '平台永久人員流水號'],
    ['IDENTITY', 'ANGI-', 0, 8, 'ANGI-00000001', '登入身分流水號'],
    ['MEMBERSHIP', 'ANGM-', 0, 8, 'ANGM-00000001', '公司隸屬流水號'],
    ['SUBSCRIPTION', 'ANGS-', 0, 8, 'ANGS-00000001', '方案訂閱流水號'],
    ['DEVICE', 'ANGD-', 0, 8, 'ANGD-00000001', '裝置綁定流水號']
  ];
  definitions.forEach(function(d) {
    if (!angPeopleFindOne_(sheet, 'sequence_key', d[0])) {
      angPeopleAppend_(sheet, {
        sequence_key: d[0], prefix: d[1], current_value: d[2], width: d[3],
        example: d[4], updated_at: angPeopleNow_(), note: d[5]
      });
    }
  });
}

function angPeopleNextId_(key) {
  key = String(key || '').trim().toUpperCase();
  var lock = LockService.getScriptLock();
  var alreadyLocked = typeof lock.hasLock === 'function' && lock.hasLock();
  if (!alreadyLocked) lock.waitLock(30000);
  try {
    var ss = angPeopleMasterSpreadsheet_();
    angPeopleSeedSequences_(ss);
    var sheet = angPeopleEnsureSheet_(ss, ANG_PEOPLE_SHEET_SEQUENCES_);
    var values = sheet.getDataRange().getValues();
    var headers = values[0].map(String);
    var keyCol = headers.indexOf('sequence_key');
    var prefixCol = headers.indexOf('prefix');
    var valueCol = headers.indexOf('current_value');
    var widthCol = headers.indexOf('width');
    var updatedCol = headers.indexOf('updated_at');
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][keyCol] || '').toUpperCase() !== key) continue;
      var next = Number(values[i][valueCol] || 0) + 1;
      var width = Number(values[i][widthCol] || 8);
      var text = String(next);
      while (text.length < width) text = '0' + text;
      sheet.getRange(i + 1, valueCol + 1).setValue(next);
      if (updatedCol >= 0) sheet.getRange(i + 1, updatedCol + 1).setValue(angPeopleNow_());
      SpreadsheetApp.flush();
      return String(values[i][prefixCol] || '') + text;
    }
    throw new Error('找不到流水號設定：' + key);
  } finally {
    if (!alreadyLocked) lock.releaseLock();
  }
}

function angPeopleMasterSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = String(
    props.getProperty('MASTER_SPREADSHEET_ID') ||
    props.getProperty('ANG_HR_DB_ID') ||
    (typeof DEFAULT_ANG_HR_DB_ID !== 'undefined' ? DEFAULT_ANG_HR_DB_ID : '') ||
    ANG_PEOPLE_MASTER_FALLBACK_ID_
  ).trim();
  if (!id) throw new Error('尚未設定 MASTER_SPREADSHEET_ID');
  return SpreadsheetApp.openById(id);
}

function angPeopleEnsureSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function angPeopleEnsureHeaders_(sheet, required) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, required.length).setValues([required]);
    sheet.setFrozenRows(1);
    return;
  }
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var current = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(v) { return String(v || '').trim(); });
  required.forEach(function(h) {
    if (current.indexOf(h) < 0) {
      current.push(h);
      sheet.getRange(1, current.length).setValue(h);
    }
  });
  sheet.setFrozenRows(1);
}

function angPeopleObjects_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function(v) { return String(v || '').trim(); });
  var out = [];
  for (var r = 1; r < values.length; r++) {
    if (values[r].every(function(v) { return String(v || '').trim() === ''; })) continue;
    var obj = { _row: r + 1 };
    headers.forEach(function(h, c) { if (h) obj[h] = values[r][c]; });
    out.push(obj);
  }
  return out;
}

function angPeopleFindOne_(sheet, header, value) {
  var target = String(value == null ? '' : value).trim().toUpperCase();
  var rows = angPeopleObjects_(sheet);
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][header] == null ? '' : rows[i][header]).trim().toUpperCase() === target) return rows[i];
  }
  return null;
}

function angPeopleAppend_(sheet, obj) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(v) { return String(v || '').trim(); });
  sheet.appendRow(headers.map(function(h) { return obj[h] == null ? '' : obj[h]; }));
}

function angPeoplePatchRow_(sheet, rowNumber, patch) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(v) { return String(v || '').trim(); });
  var range = sheet.getRange(rowNumber, 1, 1, headers.length);
  var row = range.getValues()[0];
  headers.forEach(function(h, i) {
    if (Object.prototype.hasOwnProperty.call(patch, h)) row[i] = patch[h];
  });
  range.setValues([row]);
}

function angPeopleFormatSheets_(ss) {
  [
    ANG_PEOPLE_SHEET_PEOPLE_, ANG_PEOPLE_SHEET_IDENTITIES_, ANG_PEOPLE_SHEET_MEMBERSHIPS_,
    ANG_PEOPLE_SHEET_PLAN_CATALOG_, ANG_PEOPLE_SHEET_SUBSCRIPTIONS_,
    ANG_PEOPLE_SHEET_DEVICES_, ANG_PEOPLE_SHEET_SEQUENCES_
  ].forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) return;
    sheet.setFrozenRows(1);
    if (sheet.getLastColumn() > 0) sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold');
  });
}

function angPeopleCompanyCode_(value) {
  var code = String(value || '').trim().toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9_-]/g, '');
  if (!code) return '';
  return code.indexOf('ANG') === 0 ? code : 'ANG' + code;
}

function angPeopleEmployeeNo_(value) {
  var text = String(value || '').trim().toUpperCase();
  if (text.indexOf('ANG') === 0) text = text.slice(3);
  text = text.replace(/\D/g, '');
  while (text.length < 4) text = '0' + text;
  return text;
}

function angPeopleEmail_(value) {
  return String(value || '').trim().toLowerCase();
}

function angPeoplePhone_(value) {
  return String(value || '').trim().replace(/[\s()\-]/g, '');
}

function angPeopleHash_(value) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value || ''), Utilities.Charset.UTF_8);
  return bytes.map(function(b) { var v = b < 0 ? b + 256 : b; return ('0' + v.toString(16)).slice(-2); }).join('');
}

function angPeopleNow_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || ANG_PEOPLE_TIMEZONE_, 'yyyy-MM-dd HH:mm:ss');
}
