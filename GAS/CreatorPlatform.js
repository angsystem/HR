/***** ANG HR SYSTEMS｜CreatorPlatform.gs
 * 平台 Creator 管理中心專用後端
 * 只允許 ANG8963。
 *
 * Script Properties：
 * MASTER_SPREADSHEET_ID = 平台總表試算表 ID
 * ANG8963_OWNER_KEY     = 平台 Creator 管理金鑰
 *
 * creator.html 以 google.script.run 直接呼叫本檔函式，
 * 不必修改 doPost action router。
 *****/

var ANG_PLATFORM_CREATOR_ID_ = 'ANG8963';
var ANG_PLATFORM_COMPANY_SHEET_ = '公司清單';
var ANG_PLATFORM_PAYMENT_SHEET_ = '付款紀錄';
var ANG_PLATFORM_PEOPLE_SHEET_ = '平台人員';
var ANG_PLATFORM_MEMBERSHIP_SHEET_ = '公司隸屬';
var ANG_PLATFORM_PLAN_CATALOG_SHEET_ = '方案目錄';
var ANG_PLATFORM_SUBSCRIPTION_SHEET_ = '方案訂閱';

function angPlatformCreatorLogin(creatorId, creatorKey) {
  try {
    angPlatformCreatorAssert_(creatorId, creatorKey);
    return { ok: true, creator_id: ANG_PLATFORM_CREATOR_ID_, message: '登入成功' };
  } catch (err) {
    return { ok: false, message: err && err.message ? err.message : String(err) };
  }
}

function angPlatformCreatorGetBootstrap(creatorId, creatorKey) {
  try {
    angPlatformCreatorAssert_(creatorId, creatorKey);

    var ss = angPlatformCreatorOpenMaster_();
    var companies = angPlatformCreatorReadSheet_(ss, ANG_PLATFORM_COMPANY_SHEET_);
    var payments = angPlatformCreatorReadSheet_(ss, ANG_PLATFORM_PAYMENT_SHEET_);
    var people = angPlatformCreatorReadSheet_(ss, ANG_PLATFORM_PEOPLE_SHEET_);
    var memberships = angPlatformCreatorReadSheet_(ss, ANG_PLATFORM_MEMBERSHIP_SHEET_);
    var planCatalog = angPlatformCreatorReadSheet_(ss, ANG_PLATFORM_PLAN_CATALOG_SHEET_);
    var subscriptions = angPlatformCreatorReadSheet_(ss, ANG_PLATFORM_SUBSCRIPTION_SHEET_);

    companies = companies.map(function(row) {
      return angPlatformCreatorNormalizeCompany_(row);
    });

    return {
      ok: true,
      creator_id: ANG_PLATFORM_CREATOR_ID_,
      companies: companies,
      payments: payments,
      people: people,
      memberships: memberships,
      plan_catalog: planCatalog,
      subscriptions: subscriptions,
      summary: angPlatformCreatorBuildSummary_(companies, people, memberships, subscriptions),
      synced_at: angPlatformCreatorNow_()
    };
  } catch (err) {
    return { ok: false, message: err && err.message ? err.message : String(err) };
  }
}

function angPlatformCreatorSaveCompany(creatorId, creatorKey, data) {
  try {
    angPlatformCreatorAssert_(creatorId, creatorKey);
    data = data || {};

    var companyId = angPlatformCreatorUpper_(data.company_id || data.company_code);
    if (companyId && companyId.indexOf('ANG') !== 0) companyId = 'ANG' + companyId;
    var companyName = angPlatformCreatorText_(data.company_name);

    if (!companyId) throw new Error('公司代碼不可空白');
    if (!companyName) throw new Error('公司名稱不可空白');

    var ss = angPlatformCreatorOpenMaster_();
    var sheet = ss.getSheetByName(ANG_PLATFORM_COMPANY_SHEET_);
    if (!sheet) throw new Error('找不到工作表：' + ANG_PLATFORM_COMPANY_SHEET_);

    var headers = angPlatformCreatorHeaders_(sheet);
    if (!headers.length) throw new Error('公司清單沒有標題列');

    var aliases = {
      company_id: ['company_id', '公司代碼', '公司ID'],
      company_code: ['company_code', '公司代號'],
      company_name: ['company_name', '公司名稱'],
      company_sub_name: ['company_sub_name', '公司副名稱', '分店識別'],
      plan: ['plan', '方案'],
      plan_code: ['plan_code', '正式方案代碼'],
      status: ['status', '公司狀態', '服務狀態'],
      payment_status: ['payment_status', 'billing_status', '付款狀態'],
      owner_person_id: ['owner_person_id', 'person_id', '平台人員ID'],
      creator_employee_no: ['creator_employee_no', 'Creator員編'],
      creator_employee_id: ['creator_employee_id', 'Creator登入員編'],
      owner_name: ['owner_name', 'admin_name', '負責人姓名'],
      owner_email: ['owner_email', 'verified_email', '負責人Email'],
      owner_phone: ['owner_phone', 'admin_phone', '負責人電話'],
      employee_quota: ['employee_quota', '員工上限'],
      note: ['note', '備註'],
      created_at: ['created_at', '建立時間'],
      updated_at: ['updated_at', '更新時間']
    };

    var values = sheet.getDataRange().getValues();
    var idCol = angPlatformCreatorFindHeader_(headers, aliases.company_id);
    if (idCol < 0) throw new Error('公司清單缺少 company_id 欄位');

    var targetRow = -1;
    for (var r = 1; r < values.length; r++) {
      if (angPlatformCreatorUpper_(values[r][idCol]) === companyId) {
        targetRow = r + 1;
        break;
      }
    }

    var now = angPlatformCreatorNow_();
    var rowObject = {
      company_id: companyId,
      company_code: companyId.indexOf('ANG') === 0 ? companyId : 'ANG' + companyId,
      company_name: companyName,
      company_sub_name: angPlatformCreatorText_(data.company_sub_name),
      plan: angPlatformCreatorLower_(data.plan || 'business_basic'),
      plan_code: angPlatformCreatorLower_(data.plan_code || data.plan || 'business_basic'),
      status: angPlatformCreatorLower_(data.status || 'active'),
      payment_status: angPlatformCreatorLower_(data.payment_status || 'first_month_free'),
      owner_person_id: angPlatformCreatorUpper_(data.owner_person_id || ''),
      creator_employee_no: '0603',
      creator_employee_id: 'ANG0603',
      owner_name: angPlatformCreatorText_(data.owner_name),
      owner_email: angPlatformCreatorLower_(data.owner_email),
      owner_phone: angPlatformCreatorText_(data.owner_phone),
      employee_quota: Number(data.employee_quota || 0),
      note: angPlatformCreatorText_(data.note),
      updated_at: now
    };

    if (targetRow < 0) {
      rowObject.created_at = now;
      var newRow = headers.map(function(header) {
        return angPlatformCreatorValueByAlias_(header, rowObject, aliases);
      });
      sheet.appendRow(newRow);
      targetRow = sheet.getLastRow();
    } else {
      var oldRow = sheet.getRange(targetRow, 1, 1, headers.length).getValues()[0];
      var updatedRow = headers.map(function(header, index) {
        var value = angPlatformCreatorValueByAlias_(header, rowObject, aliases);
        return value === undefined ? oldRow[index] : value;
      });
      sheet.getRange(targetRow, 1, 1, headers.length).setValues([updatedRow]);
    }

    SpreadsheetApp.flush();

    return {
      ok: true,
      message: '公司資料已儲存',
      company_id: companyId,
      row: targetRow,
      updated_at: now
    };
  } catch (err) {
    return { ok: false, message: err && err.message ? err.message : String(err) };
  }
}

function angPlatformCreatorAssert_(creatorId, creatorKey) {
  creatorId = angPlatformCreatorUpper_(creatorId);
  creatorKey = String(creatorKey || '');

  if (creatorId !== ANG_PLATFORM_CREATOR_ID_) {
    throw new Error('此帳號不是平台 Creator');
  }

  var props = PropertiesService.getScriptProperties();
  var savedKey = String(props.getProperty('ANG8963_OWNER_KEY') || '');

  if (!savedKey) {
    throw new Error('尚未設定 Script Property：ANG8963_OWNER_KEY');
  }

  if (!angPlatformCreatorSafeEqual_(creatorKey, savedKey)) {
    throw new Error('管理金鑰不正確');
  }
}

function angPlatformCreatorOpenMaster_() {
  var props = PropertiesService.getScriptProperties();
  var id = String(
    props.getProperty('MASTER_SPREADSHEET_ID') ||
    props.getProperty('ANG_HR_DB_ID') ||
    ''
  ).trim();

  if (!id && typeof DEFAULT_ANG_HR_DB_ID !== 'undefined') {
    id = String(DEFAULT_ANG_HR_DB_ID || '').trim();
  }

  if (!id) throw new Error('尚未設定 MASTER_SPREADSHEET_ID');
  return SpreadsheetApp.openById(id);
}

function angPlatformCreatorReadSheet_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) return [];

  var values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];

  var headers = values[0].map(function(v) { return String(v || '').trim(); });
  return values.slice(1).filter(function(row) {
    return row.some(function(v) { return String(v || '').trim() !== ''; });
  }).map(function(row) {
    var obj = {};
    headers.forEach(function(header, index) {
      if (header) obj[header] = row[index];
    });
    return obj;
  });
}

function angPlatformCreatorNormalizeCompany_(row) {
  row = row || {};
  return {
    company_id: angPlatformCreatorPick_(row, ['company_id', '公司代碼', '公司ID']),
    company_code: angPlatformCreatorPick_(row, ['company_code', '公司代號', 'company_id']),
    company_name: angPlatformCreatorPick_(row, ['company_name', '公司名稱']),
    company_sub_name: angPlatformCreatorPick_(row, ['company_sub_name', '公司副名稱', '分店識別']),
    plan: angPlatformCreatorPick_(row, ['plan', '方案']) || 'business_basic',
    plan_code: angPlatformCreatorPick_(row, ['plan_code', '正式方案代碼', 'plan']) || 'business_basic',
    status: angPlatformCreatorPick_(row, ['status', '公司狀態', '服務狀態']) || 'active',
    payment_status: angPlatformCreatorPick_(row, ['payment_status', 'billing_status', '付款狀態']),
    owner_person_id: angPlatformCreatorPick_(row, ['owner_person_id', 'person_id', '平台人員ID']),
    creator_employee_no: angPlatformCreatorPick_(row, ['creator_employee_no', 'Creator員編']) || '0603',
    creator_employee_id: angPlatformCreatorPick_(row, ['creator_employee_id', 'Creator登入員編']) || 'ANG0603',
    owner_name: angPlatformCreatorPick_(row, ['owner_name', 'admin_name', '負責人姓名']),
    owner_email: angPlatformCreatorPick_(row, ['owner_email', 'verified_email', '負責人Email']),
    owner_phone: angPlatformCreatorPick_(row, ['owner_phone', 'admin_phone', '負責人電話']),
    employee_quota: angPlatformCreatorPick_(row, ['employee_quota', '員工上限']),
    active_employee_count: angPlatformCreatorPick_(row, ['active_employee_count', 'employee_count', '啟用員工數']),
    monthly_total: angPlatformCreatorPick_(row, ['monthly_total', '月費']),
    base_monthly_price: angPlatformCreatorPick_(row, ['base_monthly_price', '基本月費']),
    trial_ends_at: angPlatformCreatorPick_(row, ['trial_ends_at', '試用到期']),
    paid_until: angPlatformCreatorPick_(row, ['paid_until', '付費期限']),
    next_charge_at: angPlatformCreatorPick_(row, ['next_charge_at', '下次收費']),
    spreadsheet_url: angPlatformCreatorPick_(row, ['spreadsheet_url', 'company_spreadsheet_url', '公司試算表網址']),
    frontend_url: angPlatformCreatorPick_(row, ['frontend_url', '前端網址']),
    gas_api_url: angPlatformCreatorPick_(row, ['gas_api_url', 'GAS網址']),
    created_at: angPlatformCreatorPick_(row, ['created_at', '建立時間']),
    updated_at: angPlatformCreatorPick_(row, ['updated_at', '更新時間']),
    note: angPlatformCreatorPick_(row, ['note', '備註'])
  };
}

function angPlatformCreatorBuildSummary_(companies, people, memberships, subscriptions) {
  companies = companies || [];
  people = people || [];
  memberships = memberships || [];
  subscriptions = subscriptions || [];
  var summary = {
    total_companies: companies.length,
    active_companies: 0,
    paid_companies: 0,
    employee_total: 0,
    people_total: people.length,
    membership_total: memberships.length,
    active_subscription_total: subscriptions.filter(function(row) { return angPlatformCreatorLower_(row.status) === 'active'; }).length
  };

  companies.forEach(function(company) {
    var status = angPlatformCreatorLower_(company.status);
    var payment = angPlatformCreatorLower_(company.payment_status);
    if (status === 'active') summary.active_companies++;
    if (payment === 'active_paid' || payment === 'free_privilege') summary.paid_companies++;
    summary.employee_total += Number(company.active_employee_count || 0);
  });

  return summary;
}

function angPlatformCreatorHeaders_(sheet) {
  if (!sheet || sheet.getLastColumn() < 1) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0].map(function(v) {
    return String(v || '').trim();
  });
}

function angPlatformCreatorFindHeader_(headers, candidates) {
  var normalized = headers.map(function(v) { return angPlatformCreatorLower_(v); });
  for (var i = 0; i < candidates.length; i++) {
    var index = normalized.indexOf(angPlatformCreatorLower_(candidates[i]));
    if (index >= 0) return index;
  }
  return -1;
}

function angPlatformCreatorValueByAlias_(header, data, aliases) {
  var normalizedHeader = angPlatformCreatorLower_(header);
  var keys = Object.keys(aliases);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var candidates = aliases[key].map(function(v) { return angPlatformCreatorLower_(v); });
    if (candidates.indexOf(normalizedHeader) >= 0) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : undefined;
    }
  }
  return undefined;
}

function angPlatformCreatorPick_(obj, keys) {
  for (var i = 0; i < keys.length; i++) {
    if (Object.prototype.hasOwnProperty.call(obj, keys[i]) && String(obj[keys[i]] || '').trim() !== '') {
      return obj[keys[i]];
    }
  }
  return '';
}

function angPlatformCreatorSafeEqual_(a, b) {
  a = String(a || '');
  b = String(b || '');
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function angPlatformCreatorText_(value) {
  return String(value == null ? '' : value).trim();
}

function angPlatformCreatorUpper_(value) {
  return angPlatformCreatorText_(value).toUpperCase();
}

function angPlatformCreatorLower_(value) {
  return angPlatformCreatorText_(value).toLowerCase();
}

function angPlatformCreatorNow_() {
  return Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
}
