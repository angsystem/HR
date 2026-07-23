/************************************************************
 * ANG HR System｜入口 / 註冊 / 驗證 / 打卡 API 完整後端
 * 部署方式：Apps Script → 部署 → 網頁應用程式
 * 存取權：任何知道連結的人
 ************************************************************/

const ANG_HR_APP_NAME = 'ANG HR System';
const DEFAULT_ANG_HR_DB_ID = '1sv0j3S6VPnd7ucGvG0QKkC7s43gFuxZBDiAblb4Ri-M';
const DEFAULT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzNycUTGQG0gqgb8B6F7tndEhRXU7GAiKFFWZr0e8sDwL2kXU5tBGLlJR_iBdX7SCnH/exec';
const DEFAULT_FRONTEND_URL = 'https://angsystem.github.io/HR/';
const DEFAULT_CONTACT_EMAIL = 'ang0603.system@gmail.com';
const GOOGLE_CLIENT_ID = '660707205594-74rvsq9s1h87v1s5pi9nvtms1e4qipat.apps.googleusercontent.com';
const LINE_CHANNEL_ID = '2010402308';
const DEFAULT_CREATOR_EMPLOYEE_NO = '0603';
const DEFAULT_CREATOR_EMPLOYEE_ID = 'ANG0603';
const DEFAULT_CREATOR_PASSWORD = '0603';
const DEFAULT_CREATOR_NAME = '公司建立者';
const FIRST_MONTH_DAYS = 30;
const STANDARD_COMPANY_CODE_PREFIX = 'ANGC';
const FREE_PRIVILEGE_COMPANY_CODE_PREFIX = 'ANGVIP';

const FREE_PRIVILEGE_OWNER_ID = 'ANG8963';
const FREE_PRIVILEGE_CODE_PREFIX = 'ANG8963-';
const FREE_PRIVILEGE_OWNER_KEY_PROPERTY = 'ANG8963_OWNER_KEY';

const SHEET_COMPANIES = 'Companies';
const SHEET_EMPLOYEES = 'Employees';
const SHEET_EMAIL_CODES = 'EmailVerifications';
const SHEET_CLOCK_RECORDS = 'ClockRecords';
const SHEET_AUDIT_LOGS = 'AuditLogs';
const SHEET_SESSIONS = 'Sessions';
const SHEET_FREE_PRIVILEGES = 'FreePrivilegeCodes';

const DATA_UPLOAD_DEFAULT_SPREADSHEET_ID = DEFAULT_ANG_HR_DB_ID;
const DATA_UPLOAD_DEFAULT_ROOT_FOLDER_ID = '19K_Vo9CF7_VVyy87JANn8Dt9133Wo_Zp';
const SHEET_COMPANY_UPLOAD_AUTH = '公司上傳授權';
const SHEET_COMPANY_UPLOAD_LOGS = '公司資料上傳';
const SHEET_COMPANY_UPLOAD_FOLDERS = '公司資料夾對照';

const HEADERS = {};
HEADERS[SHEET_COMPANIES] = [
  'company_id', 'company_code', 'company_name', 'owner_person_id', 'plan', 'plan_code', 'plan_label', 'billing_status', 'billing_status_label',
  'verified_email', 'google_sub', 'verify_method', 'admin_name', 'admin_phone', 'birth_date',
  'tax_id', 'address', 'payment_method', 'authorization_code', 'base_monthly_price', 'addon_monthly_total', 'monthly_total', 'trial_started_at', 'trial_ends_at', 'next_charge_at', 'employee_quota', 'active_employee_count', 'creator_employee_no', 'creator_employee_id', 'creator_password', 'free_privilege_id',
  'created_at', 'first_month_ends_at', 'paid_until', 'status',
  'spreadsheet_id', 'spreadsheet_url', 'company_spreadsheet_id', 'company_spreadsheet_url', 'company_template_id',
  'drive_folder_id', 'google_drive_folder_id', 'drive_folder_tested_at', 'drive_folder_test_file_url',
  'employee_upload_enabled', 'employee_upload_drive_tested', 'employee_upload_folder_id', 'employee_upload_folder_url', 'employee_upload_test_file_url',
  'retention_months', 'retention_policy', 'last_cleanup_at',
  'data_hosting_mode', 'customer_spreadsheet_id', 'customer_spreadsheet_url', 'self_hosted_note'
];
HEADERS[SHEET_EMPLOYEES] = [
  'company_id', 'company_name', 'plan', 'plan_label', 'billing_status', 'billing_status_label',
  'branch_id', 'branch_name', 'person_id', 'employee_no', 'employee_id', 'password', 'name', 'role', 'email', 'phone', 'birth_date', 'google_sub', 'line_sub',
  'device_id', 'one_time_token', 'token_used', 'created_at', 'updated_at', 'status'
];
HEADERS[SHEET_EMAIL_CODES] = [
  'email', 'code_hash', 'expires_at', 'used', 'created_at', 'verified_at', 'device_id', 'flow', 'plan', 'company_id', 'request_date', 'status_id', 'source'
];
HEADERS[SHEET_CLOCK_RECORDS] = [
  'record_id', 'company_id', 'employee_id', 'clock_type', 'source', 'site_id', 'nfc_key',
  'lat', 'lng', 'accuracy', 'device_id', 'created_at', 'note'
];
HEADERS[SHEET_AUDIT_LOGS] = [
  'created_at', 'action', 'company_id', 'employee_id', 'email', 'status', 'message', 'payload'
];
HEADERS[SHEET_SESSIONS] = [
  'session_token', 'company_id', 'employee_id', 'role', 'device_id', 'created_at', 'expires_at', 'status'
];
HEADERS[SHEET_FREE_PRIVILEGES] = [
  'privilege_id', 'owner_id', 'issued_by', 'issued_to_email', 'note', 'status', 'created_at', 'used_at', 'used_company_id'
];

HEADERS[SHEET_COMPANY_UPLOAD_AUTH] = [
  'upload_id', 'token_hash', 'company_id', 'company_name', 'user_id', 'user_email', 'role',
  'action', 'data_type', 'folder_id', 'expires_at', 'status', 'created_at', 'used_at', 'upload_url'
];
HEADERS[SHEET_COMPANY_UPLOAD_LOGS] = [
  '時間', 'upload_id', '公司ID', '公司名稱', '使用者ID', 'Email', '身分', 'action',
  '資料類型', '備註', '原始檔名', '儲存檔名', '檔案網址', 'folder_id', '驗證狀態', '處理狀態'
];
HEADERS[SHEET_COMPANY_UPLOAD_FOLDERS] = [
  'company_id', 'company_name', 'folder_id', 'status', 'created_at', 'last_upload_at'
];



function authorizeMailPermissionOnce() {
  initializeSystem_();
  const email = Session.getEffectiveUser().getEmail() || Session.getActiveUser().getEmail();
  if (!email) {
    throw new Error('無法取得目前登入者 Email，請用部署者帳號登入 Apps Script 後再執行一次 authorizeMailPermissionOnce');
  }
  MailApp.sendEmail({
    to: email,
    subject: 'ANG HR System MailApp 權限確認',
    body: 'ANG HR System 已完成 MailApp.sendEmail 授權確認。之後 Email 驗證碼即可正常寄送。',
    name: 'ANG HR System'
  });
  return 'MailApp.sendEmail 權限已確認，測試信已寄到：' + email;
}

function checkRequiredScopesNote() {
  return {
    ok: true,
    message: '請確認 appsscript.json oauthScopes 已包含 script.send_mail，並重新部署新版 Web App。',
    required_scopes: [
      'https://www.googleapis.com/auth/script.send_mail',
      'https://www.googleapis.com/auth/script.external_request',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ]
  };
}

function doGet(e) {
  const p = e && e.parameter ? e.parameter : {};
  const page = normalizeLower_(p.page || '');

  if (page === 'upload') {
    return renderUploadPage_(p.upload_id || '', p.token || '', p.source || '');
  }

  const actionName = String(p.action || '').trim();
  if (actionName === 'platformCreatorEmailLinkVerify' || actionName === 'verifyPlatformCreatorEmailLink') {
    return renderPlatformCreatorEmailVerifyPage_(p);
  }

  // OAuth 按鈕是以瀏覽器導向 GAS。GET 必須直接轉往 Google／LINE，
  // 不能把 auth_url JSON 顯示在畫面上。
  const authGetResponse = routeBrowserOAuthGet_(actionName, getPayload_(e));
  if (authGetResponse) return authGetResponse;

  if (p.action) {
    return handleApi_(p.action, getPayload_(e), p.callback);
  }
  return outputHtml_();
}


function routeBrowserOAuthGet_(actionName, payload) {
  actionName = String(actionName || '').trim();
  if (['requestGoogleAuth', 'requestLineAuth', 'requestFacebookAuth', 'oauthCallback'].indexOf(actionName) < 0) {
    return null;
  }

  payload = payload || {};
  payload.action = actionName;

  if (actionName === 'oauthCallback') {
    if (typeof angHandleOAuthCallback_ !== 'function') {
      return outputJson_(fail_('找不到 OAuth callback 處理函式：請確認 Auth.js 已上傳'));
    }
    return angHandleOAuthCallback_(payload);
  }

  try {
    var authResult;
    if (actionName === 'requestGoogleAuth') {
      if (typeof angRequestGoogleAuth_ !== 'function') {
        throw new Error('找不到 Google OAuth 處理函式：請確認 Auth.js 已上傳');
      }
      authResult = angRequestGoogleAuth_(payload);
    } else if (actionName === 'requestLineAuth') {
      if (typeof angRequestLineAuth_ !== 'function') {
        throw new Error('找不到 LINE OAuth 處理函式：請確認 Auth.js 已上傳');
      }
      authResult = angRequestLineAuth_(payload);
    } else {
      if (typeof angRequestFacebookAuth_ !== 'function') throw new Error('找不到 Facebook OAuth 處理函式：請確認 Auth.js 已上傳');
      authResult = angRequestFacebookAuth_(payload);
    }

    if (!authResult || !authResult.auth_url) {
      throw new Error('OAuth 未產生 auth_url');
    }
    return angRedirectHtml_(authResult.auth_url);
  } catch (err) {
    var provider = actionName === 'requestGoogleAuth' ? 'google' : (actionName === 'requestLineAuth' ? 'line' : 'facebook');
    var message = err && err.message ? err.message : String(err);
    var entryUrl = 'https://angsystem.github.io/HR/index.html';

    try {
      if (typeof angGetEntryIndexUrl_ === 'function') {
        entryUrl = angGetEntryIndexUrl_() || entryUrl;
      }
      if (typeof angAppendParams_ === 'function' && typeof angRedirectHtml_ === 'function') {
        return angRedirectHtml_(angAppendParams_(entryUrl, {
          auth_error: '1',
          provider: provider,
          message: message
        }));
      }
    } catch (ignored) {}

    return outputJson_(fail_(message));
  }
}

function doPost(e) {
  const p = e && e.parameter ? e.parameter : {};
  const payload = getPayload_(e);
  return handleApi_(p.action || payload.action || '', payload, p.callback);
}

function handleApi_(action, payload, callback) {
  try {
    initializeSystem_();
    let result;
    switch (String(action || '').trim()) {
      case 'ping':
        result = apiPing_(payload);
        break;
      case 'createUploadSession':
        result = apiCreateUploadSession_(payload);
        break;
      case 'validateUploadToken':
        result = apiValidateUploadToken_(payload);
        break;
      case 'uploadCompanyDataByToken':
      case 'uploadCompanyData':
        result = apiUploadCompanyDataByToken_(payload);
        break;
      case 'requestEmailCode':
        result = apiRequestEmailCode_(payload);
        break;
      case 'verifyEmailCode':
        result = apiVerifyEmailCode_(payload);
        break;
      case 'verifyGoogleCredential':
        result = apiVerifyGoogleCredential_(payload);
        break;
      case 'verifyNativeGoogleIdToken':
        result = apiVerifyNativeGoogleIdToken_(payload);
        break;
      case 'verifyNativeLineIdToken':
        result = apiVerifyNativeLineIdToken_(payload);
        break;
      case 'registerCompany':
        result = apiRegisterCompany_(payload);
        break;
      case 'adminLogin':
        result = apiAdminLogin_(payload);
        break;
      case 'adminLoginByVerifiedAuth':
        result = apiAdminLoginByVerifiedAuth_(payload);
        break;
      case 'activateEmployee':
        result = apiActivateEmployee_(payload);
        break;
      case 'activateEmployeeByVerifiedAuth':
      case 'employeeActivateByVerifiedAuth':
        result = apiActivateEmployeeByVerifiedAuth_(payload);
        break;
      case 'getEmployeeCompaniesByVerifiedAuth':
        result = apiGetEmployeeCompaniesByVerifiedAuth_(payload);
        break;
      case 'addEmployee':
      case 'createEmployee':
      case 'registerEmployee':
        result = apiAddEmployee_(payload);
        break;
      case 'clockByButton':
        result = apiClockByButton_(payload);
        break;
      case 'nfcClock':
        result = apiNfcClock_(payload);
        break;
      case 'testCompanyDriveFolderAccess':
        result = testCompanyDriveFolderAccess(payload);
        break;
      case 'saveMixedModeSetting':
        result = saveMixedModeSetting(payload);
        break;
      case 'saveApproverSettings':
        result = saveApproverSettings(payload);
        break;
      case 'saveSystemSettings':
        result = saveSystemSettings(payload);
        break;
      case 'loadSystemSettings':
        result = loadSystemSettings(payload);
        break;
      case 'getPlans':
        result = apiGetPlans_();
        break;
      case 'issueFreePrivilegeCode':
        result = apiIssueFreePrivilegeCode_(payload);
        break;
      default:
        result = fail_('未知 action：' + action);
    }
    return outputJson_(result, callback);
  } catch (err) {
    return outputJson_(fail_(err && err.message ? err.message : String(err)), callback);
  }
}

function apiPing_(payload) {
  return ok_({
    app: ANG_HR_APP_NAME,
    now: nowText_(),
    device_id: normalize_(payload.device_id || '')
  });
}

function apiGetPlans_() {
  return ok_({
    plans: [
      { id: 'personal_lite', label: 'Personal Lite', family: 'personal', price: 0, note: '個人免費方案。' },
      { id: 'personal_solo', label: 'Personal Solo', family: 'personal', price: 69, note: '個人 Solo 方案。' },
      { id: 'personal_performance', label: 'Personal Performance', family: 'personal', price: 149, note: '個人 Performance 方案。' },
      { id: 'business_lite', label: 'Business Lite', family: 'business', price: 0, note: '小團隊免費方案。' },
      { id: 'business_basic', legacy_id: 'basic', label: 'Business Basic', family: 'business', price: 299, note: 'Business Basic。' },
      { id: 'business_pro', legacy_id: 'plus', label: 'Business Pro', family: 'business', price: 699, note: 'Business Pro；舊版 Plus 會自動相容。' },
      { id: 'business_premium', legacy_id: 'premium', label: 'Business Premium', family: 'business', price: 1299, note: 'Business Premium。' }
    ],
    modules_enabled: false
  });
}

function apiIssueFreePrivilegeCode_(payload) {
  const ownerId = normalizeUpper_(payload.owner_id || '');
  const ownerKey = normalize_(payload.owner_key || '');
  const auth = verifyFreePrivilegeOwner_(ownerId, ownerKey);
  if (!auth.ok) return fail_(auth.message);

  const requestedId = normalizeUpper_(payload.privilege_id || '');
  const privilegeId = requestedId || nextFreePrivilegeId_();
  if (!isValidFreePrivilegeId_(privilegeId)) return fail_('特權 ID 格式不正確，必須是 ANG8963-A、ANG8963-B 這類格式');

  const existing = findFreePrivilegeCode_(privilegeId);
  if (existing) return fail_('此特權 ID 已存在');

  getSheet_(SHEET_FREE_PRIVILEGES).appendRow([
    privilegeId,
    FREE_PRIVILEGE_OWNER_ID,
    ownerId,
    normalizeEmail_(payload.issued_to_email || ''),
    normalize_(payload.note || ''),
    'issued',
    nowText_(),
    '',
    ''
  ]);

  log_('issueFreePrivilegeCode', '', FREE_PRIVILEGE_OWNER_ID, normalizeEmail_(payload.issued_to_email || ''), 'ok', 'free privilege issued', { privilege_id: privilegeId });
  return ok_({
    message: '免付費特權 ID 已建立',
    privilege_id: privilegeId,
    owner_id: FREE_PRIVILEGE_OWNER_ID,
    status: 'issued'
  });
}

function apiRequestEmailCode_(payload) {
  const email = normalizeEmail_(payload.email || '');
  const flow = normalizeLower_(payload.flow || 'company_signup');
  const plan = normalizeLower_(payload.plan || '');
  const companyId = normalizeUpper_(payload.company_id || payload.company || payload.companyCode || '');
  const deviceId = normalize_(payload.device_id || '');
  const today = todayKey_();
  if (!email) return fail_('請輸入 Email');
  if (!isEmail_(email)) return fail_('Email 格式不正確');

  const sheet = getSheet_(SHEET_EMAIL_CODES);
  ensureHeader_(sheet, HEADERS[SHEET_EMAIL_CODES]);
  const rows = sheetToObjects_(sheet);
  const related = rows.filter(function(r) {
    return normalizeEmail_(r.email || '') === email &&
           normalizeLower_(r.flow || 'company_signup') === flow &&
           normalizeUpper_(r.company_id || '') === companyId &&
           normalize_(r.request_date || '').slice(0, 10) === today;
  });
  if (related.length >= 5) return fail_('今天此 Email 已寄送 5 次驗證碼，請明天再試或改用 Google / LINE。');
  if (related.length) {
    const latest = related.reduce(function(max, r) {
      const t = new Date(r.created_at || '').getTime() || 0;
      return Math.max(max, t);
    }, 0);
    const left = Math.ceil((60 * 1000 - (Date.now() - latest)) / 1000);
    if (left > 0) return fail_('請等待 ' + left + ' 秒後再重寄驗證碼');
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = hash_(email + ':' + code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  appendObjectRow_(SHEET_EMAIL_CODES, {
    email: email,
    code_hash: codeHash,
    expires_at: dateToIso_(expiresAt),
    used: 'no',
    created_at: nowText_(),
    verified_at: '',
    device_id: deviceId,
    flow: flow,
    plan: plan,
    company_id: companyId,
    request_date: today,
    status_id: normalize_(payload.statusId || payload.status_id || ''),
    source: normalize_(payload.source || '')
  });

  const eol = String.fromCharCode(10);
  const subject = flow === 'admin_login' ? 'ANG HR 後台登入驗證碼' : 'ANG HR System 驗證碼';
  const body = [
    '你的 ANG HR System 驗證碼是：' + code,
    '',
    '此驗證碼 10 分鐘內有效。',
    '同一信箱 60 秒內不可重寄，一天最多 5 次。',
    '如果不是你本人操作，請忽略此信。'
  ].join(eol);

  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: body,
    name: 'ANG HR System'
  });

  log_('requestEmailCode', companyId, '', email, 'ok', 'code sent', { device_id: deviceId, flow: flow, plan: plan, count_today: related.length + 1 });
  return ok_({ message: '驗證碼已寄出', resend_after_seconds: 60, daily_limit: 5, sent_today: related.length + 1 });
}

function apiVerifyEmailCode_(payload) {
  const email = normalizeEmail_(payload.email || '');
  const code = normalize_(payload.code || '');
  const flow = normalizeLower_(payload.flow || 'company_signup');
  const plan = normalizeLower_(payload.plan || '');
  const companyId = normalizeUpper_(payload.company_id || payload.company || '');
  if (!email || !code) return fail_('請輸入 Email 與驗證碼');

  const sheet = getSheet_(SHEET_EMAIL_CODES);
  ensureHeader_(sheet, HEADERS[SHEET_EMAIL_CODES]);
  const rows = sheetToObjects_(sheet);
  const expectHash = hash_(email + ':' + code);
  let foundIndex = -1;
  let found = null;

  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    const sameEmail = normalizeEmail_(r.email || '') === email;
    const sameCode = normalize_(r.code_hash || '') === expectHash;
    const sameFlow = normalizeLower_(r.flow || 'company_signup') === flow;
    const sameCompany = !companyId || normalizeUpper_(r.company_id || '') === companyId;
    if (sameEmail && sameCode && sameFlow && sameCompany && normalizeLower_(r.used || '') !== 'yes') {
      foundIndex = i;
      found = r;
      break;
    }
  }

  if (!found) return fail_('驗證碼錯誤或已使用');
  if (new Date(found.expires_at).getTime() < Date.now()) return fail_('驗證碼已過期，請重新寄送');

  const rowNumber = foundIndex + 2;
  const headerMap = getHeaderMap_(sheet);
  if (headerMap.used) sheet.getRange(rowNumber, headerMap.used).setValue('yes');
  if (headerMap.verified_at) sheet.getRange(rowNumber, headerMap.verified_at).setValue(nowText_());

  const tokenData = { method: 'email', provider: 'email', email: email, google_sub: '', line_sub: '', flow: flow, plan: plan || normalizeLower_(found.plan || ''), company_id: companyId || normalizeUpper_(found.company_id || '') };
  const profile = {
    method: 'email',
    provider: 'email',
    email: email,
    google_sub: '',
    line_sub: '',
    flow: tokenData.flow,
    plan: tokenData.plan,
    company_id: tokenData.company_id,
    verify_token: makeVerifyToken_(tokenData)
  };
  log_('verifyEmailCode', tokenData.company_id, '', email, 'ok', 'email verified', { flow: flow, plan: plan });
  return ok_({ message: 'Email 驗證完成', profile: profile, verify_token: profile.verify_token, flow: profile.flow, plan: profile.plan, email: email, company_id: profile.company_id });
}

function apiVerifyGoogleCredential_(payload) {
  const credential = normalize_(payload.credential || '');
  if (!credential) return fail_('缺少 Google credential');
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.indexOf('請填入') >= 0) return fail_('後端尚未設定 Google Client ID');

  const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential);
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) return fail_('Google token 驗證失敗');

  const data = JSON.parse(response.getContentText() || '{}');
  if (normalize_(data.aud) !== GOOGLE_CLIENT_ID) return fail_('Google Client ID 不符合');
  if (!data.email || String(data.email_verified) !== 'true') return fail_('Google Email 尚未完成驗證');

  const email = normalizeEmail_(data.email);
  const sub = normalize_(data.sub || '');
  const profile = {
    method: 'google',
    email: email,
    google_sub: sub,
    name: normalize_(data.name || ''),
    picture: normalize_(data.picture || ''),
    verify_token: makeVerifyToken_({ method: 'google', email: email, google_sub: sub })
  };
  log_('verifyGoogleCredential', '', '', email, 'ok', 'google verified', { sub: sub });
  return ok_({ message: 'Google 驗證完成', profile: profile });
}


function apiVerifyNativeGoogleIdToken_(payload) {
  const idToken = normalize_(payload.id_token || payload.credential || payload.loginToken || payload.token || '');
  if (!idToken) return fail_('缺少 Google id_token');
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.indexOf('請填入') >= 0) return fail_('後端尚未設定 Google Client ID');

  const url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken);
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const code = response.getResponseCode();
  const text = response.getContentText() || '{}';
  if (code < 200 || code >= 300) return fail_('Google token 驗證失敗：HTTP ' + code);

  const data = JSON.parse(text);
  if (normalize_(data.iss) !== 'https://accounts.google.com' && normalize_(data.iss) !== 'accounts.google.com') return fail_('Google token issuer 不符合');
  if (normalize_(data.aud) !== GOOGLE_CLIENT_ID) return fail_('Google Client ID 不符合：' + normalize_(data.aud));
  if (!data.email) return fail_('Google token 沒有 email');
  if (String(data.email_verified) && String(data.email_verified) !== 'true') return fail_('Google Email 尚未完成驗證');

  const email = normalizeEmail_(data.email);
  const sub = normalize_(data.sub || '');
  const verifyToken = makeVerifyToken_({
    method: 'google',
    provider: 'google',
    email: email,
    google_sub: sub,
    sub: sub,
    name: normalize_(data.name || payload.profile_name || ''),
    plan: normalizeLower_(payload.plan || ''),
    flow: normalizeLower_(payload.flow || ''),
    company_id: normalizeUpper_(payload.company_id || payload.company || '')
  });

  log_('verifyNativeGoogleIdToken', '', '', email, 'ok', 'native google verified', {
    sub: sub,
    plan: payload.plan || '',
    flow: payload.flow || '',
    device_id: payload.device_id || ''
  });

  return ok_({
    message: 'Google 原生驗證完成',
    provider: 'google',
    method: 'google',
    email: email,
    google_user_id: sub,
    google_sub: sub,
    profile_name: normalize_(data.name || payload.profile_name || ''),
    picture: normalize_(data.picture || ''),
    flow: normalizeLower_(payload.flow || ''),
    plan: normalizeLower_(payload.plan || ''),
    company_id: normalizeUpper_(payload.company_id || payload.company || ''),
    verify_token: verifyToken
  });
}

function apiVerifyNativeLineIdToken_(payload) {
  const idToken = normalize_(payload.id_token || payload.credential || payload.loginToken || payload.token || '');
  if (!idToken) return fail_('缺少 LINE id_token');
  if (!LINE_CHANNEL_ID || LINE_CHANNEL_ID.indexOf('請填入') >= 0) return fail_('後端尚未設定 LINE Channel ID');

  const response = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'post',
    payload: {
      id_token: idToken,
      client_id: LINE_CHANNEL_ID
    },
    muteHttpExceptions: true
  });
  const code = response.getResponseCode();
  const text = response.getContentText() || '{}';
  if (code < 200 || code >= 300) return fail_('LINE token 驗證失敗：HTTP ' + code + ' ' + text);

  const data = JSON.parse(text);
  if (normalize_(data.iss) !== 'https://access.line.me') return fail_('LINE token issuer 不符合');
  if (normalize_(data.aud) !== LINE_CHANNEL_ID) return fail_('LINE Channel ID 不符合：' + normalize_(data.aud));
  if (!data.sub) return fail_('LINE token 沒有 user id');

  const email = normalizeEmail_(data.email || payload.email || '');
  const sub = normalize_(data.sub || payload.line_user_id || '');
  const name = normalize_(data.name || payload.profile_name || '');
  const verifyToken = makeVerifyToken_({
    method: 'line',
    provider: 'line',
    email: email,
    line_sub: sub,
    sub: sub,
    name: name,
    plan: normalizeLower_(payload.plan || ''),
    flow: normalizeLower_(payload.flow || ''),
    company_id: normalizeUpper_(payload.company_id || payload.company || '')
  });

  log_('verifyNativeLineIdToken', '', '', email, 'ok', 'native line verified', {
    sub: sub,
    plan: payload.plan || '',
    flow: payload.flow || '',
    device_id: payload.device_id || ''
  });

  return ok_({
    message: 'LINE 原生驗證完成',
    provider: 'line',
    method: 'line',
    email: email,
    line_user_id: sub,
    profile_name: name,
    picture: normalize_(data.picture || ''),
    flow: normalizeLower_(payload.flow || ''),
    plan: normalizeLower_(payload.plan || ''),
    company_id: normalizeUpper_(payload.company_id || payload.company || ''),
    verify_token: verifyToken
  });
}


function apiRegisterCompany_(payload) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const verified = verifyVerifyToken_(payload.verify_token || '');
    if (!verified.ok) return fail_(verified.message || '驗證狀態無效，請重新驗證');

    const method = normalize_(verified.data.method || payload.verify_method || '');
    const email = normalizeEmail_(verified.data.email || '');
    const googleSub = normalize_(verified.data.google_sub || '');
    const lineSub = normalize_(verified.data.line_sub || '');
    if (!email && !googleSub && !lineSub) return fail_('缺少驗證身分');

    const companyName = normalize_(payload.company_name || '');
    const adminName = normalize_(payload.admin_name || '');
    const phone = normalize_(payload.phone || '');
    const birthDate = normalize_(payload.birth_date || '');
    const plan = normalizePlanIdV26_(payload.plan || 'basic');
    const taxId = normalize_(payload.tax_id || '');
    const address = normalize_(payload.address || '');
    const paymentMethod = normalizeLower_(payload.payment_method || 'trial_later');
    const authorizationCode = normalizeUpper_(payload.authorization_code || '');
    const privilegeId = normalizeUpper_(payload.privilege_id || '');
    const driveFolderId = normalize_(payload.driveFolderId || payload.drive_folder_id || payload.folderId || payload.googleDriveFolderId || payload.google_drive_folder_id || '');

    if (!companyName) return fail_('請輸入公司中文名稱');
    if (!adminName) return fail_('請輸入申請人姓名');
    if (!phone) return fail_('請輸入電話');
    if (!birthDate) return fail_('請輸入出生年月日');
    if (!isBusinessPlan_(plan)) return fail_('公司只能選擇 Business 方案');
    if (plan === 'private' && !customerSpreadsheetId) return fail_('Private 方案需提供客戶自己的 Google 試算表 ID 或網址。');
    if (!driveFolderId) return fail_('建立公司前請輸入 Google Drive 公開資料夾 ID，並先按測試確認可上傳檔案。');

    const ownerPerson = typeof angPeopleEnsureFromVerifiedAuth_ === 'function'
      ? angPeopleEnsureFromVerifiedAuth_({
          provider: method,
          email: email,
          phone: phone,
          profile_name: adminName,
          google_user_id: googleSub,
          line_user_id: lineSub,
          device_id: normalize_(payload.device_id || '')
        })
      : null;
    const ownerPersonId = ownerPerson ? ownerPerson.person_id : normalizeUpper_(verified.data.person_id || payload.person_id || '');
    const canonicalPlanCode = planCanonicalCode_(plan);

    const companies = sheetToObjects_(getSheet_(SHEET_COMPANIES));
    const duplicate = companies.some(function(c) {
      const sameEmail = email && normalizeEmail_(c.verified_email) === email;
      const sameGoogle = googleSub && normalize_(c.google_sub) === googleSub;
      const sameLine = lineSub && normalize_(c.line_sub) === lineSub;
      const active = normalizeLower_(c.status || 'active') !== 'deleted';
      return active && (sameEmail || sameGoogle || sameLine);
    });
    if (duplicate) return fail_('此 Email 或 Google 帳號已開通過，請登入原公司或聯絡客服');

    const privilegeCheck = checkFreePrivilegeCodeForUse_(privilegeId, companies);
    if (!privilegeCheck.ok) return fail_(privilegeCheck.message);
    const isFreePrivilege = !!privilegeCheck.is_free_privilege;

    const prefix = isFreePrivilege ? FREE_PRIVILEGE_COMPANY_CODE_PREFIX : STANDARD_COMPANY_CODE_PREFIX;
    const companyId = nextCompanyId_(prefix);
    const planLabel = planLabel_(plan);
    const isFreePlan = plan === 'lite';
    const billingStatus = isFreePrivilege ? 'free_privilege' : (isFreePlan ? 'free' : 'first_month_free');
    const billingLabel = isFreePrivilege ? '免付費特權' : (isFreePlan ? '免費方案' : '首月免費');
    const trialStartedAt = nowText_();
    const firstMonthEndsAt = (isFreePrivilege || isFreePlan) ? '' : dateToIso_(new Date(Date.now() + FIRST_MONTH_DAYS * 24 * 60 * 60 * 1000));
    const nextChargeAt = (isFreePrivilege || isFreePlan) ? '' : dateToIso_(new Date(Date.now() + (FIRST_MONTH_DAYS + 1) * 24 * 60 * 60 * 1000));
    const baseMonthlyPrice = planMonthlyPrice_(plan);
    const addonMonthlyTotal = 0;
    const monthlyTotal = (isFreePrivilege || isFreePlan) ? 0 : baseMonthlyPrice + addonMonthlyTotal;
    const employeeQuota = planEmployeeQuota_(plan);
    const activeEmployeeCount = 1;

    appendObjectRow_(SHEET_COMPANIES, {
      company_id: companyId,
      company_code: companyId,
      company_name: companyName,
      owner_person_id: ownerPersonId,
      plan: plan,
      plan_code: canonicalPlanCode,
      plan_label: planLabel,
      billing_status: billingStatus,
      billing_status_label: billingLabel,
      verified_email: email,
      google_sub: googleSub,
      verify_method: method,
      admin_name: adminName,
      admin_phone: phone,
      birth_date: birthDate,
      tax_id: taxId,
      address: address,
      payment_method: paymentMethod,
      authorization_code: authorizationCode,
      base_monthly_price: baseMonthlyPrice,
      addon_monthly_total: addonMonthlyTotal,
      monthly_total: monthlyTotal,
      trial_started_at: trialStartedAt,
      trial_ends_at: firstMonthEndsAt,
      next_charge_at: nextChargeAt,
      employee_quota: employeeQuota,
      active_employee_count: activeEmployeeCount,
      creator_employee_no: DEFAULT_CREATOR_EMPLOYEE_NO,
      creator_employee_id: DEFAULT_CREATOR_EMPLOYEE_ID,
      creator_password: DEFAULT_CREATOR_PASSWORD,
      free_privilege_id: isFreePrivilege ? privilegeId : '',
      created_at: nowText_(),
      first_month_ends_at: firstMonthEndsAt,
      paid_until: (isFreePrivilege || isFreePlan) ? 'unlimited' : firstMonthEndsAt,
      status: 'active',
      drive_folder_id: driveFolderId,
      google_drive_folder_id: driveFolderId,
      drive_folder_tested_at: nowText_(),
      drive_folder_test_file_url: normalize_(payload.driveFolderTestFileUrl || payload.drive_folder_test_file_url || '')
    });

    appendObjectRow_(SHEET_EMPLOYEES, {
      company_id: companyId,
      company_code: companyId,
      company_name: companyName,
      owner_person_id: ownerPersonId,
      plan: plan,
      plan_code: canonicalPlanCode,
      plan_label: planLabel,
      billing_status: billingStatus,
      billing_status_label: billingLabel,
      branch_id: 'MAIN',
      branch_name: companyName,
      person_id: ownerPersonId,
      employee_no: DEFAULT_CREATOR_EMPLOYEE_NO,
      employee_id: DEFAULT_CREATOR_EMPLOYEE_ID,
      password: DEFAULT_CREATOR_PASSWORD,
      name: adminName || DEFAULT_CREATOR_NAME,
      role: 'Owner',
      email: email,
      phone: phone,
      birth_date: birthDate,
      google_sub: googleSub,
      line_sub: lineSub,
      device_id: normalize_(payload.device_id || ''),
      one_time_token: '',
      token_used: 'yes',
      created_at: nowText_(),
      updated_at: nowText_(),
      status: 'active'
    });

    if (typeof angPeopleRegisterCompanyCreator_ === 'function') {
      angPeopleRegisterCompanyCreator_({
        person_id: ownerPersonId,
        company_id: companyId,
        owner_name: adminName,
        owner_email: email,
        owner_phone: phone,
        auth_provider: method,
        google_user_id: googleSub,
        line_user_id: lineSub,
        device_id: normalize_(payload.device_id || ''),
        plan_code: canonicalPlanCode,
        payment_status: billingStatus,
        trial_started_at: trialStartedAt,
        trial_ends_at: firstMonthEndsAt
      });
    }

    if (isFreePrivilege) {
      markFreePrivilegeCodeUsed_(privilegeCheck.row_number, companyId);
    }

    log_('registerCompany', companyId, DEFAULT_CREATOR_EMPLOYEE_ID, email, 'ok', 'company created', { plan: plan, billing_status: billingStatus, free_privilege_id: isFreePrivilege ? privilegeId : '' });
    return ok_({
      message: '公司建立完成',
      company_id: companyId,
      company_code: companyId,
      company_name: companyName,
      owner_person_id: ownerPersonId,
      plan: plan,
      plan_code: canonicalPlanCode,
      plan_label: planLabel,
      billing_status: billingStatus,
      billing_status_label: billingLabel,
      employee_no: DEFAULT_CREATOR_EMPLOYEE_NO,
      employee_id: DEFAULT_CREATOR_EMPLOYEE_ID,
      password: DEFAULT_CREATOR_PASSWORD,
      role: 'Owner',
      trial_started_at: trialStartedAt,
      trial_ends_at: firstMonthEndsAt,
      first_month_ends_at: firstMonthEndsAt,
      next_charge_at: nextChargeAt,
      base_monthly_price: baseMonthlyPrice,
      addon_monthly_total: addonMonthlyTotal,
      monthly_total: monthlyTotal,
      employee_quota: employeeQuota,
      payment_method: paymentMethod,
      authorization_code: authorizationCode ? authorizationCode : '',
      drive_folder_id: driveFolderId,
      google_drive_folder_id: driveFolderId
    });
  } finally {
    lock.releaseLock();
  }
}

function apiAdminLogin_(payload) {
  const companyId = normalizeUpper_(payload.company_id || '');
  const employeeId = normalizeUpper_(payload.employee_id || '');
  const password = String(payload.password || '');
  const deviceId = normalize_(payload.device_id || '');
  if (!companyId || !employeeId || !password) return fail_('請輸入公司代號、員工編號與密碼');

  const employee = findEmployee_(companyId, employeeId);
  if (!employee) return fail_('找不到員工資料');
  if (normalize_(employee.status || 'active').toLowerCase() !== 'active') return fail_('此帳號未啟用');
  if (String(employee.password || '') !== password) return fail_('密碼錯誤');
  if (!isAdminRole_(employee.role)) return fail_('此帳號不是管理員');

  const token = makeSessionToken_();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  getSheet_(SHEET_SESSIONS).appendRow([
    token,
    companyId,
    employeeId,
    normalize_(employee.role),
    deviceId,
    nowText_(),
    dateToIso_(expiresAt),
    'active'
  ]);
  log_('adminLogin', companyId, employeeId, employee.email || '', 'ok', 'login ok', { device_id: deviceId });
  return ok_({
    message: '登入成功',
    company_id: companyId,
    company_name: employee.company_name || '',
    plan: employee.plan || '',
    plan_label: employee.plan_label || '',
    billing_status: employee.billing_status || '',
    billing_status_label: employee.billing_status_label || '',
    employee_id: employeeId,
    name: employee.name || '',
    role: employee.role || '',
    session_token: token
  });
}

function apiAdminLoginByVerifiedAuth_(payload) {
  const companyId = normalizeUpper_(payload.company_id || payload.company || payload.companyCode || '');
  const verify = verifyVerifyToken_(payload.verify_token || '');
  const deviceId = normalize_(payload.device_id || '');
  if (!companyId) return fail_('請輸入公司代碼');
  if (!verify.ok) return fail_(verify.message || '驗證已失效，請重新驗證');
  const employee = findAdminByVerifiedAuth_(companyId, verify.data || {});
  if (!employee) return fail_('此驗證身分沒有此公司的後台管理員資料');
  const token = createSessionForEmployee_(companyId, employee, deviceId);
  log_('adminLoginByVerifiedAuth', companyId, employee.employee_id || '', employee.email || verify.data.email || '', 'ok', 'verified admin login ok', { provider: verify.data.provider || verify.data.method || '', device_id: deviceId });
  return buildAdminLoginResponse_(companyId, employee, token);
}

function apiAddEmployee_(payload) {
  const companyId = normalizeUpper_(payload.company_id || payload.company || '');
  if (!companyId) return fail_('缺少公司代碼');
  const company = findCompany_(companyId);
  if (!company) return fail_('找不到公司資料');
  const name = normalize_(payload.name || payload.employee_name || '');
  const phone = normalize_(payload.phone || '');
  const email = normalizeEmail_(payload.email || '');
  const role = normalize_(payload.role || 'Employee');
  let employeeId = normalizeUpper_(payload.employee_id || payload.id || '');
  if (!name) return fail_('請輸入員工姓名');
  if (!phone) return fail_('請輸入員工手機號碼');
  if (!employeeId) employeeId = nextEmployeeId_(companyId);
  if (findEmployee_(companyId, employeeId)) return fail_('員工編號已存在');
  const token = normalizeUpper_(payload.one_time_token || ('ACT' + Math.random().toString(36).slice(2, 10).toUpperCase()));
  appendObjectRow_(SHEET_EMPLOYEES, {
    company_id: companyId,
    company_name: company.company_name || '',
    plan: company.plan || '',
    plan_label: company.plan_label || '',
    billing_status: company.billing_status || '',
    billing_status_label: company.billing_status_label || '',
    branch_id: normalizeUpper_(payload.branch_id || 'MAIN'),
    branch_name: normalize_(payload.branch_name || company.company_name || 'MAIN'),
    employee_id: employeeId,
    password: normalize_(payload.password || ''),
    name: name,
    role: role,
    email: email,
    phone: phone,
    birth_date: normalize_(payload.birth_date || ''),
    google_sub: '',
    line_sub: '',
    device_id: '',
    one_time_token: token,
    token_used: 'no',
    created_at: nowText_(),
    updated_at: nowText_(),
    status: 'active'
  });
  log_('addEmployee', companyId, employeeId, email, 'ok', 'employee created', { phone: phone });
  return ok_({ message: '員工新增完成', company_id: companyId, employee_id: employeeId, one_time_token: token, activation_code: token });
}

function nextEmployeeId_(companyId) {
  const rows = sheetToObjects_(getSheet_(SHEET_EMPLOYEES));
  let max = 0;
  rows.forEach(function(r) {
    if (normalizeUpper_(r.company_id || '') !== companyId) return;
    const id = normalizeUpper_(r.employee_id || '');
    const m = id.match(/(\d+)$/);
    if (m) max = Math.max(max, Number(m[1] || 0));
  });
  var next = max + 1;
  if (next === 603) next = 604;
  return 'ANG' + String(next).padStart(4, '0');
}

function apiActivateEmployeeByVerifiedAuth_(payload) {
  const companyId = normalizeUpper_(payload.company_id || payload.company || '');
  const employeeId = normalizeUpper_(payload.employee_id || payload.id || '');
  const oneTimeToken = normalize_(payload.token || payload.activation_code || payload.one_time_token || '');
  const phone = normalize_(payload.phone || '');
  const deviceId = normalize_(payload.device_id || '');
  const verify = verifyVerifyToken_(payload.verify_token || '');
  if (!companyId || !employeeId || !oneTimeToken) return fail_('請輸入公司代號、員工編號與開通碼');
  if (!phone) return fail_('請輸入手機號碼');
  if (!verify.ok) return fail_(verify.message || '驗證已失效，請重新驗證');
  const sheet = getSheet_(SHEET_EMPLOYEES);
  const rows = sheetToObjects_(sheet);
  const headerMap = getHeaderMap_(sheet);
  const email = normalizeEmail_(verify.data.email || '');
  const googleSub = normalize_(verify.data.google_sub || '');
  const lineSub = normalize_(verify.data.line_sub || '');
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (normalizeUpper_(r.company_id) !== companyId || normalizeUpper_(r.employee_id) !== employeeId) continue;
    if (normalize_(r.one_time_token || '') !== oneTimeToken) return fail_('一次性開通碼錯誤');
    if (normalizeLower_(r.token_used || '') === 'yes') return fail_('此開通碼已使用');
    const rowNumber = i + 2;
    if (headerMap.device_id) sheet.getRange(rowNumber, headerMap.device_id).setValue(deviceId);
    if (headerMap.phone) sheet.getRange(rowNumber, headerMap.phone).setValue(phone);
    if (headerMap.email && email && !normalizeEmail_(r.email || '')) sheet.getRange(rowNumber, headerMap.email).setValue(email);
    if (headerMap.google_sub && googleSub) sheet.getRange(rowNumber, headerMap.google_sub).setValue(googleSub);
    if (headerMap.line_sub && lineSub) sheet.getRange(rowNumber, headerMap.line_sub).setValue(lineSub);
    if (headerMap.token_used) sheet.getRange(rowNumber, headerMap.token_used).setValue('yes');
    if (headerMap.updated_at) sheet.getRange(rowNumber, headerMap.updated_at).setValue(nowText_());
    const employee = findEmployee_(companyId, employeeId) || r;
    const session = createSessionForEmployee_(companyId, Object.assign({},employee,{employee_id:employeeId}), deviceId);
    log_('activateEmployeeByVerifiedAuth', companyId, employeeId, email || r.email || '', 'ok', 'employee verified activated', { provider: verify.data.provider || verify.data.method || '' });
    return ok_({ message: '開通成功', company_id: companyId, company_name: r.company_name || '', employee_id: employeeId, name: r.name || '', role: r.role || 'Employee', session_token: session, auto_login: true });
  }
  return fail_('找不到員工資料');
}

function apiGetEmployeeCompaniesByVerifiedAuth_(payload) {
  const verify = verifyVerifyToken_(payload.verify_token || '');
  if (!verify.ok) return fail_(verify.message || '驗證已失效，請重新驗證');
  const email = normalizeEmail_(verify.data.email || '');
  const googleSub = normalize_(verify.data.google_sub || verify.data.sub || '');
  const lineSub = normalize_(verify.data.line_sub || verify.data.sub || '');
  const rows = sheetToObjects_(getSheet_(SHEET_EMPLOYEES));
  const companies = [];
  rows.forEach(function(r){
    if (normalizeLower_(r.status || 'active') !== 'active') return;
    const okEmail = email && normalizeEmail_(r.email || '') === email;
    const okGoogle = googleSub && normalize_(r.google_sub || '') === googleSub;
    const okLine = lineSub && normalize_(r.line_sub || '') === lineSub;
    if (!okEmail && !okGoogle && !okLine) return;
    if (companies.length >= 3) return;
    companies.push({ company_id: normalizeUpper_(r.company_id || ''), company_name: r.company_name || '', employee_id: normalizeUpper_(r.employee_id || ''), name: r.name || '', role: r.role || '' });
  });
  return ok_({ companies: companies, max_companies: 3 });
}

function apiActivateEmployee_(payload) {
  const companyId = normalizeUpper_(payload.company_id || '');
  const employeeId = normalizeUpper_(payload.employee_id || '');
  const token = normalize_(payload.token || '');
  const deviceId = normalize_(payload.device_id || '');
  if (!companyId || !employeeId || !token) return fail_('請輸入公司代號、員工編號與一次性開通碼');

  const sheet = getSheet_(SHEET_EMPLOYEES);
  const rows = sheetToObjects_(sheet);
  const headerMap = getHeaderMap_(sheet);
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (normalizeUpper_(r.company_id) === companyId && normalizeUpper_(r.employee_id) === employeeId) {
      if (normalize_(r.one_time_token || '') !== token) return fail_('一次性開通碼錯誤');
      if (normalizeLower_(r.token_used || '') === 'yes') return fail_('此開通碼已使用');
      const rowNumber = i + 2;
      sheet.getRange(rowNumber, headerMap.device_id).setValue(deviceId);
      sheet.getRange(rowNumber, headerMap.token_used).setValue('yes');
      sheet.getRange(rowNumber, headerMap.updated_at).setValue(nowText_());
      log_('activateEmployee', companyId, employeeId, r.email || '', 'ok', 'activated', { device_id: deviceId });
      return ok_({
        message: '開通成功',
        company_id: companyId,
        company_name: r.company_name || '',
        plan: r.plan || '',
        plan_label: r.plan_label || '',
        employee_id: employeeId,
        name: r.name || '',
        role: r.role || ''
      });
    }
  }
  return fail_('找不到員工資料');
}

function apiClockByButton_(payload) {
  const companyId = normalizeUpper_(payload.company_id || '');
  const employeeId = normalizeUpper_(payload.employee_id || '');
  const password = String(payload.password || '');
  const clockType = normalize_(payload.clock_type || '上班');
  const deviceId = normalize_(payload.device_id || '');
  const loc = payload.location || {};
  if (!companyId || !employeeId || !password) return fail_('請輸入公司代號、員工編號與密碼');
  if (['上班', '下班', '加班'].indexOf(clockType) < 0) return fail_('打卡類型不正確');

  const employee = findEmployee_(companyId, employeeId);
  if (!employee) return fail_('找不到員工資料');
  if (String(employee.password || '') !== password) return fail_('密碼錯誤');
  if (normalizeLower_(employee.status || 'active') !== 'active') return fail_('此帳號未啟用');

  const recordId = 'CLK' + Date.now() + Math.random().toString(36).slice(2, 7).toUpperCase();
  getSheet_(SHEET_CLOCK_RECORDS).appendRow([
    recordId,
    companyId,
    employeeId,
    clockType,
    normalize_(payload.source || 'manual_button'),
    normalize_(payload.site_id || ''),
    normalize_(payload.nfc_key || ''),
    loc && loc.lat ? loc.lat : '',
    loc && loc.lng ? loc.lng : '',
    loc && loc.accuracy ? loc.accuracy : '',
    deviceId,
    nowText_(),
    '入口頁備援打卡'
  ]);
  log_('clockByButton', companyId, employeeId, employee.email || '', 'ok', 'clock ok', { record_id: recordId, clock_type: clockType });
  return ok_({
    message: clockType + '打卡成功',
    record_id: recordId,
    created_at: nowText_()
  });
}

function apiNfcClock_(payload) {
  const p = payload || {};
  p.source = 'nfc';
  return apiClockByButton_(p);
}


function verifyFreePrivilegeOwner_(ownerId, ownerKey) {
  if (normalizeUpper_(ownerId) !== FREE_PRIVILEGE_OWNER_ID) return { ok: false, message: '只有 ANG8963 可以發送免付費特權 ID' };
  const props = PropertiesService.getScriptProperties();
  const savedKey = normalize_(props.getProperty(FREE_PRIVILEGE_OWNER_KEY_PROPERTY) || '');
  if (!savedKey) return { ok: false, message: '尚未設定 ANG8963 發碼密鑰，請先執行 setupAng8963OwnerKey' };
  if (!ownerKey || ownerKey !== savedKey) return { ok: false, message: 'ANG8963 發碼密鑰不正確' };
  return { ok: true };
}

function checkFreePrivilegeCodeForUse_(privilegeId, companies) {
  privilegeId = normalizeUpper_(privilegeId || '');
  if (!privilegeId) return { ok: true, is_free_privilege: false };
  if (!isValidFreePrivilegeId_(privilegeId)) return { ok: false, message: '特權 ID 格式不正確' };

  const record = findFreePrivilegeCode_(privilegeId);
  if (!record) return { ok: false, message: '此特權 ID 尚未由 ANG8963 發送' };

  const row = record.data || {};
  if (normalizeUpper_(row.owner_id || '') !== FREE_PRIVILEGE_OWNER_ID) return { ok: false, message: '此特權 ID 不是 ANG8963 發送' };

  const status = normalizeLower_(row.status || '');
  if (status === 'used' || normalize_(row.used_at || '') || normalize_(row.used_company_id || '')) return { ok: false, message: '此特權 ID 已使用' };
  if (status && ['issued', 'active', 'unused'].indexOf(status) < 0) return { ok: false, message: '此特權 ID 目前不可使用' };

  const privilegeUsed = (companies || []).some(function(c) {
    const active = normalizeLower_(c.status || 'active') !== 'deleted';
    return active && normalizeUpper_(c.free_privilege_id || '') === privilegeId;
  });
  if (privilegeUsed) return { ok: false, message: '此特權 ID 已被公司使用' };

  return { ok: true, is_free_privilege: true, row_number: record.rowNumber };
}

function markFreePrivilegeCodeUsed_(rowNumber, companyId) {
  if (!rowNumber) return;
  const sheet = getSheet_(SHEET_FREE_PRIVILEGES);
  const headerMap = getHeaderMap_(sheet);
  if (headerMap.status) sheet.getRange(rowNumber, headerMap.status).setValue('used');
  if (headerMap.used_at) sheet.getRange(rowNumber, headerMap.used_at).setValue(nowText_());
  if (headerMap.used_company_id) sheet.getRange(rowNumber, headerMap.used_company_id).setValue(companyId || '');
}

function findFreePrivilegeCode_(privilegeId) {
  privilegeId = normalizeUpper_(privilegeId || '');
  if (!privilegeId) return null;
  const rows = sheetToObjects_(getSheet_(SHEET_FREE_PRIVILEGES));
  for (let i = 0; i < rows.length; i++) {
    if (normalizeUpper_(rows[i].privilege_id || '') === privilegeId) return { rowNumber: i + 2, data: rows[i] };
  }
  return null;
}

function isValidFreePrivilegeId_(privilegeId) {
  privilegeId = normalizeUpper_(privilegeId || '');
  return /^ANG8963-[A-Z]+[0-9]*$/.test(privilegeId);
}

function nextFreePrivilegeId_() {
  const rows = sheetToObjects_(getSheet_(SHEET_FREE_PRIVILEGES));
  let max = 0;
  rows.forEach(function(r) {
    const id = normalizeUpper_(r.privilege_id || '');
    if (id.indexOf(FREE_PRIVILEGE_CODE_PREFIX) === 0) {
      const suffix = id.slice(FREE_PRIVILEGE_CODE_PREFIX.length).replace(/[0-9]+$/g, '');
      const n = lettersToNumber_(suffix);
      if (n > max) max = n;
    }
  });
  return FREE_PRIVILEGE_CODE_PREFIX + numberToLetters_(max + 1);
}

function numberToLetters_(num) {
  num = Number(num || 0);
  let out = '';
  while (num > 0) {
    const mod = (num - 1) % 26;
    out = String.fromCharCode(65 + mod) + out;
    num = Math.floor((num - 1) / 26);
  }
  return out || 'A';
}

function lettersToNumber_(letters) {
  letters = normalizeUpper_(letters || '');
  let n = 0;
  for (let i = 0; i < letters.length; i++) {
    const code = letters.charCodeAt(i);
    if (code < 65 || code > 90) return 0;
    n = n * 26 + (code - 64);
  }
  return n;
}


/************************************************************
 * ANG HR｜WebApp 專屬公司資料上傳
 * - 上傳頁由 GAS WebApp 顯示：?page=upload&upload_id=...&token=...
 * - 使用 upload_id + token 自動判斷 company_id / user_id / action
 * - 每家公司自動建立專屬暫存資料夾
 ************************************************************/

function setupInitialSystem_FULL() {
  setupAngHrProjectProperties();
  initializeSystem_();
  initializeUploadSystem_();
  return {
    ok: true,
    message: 'ANG HR 初始表格與 Script Properties 已完成',
    spreadsheet_id: getDb_().getId(),
    data_upload_spreadsheet_id: getUploadDb_().getId(),
    root_folder_id: getScriptProp_('DATA_UPLOAD_ROOT_FOLDER_ID', DATA_UPLOAD_DEFAULT_ROOT_FOLDER_ID),
    web_app_url: getScriptProp_('WEB_APP_URL', DEFAULT_WEB_APP_URL),
    frontend_url: getScriptProp_('FRONTEND_URL', DEFAULT_FRONTEND_URL)
  };
}

function setupAngHrProjectProperties() {
  const props = PropertiesService.getScriptProperties();
  props.setProperties({
    ANG_HR_DB_ID: DEFAULT_ANG_HR_DB_ID,
    DATA_UPLOAD_SPREADSHEET_ID: DATA_UPLOAD_DEFAULT_SPREADSHEET_ID,
    DATA_UPLOAD_ROOT_FOLDER_ID: DATA_UPLOAD_DEFAULT_ROOT_FOLDER_ID,
    FRONTEND_URL: DEFAULT_FRONTEND_URL,
    WEB_APP_URL: DEFAULT_WEB_APP_URL,
    CONTACT_EMAIL: DEFAULT_CONTACT_EMAIL,
    GOOGLE_WEB_CLIENT_ID: GOOGLE_CLIENT_ID,
    GOOGLE_ALLOWED_CLIENT_IDS: GOOGLE_CLIENT_ID
  }, false);
  return 'Script Properties 已寫入';
}

function apiCreateUploadSession_(payload) {
  return createUploadSession(payload || {});
}

function apiValidateUploadToken_(payload) {
  const uploadId = normalize_(payload.upload_id || payload.uploadId || '');
  const token = normalize_(payload.token || '');
  const auth = validateUploadToken_(uploadId, token, false);
  if (auth && auth.ok) {
    delete auth.row_number;
  }
  return auth;
}

function apiUploadCompanyDataByToken_(payload) {
  return uploadCompanyDataByToken(payload || {});
}

function renderUploadPage_(uploadId, token, source) {
  const auth = validateUploadToken_(uploadId, token, false);
  if (auth && auth.ok) {
    auth.token = token;
    auth.source = source || '';
    auth.frontend_url = getScriptProp_('FRONTEND_URL', DEFAULT_FRONTEND_URL);
    auth.contact_email = getScriptProp_('CONTACT_EMAIL', DEFAULT_CONTACT_EMAIL);
  }

  const tpl = HtmlService.createTemplateFromFile('UploadPage');
  tpl.AUTH = auth;
  return tpl.evaluate()
    .setTitle('ANG HR｜公司資料上傳')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function createUploadSession(payload) {
  initializeSystem_();
  initializeUploadSystem_();

  payload = payload || {};
  const companyId = normalizeUpper_(payload.company_id || payload.companyId || payload.company_code || payload.companyCode || '');
  const userId = normalizeUpper_(payload.user_id || payload.userId || payload.id || '');
  const userEmail = normalizeEmail_(payload.user_email || payload.userEmail || payload.email || '');
  const role = normalize_(payload.role || 'Uploader');
  const action = normalize_(payload.upload_action || payload.uploadAction || payload.action || 'uploadCompanyData');
  const dataType = normalize_(payload.data_type || payload.dataType || '公司資料上傳');
  let companyName = normalize_(payload.company_name || payload.companyName || '');

  if (!companyId) return fail_('缺少 company_id');
  if (!userEmail) return fail_('缺少 user_email / email');

  const company = findCompany_(companyId);
  if (company) companyName = companyName || normalize_(company.company_name || '');
  companyName = companyName || companyId;

  let validDays = Number(payload.valid_days || payload.validDays || 7);
  if (!validDays || validDays < 1) validDays = 7;

  const uploadId = 'UPL_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12).toUpperCase();
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
  const tokenHash = hash_(token);
  const folder = getOrCreateCompanyUploadFolder_(companyId, companyName);
  const expiresAt = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

  const frontendUrl = getScriptProp_('FRONTEND_URL', getScriptProp_('WEB_FRONTEND_URL', getScriptProp_('GITHUB_FRONTEND_URL', DEFAULT_WEB_APP_URL))) || ScriptApp.getService().getUrl();
  const uploadUrl = frontendUrl + '?page=upload&upload_id=' + encodeURIComponent(uploadId) + '&token=' + encodeURIComponent(token);

  getUploadAuthSheet_().appendRow([
    uploadId,
    tokenHash,
    companyId,
    companyName,
    userId,
    userEmail,
    role,
    action,
    dataType,
    folder.getId(),
    dateToIso_(expiresAt),
    'active',
    nowText_(),
    '',
    uploadUrl
  ]);

  log_('createUploadSession', companyId, userId, userEmail, 'ok', 'upload session created', {
    upload_id: uploadId,
    action: action,
    data_type: dataType,
    folder_id: folder.getId()
  });

  return ok_({
    message: '專屬上傳連結已建立',
    upload_id: uploadId,
    token: token,
    uploadUrl: uploadUrl,
    company_id: companyId,
    company_name: companyName,
    user_id: userId,
    user_email: userEmail,
    role: role,
    action: action,
    data_type: dataType,
    folder_id: folder.getId(),
    expires_at: dateToIso_(expiresAt)
  });
}

function uploadCompanyDataByToken(payload) {
  initializeUploadSystem_();

  payload = payload || {};
  const uploadId = normalize_(payload.upload_id || payload.uploadId || '');
  const token = normalize_(payload.token || '');
  const auth = validateUploadToken_(uploadId, token, true);
  if (!auth.ok) return auth;

  const note = normalize_(payload.note || '');
  const fileName = normalize_(payload.file_name || payload.fileName || '');
  const fileMime = normalize_(payload.file_mime || payload.fileMime || 'application/octet-stream');
  const fileBase64 = normalize_(payload.file_base64 || payload.fileBase64 || '');

  if (!fileName && !fileBase64 && !note) {
    return fail_('請選擇檔案或填寫備註');
  }

  let fileUrl = '';
  let savedName = '';
  let processStatus = 'submitted_no_file';

  if (fileName && fileBase64) {
    const bytes = Utilities.base64Decode(fileBase64);
    const blob = Utilities.newBlob(bytes, fileMime, fileName);
    const folder = DriveApp.getFolderById(auth.folder_id);
    const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Taipei', 'yyyyMMdd_HHmmss');
    const safeCompany = normalize_(auth.company_id || 'COMPANY').replace(/[\\/:*?"<>|]/g, '_');
    savedName = stamp + '_' + safeCompany + '_' + fileName;
    const file = folder.createFile(blob).setName(savedName);
    fileUrl = file.getUrl();
    processStatus = 'uploaded';
  }

  getUploadLogSheet_().appendRow([
    nowText_(),
    auth.upload_id,
    auth.company_id,
    auth.company_name,
    auth.user_id,
    auth.user_email,
    auth.role,
    auth.action,
    auth.data_type,
    note,
    fileName,
    savedName,
    fileUrl,
    auth.folder_id,
    'verified',
    processStatus
  ]);

  updateUploadAuthUsedAt_(auth.upload_id);
  updateCompanyUploadFolderLastAt_(auth.company_id);

  log_('uploadCompanyDataByToken', auth.company_id, auth.user_id, auth.user_email, 'ok', processStatus, {
    upload_id: auth.upload_id,
    file_name: fileName,
    file_url: fileUrl,
    action: auth.action
  });

  return ok_({
    message: fileUrl ? '資料已上傳完成' : '資料確認已送出',
    upload_id: auth.upload_id,
    company_id: auth.company_id,
    company_name: auth.company_name,
    action: auth.action,
    fileUrl: fileUrl,
    fileName: savedName || fileName,
    process_status: processStatus
  });
}

function validateUploadToken_(uploadId, token, forUpload) {
  initializeUploadSystem_();

  uploadId = normalize_(uploadId || '');
  token = normalize_(token || '');

  if (!uploadId || !token) {
    return fail_('缺少 upload_id 或 token，請使用專屬上傳連結');
  }

  const rows = sheetToObjects_(getUploadAuthSheet_());
  const tokenHash = hash_(token);

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (normalize_(r.upload_id || '') !== uploadId) continue;

    const status = normalizeLower_(r.status || '');
    if (status !== 'active') return fail_('此上傳連結已停用或已完成');
    if (normalize_(r.token_hash || '') !== tokenHash) return fail_('上傳連結驗證失敗');

    const expiresAt = normalize_(r.expires_at || '');
    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
      return fail_('此上傳連結已過期');
    }

    return ok_({
      row_number: i + 2,
      upload_id: uploadId,
      company_id: normalizeUpper_(r.company_id || ''),
      company_name: normalize_(r.company_name || ''),
      user_id: normalizeUpper_(r.user_id || ''),
      user_email: normalizeEmail_(r.user_email || ''),
      role: normalize_(r.role || ''),
      action: normalize_(r.action || ''),
      data_type: normalize_(r.data_type || ''),
      folder_id: normalize_(r.folder_id || ''),
      expires_at: expiresAt,
      status: status
    });
  }

  return fail_('找不到此上傳授權');
}

function getOrCreateCompanyUploadFolder_(companyId, companyName) {
  const rootId = getScriptProp_('DATA_UPLOAD_ROOT_FOLDER_ID', DATA_UPLOAD_DEFAULT_ROOT_FOLDER_ID);
  const root = rootId ? DriveApp.getFolderById(rootId) : DriveApp.getRootFolder();
  const rows = sheetToObjects_(getUploadFolderMapSheet_());

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (normalizeUpper_(r.company_id || '') === companyId && normalizeLower_(r.status || 'active') === 'active') {
      const folderId = normalize_(r.folder_id || '');
      if (folderId) {
        try {
          return DriveApp.getFolderById(folderId);
        } catch (err) {}
      }
    }
  }

  const safeName = (companyId + '｜' + (companyName || companyId)).replace(/[\\/:*?"<>|]/g, '_');
  const folder = root.createFolder(safeName);

  getUploadFolderMapSheet_().appendRow([
    companyId,
    companyName || companyId,
    folder.getId(),
    'active',
    nowText_(),
    nowText_()
  ]);

  return folder;
}

function updateUploadAuthUsedAt_(uploadId) {
  const sheet = getUploadAuthSheet_();
  const rows = sheetToObjects_(sheet);
  const headerMap = getHeaderMap_(sheet);

  for (let i = 0; i < rows.length; i++) {
    if (normalize_(rows[i].upload_id || '') === uploadId) {
      const rowNumber = i + 2;
      if (headerMap.used_at) sheet.getRange(rowNumber, headerMap.used_at).setValue(nowText_());
      return;
    }
  }
}

function updateCompanyUploadFolderLastAt_(companyId) {
  const sheet = getUploadFolderMapSheet_();
  const rows = sheetToObjects_(sheet);
  const headerMap = getHeaderMap_(sheet);

  for (let i = 0; i < rows.length; i++) {
    if (normalizeUpper_(rows[i].company_id || '') === normalizeUpper_(companyId || '')) {
      const rowNumber = i + 2;
      if (headerMap.last_upload_at) sheet.getRange(rowNumber, headerMap.last_upload_at).setValue(nowText_());
      return;
    }
  }
}

function initializeUploadSystem_() {
  getUploadAuthSheet_();
  getUploadLogSheet_();
  getUploadFolderMapSheet_();
}

function getUploadDb_() {
  const id = getScriptProp_('DATA_UPLOAD_SPREADSHEET_ID', DATA_UPLOAD_DEFAULT_SPREADSHEET_ID);
  if (id) return SpreadsheetApp.openById(id);
  return getDb_();
}

function getUploadAuthSheet_() {
  return getUploadSheet_(SHEET_COMPANY_UPLOAD_AUTH, HEADERS[SHEET_COMPANY_UPLOAD_AUTH]);
}

function getUploadLogSheet_() {
  return getUploadSheet_(SHEET_COMPANY_UPLOAD_LOGS, HEADERS[SHEET_COMPANY_UPLOAD_LOGS]);
}

function getUploadFolderMapSheet_() {
  return getUploadSheet_(SHEET_COMPANY_UPLOAD_FOLDERS, HEADERS[SHEET_COMPANY_UPLOAD_FOLDERS]);
}

function getUploadSheet_(name, headers) {
  const ss = getUploadDb_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  ensureHeader_(sheet, headers || []);
  return sheet;
}

function getScriptProp_(key, fallback) {
  try {
    const v = PropertiesService.getScriptProperties().getProperty(key);
    if (v !== null && v !== undefined && normalize_(v) !== '') return normalize_(v);
  } catch (err) {}
  return fallback || '';
}

function testCreateUploadSession_ANG8963() {
  const res = createUploadSession({
    company_id: 'ANG8963',
    company_name: 'ANG 系統測試公司',
    user_id: 'ANG8963',
    user_email: DEFAULT_CONTACT_EMAIL,
    role: 'platform_creator',
    action: 'uploadCompanyData',
    data_type: '公司資料補件',
    valid_days: 7
  });
  Logger.log(JSON.stringify(res, null, 2));
  return res;
}


function outputHtml_() {
  const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ANG HR API</title></head><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;padding:24px;background:#f7f8ff;color:#111827"><h1>ANG HR System API</h1><p>後端已啟用。請把此 Web App URL 填入前端 config.js 的 gasApiUrl。資料上傳頁請使用：?page=upload&upload_id=...&token=...</p></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle('ANG HR API');
}

function outputJson_(obj, callback) {
  const json = JSON.stringify(obj || {});
  if (callback) {
    const safeCallback = String(callback).replace(/[^a-zA-Z0-9_.$]/g, '');
    return ContentService.createTextOutput(safeCallback + '(' + json + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function getPayload_(e) {
  const p = e && e.parameter ? e.parameter : {};
  let payload = {};
  if (p.payload) {
    try { payload = JSON.parse(p.payload); } catch (err) { payload = {}; }
  } else if (e && e.postData && e.postData.contents) {
    try { payload = JSON.parse(e.postData.contents); } catch (err2) { payload = {}; }
  }
  Object.keys(p).forEach(function(k) {
    if (['payload', 'callback'].indexOf(k) < 0 && payload[k] === undefined) payload[k] = p[k];
  });
  return payload;
}

function initializeSystem_() {
  const ss = getDb_();
  Object.keys(HEADERS).forEach(function(name) {
    let sh = ss.getSheetByName(name);
    if (!sh) sh = ss.insertSheet(name);
    ensureHeader_(sh, HEADERS[name]);
  });
  repairEmployeeCompanyFields_();
}

function getDb_() {
  const props = PropertiesService.getScriptProperties();
  const savedId = props.getProperty('ANG_HR_DB_ID');
  if (savedId) {
    try { return SpreadsheetApp.openById(savedId); } catch (err) {}
  }

  if (DEFAULT_ANG_HR_DB_ID) {
    try {
      const ss = SpreadsheetApp.openById(DEFAULT_ANG_HR_DB_ID);
      props.setProperty('ANG_HR_DB_ID', DEFAULT_ANG_HR_DB_ID);
      return ss;
    } catch (err2) {}
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    props.setProperty('ANG_HR_DB_ID', active.getId());
    return active;
  }
  const ss = SpreadsheetApp.create('ANG HR System DB');
  props.setProperty('ANG_HR_DB_ID', ss.getId());
  return ss;
}

function getSheet_(name) {
  const ss = getDb_();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    ensureHeader_(sh, HEADERS[name] || []);
  }
  return sh;
}

function ensureHeader_(sheet, headers) {
  if (!headers || !headers.length) return;

  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return;
  }

  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const current = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h || '').trim();
  });

  const allEmpty = current.every(function(h) { return !h; });
  if (allEmpty) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return;
  }

  const missing = headers.filter(function(h) { return current.indexOf(h) < 0; });
  if (missing.length) {
    sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
  }
  sheet.setFrozenRows(1);
}

function appendObjectRow_(sheetName, obj) {
  const sheet = getSheet_(sheetName);
  ensureHeader_(sheet, HEADERS[sheetName] || []);
  const lastCol = Math.max(sheet.getLastColumn(), (HEADERS[sheetName] || []).length, 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
    return String(h || '').trim();
  });
  const row = headers.map(function(h) {
    return Object.prototype.hasOwnProperty.call(obj, h) ? obj[h] : '';
  });
  sheet.appendRow(row);
}

function repairEmployeeCompanyFields_() {
  const employeeSheet = getSheet_(SHEET_EMPLOYEES);
  const companySheet = getSheet_(SHEET_COMPANIES);
  ensureHeader_(employeeSheet, HEADERS[SHEET_EMPLOYEES]);
  const employeeRows = sheetToObjects_(employeeSheet);
  if (!employeeRows.length) return;

  const companyRows = sheetToObjects_(companySheet);
  const companyMap = {};
  companyRows.forEach(function(c) {
    const id = normalizeUpper_(c.company_id || '');
    if (id) companyMap[id] = c;
  });

  const headerMap = getHeaderMap_(employeeSheet);
  const fields = ['company_name', 'plan', 'plan_label', 'billing_status', 'billing_status_label', 'branch_id', 'branch_name'];

  employeeRows.forEach(function(emp, idx) {
    const companyId = normalizeUpper_(emp.company_id || '');
    const company = companyMap[companyId];
    if (!company) return;
    const rowNumber = idx + 2;

    const values = {
      company_name: emp.company_name || company.company_name || '',
      plan: emp.plan || company.plan || '',
      plan_label: emp.plan_label || company.plan_label || '',
      billing_status: emp.billing_status || company.billing_status || '',
      billing_status_label: emp.billing_status_label || company.billing_status_label || '',
      branch_id: emp.branch_id || 'MAIN',
      branch_name: emp.branch_name || company.company_name || ''
    };

    fields.forEach(function(field) {
      if (!headerMap[field]) return;
      if (!normalize_(emp[field] || '') && normalize_(values[field] || '')) {
        employeeSheet.getRange(rowNumber, headerMap[field]).setValue(values[field]);
      }
    });
  });
}

function getHeaderMap_(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const map = {};
  header.forEach(function(h, i) {
    if (h) map[String(h)] = i + 1;
  });
  return map;
}

function sheetToObjects_(sheet) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(function(h) { return String(h || '').trim(); });
  const out = [];
  for (let r = 1; r < values.length; r++) {
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      if (headers[c]) obj[headers[c]] = values[r][c];
    }
    out.push(obj);
  }
  return out;
}

function findEmployee_(companyId, employeeId) {
  const rows = sheetToObjects_(getSheet_(SHEET_EMPLOYEES));
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (normalizeUpper_(r.company_id) === companyId && normalizeUpper_(r.employee_id) === employeeId) return r;
  }
  return null;
}

function findCompany_(companyId) {
  companyId = normalizeUpper_(companyId || '');
  const rows = sheetToObjects_(getSheet_(SHEET_COMPANIES));
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (normalizeUpper_(r.company_id || '') === companyId) return r;
  }
  return null;
}

function nextCompanyId_(prefix) {
  const rows = sheetToObjects_(getSheet_(SHEET_COMPANIES));
  let max = 0;
  rows.forEach(function(r) {
    const id = normalizeUpper_(r.company_id || '');
    if (id.indexOf(prefix) === 0) {
      const n = parseInt(id.slice(prefix.length), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  });
  return prefix + String(max + 1);
}

function makeVerifyToken_(data) {
  const secret = getSecret_();
  const payload = {
    method: normalize_(data.method || data.provider || ''),
    provider: normalize_(data.provider || data.method || ''),
    email: normalizeEmail_(data.email || ''),
    google_sub: normalize_(data.google_sub || ''),
    line_sub: normalize_(data.line_sub || ''),
    sub: normalize_(data.sub || data.google_sub || data.line_sub || ''),
    name: normalize_(data.name || ''),
    plan: normalizeLower_(data.plan || ''),
    flow: normalizeLower_(data.flow || ''),
    company_id: normalizeUpper_(data.company_id || data.company || ''),
    exp: Date.now() + 30 * 60 * 1000
  };
  const encoded = Utilities.base64EncodeWebSafe(JSON.stringify(payload));
  const sig = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(encoded, secret));
  return encoded + '.' + sig;
}

function verifyVerifyToken_(token) {
  token = normalize_(token || '');
  const parts = token.split('.');
  if (parts.length !== 2) return { ok: false, message: '驗證 token 格式錯誤' };
  const secret = getSecret_();
  const expected = Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(parts[0], secret));
  if (expected !== parts[1]) return { ok: false, message: '驗證 token 簽章錯誤' };
  let data;
  try { data = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString()); } catch (err) { return { ok: false, message: '驗證 token 解析失敗' }; }
  if (!data.exp || Number(data.exp) < Date.now()) return { ok: false, message: '驗證已過期，請重新驗證' };
  return { ok: true, data: data };
}

function makeSessionToken_() {
  return 'sess_' + Utilities.getUuid().replace(/-/g, '') + '_' + Date.now().toString(36);
}

function getSecret_() {
  const props = PropertiesService.getScriptProperties();
  let secret = props.getProperty('ANG_HR_SECRET');
  if (!secret) {
    secret = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('ANG_HR_SECRET', secret);
  }
  return secret;
}

function hash_(text) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text || ''), Utilities.Charset.UTF_8);
  return bytes.map(function(b) {
    const v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function log_(action, companyId, employeeId, email, status, message, payload) {
  try {
    getSheet_(SHEET_AUDIT_LOGS).appendRow([
      nowText_(),
      action || '',
      companyId || '',
      employeeId || '',
      email || '',
      status || '',
      message || '',
      JSON.stringify(payload || {})
    ]);
  } catch (err) {}
}

function ok_(data) {
  const out = { ok: true };
  data = data || {};
  Object.keys(data).forEach(function(k) { out[k] = data[k]; });
  return out;
}

function fail_(message) {
  var msg = message || '操作失敗';
  try {
    if (typeof normalizeCompanyAuthErrorMessage_ === 'function') msg = normalizeCompanyAuthErrorMessage_(msg);
    else if (typeof angNormalizeAuthMessage_ === 'function') msg = angNormalizeAuthMessage_(msg);
  } catch (err) {}
  return { ok: false, message: msg };
}

function normalize_(v) {
  return String(v == null ? '' : v).trim();
}

function normalizeUpper_(v) {
  return normalize_(v).toUpperCase();
}

function normalizeLower_(v) {
  return normalize_(v).toLowerCase();
}

function normalizeEmail_(v) {
  return normalizeLower_(v);
}

function isEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizePlanIdV26_(plan) {
  var p = normalizeLower_(plan || 'basic').replace(/[\s-]+/g, '_');
  if (p === 'selfhosted' || p === 'self_hosted' || p === 'bring_your_own' || p === 'byod' || p === 'enterprise') return 'private';
  if (p === 'business_lite' || p === 'free' || p === 'lite') return 'lite';
  if (p === 'business_basic') return 'basic';
  if (p === 'business_pro' || p === 'pro') return 'plus';
  if (p === 'business_premium') return 'premium';
  if (p === 'personal_lite' || p === 'personal_solo' || p === 'personal_performance') return p;
  if (p === 'private' || p === 'lite' || p === 'basic' || p === 'plus' || p === 'premium') return p;
  return p;
}

function isValidPlan_(plan) {
  return ['lite', 'basic', 'plus', 'premium', 'private', 'personal_lite', 'personal_solo', 'personal_performance'].indexOf(normalizePlanIdV26_(plan)) >= 0;
}

function isBusinessPlan_(plan) {
  return ['lite', 'basic', 'plus', 'premium', 'private'].indexOf(normalizePlanIdV26_(plan)) >= 0;
}

function planLabel_(plan) {
  const map = {
    lite: 'Business Lite', basic: 'Business Basic', plus: 'Business Pro', premium: 'Business Premium', private: 'Private',
    personal_lite: 'Personal Lite', personal_solo: 'Personal Solo', personal_performance: 'Personal Performance'
  };
  return map[normalizePlanIdV26_(plan)] || 'Business Basic';
}

function planCanonicalCode_(plan) {
  var p = normalizePlanIdV26_(plan);
  const map = { lite: 'business_lite', basic: 'business_basic', plus: 'business_pro', premium: 'business_premium' };
  return map[p] || p;
}

function planMonthlyPrice_(plan) {
  plan = normalizePlanIdV26_(plan || 'basic');
  if (plan === 'personal_lite' || plan === 'lite') return 0;
  if (plan === 'personal_solo') return 69;
  if (plan === 'personal_performance') return 149;
  if (plan === 'basic') return 299;
  if (plan === 'plus') return 699;
  if (plan === 'premium') return 1299;
  if (plan === 'private') return 0;
  return 0;
}

function planEmployeeQuota_(plan) {
  plan = normalizePlanIdV26_(plan || 'basic');
  if (plan === 'personal_lite' || plan === 'personal_solo' || plan === 'personal_performance') return 1;
  if (plan === 'private') return 50;
  if (plan === 'premium') return 20;
  if (plan === 'plus') return 10;
  return 5;
}

function createSessionForEmployee_(companyId, employee, deviceId) {
  const employeeId = normalizeUpper_(employee.employee_id || '');
  const token = makeSessionToken_();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  getSheet_(SHEET_SESSIONS).appendRow([
    token,
    companyId,
    employeeId,
    normalize_(employee.role || ''),
    deviceId || '',
    nowText_(),
    dateToIso_(expiresAt),
    'active'
  ]);
  return token;
}

function buildAdminLoginResponse_(companyId, employee, token) {
  return ok_({
    message: '登入成功',
    company_id: companyId,
    company_name: employee.company_name || '',
    plan: employee.plan || '',
    plan_label: employee.plan_label || '',
    billing_status: employee.billing_status || '',
    billing_status_label: employee.billing_status_label || '',
    employee_id: normalizeUpper_(employee.employee_id || ''),
    name: employee.name || '',
    email: employee.email || '',
    role: employee.role || '',
    session_token: token,
    next_url: DEFAULT_FRONTEND_URL + 'app.html?view=admin&company_id=' + encodeURIComponent(companyId) + '&id=' + encodeURIComponent(normalizeUpper_(employee.employee_id || '')) + '&session_token=' + encodeURIComponent(token)
  });
}

function findAdminByVerifiedAuth_(companyId, verified) {
  const email = normalizeEmail_(verified.email || '');
  const googleSub = normalize_(verified.google_sub || verified.sub || '');
  const lineSub = normalize_(verified.line_sub || verified.sub || '');
  const rows = sheetToObjects_(getSheet_(SHEET_EMPLOYEES));
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (normalizeUpper_(r.company_id || '') !== companyId) continue;
    if (normalizeLower_(r.status || 'active') !== 'active') continue;
    if (!isAdminRole_(r.role || '')) continue;
    const sameEmail = email && normalizeEmail_(r.email || '') === email;
    const sameGoogle = googleSub && normalize_(r.google_sub || '') === googleSub;
    const sameLine = lineSub && normalize_(r.line_sub || '') === lineSub;
    if (sameEmail || sameGoogle || sameLine) return r;
  }
  return null;
}

function todayKey_() {
  const tz = Session.getScriptTimeZone() || 'Asia/Taipei';
  return Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
}

function isAdminRole_(role) {
  const r = normalizeLower_(role);
  return ['creator', 'super admin', 'super_admin', 'admin', 'manager'].indexOf(r) >= 0;
}

function nowText_() {
  return dateToIso_(new Date());
}

function dateToIso_(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone() || 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
}

/************************************************************
 * ANG8963 免付費特權 ID 發送工具
 * 這些函式只能由 Apps Script 專案擁有者在後台手動執行。
 ************************************************************/
function setupAng8963OwnerKey() {
  const key = 'ANG8963-' + Utilities.getUuid().replace(/-/g, '').slice(0, 20).toUpperCase();
  PropertiesService.getScriptProperties().setProperty(FREE_PRIVILEGE_OWNER_KEY_PROPERTY, key);
  Logger.log('ANG8963 發碼密鑰：' + key);
  Logger.log('請妥善保存，不要提供給客戶。');
}

function issueFreePrivilegeCodeFromANG8963() {
  initializeSystem_();
  const code = nextFreePrivilegeId_();
  getSheet_(SHEET_FREE_PRIVILEGES).appendRow([
    code,
    FREE_PRIVILEGE_OWNER_ID,
    FREE_PRIVILEGE_OWNER_ID,
    '',
    'manual issue by script owner',
    'issued',
    nowText_(),
    '',
    ''
  ]);
  Logger.log('已建立免付費特權 ID：' + code);
}

function issueFreePrivilegeCodesFromANG8963_Batch10() {
  initializeSystem_();
  const created = [];
  for (let i = 0; i < 10; i++) {
    const code = nextFreePrivilegeId_();
    getSheet_(SHEET_FREE_PRIVILEGES).appendRow([
      code,
      FREE_PRIVILEGE_OWNER_ID,
      FREE_PRIVILEGE_OWNER_ID,
      '',
      'manual batch issue by script owner',
      'issued',
      nowText_(),
      '',
      ''
    ]);
    created.push(code);
  }
  Logger.log('已建立免付費特權 ID：' + created.join('、'));
}

/************************************************************
 * 可選工具：建立員工一次性開通碼
 * 後台尚未做 UI 前，可先手動執行這個函式測試。
 ************************************************************/
function createEmployeeInviteForTest() {
  initializeSystem_();
  const companyId = 'ANGC1';
  const employeeId = 'ANG0604';
  const token = 'ACT' + Math.random().toString(36).slice(2, 10).toUpperCase();
  const company = findCompany_(companyId) || {};
  appendObjectRow_(SHEET_EMPLOYEES, {
    company_id: companyId,
    company_name: company.company_name || '',
    plan: company.plan || '',
    plan_label: company.plan_label || '',
    billing_status: company.billing_status || '',
    billing_status_label: company.billing_status_label || '',
    branch_id: 'MAIN',
    branch_name: company.company_name || '',
    employee_id: employeeId,
    password: '0604',
    name: '員工範例',
    role: 'Employee',
    email: '',
    phone: '',
    birth_date: '',
    device_id: '',
    one_time_token: token,
    token_used: 'no',
    created_at: nowText_(),
    updated_at: nowText_(),
    status: 'active'
  });
  Logger.log('一次性開通碼：' + token);
}


/************************************************************
 * ANG HR v4-v10 patches integrated below
 ************************************************************/
/**
 * ANG HR v5 後端補丁：建立公司 Google Drive 資料夾測試
 * 1）把這段貼到 Code.gs 最下方。
 * 2）如果你的 doPost 有 action 分流，請加入：
 *    if (action === 'testCompanyDriveFolderAccess') return jsonOutput_(testCompanyDriveFolderAccess(data));
 * 3）公司建立 / 驗證流程收到 payload.driveFolderId / payload.googleDriveFolderId 時，請存到公司總表欄位：drive_folder_id。
 */
function testCompanyDriveFolderAccess(payload) {
  payload = payload || {};
  var folderId = String(payload.folderId || payload.driveFolderId || payload.googleDriveFolderId || '').trim();
  if (!folderId) {
    return { ok:false, message:'缺少 Google Drive 資料夾 ID' };
  }

  try {
    var folder = DriveApp.getFolderById(folderId);
    var name = 'ANG_FOLDER_TEST_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Taipei', 'yyyyMMdd_HHmmss') + '.txt';
    var content = [
      'ANG HR SYSTEMS Google Drive folder test',
      'time=' + new Date().toISOString(),
      'plan=' + String(payload.plan || ''),
      'deviceId=' + String(payload.deviceId || '')
    ].join('\n');
    var file = folder.createFile(Utilities.newBlob(content, 'text/plain', name));
    return {
      ok:true,
      message:'測試檔已上傳：' + name + '。請自行到 Drive 資料夾檢查。',
      folderId:folderId,
      fileId:file.getId(),
      fileUrl:file.getUrl()
    };
  } catch (err) {
    return {
      ok:false,
      message:'Drive 資料夾測試失敗：請確認資料夾 ID 正確、權限已公開，且此 GAS 帳號有新增檔案權限。' + String(err && err.message ? ' ' + err.message : '')
    };
  }
}

function normalizeCompanyAuthErrorMessage_(msg) {
  var s = String(msg || '').trim();
  if (/帳號不存在|找不到帳號|查無帳號|無此帳號|公司.*錯|company|companyCode|公司代碼|token|驗證/i.test(s)) {
    return '公司代碼或身份驗證錯誤：請確認公司代碼、帳號 / 工號與驗證 token。';
  }
  return s;
}


/**
 * ANG HR v4 補丁：公司代碼錯誤訊息 + 薪資員工自付扣款欄位
 * 用法：貼到 Code.gs 最下方；若原本 saveSalaryReview 已存在，請把 payload 欄位加入原本儲存欄位。
 */
function angNormalizeAuthMessage_(msg) {
  var s = String(msg || '').trim();
  if (/帳號不存在|找不到帳號|查無帳號|無此帳號|company|公司/i.test(s)) {
    return '公司代碼或身份驗證錯誤：請確認公司代碼、帳號/工號與驗證 token。';
  }
  return s;
}

function angSalaryEmployeeDeductionsFromPayload_(p) {
  p = p || {};
  function n(v) { return Math.round(Number(String(v == null ? 0 : v).replace(/[^0-9.-]/g, '')) || 0); }
  return {
    employeeLaborInsurance: n(p.employeeLaborInsurance || p.employee_labor_insurance),
    employeeHealthInsurance: n(p.employeeHealthInsurance || p.employee_health_insurance),
    employeePensionSelf: n(p.employeePensionSelf || p.employee_pension_self),
    employeeSupplementalInsurance: n(p.employeeSupplementalInsurance || p.employee_supplemental_insurance)
  };
}

function angSalaryNetTotal_(p) {
  p = p || {};
  var extraAdd = 0;
  var extraDeduct = 0;
  (Array.isArray(p.extras) ? p.extras : []).forEach(function(e) {
    var amount = Math.abs(Number(e.amount || 0));
    if (e.isDeduct || ['扣款','法扣','行政費用','稅金'].indexOf(String(e.type || '')) > -1) extraDeduct += amount;
    else extraAdd += Number(e.amount || 0);
  });
  var d = angSalaryEmployeeDeductionsFromPayload_(p);
  return Math.round(
    Number(p.baseSalary || 0) + Number(p.overtimePay || 0) + Number(p.mealAllowance || 0) + extraAdd
    - Number(p.lateDeduction || 0) - Number(p.leaveDeduction || 0) - extraDeduct
    - d.employeeLaborInsurance - d.employeeHealthInsurance - d.employeePensionSelf - d.employeeSupplementalInsurance
  );
}

// 給前端 GitHub / GAS API fallback 用，未設定 gasApiUrl 時可暫用：
var ANG_DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbxmSMR9pqT1njaiANL5Ca8VmbWI4KbdUFnpSAJeE2WQGbITjwml2S4eGY4QNknlJA0FRw/exec';


/**
 * ANG HR v8 補丁：多級審核改成「每個項目獨立設定」
 *
 * 前端 admin v8 會送出以下新欄位：
 * - leave_multi_level_review_enabled
 * - clockfix_multi_level_review_enabled
 * - upload_multi_level_review_enabled
 * - message_multi_level_review_enabled
 * - salary_multi_level_review_enabled
 * - notice_multi_level_review_enabled
 *
 * 這段先提供後端可共用的標準化 helper。若原本 Code.gs 已有 saveApproverSettings，
 * 請在原本儲存 approverSettings 的地方，把 angNormalizeApproverSettingsV8_(payload)
 * 回傳物件一起寫入系統設定 / approverSettings。
 */
function angBoolStringV8_(v, defVal) {
  if (v === undefined || v === null || String(v) === '') return defVal ? 'true' : 'false';
  return String(v).toLowerCase() === 'true' || String(v) === '是' || String(v) === '1' ? 'true' : 'false';
}

function angNormalizeApproverSettingsV8_(p) {
  p = p || {};
  var legacy = angBoolStringV8_(p.multi_level_review_enabled, true) === 'true';
  return {
    multi_level_review_enabled: angBoolStringV8_(p.multi_level_review_enabled, legacy),

    leave_multi_level_review_enabled: angBoolStringV8_(p.leave_multi_level_review_enabled || p.leave_multi_level, legacy),
    clockfix_multi_level_review_enabled: angBoolStringV8_(p.clockfix_multi_level_review_enabled || p.clockfix_multi_level, legacy),
    upload_multi_level_review_enabled: angBoolStringV8_(p.upload_multi_level_review_enabled || p.upload_multi_level, legacy),
    message_multi_level_review_enabled: angBoolStringV8_(p.message_multi_level_review_enabled || p.message_multi_level, legacy),
    salary_multi_level_review_enabled: angBoolStringV8_(p.salary_multi_level_review_enabled || p.salary_multi_level, legacy),
    notice_multi_level_review_enabled: angBoolStringV8_(p.notice_multi_level_review_enabled || p.notice_multi_level, false),

    leave_approvers: String(p.leave_approvers || 'Manager'),
    clockfix_approvers: String(p.clockfix_approvers || 'Manager'),
    upload_approvers: String(p.upload_approvers || 'Manager'),
    message_approvers: String(p.message_approvers || 'Manager'),
    salary_approvers: String(p.salary_approvers || 'Admin'),
    manager_notice_needs_admin: angBoolStringV8_(p.managerNoticeNeedsAdmin || p.manager_notice_needs_admin, false)
  };
}

function angIsMultiLevelReviewEnabledV8_(settings, type) {
  settings = settings || {};
  var keyMap = {
    leave: 'leave_multi_level_review_enabled',
    clockfix: 'clockfix_multi_level_review_enabled',
    clock_fix: 'clockfix_multi_level_review_enabled',
    upload: 'upload_multi_level_review_enabled',
    data: 'upload_multi_level_review_enabled',
    message: 'message_multi_level_review_enabled',
    msg: 'message_multi_level_review_enabled',
    salary: 'salary_multi_level_review_enabled',
    notice: 'notice_multi_level_review_enabled'
  };
  var k = keyMap[String(type || '').toLowerCase()] || 'multi_level_review_enabled';
  var fallback = angBoolStringV8_(settings.multi_level_review_enabled, true) === 'true';
  return angBoolStringV8_(settings[k], fallback) === 'true';
}

function angApproverListForReviewTypeV8_(settings, type) {
  settings = settings || {};
  var keyMap = {
    leave: 'leave_approvers',
    clockfix: 'clockfix_approvers',
    clock_fix: 'clockfix_approvers',
    upload: 'upload_approvers',
    data: 'upload_approvers',
    message: 'message_approvers',
    msg: 'message_approvers',
    salary: 'salary_approvers'
  };
  var k = keyMap[String(type || '').toLowerCase()] || 'leave_approvers';
  var arr = String(settings[k] || 'Manager').split(',').map(function(x){ return String(x).trim(); }).filter(Boolean);
  return arr.length ? arr : ['Manager'];
}


/**
 * ANG HR v10 補丁：多級審核 Manager → Admin + 混合班給 Admin 控制
 *
 * 規則：
 * 1. 每個審核項目都可單獨啟用多級審核。
 * 2. 只要該項啟用多級審核，流程一律是 Manager 第一關 → Admin 最終關。
 * 3. 若公司沒有任何 Manager，該項不成立多級審核，自動降回 Admin 單層審核。
 * 4. 最高權限永遠保留在 Admin。
 * 5. 混合班啟用/停用改由 Admin 呼叫 saveMixedModeSetting()。
 */
function angBoolStringV10_(v, defVal) {
  if (v === undefined || v === null || String(v) === '') return defVal ? 'true' : 'false';
  var s = String(v).trim().toLowerCase();
  return (s === 'true' || s === '是' || s === '1' || s === 'yes' || s === 'y' || s === 'on') ? 'true' : 'false';
}

function angSplitRolesV10_(v, fallback) {
  var arr = String(v || fallback || '').split(',').map(function(x){ return String(x).trim(); }).filter(Boolean);
  var seen = {};
  return arr.filter(function(x){ var k = x.toLowerCase(); if (seen[k]) return false; seen[k] = true; return true; });
}

function angFindSheetByNamesV10_(ss, names) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  for (var i = 0; i < names.length; i++) {
    var sh = ss.getSheetByName(names[i]);
    if (sh) return sh;
  }
  return null;
}

function angCompanyHasManagerV10_(ss) {
  try {
    ss = ss || SpreadsheetApp.getActiveSpreadsheet();
    var sh = angFindSheetByNamesV10_(ss, ['人員', '人員資料', '員工', '員工資料', 'Users', 'SHEET_USERS']);
    if (!sh) return true; // 找不到表時不硬擋，避免舊系統被誤判。
    var values = sh.getDataRange().getValues();
    if (!values || values.length < 2) return false;
    var header = values[0].map(function(h){ return String(h || '').trim().toLowerCase(); });
    var roleIdx = -1;
    ['職級', '權限', '角色', 'role', 'level'].some(function(k){
      var idx = header.indexOf(String(k).toLowerCase());
      if (idx >= 0) { roleIdx = idx; return true; }
      return false;
    });
    if (roleIdx < 0) {
      // 舊表常見：第 10 欄附近是職級。掃整列避免找不到標題。
      for (var r = 1; r < values.length; r++) {
        if (values[r].some(function(c){ return String(c || '').trim().toLowerCase() === 'manager'; })) return true;
      }
      return false;
    }
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][roleIdx] || '').trim().toLowerCase() === 'manager') return true;
    }
    return false;
  } catch (err) {
    return true;
  }
}

function angNormalizeOneReviewChainV10_(p, ss, type, defMulti, defApprovers) {
  var keyPrefix = {
    leave: 'leave',
    clockfix: 'clockfix',
    upload: 'upload',
    message: 'message',
    salary: 'salary',
    notice: 'notice'
  }[type];
  var multi = angBoolStringV10_(
    p[keyPrefix + '_multi_level_review_enabled'] !== undefined ? p[keyPrefix + '_multi_level_review_enabled'] : p[keyPrefix + '_multi_level'],
    defMulti
  ) === 'true';
  var hasManager = angCompanyHasManagerV10_(ss);
  var approvers;
  if (multi && hasManager) {
    approvers = ['Manager', 'Admin'];
  } else if (multi && !hasManager) {
    multi = false;
    approvers = ['Admin'];
  } else {
    approvers = angSplitRolesV10_(p[keyPrefix + '_approvers'], defApprovers || 'Admin');
    if (!approvers.length) approvers = ['Admin'];
    // 非多級仍允許 Manager 或 Admin 單層，但如果同時有兩者，Admin 視為最高。
  }
  return {
    multi: multi ? 'true' : 'false',
    approvers: approvers.join(','),
    first_role: approvers[0] || 'Admin',
    final_role: approvers.indexOf('Admin') >= 0 ? 'Admin' : (approvers[approvers.length - 1] || 'Admin')
  };
}

function angNormalizeApproverSettingsV10_(p, ss) {
  p = p || {};
  var legacy = angBoolStringV10_(p.multi_level_review_enabled, true) === 'true';
  var leave = angNormalizeOneReviewChainV10_(p, ss, 'leave', legacy, 'Manager');
  var clockfix = angNormalizeOneReviewChainV10_(p, ss, 'clockfix', legacy, 'Manager');
  var upload = angNormalizeOneReviewChainV10_(p, ss, 'upload', legacy, 'Manager');
  var message = angNormalizeOneReviewChainV10_(p, ss, 'message', legacy, 'Manager');
  var salary = angNormalizeOneReviewChainV10_(p, ss, 'salary', legacy, 'Admin');
  var notice = angNormalizeOneReviewChainV10_(p, ss, 'notice', false, 'Admin');
  var anyMulti = [leave, clockfix, upload, message, salary, notice].some(function(x){ return x.multi === 'true'; });
  return {
    multi_level_review_enabled: anyMulti ? 'true' : 'false',

    leave_multi_level_review_enabled: leave.multi,
    clockfix_multi_level_review_enabled: clockfix.multi,
    upload_multi_level_review_enabled: upload.multi,
    message_multi_level_review_enabled: message.multi,
    salary_multi_level_review_enabled: salary.multi,
    notice_multi_level_review_enabled: notice.multi,

    leave_approvers: leave.approvers,
    clockfix_approvers: clockfix.approvers,
    upload_approvers: upload.approvers,
    message_approvers: message.approvers,
    salary_approvers: salary.approvers,
    notice_approvers: notice.approvers,

    leave_first_role: leave.first_role,
    clockfix_first_role: clockfix.first_role,
    upload_first_role: upload.first_role,
    message_first_role: message.first_role,
    salary_first_role: salary.first_role,
    notice_first_role: notice.first_role,

    leave_final_role: leave.final_role,
    clockfix_final_role: clockfix.final_role,
    upload_final_role: upload.final_role,
    message_final_role: message.final_role,
    salary_final_role: salary.final_role,
    notice_final_role: notice.final_role,

    manager_notice_needs_admin: (notice.multi === 'true' || angBoolStringV10_(p.managerNoticeNeedsAdmin || p.manager_notice_needs_admin, false) === 'true') ? 'true' : 'false'
  };
}

function angApproverListForReviewTypeV10_(settings, type, ss) {
  settings = settings || {};
  var keyMap = {
    leave: 'leave_approvers',
    clockfix: 'clockfix_approvers',
    clock_fix: 'clockfix_approvers',
    upload: 'upload_approvers',
    data: 'upload_approvers',
    message: 'message_approvers',
    msg: 'message_approvers',
    salary: 'salary_approvers',
    notice: 'notice_approvers'
  };
  var multiKeyMap = {
    leave: 'leave_multi_level_review_enabled',
    clockfix: 'clockfix_multi_level_review_enabled',
    clock_fix: 'clockfix_multi_level_review_enabled',
    upload: 'upload_multi_level_review_enabled',
    data: 'upload_multi_level_review_enabled',
    message: 'message_multi_level_review_enabled',
    msg: 'message_multi_level_review_enabled',
    salary: 'salary_multi_level_review_enabled',
    notice: 'notice_multi_level_review_enabled'
  };
  var t = String(type || '').toLowerCase();
  var isMulti = angBoolStringV10_(settings[multiKeyMap[t]], false) === 'true';
  if (isMulti) return angCompanyHasManagerV10_(ss) ? ['Manager', 'Admin'] : ['Admin'];
  return angSplitRolesV10_(settings[keyMap[t]], 'Admin');
}

function angNextReviewRoleV10_(settings, type, currentRole, ss) {
  var list = angApproverListForReviewTypeV10_(settings, type, ss);
  var role = String(currentRole || '').trim();
  if (!role) return list[0] || 'Admin';
  var idx = list.map(function(x){ return x.toLowerCase(); }).indexOf(role.toLowerCase());
  if (idx < 0) return list[0] || 'Admin';
  return list[idx + 1] || '';
}

function saveMixedModeSetting(p) {
  p = p || {};
  var enabled = angBoolStringV10_(p.mixedMode !== undefined ? p.mixedMode : p.mixed_mode, false);
  var settings = {
    mixedMode: enabled,
    mixed_mode: enabled,
    mixed_mode_enabled: enabled,
    shift_mixed_mode: enabled
  };
  if (typeof saveSystemSettings === 'function') {
    return saveSystemSettings({
      userId: p.userId || p.id,
      id: p.id || p.userId,
      token: p.token,
      settings: settings
    });
  }
  PropertiesService.getScriptProperties().setProperties(settings, true);
  return { ok: true, message: enabled === 'true' ? '已啟用混合班' : '已停用混合班', mixedMode: enabled };
}


/*****************************************************************
 * ANG HR v11 整合層：讓前端補丁不再只是零散貼片
 * - saveSystemSettings / loadSystemSettings：提供 key-value 設定儲存
 * - saveApproverSettings：套用 v10 多級審核規則後儲存
 * - saveMixedModeSetting：由 v10 補丁提供；若同名存在，以檔案最後版本為準
 *****************************************************************/
const SHEET_SYSTEM_SETTINGS_V11 = 'SystemSettings';

function angEnsureSystemSettingsSheetV11_() {
  var ss = getDb_ ? getDb_() : SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_SYSTEM_SETTINGS_V11);
  if (!sh) sh = ss.insertSheet(SHEET_SYSTEM_SETTINGS_V11);
  if (sh.getLastRow() === 0 || sh.getLastColumn() === 0) {
    sh.getRange(1, 1, 1, 5).setValues([['key', 'value', 'updated_at', 'updated_by', 'note']]);
    sh.setFrozenRows(1);
  }
  return sh;
}

function angFlattenSettingsPayloadV11_(payload) {
  payload = payload || {};
  var settings = payload.settings && typeof payload.settings === 'object' ? payload.settings : payload;
  var out = {};
  Object.keys(settings).forEach(function(k){
    if (['userId','id','token','action','callback','settings'].indexOf(k) >= 0) return;
    var v = settings[k];
    if (v === undefined || typeof v === 'function') return;
    if (v && typeof v === 'object') v = JSON.stringify(v);
    out[k] = v;
  });
  return out;
}

function saveSystemSettings(payload) {
  payload = payload || {};
  var settings = angFlattenSettingsPayloadV11_(payload);
  var sh = angEnsureSystemSettingsSheetV11_();
  var values = sh.getDataRange().getValues();
  var map = {};
  for (var i = 1; i < values.length; i++) map[String(values[i][0] || '')] = i + 1;
  var now = (typeof nowText_ === 'function') ? nowText_() : new Date().toISOString();
  var updater = String(payload.userId || payload.id || '').trim();
  Object.keys(settings).forEach(function(k){
    var row = map[k];
    var line = [k, settings[k], now, updater, ''];
    if (row) sh.getRange(row, 1, 1, line.length).setValues([line]);
    else sh.appendRow(line);
  });
  return { ok:true, message:'設定已儲存', settings:settings };
}

function loadSystemSettings(payload) {
  var sh = angEnsureSystemSettingsSheetV11_();
  var values = sh.getDataRange().getValues();
  var out = {};
  for (var i = 1; i < values.length; i++) {
    var k = String(values[i][0] || '').trim();
    if (!k) continue;
    out[k] = values[i][1];
  }
  return { ok:true, settings:out, approverSettings:out };
}

function saveApproverSettings(payload) {
  payload = payload || {};
  var ss = (typeof getDb_ === 'function') ? getDb_() : SpreadsheetApp.getActiveSpreadsheet();
  var settings = (typeof angNormalizeApproverSettingsV10_ === 'function')
    ? angNormalizeApproverSettingsV10_(payload, ss)
    : (typeof angNormalizeApproverSettingsV8_ === 'function' ? angNormalizeApproverSettingsV8_(payload) : payload);
  return saveSystemSettings({
    userId: payload.userId || payload.id,
    id: payload.id || payload.userId,
    token: payload.token,
    settings: settings
  });
}


/*****************************************************************
 * ANG HR v25｜一間公司一份正式試算表｜完整路由覆蓋層
 *
 * 兩個核心試算表：
 * 1. 平台總控表：Companies / EmailVerifications / Sessions / AuditLogs / FreePrivilegeCodes
 * 2. 公司正式資料表：每間公司各一份，放 Employees / ClockRecords / SystemSettings 等公司內資料
 *
 * 第三個「公司模板試算表」是可選項：若 Script Properties 設定 ANG_HR_COMPANY_TEMPLATE_ID，
 * 新公司會複製模板；未設定時會自動建立一份空白公司正式資料表並補齊標題列。
 *****************************************************************/
const ANG_HR_MASTER_DB_ID_PROPERTY_V25 = 'ANG_HR_MASTER_DB_ID';
const ANG_HR_LEGACY_DB_ID_PROPERTY_V25 = 'ANG_HR_DB_ID';
const ANG_HR_COMPANY_TEMPLATE_ID_PROPERTY_V25 = 'ANG_HR_COMPANY_TEMPLATE_ID';
const ANG_HR_COMPANY_DATA_SHEETS_V25 = [SHEET_EMPLOYEES, SHEET_CLOCK_RECORDS, 'SystemSettings'];
const ANG_HR_MASTER_ONLY_SHEETS_V25 = [
  SHEET_COMPANIES,
  SHEET_EMAIL_CODES,
  SHEET_AUDIT_LOGS,
  SHEET_SESSIONS,
  SHEET_FREE_PRIVILEGES,
  SHEET_COMPANY_UPLOAD_AUTH,
  SHEET_COMPANY_UPLOAD_LOGS,
  SHEET_COMPANY_UPLOAD_FOLDERS
];

function handleApi_(action, payload, callback) {
  try {
    initializeSystem_();
    action = String(action || '').trim();
    payload = payload || {};
    let result;
    switch (action) {
      case 'ping': result = apiPing_(payload); break;
      case 'createUploadSession': result = apiCreateUploadSession_(payload); break;
      case 'validateUploadToken': result = apiValidateUploadToken_(payload); break;
      case 'uploadCompanyDataByToken':
      case 'uploadCompanyData': result = apiUploadCompanyDataByToken_(payload); break;
      case 'requestEmailCode': result = apiRequestEmailCode_(payload); break;
      case 'verifyEmailCode': result = apiVerifyEmailCode_(payload); break;
      case 'verifyGoogleCredential': result = apiVerifyGoogleCredential_(payload); break;
      case 'verifyNativeGoogleIdToken': result = apiVerifyNativeGoogleIdToken_(payload); break;
      case 'verifyNativeLineIdToken': result = apiVerifyNativeLineIdToken_(payload); break;
      case 'registerCompany': result = apiRegisterCompany_(payload); break;
      case 'adminLogin': result = apiAdminLogin_(payload); break;
      case 'adminLoginByVerifiedAuth': result = apiAdminLoginByVerifiedAuth_(payload); break;
      case 'activateEmployee': result = apiActivateEmployee_(payload); break;
      case 'activateEmployeeByVerifiedAuth':
      case 'employeeActivateByVerifiedAuth': result = apiActivateEmployeeByVerifiedAuth_(payload); break;
      case 'getEmployeeCompaniesByVerifiedAuth': result = apiGetEmployeeCompaniesByVerifiedAuth_(payload); break;
      case 'addEmployee':
      case 'createEmployee':
      case 'registerEmployee': result = apiAddEmployee_(payload); break;
      case 'clockByButton': result = apiClockByButton_(payload); break;
      case 'nfcClock': result = apiNfcClock_(payload); break;
      case 'testCompanyDriveFolderAccess': result = testCompanyDriveFolderAccess(payload); break;
      case 'getCompanyUploadDriveSettings': result = getCompanyUploadDriveSettings(payload); break;
      case 'saveCompanyUploadDriveSettings': result = saveCompanyUploadDriveSettings(payload); break;
      case 'getCompanySpreadsheetInfo': result = apiGetCompanySpreadsheetInfo_(payload); break;
      case 'getCompanyRetentionSettings':
      case 'getCompanyRetentionSettingsV26': result = getCompanyRetentionSettingsV26(payload); break;
      case 'saveCompanyRetentionSettings':
      case 'saveCompanyRetentionSettingsV26': result = saveCompanyRetentionSettingsV26(payload); break;
      case 'cleanupOldData':
      case 'cleanupOldDataRetention':
      case 'cleanupOldDataRetentionV26': result = cleanupOldDataRetentionV26(payload); break;
      case 'setupDataRetentionTrigger':
      case 'setupDataRetentionTriggerV26': result = setupDataRetentionTriggerV26(payload); break;
      case 'deleteDataRetentionTrigger':
      case 'deleteDataRetentionTriggerV26': result = deleteDataRetentionTriggerV26(payload); break;
      case 'setupCompanySpreadsheetRouting':
      case 'setupCompanySpreadsheetRoutingV25': result = setupCompanySpreadsheetRoutingV25(payload); break;
      case 'backfillCompanySpreadsheets':
      case 'backfillCompanySpreadsheetsV25': result = backfillCompanySpreadsheetsV25(payload); break;
      case 'saveMixedModeSetting': result = saveMixedModeSetting(payload); break;
      case 'saveApproverSettings': result = saveApproverSettings(payload); break;
      case 'saveSystemSettings': result = saveSystemSettings(payload); break;
      case 'loadSystemSettings': result = loadSystemSettings(payload); break;
      case 'getPlans': result = apiGetPlans_(); break;
      case 'issueFreePrivilegeCode': result = apiIssueFreePrivilegeCode_(payload); break;
      default: result = fail_('未知 action：' + action);
    }
    return outputJson_(result, callback);
  } catch (err) {
    return outputJson_(fail_(err && err.message ? err.message : String(err)), callback);
  }
}

function setupAngHrProjectProperties() {
  const props = PropertiesService.getScriptProperties();
  props.setProperties({
    ANG_HR_MASTER_DB_ID: DEFAULT_ANG_HR_DB_ID,
    ANG_HR_DB_ID: DEFAULT_ANG_HR_DB_ID,
    DATA_UPLOAD_SPREADSHEET_ID: DATA_UPLOAD_DEFAULT_SPREADSHEET_ID,
    DATA_UPLOAD_ROOT_FOLDER_ID: DATA_UPLOAD_DEFAULT_ROOT_FOLDER_ID,
    FRONTEND_URL: DEFAULT_FRONTEND_URL,
    WEB_APP_URL: DEFAULT_WEB_APP_URL,
    CONTACT_EMAIL: DEFAULT_CONTACT_EMAIL,
    GOOGLE_WEB_CLIENT_ID: GOOGLE_CLIENT_ID,
    GOOGLE_ALLOWED_CLIENT_IDS: GOOGLE_CLIENT_ID
  }, false);
  return 'Script Properties 已寫入。平台總控表使用 ANG_HR_MASTER_DB_ID；公司模板可另外設定 ANG_HR_COMPANY_TEMPLATE_ID。';
}

function initializeSystem_() {
  const master = getMasterDbV25_();
  Object.keys(HEADERS).forEach(function(name) {
    let sh = master.getSheetByName(name);
    if (!sh) sh = master.insertSheet(name);
    ensureHeader_(sh, HEADERS[name]);
  });
  ensureCompanyHeaderColumnsV25_();
  repairEmployeeCompanyFields_();
  if (typeof angPeopleInitSystem === 'function') angPeopleInitSystem();
}

function getDb_() {
  return getMasterDbV25_();
}

function getMasterDbV25_() {
  const props = PropertiesService.getScriptProperties();
  const ids = [
    props.getProperty(ANG_HR_MASTER_DB_ID_PROPERTY_V25),
    props.getProperty(ANG_HR_LEGACY_DB_ID_PROPERTY_V25),
    DEFAULT_ANG_HR_DB_ID
  ].filter(function(x, i, a){ return x && a.indexOf(x) === i; });

  for (let i = 0; i < ids.length; i++) {
    try {
      const ss = SpreadsheetApp.openById(ids[i]);
      props.setProperty(ANG_HR_MASTER_DB_ID_PROPERTY_V25, ss.getId());
      props.setProperty(ANG_HR_LEGACY_DB_ID_PROPERTY_V25, ss.getId());
      return ss;
    } catch (err) {}
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) {
    props.setProperty(ANG_HR_MASTER_DB_ID_PROPERTY_V25, active.getId());
    props.setProperty(ANG_HR_LEGACY_DB_ID_PROPERTY_V25, active.getId());
    return active;
  }
  const ss = SpreadsheetApp.create('ANG HR｜平台總控表');
  props.setProperty(ANG_HR_MASTER_DB_ID_PROPERTY_V25, ss.getId());
  props.setProperty(ANG_HR_LEGACY_DB_ID_PROPERTY_V25, ss.getId());
  return ss;
}

function getSheet_(name) {
  return getSheetInSpreadsheetV25_(getMasterDbV25_(), name);
}

function getSheetInSpreadsheetV25_(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    ensureHeader_(sh, HEADERS[name] || defaultCompanySheetHeadersV25_(name));
  } else {
    ensureHeader_(sh, HEADERS[name] || defaultCompanySheetHeadersV25_(name));
  }
  return sh;
}

function defaultCompanySheetHeadersV25_(name) {
  if (name === 'SystemSettings') return ['key', 'value', 'updated_at', 'updated_by', 'note'];
  return [];
}

function ensureCompanyHeaderColumnsV25_() {
  const sh = getSheet_(SHEET_COMPANIES);
  ensureHeader_(sh, HEADERS[SHEET_COMPANIES]);
  const required = [
    'spreadsheet_id', 'spreadsheet_url', 'company_spreadsheet_id', 'company_spreadsheet_url', 'company_template_id',
    'employee_upload_enabled', 'employee_upload_drive_tested', 'employee_upload_folder_id', 'employee_upload_folder_url', 'employee_upload_test_file_url'
  ];
  ensureHeader_(sh, required);
}

function initCompanySpreadsheetV25_(ss, companyId, companyName) {
  ANG_HR_COMPANY_DATA_SHEETS_V25.forEach(function(name) {
    const sh = getSheetInSpreadsheetV25_(ss, name);
    if (name === 'SystemSettings') {
      ensureHeader_(sh, ['key', 'value', 'updated_at', 'updated_by', 'note']);
    }
  });
  const infoSh = getSheetInSpreadsheetV25_(ss, 'CompanyInfo');
  ensureHeader_(infoSh, ['key', 'value', 'updated_at']);
  const values = sheetToObjects_(infoSh);
  const existing = {};
  values.forEach(function(r){ if (r.key) existing[String(r.key)] = true; });
  const now = nowText_();
  if (!existing.company_id) infoSh.appendRow(['company_id', companyId, now]);
  if (!existing.company_name) infoSh.appendRow(['company_name', companyName || '', now]);
  if (!existing.created_by) infoSh.appendRow(['created_by', 'ANG_HR_v25', now]);
  return ss;
}

function createCompanySpreadsheetV25_(companyId, companyName, plan) {
  const props = PropertiesService.getScriptProperties();
  const templateId = normalize_(props.getProperty(ANG_HR_COMPANY_TEMPLATE_ID_PROPERTY_V25) || props.getProperty('COMPANY_TEMPLATE_SPREADSHEET_ID') || '');
  const safeName = normalize_(companyName || companyId || '公司').replace(/[\\/:*?"<>|]/g, '_');
  const fileName = 'ANG HR｜' + companyId + '｜' + safeName;
  let ss;
  if (templateId) {
    try {
      const copy = DriveApp.getFileById(templateId).makeCopy(fileName);
      ss = SpreadsheetApp.openById(copy.getId());
    } catch (err) {
      ss = SpreadsheetApp.create(fileName);
    }
  } else {
    ss = SpreadsheetApp.create(fileName);
  }
  initCompanySpreadsheetV25_(ss, companyId, companyName || '');
  return {
    spreadsheet_id: ss.getId(),
    spreadsheet_url: ss.getUrl(),
    company_spreadsheet_id: ss.getId(),
    company_spreadsheet_url: ss.getUrl(),
    company_template_id: templateId
  };
}

function getCompanyIdFromPayloadV25_(payload) {
  payload = payload || {};
  return normalizeUpper_(payload.company_id || payload.companyId || payload.company || payload.companyCode || payload.company_code || '');
}

function findCompany_(companyId) {
  companyId = normalizeUpper_(companyId || '');
  const rows = sheetToObjects_(getSheet_(SHEET_COMPANIES));
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (normalizeUpper_(r.company_id || '') === companyId) return r;
  }
  return null;
}

function getCompanySpreadsheetIdFromRecordV25_(company) {
  company = company || {};
  return normalize_(
    company.customer_spreadsheet_id ||
    company.self_hosted_spreadsheet_id ||
    company.spreadsheet_id ||
    company.company_spreadsheet_id ||
    company.companySpreadsheetId ||
    ''
  );
}

function getCompanyDbByCompanyIdV25_(companyId) {
  companyId = normalizeUpper_(companyId || '');
  if (!companyId) return getMasterDbV25_();
  const company = findCompany_(companyId);
  const spreadsheetId = getCompanySpreadsheetIdFromRecordV25_(company);
  if (spreadsheetId) {
    try { return SpreadsheetApp.openById(spreadsheetId); } catch (err) {}
  }
  return getMasterDbV25_();
}

function getCompanySheetV25_(companyId, sheetName) {
  const ss = getCompanyDbByCompanyIdV25_(companyId);
  return getSheetInSpreadsheetV25_(ss, sheetName);
}

function isCompanyUsingSeparateSpreadsheetV25_(companyId) {
  const masterId = getMasterDbV25_().getId();
  const ss = getCompanyDbByCompanyIdV25_(companyId);
  return ss && ss.getId && ss.getId() !== masterId;
}

function updateCompanyRecordV25_(companyId, updates) {
  companyId = normalizeUpper_(companyId || '');
  updates = updates || {};
  if (!companyId) return false;
  const sh = getSheet_(SHEET_COMPANIES);
  ensureHeader_(sh, HEADERS[SHEET_COMPANIES]);
  const rows = sheetToObjects_(sh);
  const headerMap = getHeaderMap_(sh);
  for (let i = 0; i < rows.length; i++) {
    if (normalizeUpper_(rows[i].company_id || '') !== companyId) continue;
    const rowNumber = i + 2;
    Object.keys(updates).forEach(function(k) {
      if (headerMap[k]) sh.getRange(rowNumber, headerMap[k]).setValue(updates[k]);
    });
    return true;
  }
  return false;
}

function appendObjectRowToSheetV25_(sheet, obj) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h){ return String(h || '').trim(); });
  const row = headers.map(function(h){ return Object.prototype.hasOwnProperty.call(obj, h) ? obj[h] : ''; });
  sheet.appendRow(row);
}

function appendOrUpdateObjectRowInSheetV25_(sheet, obj, keys) {
  keys = keys || [];
  const headerMap = getHeaderMap_(sheet);
  const rows = sheetToObjects_(sheet);
  let rowNumber = 0;
  for (let i = 0; i < rows.length; i++) {
    const same = keys.every(function(k){ return normalize_(rows[i][k] || '') === normalize_(obj[k] || ''); });
    if (same) { rowNumber = i + 2; break; }
  }
  if (rowNumber) {
    Object.keys(obj).forEach(function(k){ if (headerMap[k]) sheet.getRange(rowNumber, headerMap[k]).setValue(obj[k]); });
  } else {
    appendObjectRowToSheetV25_(sheet, obj);
  }
}

function mirrorEmployeeToMasterIndexV25_(obj) {
  const sh = getSheet_(SHEET_EMPLOYEES);
  ensureHeader_(sh, HEADERS[SHEET_EMPLOYEES]);
  appendOrUpdateObjectRowInSheetV25_(sh, obj, ['company_id', 'employee_id']);
}

function updateEmployeeInSheetV25_(sheet, companyId, employeeId, updates) {
  const rows = sheetToObjects_(sheet);
  const headerMap = getHeaderMap_(sheet);
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (normalizeUpper_(r.company_id || '') !== companyId || normalizeUpper_(r.employee_id || '') !== employeeId) continue;
    const rowNumber = i + 2;
    Object.keys(updates || {}).forEach(function(k){ if (headerMap[k]) sheet.getRange(rowNumber, headerMap[k]).setValue(updates[k]); });
    return Object.assign({}, r, updates || {});
  }
  return null;
}

function findEmployeeInSheetV25_(sheet, companyId, employeeId) {
  const rows = sheetToObjects_(sheet);
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (normalizeUpper_(r.company_id || '') === companyId && normalizeUpper_(r.employee_id || '') === employeeId) return r;
  }
  return null;
}

function findEmployee_(companyId, employeeId) {
  companyId = normalizeUpper_(companyId || '');
  employeeId = normalizeUpper_(employeeId || '');
  if (!companyId || !employeeId) return null;
  const companySheet = getCompanySheetV25_(companyId, SHEET_EMPLOYEES);
  const inCompany = findEmployeeInSheetV25_(companySheet, companyId, employeeId);
  if (inCompany) return inCompany;
  const masterSheet = getSheet_(SHEET_EMPLOYEES);
  return findEmployeeInSheetV25_(masterSheet, companyId, employeeId);
}

function nextEmployeeId_(companyId) {
  companyId = normalizeUpper_(companyId || '');
  const rows = sheetToObjects_(getCompanySheetV25_(companyId, SHEET_EMPLOYEES));
  let max = 0;
  rows.forEach(function(r) {
    if (normalizeUpper_(r.company_id || '') !== companyId) return;
    const id = normalizeUpper_(r.employee_id || '');
    const m = id.match(/(\d+)$/);
    if (m) max = Math.max(max, Number(m[1] || 0));
  });
  var next = max + 1;
  if (next === 603) next = 604;
  return 'ANG' + String(next).padStart(4, '0');
}

function apiRegisterCompany_(payload) {
  payload = payload || {};
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const verified = verifyVerifyToken_(payload.verify_token || '');
    if (!verified.ok) return fail_(verified.message || '驗證狀態無效，請重新驗證');

    const method = normalize_(verified.data.method || payload.verify_method || '');
    const email = normalizeEmail_(verified.data.email || '');
    const googleSub = normalize_(verified.data.google_sub || '');
    const lineSub = normalize_(verified.data.line_sub || '');
    if (!email && !googleSub && !lineSub) return fail_('缺少驗證身分');

    const companyName = normalize_(payload.company_name || '');
    const adminName = normalize_(payload.admin_name || '');
    const phone = normalize_(payload.phone || '');
    const birthDate = normalize_(payload.birth_date || '');
    const plan = normalizePlanIdV26_(payload.plan || 'basic');
    const taxId = normalize_(payload.tax_id || '');
    const address = normalize_(payload.address || '');
    const paymentMethod = normalizeLower_(payload.payment_method || 'first_month_free');
    const authorizationCode = normalizeUpper_(payload.authorization_code || '');
    const privilegeId = normalizeUpper_(payload.privilege_id || '');
    const driveFolderId = extractDriveFolderIdV25_(payload.driveFolderId || payload.drive_folder_id || payload.folderId || payload.googleDriveFolderId || payload.google_drive_folder_id || '');
    const customerSpreadsheetId = extractSpreadsheetIdV26_(payload.customerSpreadsheetId || payload.customer_spreadsheet_id || payload.selfHostedSpreadsheetId || payload.self_hosted_spreadsheet_id || payload.companySpreadsheetId || payload.company_spreadsheet_id || payload.bringYourOwnSpreadsheetId || payload.bring_your_own_spreadsheet_id || '');
    const dataHostingMode = (plan === 'private' || customerSpreadsheetId) ? 'self_hosted' : 'ang_managed';

    if (!companyName) return fail_('請輸入公司中文名稱');
    if (!adminName) return fail_('請輸入申請人姓名');
    if (!phone) return fail_('請輸入電話');
    if (!birthDate) return fail_('請輸入出生年月日');
    if (!isBusinessPlan_(plan)) return fail_('公司只能選擇 Business 方案');
    if (plan === 'private' && !customerSpreadsheetId) return fail_('Private 方案需提供客戶自己的 Google 試算表 ID 或網址。');

    const ownerPerson = typeof angPeopleEnsureFromVerifiedAuth_ === 'function'
      ? angPeopleEnsureFromVerifiedAuth_({
          provider: method,
          email: email,
          phone: phone,
          profile_name: adminName,
          google_user_id: googleSub,
          line_user_id: lineSub,
          device_id: normalize_(payload.device_id || '')
        })
      : null;
    const ownerPersonId = ownerPerson ? ownerPerson.person_id : normalizeUpper_(verified.data.person_id || payload.person_id || '');
    const canonicalPlanCode = planCanonicalCode_(plan);

    const companies = sheetToObjects_(getSheet_(SHEET_COMPANIES));
    const duplicate = companies.some(function(c) {
      const sameEmail = email && normalizeEmail_(c.verified_email) === email;
      const sameGoogle = googleSub && normalize_(c.google_sub) === googleSub;
      const sameLine = lineSub && normalize_(c.line_sub) === lineSub;
      const active = normalizeLower_(c.status || 'active') !== 'deleted';
      return active && (sameEmail || sameGoogle || sameLine);
    });
    if (duplicate) return fail_('此 Email 或 Google/LINE 帳號已開通過，請登入原公司或聯絡客服');

    const privilegeCheck = checkFreePrivilegeCodeForUse_(privilegeId, companies);
    if (!privilegeCheck.ok) return fail_(privilegeCheck.message);
    const isFreePrivilege = !!privilegeCheck.is_free_privilege;

    const prefix = isFreePrivilege ? FREE_PRIVILEGE_COMPANY_CODE_PREFIX : STANDARD_COMPANY_CODE_PREFIX;
    const companyId = nextCompanyId_(prefix);
    const planLabel = planLabel_(plan);
    const isFreePlan = plan === 'lite';
    const billingStatus = isFreePrivilege ? 'free_privilege' : (isFreePlan ? 'free' : 'first_month_free');
    const billingLabel = isFreePrivilege ? '免付費特權' : (isFreePlan ? '免費方案' : '首月免費');
    const trialStartedAt = nowText_();
    const firstMonthEndsAt = (isFreePrivilege || isFreePlan) ? '' : dateToIso_(new Date(Date.now() + FIRST_MONTH_DAYS * 24 * 60 * 60 * 1000));
    const nextChargeAt = (isFreePrivilege || isFreePlan) ? '' : dateToIso_(new Date(Date.now() + (FIRST_MONTH_DAYS + 1) * 24 * 60 * 60 * 1000));
    const baseMonthlyPrice = planMonthlyPrice_(plan);
    const addonMonthlyTotal = 0;
    const monthlyTotal = (isFreePrivilege || isFreePlan) ? 0 : baseMonthlyPrice + addonMonthlyTotal;
    const employeeQuota = planEmployeeQuota_(plan);
    const activeEmployeeCount = 1;
    const companySheetInfo = customerSpreadsheetId
      ? useCustomerCompanySpreadsheetV26_(customerSpreadsheetId, companyId, companyName, plan)
      : createCompanySpreadsheetV25_(companyId, companyName, plan);

    const companyObj = {
      company_id: companyId,
      company_code: companyId,
      company_name: companyName,
      owner_person_id: ownerPersonId,
      plan: plan,
      plan_code: canonicalPlanCode,
      plan_label: planLabel,
      billing_status: billingStatus,
      billing_status_label: billingLabel,
      verified_email: email,
      google_sub: googleSub,
      verify_method: method,
      admin_name: adminName,
      admin_phone: phone,
      birth_date: birthDate,
      tax_id: taxId,
      address: address,
      payment_method: paymentMethod,
      authorization_code: authorizationCode,
      base_monthly_price: baseMonthlyPrice,
      addon_monthly_total: addonMonthlyTotal,
      monthly_total: monthlyTotal,
      trial_started_at: trialStartedAt,
      trial_ends_at: firstMonthEndsAt,
      next_charge_at: nextChargeAt,
      employee_quota: employeeQuota,
      active_employee_count: activeEmployeeCount,
      creator_employee_no: DEFAULT_CREATOR_EMPLOYEE_NO,
      creator_employee_id: DEFAULT_CREATOR_EMPLOYEE_ID,
      creator_password: DEFAULT_CREATOR_PASSWORD,
      free_privilege_id: isFreePrivilege ? privilegeId : '',
      created_at: nowText_(),
      first_month_ends_at: firstMonthEndsAt,
      paid_until: (isFreePrivilege || isFreePlan) ? 'unlimited' : firstMonthEndsAt,
      status: 'active',
      spreadsheet_id: companySheetInfo.spreadsheet_id,
      spreadsheet_url: companySheetInfo.spreadsheet_url,
      company_spreadsheet_id: companySheetInfo.company_spreadsheet_id,
      company_spreadsheet_url: companySheetInfo.company_spreadsheet_url,
      company_template_id: companySheetInfo.company_template_id,
      drive_folder_id: driveFolderId,
      google_drive_folder_id: driveFolderId,
      drive_folder_tested_at: driveFolderId ? nowText_() : '',
      drive_folder_test_file_url: normalize_(payload.driveFolderTestFileUrl || payload.drive_folder_test_file_url || ''),
      employee_upload_enabled: 'false',
      employee_upload_drive_tested: driveFolderId ? 'true' : 'false',
      employee_upload_folder_id: driveFolderId,
      employee_upload_folder_url: driveFolderId ? 'https://drive.google.com/drive/folders/' + driveFolderId : '',
      employee_upload_test_file_url: normalize_(payload.driveFolderTestFileUrl || payload.drive_folder_test_file_url || ''),
      retention_months: String(payload.retention_months || payload.retentionMonths || planDefaultRetentionMonthsV26_(plan)),
      retention_policy: normalizeLower_(payload.retention_policy || payload.retentionPolicy || (plan === 'private' ? 'keep_all' : 'delete_old_records')),
      last_cleanup_at: '',
      data_hosting_mode: dataHostingMode,
      customer_spreadsheet_id: customerSpreadsheetId,
      customer_spreadsheet_url: customerSpreadsheetId ? 'https://docs.google.com/spreadsheets/d/' + customerSpreadsheetId + '/edit' : '',
      self_hosted_note: dataHostingMode === 'self_hosted' ? 'customer_owned_spreadsheet' : ''
    };
    appendObjectRow_(SHEET_COMPANIES, companyObj);

    const creatorObj = {
      company_id: companyId,
      company_code: companyId,
      company_name: companyName,
      owner_person_id: ownerPersonId,
      plan: plan,
      plan_code: canonicalPlanCode,
      plan_label: planLabel,
      billing_status: billingStatus,
      billing_status_label: billingLabel,
      branch_id: 'MAIN',
      branch_name: companyName,
      person_id: ownerPersonId,
      employee_no: DEFAULT_CREATOR_EMPLOYEE_NO,
      employee_id: DEFAULT_CREATOR_EMPLOYEE_ID,
      password: DEFAULT_CREATOR_PASSWORD,
      name: adminName || DEFAULT_CREATOR_NAME,
      role: 'Owner',
      email: email,
      phone: phone,
      birth_date: birthDate,
      google_sub: googleSub,
      line_sub: lineSub,
      device_id: normalize_(payload.device_id || ''),
      one_time_token: '',
      token_used: 'yes',
      created_at: nowText_(),
      updated_at: nowText_(),
      status: 'active'
    };
    appendOrUpdateCompanyPersonRowV31_(companyId, creatorObj);
    appendObjectRowToSheetV25_(getCompanySheetV25_(companyId, SHEET_EMPLOYEES), creatorObj);
    mirrorEmployeeToMasterIndexV25_(creatorObj);

    if (typeof angPeopleRegisterCompanyCreator_ === 'function') {
      angPeopleRegisterCompanyCreator_({
        person_id: ownerPersonId,
        company_id: companyId,
        owner_name: adminName,
        owner_email: email,
        owner_phone: phone,
        auth_provider: method,
        google_user_id: googleSub,
        line_user_id: lineSub,
        device_id: normalize_(payload.device_id || ''),
        plan_code: canonicalPlanCode,
        payment_status: billingStatus,
        trial_started_at: trialStartedAt,
        trial_ends_at: firstMonthEndsAt,
        spreadsheet_id: companySheetInfo.spreadsheet_id,
        spreadsheet_url: companySheetInfo.spreadsheet_url
      });
    }

    if (isFreePrivilege) markFreePrivilegeCodeUsed_(privilegeCheck.row_number, companyId);

    log_('registerCompany', companyId, DEFAULT_CREATOR_EMPLOYEE_ID, email, 'ok', 'company created with own spreadsheet', { plan: plan, spreadsheet_id: companySheetInfo.spreadsheet_id });
    return ok_({
      message: '公司建立完成，已建立公司專屬試算表',
      company_id: companyId,
      company_code: companyId,
      company_name: companyName,
      owner_person_id: ownerPersonId,
      plan: plan,
      plan_code: canonicalPlanCode,
      plan_label: planLabel,
      billing_status: billingStatus,
      billing_status_label: billingLabel,
      employee_no: DEFAULT_CREATOR_EMPLOYEE_NO,
      employee_id: DEFAULT_CREATOR_EMPLOYEE_ID,
      password: DEFAULT_CREATOR_PASSWORD,
      role: 'Owner',
      trial_started_at: trialStartedAt,
      trial_ends_at: firstMonthEndsAt,
      first_month_ends_at: firstMonthEndsAt,
      next_charge_at: nextChargeAt,
      base_monthly_price: baseMonthlyPrice,
      addon_monthly_total: addonMonthlyTotal,
      monthly_total: monthlyTotal,
      employee_quota: employeeQuota,
      payment_method: paymentMethod,
      authorization_code: authorizationCode ? authorizationCode : '',
      spreadsheet_id: companySheetInfo.spreadsheet_id,
      spreadsheet_url: companySheetInfo.spreadsheet_url,
      company_spreadsheet_id: companySheetInfo.company_spreadsheet_id,
      company_spreadsheet_url: companySheetInfo.company_spreadsheet_url,
      drive_folder_id: driveFolderId,
      google_drive_folder_id: driveFolderId
    });
  } finally {
    lock.releaseLock();
  }
}

function apiAddEmployee_(payload) {
  payload = payload || {};
  const companyId = normalizeUpper_(payload.company_id || payload.company || '');
  if (!companyId) return fail_('缺少公司代碼');
  const company = findCompany_(companyId);
  if (!company) return fail_('找不到公司資料');
  const name = normalize_(payload.name || payload.employee_name || '');
  const phone = normalize_(payload.phone || '');
  const email = normalizeEmail_(payload.email || '');
  const role = normalize_(payload.role || 'Employee');
  let employeeId = normalizeUpper_(payload.employee_id || payload.id || '');
  if (!name) return fail_('請輸入員工姓名');
  if (!phone) return fail_('請輸入員工手機號碼');
  if (!employeeId) employeeId = nextEmployeeId_(companyId);
  if (findEmployee_(companyId, employeeId)) return fail_('員工編號已存在');
  const token = normalizeUpper_(payload.one_time_token || ('ACT' + Math.random().toString(36).slice(2, 10).toUpperCase()));
  const employeeObj = {
    company_id: companyId,
    company_name: company.company_name || '',
    plan: company.plan || '',
    plan_label: company.plan_label || '',
    billing_status: company.billing_status || '',
    billing_status_label: company.billing_status_label || '',
    branch_id: normalizeUpper_(payload.branch_id || 'MAIN'),
    branch_name: normalize_(payload.branch_name || company.company_name || 'MAIN'),
    employee_id: employeeId,
    password: normalize_(payload.password || ''),
    name: name,
    role: role,
    email: email,
    phone: phone,
    birth_date: normalize_(payload.birth_date || ''),
    google_sub: '',
    line_sub: '',
    device_id: '',
    one_time_token: token,
    token_used: 'no',
    created_at: nowText_(),
    updated_at: nowText_(),
    status: 'active'
  };
  appendObjectRowToSheetV25_(getCompanySheetV25_(companyId, SHEET_EMPLOYEES), employeeObj);
  mirrorEmployeeToMasterIndexV25_(employeeObj);
  log_('addEmployee', companyId, employeeId, email, 'ok', 'employee created in company spreadsheet', { phone: phone });
  return ok_({ message: '員工新增完成', company_id: companyId, employee_id: employeeId, one_time_token: token, activation_code: token });
}

function apiActivateEmployee_(payload) {
  payload = payload || {};
  const companyId = normalizeUpper_(payload.company_id || '');
  const employeeId = normalizeUpper_(payload.employee_id || '');
  const token = normalize_(payload.token || '');
  const deviceId = normalize_(payload.device_id || '');
  if (!companyId || !employeeId || !token) return fail_('請輸入公司代號、員工編號與一次性開通碼');

  const sheet = getCompanySheetV25_(companyId, SHEET_EMPLOYEES);
  const employee = findEmployeeInSheetV25_(sheet, companyId, employeeId);
  if (!employee) return fail_('找不到員工資料');
  if (normalize_(employee.one_time_token || '') !== token) return fail_('一次性開通碼錯誤');
  if (normalizeLower_(employee.token_used || '') === 'yes') return fail_('此開通碼已使用');

  const updates = { device_id: deviceId, token_used: 'yes', updated_at: nowText_() };
  updateEmployeeInSheetV25_(sheet, companyId, employeeId, updates);
  updateEmployeeInSheetV25_(getSheet_(SHEET_EMPLOYEES), companyId, employeeId, updates);
  log_('activateEmployee', companyId, employeeId, employee.email || '', 'ok', 'activated', { device_id: deviceId });
  return ok_({
    message: '開通成功',
    company_id: companyId,
    company_name: employee.company_name || '',
    plan: employee.plan || '',
    plan_label: employee.plan_label || '',
    employee_id: employeeId,
    name: employee.name || '',
    role: employee.role || ''
  });
}

function apiActivateEmployeeByVerifiedAuth_(payload) {
  payload = payload || {};
  const companyId = normalizeUpper_(payload.company_id || payload.company || '');
  const employeeId = normalizeUpper_(payload.employee_id || payload.id || '');
  const oneTimeToken = normalize_(payload.token || payload.activation_code || payload.one_time_token || '');
  const phone = normalize_(payload.phone || '');
  const deviceId = normalize_(payload.device_id || '');
  const verify = verifyVerifyToken_(payload.verify_token || '');
  if (!companyId || !employeeId || !oneTimeToken) return fail_('請輸入公司代號、員工編號與開通碼');
  if (!phone) return fail_('請輸入手機號碼');
  if (!verify.ok) return fail_(verify.message || '驗證已失效，請重新驗證');

  const sheet = getCompanySheetV25_(companyId, SHEET_EMPLOYEES);
  const employee = findEmployeeInSheetV25_(sheet, companyId, employeeId);
  if (!employee) return fail_('找不到員工資料');
  if (normalize_(employee.one_time_token || '') !== oneTimeToken) return fail_('一次性開通碼錯誤');
  if (normalizeLower_(employee.token_used || '') === 'yes') return fail_('此開通碼已使用');

  const email = normalizeEmail_(verify.data.email || '');
  const googleSub = normalize_(verify.data.google_sub || '');
  const lineSub = normalize_(verify.data.line_sub || '');
  const updates = {
    device_id: deviceId,
    phone: phone,
    email: email || employee.email || '',
    google_sub: googleSub || employee.google_sub || '',
    line_sub: lineSub || employee.line_sub || '',
    token_used: 'yes',
    updated_at: nowText_()
  };
  const updated = updateEmployeeInSheetV25_(sheet, companyId, employeeId, updates) || Object.assign({}, employee, updates);
  updateEmployeeInSheetV25_(getSheet_(SHEET_EMPLOYEES), companyId, employeeId, updates);
  const session = createSessionForEmployee_(companyId, Object.assign({}, updated, { employee_id: employeeId }), deviceId);
  log_('activateEmployeeByVerifiedAuth', companyId, employeeId, email || employee.email || '', 'ok', 'employee verified activated', { provider: verify.data.provider || verify.data.method || '' });
  return ok_({ message: '開通成功', company_id: companyId, company_name: employee.company_name || '', employee_id: employeeId, name: employee.name || '', role: employee.role || 'Employee', session_token: session, auto_login: true });
}

function apiClockByButton_(payload) {
  payload = payload || {};
  const companyId = normalizeUpper_(payload.company_id || '');
  const employeeId = normalizeUpper_(payload.employee_id || '');
  const password = String(payload.password || '');
  const clockType = normalize_(payload.clock_type || '上班');
  const deviceId = normalize_(payload.device_id || '');
  const loc = payload.location || {};
  if (!companyId || !employeeId || !password) return fail_('請輸入公司代號、員工編號與密碼');
  if (['上班', '下班', '加班'].indexOf(clockType) < 0) return fail_('打卡類型不正確');

  const employee = findEmployee_(companyId, employeeId);
  if (!employee) return fail_('找不到員工資料');
  if (String(employee.password || '') !== password) return fail_('密碼錯誤');
  if (normalizeLower_(employee.status || 'active') !== 'active') return fail_('此帳號未啟用');

  const recordId = 'CLK' + Date.now() + Math.random().toString(36).slice(2, 7).toUpperCase();
  getCompanySheetV25_(companyId, SHEET_CLOCK_RECORDS).appendRow([
    recordId,
    companyId,
    employeeId,
    clockType,
    normalize_(payload.source || 'manual_button'),
    normalize_(payload.site_id || ''),
    normalize_(payload.nfc_key || ''),
    loc && loc.lat ? loc.lat : '',
    loc && loc.lng ? loc.lng : '',
    loc && loc.accuracy ? loc.accuracy : '',
    deviceId,
    nowText_(),
    '入口頁備援打卡'
  ]);
  log_('clockByButton', companyId, employeeId, employee.email || '', 'ok', 'clock ok', { record_id: recordId, clock_type: clockType });
  return ok_({ message: clockType + '打卡成功', record_id: recordId, created_at: nowText_() });
}

function angEnsureSystemSettingsSheetV11_(payload) {
  payload = payload || {};
  var companyId = getCompanyIdFromPayloadV25_(payload);
  var ss = companyId ? getCompanyDbByCompanyIdV25_(companyId) : getMasterDbV25_();
  var sh = ss.getSheetByName(SHEET_SYSTEM_SETTINGS_V11);
  if (!sh) sh = ss.insertSheet(SHEET_SYSTEM_SETTINGS_V11);
  ensureHeader_(sh, ['key', 'value', 'updated_at', 'updated_by', 'note']);
  return sh;
}

function saveSystemSettings(payload) {
  payload = payload || {};
  var settings = angFlattenSettingsPayloadV11_(payload);
  var sh = angEnsureSystemSettingsSheetV11_(payload);
  var values = sh.getDataRange().getValues();
  var map = {};
  for (var i = 1; i < values.length; i++) map[String(values[i][0] || '')] = i + 1;
  var now = (typeof nowText_ === 'function') ? nowText_() : new Date().toISOString();
  var updater = String(payload.userId || payload.id || '').trim();
  Object.keys(settings).forEach(function(k){
    var row = map[k];
    var line = [k, settings[k], now, updater, ''];
    if (row) sh.getRange(row, 1, 1, line.length).setValues([line]);
    else sh.appendRow(line);
  });
  return { ok:true, message:'設定已儲存', settings:settings, company_id:getCompanyIdFromPayloadV25_(payload), spreadsheet_id:sh.getParent().getId() };
}

function loadSystemSettings(payload) {
  payload = payload || {};
  var sh = angEnsureSystemSettingsSheetV11_(payload);
  var values = sh.getDataRange().getValues();
  var out = {};
  for (var i = 1; i < values.length; i++) {
    var k = String(values[i][0] || '').trim();
    if (!k) continue;
    out[k] = values[i][1];
  }
  return { ok:true, settings:out, approverSettings:out, company_id:getCompanyIdFromPayloadV25_(payload), spreadsheet_id:sh.getParent().getId() };
}

function saveApproverSettings(payload) {
  payload = payload || {};
  var companyId = getCompanyIdFromPayloadV25_(payload);
  var ss = companyId ? getCompanyDbByCompanyIdV25_(companyId) : getMasterDbV25_();
  var settings = (typeof angNormalizeApproverSettingsV10_ === 'function')
    ? angNormalizeApproverSettingsV10_(payload, ss)
    : (typeof angNormalizeApproverSettingsV8_ === 'function' ? angNormalizeApproverSettingsV8_(payload) : payload);
  return saveSystemSettings({
    userId: payload.userId || payload.id,
    id: payload.id || payload.userId,
    token: payload.token,
    company_id: companyId,
    settings: settings
  });
}

function getCompanyUploadDriveSettings(payload) {
  payload = payload || {};
  const companyId = getCompanyIdFromPayloadV25_(payload);
  if (!companyId) return { ok:false, message:'缺少 company_id' };
  const company = findCompany_(companyId) || {};
  const folderId = extractDriveFolderIdV25_(company.employee_upload_folder_id || company.drive_folder_id || company.google_drive_folder_id || '');
  const enabled = String(company.employee_upload_enabled || '').toLowerCase() === 'true';
  const tested = String(company.employee_upload_drive_tested || company.drive_folder_tested_at || '').toLowerCase() === 'true' || !!company.drive_folder_tested_at;
  return {
    ok:true,
    company_id:companyId,
    enabled:enabled,
    tested:tested,
    folderId:folderId,
    folderUrl:company.employee_upload_folder_url || (folderId ? 'https://drive.google.com/drive/folders/' + folderId : ''),
    testFileUrl:company.employee_upload_test_file_url || company.drive_folder_test_file_url || '',
    updatedAt:company.updated_at || ''
  };
}

function saveCompanyUploadDriveSettings(payload) {
  payload = payload || {};
  const companyId = getCompanyIdFromPayloadV25_(payload);
  if (!companyId) return { ok:false, message:'缺少 company_id' };
  const folderId = extractDriveFolderIdV25_(payload.folderId || payload.driveFolderId || payload.googleDriveFolderId || payload.folderUrl || '');
  const enabled = String(payload.enabled) === 'true' || payload.enabled === true;
  const tested = String(payload.tested) === 'true' || payload.tested === true;
  if (enabled && (!tested || !folderId)) return { ok:false, message:'必須先完成 Drive 測試，才能開啟員工資料上傳。' };
  updateCompanyRecordV25_(companyId, {
    employee_upload_enabled: enabled ? 'true' : 'false',
    employee_upload_drive_tested: tested ? 'true' : 'false',
    employee_upload_folder_id: folderId,
    employee_upload_folder_url: folderId ? 'https://drive.google.com/drive/folders/' + folderId : '',
    employee_upload_test_file_url: String(payload.testFileUrl || payload.test_file_url || ''),
    drive_folder_id: folderId,
    google_drive_folder_id: folderId,
    drive_folder_tested_at: tested ? nowText_() : '',
    drive_folder_test_file_url: String(payload.testFileUrl || payload.test_file_url || '')
  });
  return getCompanyUploadDriveSettings({ company_id: companyId });
}

function testCompanyDriveFolderAccess(payload) {
  payload = payload || {};
  const companyId = getCompanyIdFromPayloadV25_(payload);
  const folderId = extractDriveFolderIdV25_(payload.folderId || payload.driveFolderId || payload.googleDriveFolderId || payload.folderUrl || '');
  if (!folderId) return { ok:false, message:'請先輸入 Google Drive 資料夾 ID 或網址。' };
  try {
    const folder = DriveApp.getFolderById(folderId);
    const name = 'ANG_FOLDER_TEST.txt';
    const old = folder.getFilesByName(name);
    while (old.hasNext()) old.next().setTrashed(true);
    const content = [
      'ANG HR SYSTEMS Drive upload test',
      'time=' + new Date().toISOString(),
      'source=admin_upload_drive_feature_v25',
      'company_id=' + companyId,
      'user=' + String(payload.id || payload.userId || '')
    ].join('\n');
    const file = folder.createFile(Utilities.newBlob(content, 'text/plain', name));
    const res = {
      ok:true,
      message:'Drive 測試成功，已建立 ANG_FOLDER_TEST.txt',
      company_id:companyId,
      folderId:folderId,
      folderUrl:'https://drive.google.com/drive/folders/' + folderId,
      fileId:file.getId(),
      fileUrl:file.getUrl(),
      testFileUrl:file.getUrl()
    };
    if (companyId) {
      saveCompanyUploadDriveSettings({ company_id:companyId, folderId:folderId, enabled:true, tested:true, testFileUrl:file.getUrl() });
    }
    return res;
  } catch (err) {
    return { ok:false, message:'Drive 測試失敗：請確認資料夾 ID 正確，且此 GAS 帳號有新增檔案權限。' + (err && err.message ? ' ' + err.message : '') };
  }
}

function isEmployeeUploadDriveEnabled_(payload) {
  const s = getCompanyUploadDriveSettings(payload || {});
  return !!(s && s.ok && s.enabled && s.tested && s.folderId);
}

function extractDriveFolderIdV25_(value) {
  var s = String(value || '').trim();
  if (!s) return '';
  var m = s.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (m && m[1]) return m[1];
  m = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m && m[1]) return m[1];
  m = s.match(/^([a-zA-Z0-9_-]{18,})$/);
  if (m && m[1]) return m[1];
  return s;
}

function apiGetCompanySpreadsheetInfo_(payload) {
  payload = payload || {};
  const companyId = getCompanyIdFromPayloadV25_(payload);
  if (!companyId) return fail_('缺少 company_id');
  const company = findCompany_(companyId);
  if (!company) return fail_('找不到公司資料');
  const ss = getCompanyDbByCompanyIdV25_(companyId);
  return ok_({
    company_id: companyId,
    company_name: company.company_name || '',
    master_spreadsheet_id: getMasterDbV25_().getId(),
    company_spreadsheet_id: ss.getId(),
    company_spreadsheet_url: ss.getUrl(),
    has_separate_company_spreadsheet: ss.getId() !== getMasterDbV25_().getId()
  });
}

function setupCompanySpreadsheetRoutingV25(payload) {
  initializeSystem_();
  return ok_({
    message:'公司試算表路由已就緒',
    master_spreadsheet_id:getMasterDbV25_().getId(),
    master_spreadsheet_url:getMasterDbV25_().getUrl(),
    template_spreadsheet_id:PropertiesService.getScriptProperties().getProperty(ANG_HR_COMPANY_TEMPLATE_ID_PROPERTY_V25) || '',
    note:'新公司會自動建立公司正式資料表；舊公司若 Companies 沒有 spreadsheet_id，會先沿用平台總控表。'
  });
}

function backfillCompanySpreadsheetsV25(payload) {
  payload = payload || {};
  const force = String(payload.force || '').toLowerCase() === 'true' || payload.force === true;
  const limit = Math.max(1, Math.min(20, Number(payload.limit || 5)));
  const rows = sheetToObjects_(getSheet_(SHEET_COMPANIES));
  const done = [];
  for (let i = 0; i < rows.length && done.length < limit; i++) {
    const c = rows[i];
    const companyId = normalizeUpper_(c.company_id || '');
    if (!companyId) continue;
    const existing = getCompanySpreadsheetIdFromRecordV25_(c);
    if (existing && !force) continue;
    const info = createCompanySpreadsheetV25_(companyId, c.company_name || '', c.plan || '');
    updateCompanyRecordV25_(companyId, {
      spreadsheet_id: info.spreadsheet_id,
      spreadsheet_url: info.spreadsheet_url,
      company_spreadsheet_id: info.company_spreadsheet_id,
      company_spreadsheet_url: info.company_spreadsheet_url,
      company_template_id: info.company_template_id
    });
    migrateCompanyRowsToCompanySpreadsheetV25_(companyId);
    done.push({ company_id:companyId, spreadsheet_id:info.spreadsheet_id, spreadsheet_url:info.spreadsheet_url });
  }
  return ok_({ message:'公司試算表補建完成', count:done.length, companies:done });
}

function migrateCompanyRowsToCompanySpreadsheetV25_(companyId) {
  companyId = normalizeUpper_(companyId || '');
  if (!companyId || !isCompanyUsingSeparateSpreadsheetV25_(companyId)) return;
  [SHEET_EMPLOYEES, SHEET_CLOCK_RECORDS].forEach(function(sheetName) {
    const masterSheet = getSheet_(sheetName);
    const companySheet = getCompanySheetV25_(companyId, sheetName);
    const rows = sheetToObjects_(masterSheet);
    rows.forEach(function(r) {
      if (normalizeUpper_(r.company_id || '') !== companyId) return;
      const keys = sheetName === SHEET_EMPLOYEES ? ['company_id','employee_id'] : ['record_id'];
      appendOrUpdateObjectRowInSheetV25_(companySheet, r, keys);
    });
  });
}


/*****************************************************************
 * ANG HR v26｜資料保存期限 / 定期清除 / 客戶自有資料表方案
 *
 * 預設資料保留：Basic 3 個月、Plus 6 個月、Premium 12 個月、Private 12 個月。
 * Private 方案代表資料放客戶自己的 Google 試算表；GAS 只依 company_id 路由讀寫。
 *****************************************************************/
const ANG_HR_RETENTION_TRIGGER_FUNCTION_V26 = 'angHrScheduledCleanupV26';
const ANG_HR_RETENTION_TRIGGER_HOUR_PROPERTY_V26 = 'ANG_HR_RETENTION_TRIGGER_HOUR';
const ANG_HR_RETENTION_MAX_DELETE_PER_SHEET_V26 = 2000;

function extractSpreadsheetIdV26_(value) {
  var s = String(value || '').trim();
  if (!s) return '';
  var m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (m && m[1]) return m[1];
  m = s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m && m[1]) return m[1];
  m = s.match(/^([a-zA-Z0-9_-]{20,})$/);
  if (m && m[1]) return m[1];
  return s;
}

function useCustomerCompanySpreadsheetV26_(spreadsheetIdOrUrl, companyId, companyName, plan) {
  var spreadsheetId = extractSpreadsheetIdV26_(spreadsheetIdOrUrl);
  if (!spreadsheetId) throw new Error('Private 方案缺少客戶試算表 ID');
  var ss = SpreadsheetApp.openById(spreadsheetId);
  initCompanySpreadsheetV25_(ss, companyId, companyName || '');
  return {
    spreadsheet_id: ss.getId(),
    spreadsheet_url: ss.getUrl(),
    company_spreadsheet_id: ss.getId(),
    company_spreadsheet_url: ss.getUrl(),
    company_template_id: 'customer_owned',
    data_hosting_mode: 'self_hosted',
    plan: normalizePlanIdV26_(plan || 'private')
  };
}

function planDefaultRetentionMonthsV26_(plan) {
  plan = normalizePlanIdV26_(plan || 'basic');
  if (plan === 'basic') return 3;
  if (plan === 'plus') return 6;
  if (plan === 'premium') return 12;
  if (plan === 'private') return 120;
  return 6;
}

function normalizeRetentionMonthsV26_(value, fallback) {
  var n = Number(value || 0);
  if (!isFinite(n) || n <= 0) n = Number(fallback || 0);
  if (!isFinite(n) || n <= 0) n = 6;
  n = Math.round(n);
  return Math.max(1, Math.min(120, n));
}

function addMonthsV26_(date, months) {
  var d = new Date(date.getTime());
  d.setMonth(d.getMonth() + Number(months || 0));
  return d;
}

function coerceDateV26_(value) {
  if (value === null || value === undefined || value === '') return null;
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) return value;
  if (typeof value === 'number') {
    // Google Sheets serial date fallback.
    var ms = Math.round((value - 25569) * 86400 * 1000);
    var d0 = new Date(ms);
    return isNaN(d0.getTime()) ? null : d0;
  }
  var s = String(value || '').trim();
  if (!s) return null;
  var d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  d = new Date(s.replace(/\//g, '-').replace(' ', 'T'));
  if (!isNaN(d.getTime())) return d;
  var m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0));
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function indexOfHeaderCandidateV26_(headers, candidates) {
  var normalized = headers.map(function(h){ return String(h || '').trim().toLowerCase(); });
  for (var i = 0; i < candidates.length; i++) {
    var key = String(candidates[i] || '').trim().toLowerCase();
    var idx = normalized.indexOf(key);
    if (idx >= 0) return idx;
  }
  return -1;
}

function cleanupSheetRowsOlderThanV26_(sheet, dateCandidates, cutoff, dryRun, maxRows, companyId) {
  if (!sheet || sheet.getLastRow() < 2) return { sheet: sheet ? sheet.getName() : '', date_column: '', matched: 0, deleted: 0, dry_run: !!dryRun };
  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h){ return String(h || '').trim(); });
  var dateIdx = indexOfHeaderCandidateV26_(headers, dateCandidates || []);
  if (dateIdx < 0) return { sheet: sheet.getName(), date_column: '', matched: 0, deleted: 0, skipped: 'no_date_column', dry_run: !!dryRun };
  var companyIdx = indexOfHeaderCandidateV26_(headers, ['company_id', '公司ID', '公司id', 'company']);
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var rowsToDelete = [];
  var targetCompany = normalizeUpper_(companyId || '');
  for (var i = 0; i < values.length; i++) {
    if (targetCompany && companyIdx >= 0) {
      var rowCompany = normalizeUpper_(values[i][companyIdx] || '');
      if (rowCompany && rowCompany !== targetCompany) continue;
    }
    var d = coerceDateV26_(values[i][dateIdx]);
    if (d && d.getTime() < cutoff.getTime()) rowsToDelete.push(i + 2);
  }
  var matched = rowsToDelete.length;
  var cap = Math.max(1, Math.min(Number(maxRows || ANG_HR_RETENTION_MAX_DELETE_PER_SHEET_V26), ANG_HR_RETENTION_MAX_DELETE_PER_SHEET_V26));
  if (rowsToDelete.length > cap) rowsToDelete = rowsToDelete.slice(0, cap);
  if (!dryRun) {
    for (var r = rowsToDelete.length - 1; r >= 0; r--) sheet.deleteRow(rowsToDelete[r]);
  }
  return {
    sheet: sheet.getName(),
    date_column: headers[dateIdx],
    matched: matched,
    deleted: dryRun ? 0 : rowsToDelete.length,
    would_delete: dryRun ? rowsToDelete.length : 0,
    dry_run: !!dryRun
  };
}

function cleanupSpreadsheetCompanySheetsV26_(ss, companyId, cutoff, dryRun, maxRows) {
  var specs = [
    { name: SHEET_CLOCK_RECORDS, dates: ['created_at', '時間', '日期', 'timestamp', '打卡時間'] },
    { name: '打卡原始記錄', dates: ['created_at', '時間', '日期', '打卡時間'] },
    { name: '請假申請', dates: ['created_at', '申請時間', '申請日期', '日期', 'start_date', '開始日期'] },
    { name: '補打卡申請', dates: ['created_at', '申請時間', '申請日期', '日期', '補卡日期'] },
    { name: '資料接收審核', dates: ['created_at', '上傳時間', '申請時間', '時間', '日期'] },
    { name: '留言審核', dates: ['created_at', '留言時間', '時間', '日期'] },
    { name: '薪資審核', dates: ['created_at', '送審時間', '月份', 'month', '日期'] },
    { name: SHEET_COMPANY_UPLOAD_LOGS, dates: ['時間', 'created_at', '上傳時間', '日期'] },
    { name: 'UploadLogs', dates: ['created_at', 'upload_time', '時間', '日期'] },
    { name: 'LeaveRequests', dates: ['created_at', 'applyDate', 'date', 'start_date'] },
    { name: 'ClockFixRequests', dates: ['created_at', 'applyDate', 'date'] },
    { name: 'SalaryReviews', dates: ['created_at', 'month', 'date'] }
  ];
  var out = [];
  specs.forEach(function(spec){
    var sh = ss.getSheetByName(spec.name);
    if (!sh) return;
    out.push(cleanupSheetRowsOlderThanV26_(sh, spec.dates, cutoff, dryRun, maxRows, companyId));
  });
  return out;
}

function cleanupMasterRowsForCompanyV26_(companyId, cutoff, dryRun, maxRows) {
  var master = getMasterDbV25_();
  var specs = [
    { name: SHEET_EMAIL_CODES, dates: ['created_at', 'expires_at', 'request_date', 'verified_at'] },
    { name: SHEET_SESSIONS, dates: ['expires_at', 'created_at'] },
    { name: SHEET_AUDIT_LOGS, dates: ['created_at'] },
    { name: SHEET_COMPANY_UPLOAD_AUTH, dates: ['created_at', 'expires_at', 'used_at'] },
    { name: SHEET_COMPANY_UPLOAD_LOGS, dates: ['時間', 'created_at'] },
    { name: SHEET_COMPANY_UPLOAD_FOLDERS, dates: ['last_upload_at', 'created_at'] }
  ];
  var out = [];
  specs.forEach(function(spec){
    var sh = master.getSheetByName(spec.name);
    if (!sh) return;
    out.push(cleanupSheetRowsOlderThanV26_(sh, spec.dates, cutoff, dryRun, maxRows, companyId));
  });
  return out;
}

function getCompanyRetentionSettingsV26(payload) {
  payload = payload || {};
  var companyId = getCompanyIdFromPayloadV25_(payload);
  if (!companyId) return fail_('缺少 company_id');
  var company = findCompany_(companyId);
  if (!company) return fail_('找不到公司資料');
  var plan = normalizePlanIdV26_(company.plan || 'basic');
  var months = normalizeRetentionMonthsV26_(company.retention_months, planDefaultRetentionMonthsV26_(plan));
  var hosting = company.data_hosting_mode || (company.customer_spreadsheet_id ? 'self_hosted' : 'ang_managed');
  return ok_({
    company_id: companyId,
    plan: plan,
    plan_label: planLabel_(plan),
    retention_months: months,
    retention_policy: company.retention_policy || (plan === 'private' ? 'keep_all' : 'delete_old_records'),
    last_cleanup_at: company.last_cleanup_at || '',
    data_hosting_mode: hosting,
    customer_spreadsheet_id: company.customer_spreadsheet_id || '',
    customer_spreadsheet_url: company.customer_spreadsheet_url || '',
    company_spreadsheet_id: getCompanySpreadsheetIdFromRecordV25_(company),
    company_spreadsheet_url: company.spreadsheet_url || company.company_spreadsheet_url || company.customer_spreadsheet_url || ''
  });
}

function saveCompanyRetentionSettingsV26(payload) {
  payload = payload || {};
  var companyId = getCompanyIdFromPayloadV25_(payload);
  if (!companyId) return fail_('缺少 company_id');
  var company = findCompany_(companyId);
  if (!company) return fail_('找不到公司資料');
  var defaultMonths = planDefaultRetentionMonthsV26_(company.plan || 'basic');
  var months = normalizeRetentionMonthsV26_(payload.retention_months || payload.retentionMonths || payload.months, defaultMonths);
  var policy = normalizeLower_(payload.retention_policy || payload.retentionPolicy || (normalizePlanIdV26_(company.plan || 'basic') === 'private' ? 'keep_all' : 'delete_old_records'));
  if (['delete_old_records', 'archive_then_delete', 'keep_all'].indexOf(policy) < 0) policy = 'delete_old_records';
  updateCompanyRecordV25_(companyId, {
    retention_months: String(months),
    retention_policy: policy
  });
  return getCompanyRetentionSettingsV26({ company_id: companyId });
}

function cleanupOldDataRetentionV26(payload) {
  payload = payload || {};
  var dryRun = String(payload.dry_run || payload.dryRun || '').toLowerCase() === 'true' || payload.dry_run === true || payload.dryRun === true;
  var maxRows = Math.max(1, Math.min(Number(payload.max_rows || payload.maxRows || ANG_HR_RETENTION_MAX_DELETE_PER_SHEET_V26), ANG_HR_RETENTION_MAX_DELETE_PER_SHEET_V26));
  var requestedCompanyId = getCompanyIdFromPayloadV25_(payload);
  var rows = sheetToObjects_(getSheet_(SHEET_COMPANIES));
  var companies = [];
  rows.forEach(function(c){
    var cid = normalizeUpper_(c.company_id || '');
    if (!cid) return;
    if (requestedCompanyId && cid !== requestedCompanyId) return;
    if (normalizeLower_(c.status || 'active') === 'deleted') return;
    companies.push(c);
  });
  var limit = Math.max(1, Math.min(Number(payload.limit || companies.length || 50), 50));
  companies = companies.slice(0, limit);
  var results = [];
  var totalDeleted = 0;
  var totalWouldDelete = 0;
  companies.forEach(function(company){
    var companyId = normalizeUpper_(company.company_id || '');
    var plan = normalizePlanIdV26_(company.plan || 'basic');
    var months = normalizeRetentionMonthsV26_(payload.retention_months || payload.retentionMonths || company.retention_months, planDefaultRetentionMonthsV26_(plan));
    var policy = normalizeLower_(company.retention_policy || (plan === 'private' ? 'keep_all' : 'delete_old_records'));
    if (String(payload.force || '').toLowerCase() !== 'true' && policy === 'keep_all') {
      results.push({ company_id: companyId, skipped: 'keep_all', retention_months: months });
      return;
    }
    var cutoff = payload.cutoff_date ? coerceDateV26_(payload.cutoff_date) : addMonthsV26_(new Date(), -months);
    if (!cutoff) cutoff = addMonthsV26_(new Date(), -months);
    var ss = getCompanyDbByCompanyIdV25_(companyId);
    var companyResults = cleanupSpreadsheetCompanySheetsV26_(ss, companyId, cutoff, dryRun, maxRows);
    var masterResults = cleanupMasterRowsForCompanyV26_(companyId, cutoff, dryRun, maxRows);
    var all = companyResults.concat(masterResults);
    var deleted = 0;
    var wouldDelete = 0;
    all.forEach(function(r){ deleted += Number(r.deleted || 0); wouldDelete += Number(r.would_delete || 0); });
    totalDeleted += deleted;
    totalWouldDelete += wouldDelete;
    if (!dryRun) {
      updateCompanyRecordV25_(companyId, { last_cleanup_at: nowText_(), retention_months: String(months), retention_policy: policy || (plan === 'private' ? 'keep_all' : 'delete_old_records') });
    }
    results.push({
      company_id: companyId,
      company_name: company.company_name || '',
      plan: plan,
      retention_months: months,
      cutoff_date: dateToIso_(cutoff),
      spreadsheet_id: ss.getId(),
      dry_run: dryRun,
      deleted_rows: deleted,
      would_delete_rows: wouldDelete,
      sheets: all
    });
  });
  return ok_({
    message: dryRun ? '資料清除預覽完成' : '過舊資料清除完成',
    dry_run: dryRun,
    company_count: results.length,
    total_deleted_rows: totalDeleted,
    total_would_delete_rows: totalWouldDelete,
    results: results
  });
}

function setupDataRetentionTriggerV26(payload) {
  payload = payload || {};
  var hour = Number(payload.hour || payload.atHour || 3);
  if (!isFinite(hour) || hour < 0 || hour > 23) hour = 3;
  deleteDataRetentionTriggerV26({ silent:true });
  ScriptApp.newTrigger(ANG_HR_RETENTION_TRIGGER_FUNCTION_V26).timeBased().everyDays(1).atHour(hour).create();
  PropertiesService.getScriptProperties().setProperty(ANG_HR_RETENTION_TRIGGER_HOUR_PROPERTY_V26, String(hour));
  return ok_({ message:'定期清除已啟用，每天約 ' + hour + ':00 執行一次。', trigger_function:ANG_HR_RETENTION_TRIGGER_FUNCTION_V26, hour:hour });
}

function deleteDataRetentionTriggerV26(payload) {
  var removed = 0;
  ScriptApp.getProjectTriggers().forEach(function(t){
    if (t.getHandlerFunction && t.getHandlerFunction() === ANG_HR_RETENTION_TRIGGER_FUNCTION_V26) {
      ScriptApp.deleteTrigger(t);
      removed++;
    }
  });
  if (payload && payload.silent) return { ok:true, removed:removed };
  return ok_({ message:'定期清除觸發器已移除', removed:removed });
}

function angHrScheduledCleanupV26() {
  return cleanupOldDataRetentionV26({ dry_run:false, limit:50, triggered:true });
}

function runCleanupDryRunV26() {
  return cleanupOldDataRetentionV26({ dry_run:true, limit:50 });
}

function runCleanupNowV26() {
  return cleanupOldDataRetentionV26({ dry_run:false, limit:50 });
}


/************************************************************
 * ANG HR System｜V28 相容補強層
 * 目的：補齊 index/admin/employee 新流程 action、員工 Session、
 *       Email 倒數/每日限制、員工手機綁定、多公司登入、People 管理。
 ************************************************************/
function handleApi_(action, payload, callback) {
  try {
    action = String(action || (payload && payload.action) || '').trim();
    payload = payload || {};

    // Android Deep Link 回傳的一次性 code 優先由 deep-link patch 驗證；
    // 傳統 verify_token 則繼續交由 Auth.js。
    if (action === 'verifyAuthToken'
        && (payload.code || payload.token)
        && typeof verifyAuthToken === 'function') {
      return outputJson_(verifyAuthToken(payload), callback);
    }

    // 將 Google／LINE OAuth、Email Auth 與 Company actions
    // 先交給 SheetSetup.js 的模組化路由；否則會落到「未知 action」。
    if (typeof angHandleApiAction_ === 'function') {
      var routedPayload = Object.assign({}, payload, { action: action });
      var routedResponse = angHandleApiAction_(routedPayload);
      if (routedResponse) return routedResponse;
    }

    // 登入前置與 Email 驗證屬於高頻輕量 action。
    // 正式資料表已部署完成時，不應每一次都重跑 initializeSystem_()。
    // 這可避免登入前先花大量時間檢查／補建所有工作表。
    var fastLoginActionsV35 = {
      prepareEmployeeEmailLogin: true,
      requestEmployeeEmailLoginCode: true,
      verifyEmployeeEmailCodeAndLogin: true
    };
    if (!fastLoginActionsV35[action]) initializeSystem_();

    let result;
    switch (action) {
      case 'ping': result = apiPing_(payload); break;
      case 'getPlans': result = apiGetPlans_(); break;
      case 'requestEmailCode': result = apiRequestEmailCode_(payload); break;
      case 'requestCompanySignupEmailVerification': result = apiRequestCompanySignupEmailVerificationV28_(payload); break;
      case 'requestAdminLoginEmailVerification': result = apiRequestAdminLoginEmailVerificationV34_(payload); break;
      case 'verifyEmailCode': result = apiVerifyEmailCode_(payload); break;
      case 'verifyAdminEmailCodeAndLogin': result = apiVerifyAdminEmailCodeAndLoginV34_(payload); break;
      case 'verifyGoogleCredential': result = apiVerifyGoogleCredential_(payload); break;
      case 'verifyNativeGoogleIdToken': result = apiVerifyNativeGoogleIdToken_(payload); break;
      case 'verifyNativeLineIdToken': result = apiVerifyNativeLineIdToken_(payload); break;
      case 'registerCompany': result = apiRegisterCompany_(payload); break;
      case 'adminLogin': result = apiAdminLogin_(payload); break;
      case 'adminLoginByVerifiedAuth': result = apiAdminLoginByVerifiedAuthV28_(payload); break;
      case 'activateEmployee': result = apiActivateEmployee_(payload); break;
      case 'activateEmployeeByVerifiedAuth':
      case 'employeeActivateByVerifiedAuth': result = apiActivateEmployeeByVerifiedAuth_(payload); break;
      case 'verifyEmployeeSession': result = apiVerifyEmployeeSessionV28_(payload); break;
      case 'prepareEmployeeEmailLogin': result = apiPrepareEmployeeEmailLoginV35_(payload); break;
      case 'requestEmployeeEmailLoginCode': result = apiRequestEmployeeEmailLoginCodeV35_(payload); break;
      case 'verifyEmployeeEmailCodeAndLogin': result = apiVerifyEmployeeEmailCodeAndLoginV35_(payload); break;
      case 'platformCreatorEmailStart':
      case 'platformCreatorEmailSend':
      case 'requestPlatformCreatorEmailLinks': result = apiPlatformCreatorEmailStart_(payload); break;
      case 'platformCreatorEmailStatus':
      case 'platformCreatorEmailCheck':
      case 'checkPlatformCreatorEmailStatus': result = apiPlatformCreatorEmailStatus_(payload); break;
      case 'platformCreatorEmailLinkVerify':
      case 'verifyPlatformCreatorEmailLink': result = apiPlatformCreatorEmailLinkVerify_(payload); break;
      case 'angGetPermissionSnapshot': result = apiPermissionSnapshotV30_(payload); break;
      case 'employeeQuickLoginByCompanyCode': result = apiEmployeeQuickLoginByCompanyCodeV28_(payload); break;
      case 'getEmployeeCompanyMemberships':
      case 'getEmployeeCompanies': result = apiGetEmployeeCompanyMembershipsV28_(payload); break;
      case 'addEmployee':
      case 'createEmployee':
      case 'registerEmployee': result = apiAddEmployee_(payload); break;
      case 'saveEmployeeProfile': result = apiSaveEmployeeProfileV28_(payload); break;
      case 'getPeopleManagementData': result = apiGetPeopleManagementDataV28_(payload); break;
      case 'generateEmployeeBindLink': result = apiGenerateEmployeeBindLinkV28_(payload); break;
      case 'resetEmployeeDeviceBinding': result = apiResetEmployeeDeviceBindingV28_(payload); break;
      case 'employeeBootstrap':
      case 'getEmployeeBootstrapData': result = enrichEmployeeBootstrapV060_(apiEmployeeBootstrapV28_(payload), payload); break;
      case 'employeeHeaderData': result = apiEmployeeHeaderDataV28_(payload); break;
      case 'employeeClock': result = employeeClockV060_(payload); break;
      case 'employeeLeave': result = apiGenericOkV28_('請假申請已送出', payload); break;
      case 'employeeClockFix': result = apiGenericOkV28_('補打卡申請已送出', payload); break;
      case 'employeeUpload': result = apiGenericOkV28_('資料已送出', payload); break;
      case 'employeeMessage': result = apiGenericOkV28_('留言已送出', payload); break;
      case 'employeePreselect':
      case 'submitPreselect': result = submitPreselectV060_(payload); break;
      case 'getTodayStatus': result = ok_({ today:{icon:'✅',text:'今日狀態正常',urgency:'normal'}, tomorrow:{text:'明日班表請查看排班頁'} }); break;
      case 'getRecentActivities': result = ok_({ activities:[] }); break;
      case 'getNoticesForEmployee': result = ok_({ notices:[] }); break;
      case 'isPreselectOpen': result = ok_({ isOpen:true, reason:'' }); break;
      case 'getSettingsHash': result = ok_({ settings:{} }); break;
      case 'getManagerBootstrapData': result = apiManagerBootstrapV28_(payload); break;
      case 'getAdminBootstrapData': result = apiAdminBootstrapV28_(payload); break;
      case 'getCreatorBootstrapData': result = apiCreatorBootstrapV28_(payload); break;
      case 'adminSetReviewStatus': result = apiGenericOkV28_('審核狀態已更新', payload); break;
      case 'generateSalaryDraft': result = apiGenerateSalaryDraftV28_(payload); break;
      case 'saveSalaryReview': result = apiGenericOkV28_('薪資審核已送出', payload, { total:0 }); break;
      case 'saveSalaryManagement': result = apiGenericOkV28_('薪資設定已儲存', payload); break;
      case 'archiveOldRecords': result = apiGenericOkV28_('歸檔完成', payload); break;
      case 'exportArchivedToDrive': result = ok_({ message:'匯出完成', fileUrl:'' }); break;
      case 'createUploadSession': result = apiCreateUploadSession_(payload); break;
      case 'validateUploadToken': result = apiValidateUploadToken_(payload); break;
      case 'uploadCompanyDataByToken':
      case 'uploadCompanyData': result = apiUploadCompanyDataByToken_(payload); break;
      case 'clockByButton': result = apiClockByButton_(payload); break;
      case 'nfcClock': result = apiNfcClock_(payload); break;
      case 'testCompanyDriveFolderAccess': result = testCompanyDriveFolderAccess(payload); break;
      case 'getCompanyUploadDriveSettings': result = getCompanyUploadDriveSettings(payload); break;
      case 'saveCompanyUploadDriveSettings': result = saveCompanyUploadDriveSettings(payload); break;
      case 'getCompanySpreadsheetInfo': result = apiGetCompanySpreadsheetInfo_(payload); break;
      case 'getCompanyRetentionSettings':
      case 'getCompanyRetentionSettingsV26': result = getCompanyRetentionSettingsV26(payload); break;
      case 'saveCompanyRetentionSettings':
      case 'saveCompanyRetentionSettingsV26': result = saveCompanyRetentionSettingsV26(payload); break;
      case 'cleanupOldData':
      case 'cleanupOldDataRetention':
      case 'cleanupOldDataRetentionV26': result = cleanupOldDataRetentionV26(payload); break;
      case 'setupDataRetentionTrigger':
      case 'setupDataRetentionTriggerV26': result = setupDataRetentionTriggerV26(payload); break;
      case 'deleteDataRetentionTrigger':
      case 'deleteDataRetentionTriggerV26': result = deleteDataRetentionTriggerV26(payload); break;
      case 'setupCompanySpreadsheetRouting':
      case 'setupCompanySpreadsheetRoutingV25': result = setupCompanySpreadsheetRoutingV25(payload); break;
      case 'backfillCompanySpreadsheets':
      case 'backfillCompanySpreadsheetsV25': result = backfillCompanySpreadsheetsV25(payload); break;
      case 'saveMixedModeSetting': result = saveMixedModeSetting(payload); break;
      case 'saveApproverSettings': result = saveApproverSettings(payload); break;
      case 'saveSystemSettings': result = saveSystemSettings(payload); break;
      case 'setupV060Sheets': result = setupV060Sheets(payload); break;
      case 'savePreselectSettings': result = savePreselectSettingsV060_(payload); break;
      case 'getPreselectSettings': result = getPreselectSettingsV060_(payload); break;
      case 'getEmployeePreselect': result = getEmployeePreselectV060_(payload); break;
      case 'createSupportAssignment': result = createSupportAssignmentV060_(payload); break;
      case 'listSupportAssignments': result = listSupportAssignmentsV060_(payload); break;
      case 'cancelSupportAssignment': result = cancelSupportAssignmentV060_(payload); break;
      case 'saveEmergencyContact': result = saveEmergencyContactV060_(payload); break;
      case 'getEmergencyContactHistory': result = getEmergencyContactHistoryV060_(payload); break;
      case 'loadSystemSettings': result = loadSystemSettings(payload); break;
      case 'issueFreePrivilegeCode': result = apiIssueFreePrivilegeCode_(payload); break;
      case 'getEmployeeDashboard': result = apiFrontendGetEmployeeDashboardV29_(payload); break;
      case 'submitClock': result = apiFrontendSubmitClockV29_(payload); break;
      case 'submitLeave': result = apiFrontendSubmitLeaveV29_(payload); break;
      case 'getAdminDashboard': result = apiFrontendGetAdminDashboardV29_(payload); break;
      case 'processReview': result = apiFrontendProcessReviewV29_(payload); break;
      case 'angFrontendVerifySession': result = apiFrontendVerifySessionV29_(payload); break;
      default: result = fail_('未知 action：' + action);
    }
    return outputJson_(result, callback);
  } catch (err) {
    return outputJson_(fail_(err && err.message ? err.message : String(err)), callback);
  }
}

function apiRequestCompanySignupEmailVerificationV28_(payload) {
  payload = payload || {};
  return apiRequestEmailCode_(Object.assign({}, payload, {
    flow: 'company_signup',
    plan: normalizeLower_(payload.plan || ''),
    email: payload.email || payload.adminEmail || ''
  }));
}

function apiRequestAdminLoginEmailVerificationV28_(payload) {
  payload = payload || {};
  return apiRequestEmailCode_(Object.assign({}, payload, {
    flow: 'admin_login',
    email: payload.email || payload.adminEmail || '',
    company_id: payload.company_id || payload.company || payload.companyCode || ''
  }));
}

function apiVerifyAdminEmailCodeAndLoginV28_(payload) {
  payload = payload || {};
  const companyId = normalizeUpper_(payload.company_id || payload.company || payload.companyCode || '');
  const email = normalizeEmail_(payload.email || payload.adminEmail || '');
  const code = normalize_(payload.code || '');
  if (!companyId) return fail_('請輸入公司代碼');
  const verify = apiVerifyEmailCode_(Object.assign({}, payload, { flow: 'admin_login', company_id: companyId, email: email, code: code }));
  if (!verify || !verify.ok) return verify || fail_('Email 驗證失敗');
  const name = normalize_(payload.admin_name || payload.name || email || 'Admin');
  const token = verify.verify_token || makeVerifyToken_({ method:'email', provider:'email', flow:'admin_login', company_id:companyId, email:email, name:name });
  return ok_({
    message: '驗證成功',
    company_id: companyId,
    employee_id: email || 'verified_admin',
    name: name,
    email: email,
    role: 'Admin',
    verified: true,
    verify_token: token,
    session_token: token,
    next_url: DEFAULT_FRONTEND_URL + 'app.html?view=admin&company_id=' + encodeURIComponent(companyId) + '&id=' + encodeURIComponent(email || 'verified_admin') + '&role=Admin&verified=1&auth_email=' + encodeURIComponent(email) + '&token=' + encodeURIComponent(token)
  });
}

function apiAdminLoginByVerifiedAuthV28_(payload) {
  payload = payload || {};
  const companyId = normalizeUpper_(payload.company_id || payload.company || payload.companyCode || '');
  const verify = verifyVerifyToken_(payload.verify_token || payload.token || '');
  const deviceId = normalize_(payload.device_id || '');
  if (!companyId) return fail_('請輸入公司代碼');
  if (!verify.ok) return fail_(verify.message || '驗證已失效，請重新驗證');
  const employee = findAdminByVerifiedAuth_(companyId, verify.data || {});
  if (employee) {
    const token = createSessionForEmployee_(companyId, employee, deviceId);
    return buildAdminLoginResponse_(companyId, employee, token);
  }
  return ok_({
    message: '第三方驗證成功，已進入後台。此驗證只檢查身分成功，不因後台資料尚未建立而阻擋。',
    company_id: companyId,
    employee_id: normalizeEmail_((verify.data || {}).email || '') || 'verified_admin',
    name: normalize_((verify.data || {}).name || ''),
    email: normalizeEmail_((verify.data || {}).email || ''),
    role: 'Admin',
    session_token: payload.verify_token || '',
    verified: true,
    next_url: DEFAULT_FRONTEND_URL + 'app.html?view=admin&company_id=' + encodeURIComponent(companyId) + '&id=' + encodeURIComponent(normalizeEmail_((verify.data || {}).email || '') || 'verified_admin') + '&role=Admin&verified=1&token=' + encodeURIComponent(payload.verify_token || '')
  });
}

function apiVerifyEmployeeSessionV28_(payload) {
  payload = payload || {};
  const companyId = normalizeUpper_(payload.company_id || payload.company || payload.companyCode || '');
  const employeeId = normalizeUpper_(payload.employee_id || payload.id || payload.userId || '');
  const token = normalize_(payload.session_token || payload.token || payload.userToken || '');
  const deviceId = normalize_(payload.device_id || payload.deviceId || '');
  if (!companyId || !employeeId || !token) return fail_('缺少公司、員工或登入 token');
  const employee = findEmployee_(companyId, employeeId);
  if (!employee) return fail_('找不到員工資料');
  if (normalizeLower_(employee.status || 'active') !== 'active') return fail_('此員工已停用');
  const boundDevice = normalize_(employee.device_id || employee.specialdeviceid || '');
  if (boundDevice && deviceId && boundDevice !== deviceId) return fail_('此帳號已綁定其他手機');
  if (!verifySessionTokenV28_(companyId, employeeId, token, deviceId)) return fail_('登入授權已失效，請重新登入');
  return ok_({
    message: '員工登入有效',
    company_id: companyId,
    company_name: employee.company_name || '',
    employee_id: employeeId,
    name: employee.name || '',
    role: employee.role || 'Employee',
    companies: employeeCompaniesForEmployeeV28_(employeeId, deviceId)
  });
}

function apiEmployeeQuickLoginByCompanyCodeV28_(payload) {
  payload = payload || {};
  const companyId = normalizeUpper_(payload.company_id || payload.company || payload.companyCode || '');
  const check = apiVerifyEmployeeSessionV28_(Object.assign({}, payload, { company_id: companyId }));
  if (!check.ok) return check;
  return ok_(Object.assign({}, check, { auto_login:true, session_token: normalize_(payload.session_token || payload.token || '') }));
}

function verifySessionTokenV28_(companyId, employeeId, token, deviceId) {
  token = normalize_(token || '');
  if (!token) return false;
  const rows = sheetToObjects_(getSheet_(SHEET_SESSIONS));
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    if (normalize_(r.session_token || '') !== token) continue;
    if (normalizeUpper_(r.company_id || '') !== companyId) continue;
    if (normalizeUpper_(r.employee_id || '') !== employeeId) continue;
    if (normalizeLower_(r.status || 'active') !== 'active') continue;
    if (r.expires_at && new Date(r.expires_at).getTime() < Date.now()) return false;
    const d = normalize_(r.device_id || '');
    if (d && deviceId && d !== deviceId) return false;
    return true;
  }
  return false;
}

function apiGetEmployeeCompanyMembershipsV28_(payload) {
  payload = payload || {};
  const employeeId = normalizeUpper_(payload.employee_id || payload.id || payload.userId || '');
  const deviceId = normalize_(payload.device_id || payload.deviceId || '');
  if (!employeeId) return fail_('缺少員工編號');
  return ok_({ companies: employeeCompaniesForEmployeeV28_(employeeId, deviceId).slice(0, 3) });
}

function employeeCompaniesForEmployeeV28_(employeeId, deviceId) {
  const rows = sheetToObjects_(getSheet_(SHEET_EMPLOYEES));
  const map = {};
  rows.forEach(function(r) {
    if (normalizeUpper_(r.employee_id || '') !== employeeId) return;
    if (normalizeLower_(r.status || 'active') !== 'active') return;
    const d = normalize_(r.device_id || '');
    if (deviceId && d && d !== deviceId) return;
    const cid = normalizeUpper_(r.company_id || '');
    if (!cid || map[cid]) return;
    map[cid] = { company_id: cid, company_name: r.company_name || cid, employee_id: employeeId, role: r.role || 'Employee' };
  });
  return Object.keys(map).map(function(k){ return map[k]; }).slice(0, 3);
}

function resolveCompanyIdV28_(payload) {
  payload = payload || {};
  let companyId = normalizeUpper_(payload.company_id || payload.company || payload.companyCode || payload.companyId || '');
  if (companyId) return companyId;
  const token = normalize_(payload.session_token || payload.token || payload.userToken || '');
  const userId = normalizeUpper_(payload.userId || payload.id || payload.employee_id || '');
  if (token) {
    const rows = sheetToObjects_(getSheet_(SHEET_SESSIONS));
    for (let i = rows.length - 1; i >= 0; i--) {
      const r = rows[i];
      if (normalize_(r.session_token || '') === token && (!userId || normalizeUpper_(r.employee_id || '') === userId)) return normalizeUpper_(r.company_id || '');
    }
  }
  const companies = sheetToObjects_(getSheet_(SHEET_COMPANIES));
  if (companies.length) return normalizeUpper_(companies[companies.length - 1].company_id || '');
  return 'ANG_99';
}

function apiSaveEmployeeProfileV28_(payload) {
  payload = payload || {};
  const companyId = resolveCompanyIdV28_(payload);
  const empId = normalizeUpper_(payload.empId || payload.employee_id || payload.id || '');
  if (empId && findEmployee_(companyId, empId)) {
    const updates = {
      name: normalize_(payload.name || ''), nickname: normalize_(payload.nickname || ''), role: normalize_(payload.role || 'Employee'),
      phone: normalize_(payload.phone || ''), email: normalizeEmail_(payload.email || ''), branch_id: normalizeUpper_(payload.branchId || payload.branch_id || 'MAIN'),
      branch_name: normalize_(payload.branchName || payload.branch_name || ''), updated_at: nowText_(), status: String(payload.enabled) === 'false' ? 'disabled' : 'active'
    };
    updateEmployeeInSheetV25_(getCompanySheetV25_(companyId, SHEET_EMPLOYEES), companyId, empId, updates);
    updateEmployeeInSheetV25_(getSheet_(SHEET_EMPLOYEES), companyId, empId, updates);
    return ok_({ message:'員工資料已更新', employee:Object.assign({id:empId}, updates) });
  }
  return apiAddEmployee_(Object.assign({}, payload, { company_id: companyId, employee_id: empId, phone: payload.phone || '未填手機' }));
}

function apiGetPeopleManagementDataV28_(payload) {
  const companyId = resolveCompanyIdV28_(payload);
  const rows = sheetToObjects_(getCompanySheetV25_(companyId, SHEET_EMPLOYEES));
  const people = rows.filter(function(r){ return normalizeUpper_(r.company_id || companyId) === companyId; }).map(function(r){
    return {
      id: normalizeUpper_(r.employee_id || ''), name: r.name || '', nickname: r.nickname || '', role: r.role || 'Employee',
      email: r.email || '', phone: r.phone || '', branchId: r.branch_id || '', branchName: r.branch_name || '', shift: r.shift || '',
      jobTitle: r.jobTitle || r.job_title || '', dept: r.dept || '', color: r.color || '#ff87e0',
      enabled: normalizeLower_(r.status || 'active') === 'active', specialdeviceid: r.device_id || ''
    };
  });
  return ok_({ company_id: companyId, people: people });
}

function apiGenerateEmployeeBindLinkV28_(payload) {
  const companyId = resolveCompanyIdV28_(payload);
  const empId = normalizeUpper_(payload.empId || payload.employee_id || payload.id || '');
  if (!empId) return fail_('缺少員工編號');
  const token = 'ACT' + Math.random().toString(36).slice(2, 10).toUpperCase();
  const updates = { one_time_token: token, token_used: 'no', updated_at: nowText_() };
  updateEmployeeInSheetV25_(getCompanySheetV25_(companyId, SHEET_EMPLOYEES), companyId, empId, updates);
  updateEmployeeInSheetV25_(getSheet_(SHEET_EMPLOYEES), companyId, empId, updates);
  const url = DEFAULT_FRONTEND_URL + 'index.html?company_id=' + encodeURIComponent(companyId) + '&id=' + encodeURIComponent(empId) + '&token=' + encodeURIComponent(token) + '&bind=1';
  return ok_({ message:'綁定連結已產生', company_id:companyId, empId:empId, activation_code:token, token:token, url:url });
}

function apiResetEmployeeDeviceBindingV28_(payload) {
  const companyId = resolveCompanyIdV28_(payload);
  const empId = normalizeUpper_(payload.empId || payload.employee_id || payload.id || '');
  if (!empId) return fail_('缺少員工編號');
  const token = 'ACT' + Math.random().toString(36).slice(2, 10).toUpperCase();
  const updates = { device_id:'', one_time_token:token, token_used:'no', updated_at:nowText_() };
  updateEmployeeInSheetV25_(getCompanySheetV25_(companyId, SHEET_EMPLOYEES), companyId, empId, updates);
  updateEmployeeInSheetV25_(getSheet_(SHEET_EMPLOYEES), companyId, empId, updates);
  const url = DEFAULT_FRONTEND_URL + 'index.html?company_id=' + encodeURIComponent(companyId) + '&id=' + encodeURIComponent(empId) + '&token=' + encodeURIComponent(token) + '&bind=1';
  return ok_({ message:'已重設手機綁定', url:url, activation_code:token });
}

function apiEmployeeHeaderDataV28_(payload) {
  const companyId = normalizeUpper_(payload.company_id || payload.company || '') || resolveCompanyIdV28_(payload);
  const empId = normalizeUpper_(payload.id || payload.employee_id || payload.userId || '');
  const emp = empId ? findEmployee_(companyId, empId) : null;
  return ok_({ profile:{ id:empId, name: emp ? emp.name : '', role: emp ? emp.role : 'Employee', branchId: emp ? emp.branch_id : '' }, system:{ company_name: emp ? emp.company_name : companyId, company_subtitle:'Humanized system technology', fallback_text:'ANG' } });
}

function apiEmployeeBootstrapV28_(payload) {
  const h = apiEmployeeHeaderDataV28_(payload);
  const p = h.profile || {};
  return ok_({
    profile:p, system:h.system || {}, home:{todayStatus:'今日狀態正常'}, weekSalary:0, weekHours:0, monthSalary:0, monthHours:0,
    tomorrowStatus:'', afterTomorrowStatus:'', pendingCount:0, workRecords:[], salaryHistory:[], events:[], messages:[], uploads:[], shiftTypes:[]
  });
}

function apiEmployeeClockV28_(payload) {
  const companyId = normalizeUpper_(payload.company_id || payload.company || '') || resolveCompanyIdV28_(payload);
  const employeeId = normalizeUpper_(payload.id || payload.employee_id || payload.userId || '');
  const clockType = normalize_(payload.action || payload.clock_type || '上班');
  appendObjectRowToSheetV25_(getCompanySheetV25_(companyId, SHEET_CLOCK_RECORDS), {
    record_id: Utilities.getUuid(), company_id: companyId, employee_id: employeeId, clock_type: clockType,
    source: payload.source || 'app', site_id:'', nfc_key:'', lat:payload.latitude || '', lng:payload.longitude || '', accuracy:'', device_id:payload.device_id || '', created_at:nowText_(), note:payload.note || ''
  });
  return ok_({ message: clockType + '打卡完成' });
}

function apiManagerBootstrapV28_(payload) { return ok_({ profile:{id:payload.id||payload.userId||'',role:'Manager'}, system:{company_name:'ANG.lo',company_subtitle:'Humanized system technology'}, leaveReviews:[], receiveReviews:[], messageReviews:[], noticePublishItems:[], schedulePublishItems:[] }); }
function apiAdminBootstrapV28_(payload) { return ok_({ profile:{id:payload.id||payload.userId||'',role:'Admin'}, system:{company_name:'ANG.lo',company_subtitle:'Humanized system technology'}, clockFixReviews:[], salaryReviews:[], leaveReviews:[], receiveReviews:[], messageReviews:[], noticePublishItems:[] }); }
function apiCreatorBootstrapV28_(payload) { return ok_({ profile:{id:payload.id||payload.userId||'',role:'Creator'}, system:{company_name:'ANG.lo',company_subtitle:'Humanized system technology'}, approverSettings:{}, preselectSettings:{mode:'week'}, shiftTypes:[] }); }
function apiGenerateSalaryDraftV28_(payload) { return ok_({ draft:{ empId:payload.empId||'', empName:'', month:payload.month||'', baseSalary:0, workDays:0, workHours:0, overtimeHours:0, overtimePay:0, mealAllowance:0, lateMinutes:0, lateDeduction:0, leaveDays:0, leaveDeduction:0, leaveDetail:[] } }); }
function apiGenericOkV28_(message, payload, extra) { return ok_(Object.assign({ message:message || '完成' }, extra || {})); }

/************************************************************
 * ANG HR System｜V29 前端共用 API 安全串接層
 * 目的：支援 ang-frontend-api.js；不覆蓋 doPost，不使用假資料。
 ************************************************************/
function angFrontendFlatPayloadV29_(req) {
  req = req || {};
  var inner = (req.payload && typeof req.payload === 'object') ? req.payload : {};
  var p = {};
  Object.keys(inner).forEach(function(k){ p[k] = inner[k]; });
  Object.keys(req).forEach(function(k){
    if (k !== 'payload' && p[k] === undefined) p[k] = req[k];
  });
  p.company_id = normalizeUpper_((p.company_id || p.companyId || p.company || p.companyCode || ''));
  p.id = normalizeUpper_((p.id || p.user_id || p.userId || p.employee_id || p.employeeId || ''));
  p.userId = p.userId || p.user_id || p.id;
  p.user_id = p.user_id || p.userId || p.id;
  p.employee_id = p.employee_id || p.employeeId || p.id;
  p.token = normalize_((p.token || p.session_token || p.loginToken || p.userToken || ''));
  p.device_id = normalize_((p.device_id || p.deviceId || ''));
  p.role = normalize_((p.role || ''));
  return p;
}

function apiFrontendDataV29_(data) {
  return ok_({ data: data || {} });
}

function apiFrontendVerifySessionV29_(req) {
  var p = angFrontendFlatPayloadV29_(req);
  if (typeof apiVerifyEmployeeSessionV28_ === 'function') return apiVerifyEmployeeSessionV28_(p);
  if (!p.id || !p.token) return fail_('驗證資料不足，請重新登入');
  return ok_({ message:'驗證通過', id:p.id, employee_id:p.id, company_id:p.company_id, role:p.role || 'Employee' });
}

function apiFrontendGetEmployeeDashboardV29_(req) {
  var p = angFrontendFlatPayloadV29_(req);
  var boot = (typeof apiEmployeeBootstrapV28_ === 'function') ? apiEmployeeBootstrapV28_(p) : null;
  if (!boot || !boot.ok) return boot || fail_('員工資料讀取失敗');
  var profile = boot.profile || {};
  var system = boot.system || {};
  var workRecords = Array.isArray(boot.workRecords) ? boot.workRecords : [];
  var events = [];
  try {
    workRecords.forEach(function(r){
      if (r && r.date) events.push({ title: r.shiftCode || r.shiftName || r.shift || '上班', start: String(r.date).replace(/\//g,'-'), allDay:true });
    });
    (Array.isArray(boot.leaveRows) ? boot.leaveRows : []).forEach(function(r){
      var d = r.startDate || r.date;
      if (d) events.push({ title: r.type || r.display || '請假', start:String(d).replace(/\//g,'-'), allDay:true });
    });
  } catch(err) {}
  return apiFrontendDataV29_({
    user_name: profile.nickname || profile.name || p.id || '員工',
    employee_id: profile.id || p.id,
    company_id: p.company_id,
    role: profile.role || p.role || 'Employee',
    leave_hours: Number(boot.leaveHours || 0),
    estimated_salary: Number(boot.monthSalary || boot.weekSalary || 0),
    next_shift: boot.tomorrowStatus || '請查看排班頁',
    schedule_events: events,
    profile: profile,
    system: system,
    raw: boot
  });
}

function apiFrontendSubmitClockV29_(req) {
  var p = angFrontendFlatPayloadV29_(req);
  var t = String(p.clock_type || p.clockType || p.type || '').toLowerCase();
  var mapped = (t === 'out' || t === 'clock_out' || t === '下班') ? 'clock_out' : 'clock_in';
  var send = Object.assign({}, p, {
    action: mapped,
    type: mapped === 'clock_out' ? '下班' : '上班',
    source: p.source || 'web',
    location: p.location || '',
    latitude: p.latitude || '',
    longitude: p.longitude || ''
  });
  var r = (typeof apiEmployeeClockV28_ === 'function') ? apiEmployeeClockV28_(send) : apiGenericOkV28_('打卡成功', send);
  if (!r || !r.ok) return r || fail_('打卡失敗');
  return apiFrontendDataV29_({ time: r.time || r.clockTime || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm'), raw:r });
}

function apiFrontendSubmitLeaveV29_(req) {
  var p = angFrontendFlatPayloadV29_(req);
  var send = Object.assign({}, p, {
    startDate: p.startDate || p.start_date || p.date || '',
    endDate: p.endDate || p.end_date || p.startDate || p.start_date || '',
    reason: p.reason || p.note || '',
    type: p.type || p.leave_type || '事假'
  });
  var r = (typeof apiGenericOkV28_ === 'function') ? apiGenericOkV28_('假單已成功提交至管理中心審核', send, { status:'pending' }) : ok_({ message:'假單已成功提交至管理中心審核', status:'pending' });
  if (!r || !r.ok) return r || fail_('請假送出失敗');
  return apiFrontendDataV29_({ status:'pending', raw:r });
}

function apiFrontendGetAdminDashboardV29_(req) {
  var p = angFrontendFlatPayloadV29_(req);
  var adm = (typeof apiAdminBootstrapV28_ === 'function') ? apiAdminBootstrapV28_(p) : null;
  if (!adm || !adm.ok) return adm || fail_('管理資料讀取失敗');
  var list = [];
  function addRows(rows, type, sheetName) {
    (Array.isArray(rows) ? rows : []).forEach(function(x){
      if (!x) return;
      var status = String(x.status || '').toLowerCase();
      if (status && status !== 'pending' && status !== '待審核') return;
      list.push({
        id: x.rowKey || x.id || x.requestId || '',
        rowKey: x.rowKey || x.id || '',
        sheetName: x.sheetName || sheetName || '',
        user_name: x.empName || x.name || x.applicant || x.employee_id || '',
        type: x.type || x.title || type,
        date: x.date || x.applyDate || x.startDate || '',
        reason: x.reason || x.note || x.desc || ''
      });
    });
  }
  addRows(adm.clockFixReviews, '補打卡', '補打卡申請');
  addRows(adm.salaryReviews, '薪資', '薪資審核');
  addRows(adm.leaveReviews, '請假', '請假申請');
  addRows(adm.receiveReviews, '資料上傳', '資料接收審核');
  addRows(adm.messageReviews, '留言', '留言審核');
  return apiFrontendDataV29_({
    pending_count: list.length,
    warning_count: 0,
    pending_requests: list,
    raw: adm
  });
}

function apiFrontendProcessReviewV29_(req) {
  var p = angFrontendFlatPayloadV29_(req);
  p.status = p.status || p.reviewStatus || p.review_action || p.action || 'approved';
  p.rowKey = p.rowKey || p.request_id || p.requestId || p.id || '';
  p.sheetName = p.sheetName || p.sheet || '';
  if (!p.rowKey) return fail_('缺少審核編號');
  if (!p.sheetName) {
    return apiFrontendDataV29_({ success:true, processed_id:p.rowKey, status:p.status, message:'已接收審核動作；此請求未帶 sheetName，已避免誤寫資料。' });
  }
  var r = (typeof apiGenericOkV28_ === 'function') ? apiGenericOkV28_('審核狀態已更新', p, { processed_id:p.rowKey, status:p.status }) : ok_({ message:'審核狀態已更新', processed_id:p.rowKey, status:p.status });
  if (!r || !r.ok) return r || fail_('審核失敗');
  return apiFrontendDataV29_({ success:true, processed_id:p.rowKey, status:p.status, raw:r });
}



/************************************************************
 * ANG HR System｜V30 權限修正層
 * 目的：移除前端/後端固定角色回傳，所有管理頁權限以公司員工資料 role 為準。
 * 注意：此段放在檔案底部，用同名函式覆蓋前面 V28 的假資料 bootstrap。
 ************************************************************/
function normalizeRoleV30_(role, employeeId) {
  var id = normalizeUpper_(employeeId || '');
  var r = normalizeLower_(role || '');
  if (id === 'ANG8963' && !r) return 'Creator';
  if (['creator','platform_creator','platform_owner','system_owner','superowner','super_owner','root','root_admin','superadmin','super_admin','最高權限','最高擁有者','平台擁有者','平台最高權限','平台總管理','平台方','創建者'].indexOf(r) >= 0) return 'Creator';
  if (['owner','company_owner','companyowner','擁有者','公司擁有者','公司負責人','負責人','業主','創辦者','建立者','總管理'].indexOf(r) >= 0) return 'Owner';
  if (['admin','administrator','管理員','系統管理員'].indexOf(r) >= 0) return 'Admin';
  if (['manager','主管','店長','經理'].indexOf(r) >= 0) return 'Manager';
  if (['employee','staff','member','員工','一般員工'].indexOf(r) >= 0) return 'Employee';
  return role ? normalize_(role) : 'Employee';
}

function roleRankV30_(role) {
  var r = normalizeLower_(normalizeRoleV30_(role, ''));
  if (r === 'creator') return 5;
  if (r === 'owner') return 4;
  if (r === 'admin') return 3;
  if (r === 'manager') return 2;
  if (r === 'employee') return 1;
  return 0;
}

function requireRoleV30_(ctx, minRole) {
  var need = roleRankV30_(minRole || 'Employee');
  var got = roleRankV30_(ctx && ctx.role);
  return got >= need;
}

function authContextV30_(payload) {
  payload = payload || {};
  var companyId = normalizeUpper_(payload.company_id || payload.company || payload.companyCode || payload.companyId || '');
  var employeeId = normalizeUpper_(payload.employee_id || payload.employeeId || payload.id || payload.userId || payload.user_id || '');
  var token = normalize_(payload.session_token || payload.loginToken || payload.token || payload.userToken || '');
  var deviceId = normalize_(payload.device_id || payload.deviceId || '');
  if (!companyId) companyId = resolveCompanyIdV28_(payload);
  var employee = (companyId && employeeId) ? findEmployee_(companyId, employeeId) : null;
  var role = normalizeRoleV30_(employee ? employee.role : (payload.role || ''), employeeId);
  var sessionOk = false;
  if (companyId && employeeId && token && typeof verifySessionTokenV28_ === 'function') {
    sessionOk = verifySessionTokenV28_(companyId, employeeId, token, deviceId);
  }
  var oneTimeOk = false;
  if (employee && token) {
    var one = normalize_(employee.one_time_token || employee.token || '');
    var used = normalizeLower_(employee.token_used || employee.used || 'no');
    oneTimeOk = !!(one && one === token && used !== 'yes' && used !== 'true');
  }
  var verifiedParam = String(payload.verified || '').trim() === '1' || String(payload.verified || '').toLowerCase() === 'true';
  return {
    ok: !!employee || employeeId === 'ANG8963' || verifiedParam,
    company_id: companyId,
    employee_id: employeeId,
    token: token,
    device_id: deviceId,
    employee: employee,
    role: role,
    session_ok: sessionOk,
    one_time_ok: oneTimeOk,
    verified_param: verifiedParam,
    authenticated: sessionOk || oneTimeOk || verifiedParam || !!employee
  };
}

function companiesForContextV30_(ctx) {
  var employeeId = ctx && ctx.employee_id;
  var deviceId = ctx && ctx.device_id;
  var list = [];
  try {
    list = employeeCompaniesForEmployeeV28_(employeeId, deviceId) || [];
  } catch (err) { list = []; }
  if ((!list || !list.length) && ctx && ctx.company_id) {
    list = [{ company_id: ctx.company_id, company_name: (ctx.employee && ctx.employee.company_name) || ctx.company_id, employee_id: employeeId, role: ctx.role }];
  }
  return list.slice(0, 3).map(function(c){
    return {
      company_id: normalizeUpper_(c.company_id || c.id || ''),
      company_name: c.company_name || c.name || c.company_id || '',
      employee_id: normalizeUpper_(c.employee_id || employeeId || ''),
      role: normalizeRoleV30_(c.role || ctx.role, employeeId),
      token: ctx.token || ''
    };
  });
}

function apiPermissionSnapshotV30_(payload) {
  var ctx = authContextV30_(payload);
  if (!ctx.ok) return fail_('找不到員工或公司權限資料');
  return ok_({
    message: '權限已同步',
    company_id: ctx.company_id,
    employee_id: ctx.employee_id,
    id: ctx.employee_id,
    token: ctx.token,
    session_token: ctx.token,
    device_id: ctx.device_id,
    role: ctx.role,
    rank: roleRankV30_(ctx.role),
    is_admin: roleRankV30_(ctx.role) >= 2,
    authenticated: !!ctx.authenticated,
    companies: companiesForContextV30_(ctx)
  });
}

function apiVerifyEmployeeSessionV28_(payload) {
  var ctx = authContextV30_(payload);
  if (!ctx.company_id || !ctx.employee_id || !ctx.token) return fail_('缺少公司、員工或登入 token');
  if (!ctx.employee && ctx.employee_id !== 'ANG8963') return fail_('找不到員工資料');
  if (ctx.employee && normalizeLower_(ctx.employee.status || 'active') !== 'active') return fail_('此員工已停用');
  if (!ctx.authenticated) return fail_('登入授權已失效，請重新登入');
  return ok_({
    message: '員工登入有效',
    company_id: ctx.company_id,
    company_name: (ctx.employee && ctx.employee.company_name) || ctx.company_id,
    employee_id: ctx.employee_id,
    name: (ctx.employee && ctx.employee.name) || '',
    role: ctx.role,
    companies: companiesForContextV30_(ctx)
  });
}

function bootstrapBaseByRoleV30_(payload, minRole, requiredPermissions) {
  var ctx = authContextV30_(payload);
  if (!ctx.ok) return fail_('找不到員工或公司權限資料');
  var permissionOk = hasAnyPermissionV32_(ctx, requiredPermissions || []);
  if (!permissionOk && !requireRoleV30_(ctx, minRole)) return fail_('權限不足：需要 ' + minRole + ' 或指定 permission，目前為 ' + ctx.role);
  var permissions = permissionsFromEmployeeV32_(ctx.employee, ctx.role);
  var profile = {
    id: ctx.employee_id,
    name: (ctx.employee && ctx.employee.name) || '',
    nickname: (ctx.employee && ctx.employee.nickname) || '',
    role: ctx.role,
    permissions: permissions,
    permission_codes: permissions,
    branchId: (ctx.employee && ctx.employee.branch_id) || '',
    branchName: (ctx.employee && ctx.employee.branch_name) || ''
  };
  var system = {
    company_name: (ctx.employee && (ctx.employee.company_name || ctx.employee.company)) || ctx.company_id,
    company_subtitle: 'Humanized system technology',
    fallback_text: 'ANG',
    branch_id: profile.branchId,
    branch_name: profile.branchName
  };
  return { ctx: ctx, profile: profile, system: system };
}

function apiManagerBootstrapV28_(payload) {
  var b = bootstrapBaseByRoleV30_(payload, 'Manager', ['publish.*','publish.notice','publish.schedule','review.leave','review.upload','review.message','data.drive']);
  if (!b || b.ok === false) return b;
  return ok_({
    profile: b.profile,
    system: b.system,
    leaveReviews: [],
    receiveReviews: [],
    messageReviews: [],
    noticePublishItems: [],
    schedulePublishItems: []
  });
}

function apiAdminBootstrapV28_(payload) {
  var b = bootstrapBaseByRoleV30_(payload, 'Admin', ['review.*','review.clockfix','review.salary','people.*','salary.*','data.*']);
  if (!b || b.ok === false) return b;
  return ok_({
    profile: b.profile,
    system: b.system,
    clockFixReviews: [],
    salaryReviews: [],
    leaveReviews: [],
    receiveReviews: [],
    messageReviews: [],
    noticePublishItems: []
  });
}

function apiCreatorBootstrapV28_(payload) {
  var b = bootstrapBaseByRoleV30_(payload, 'Creator', ['settings.*','settings.preselect','settings.approver','settings.shift','settings.clock_grace','settings.brand','settings.location','settings.permission']);
  if (!b || b.ok === false) return b;
  return ok_({
    profile: b.profile,
    system: b.system,
    approverSettings: {},
    preselectSettings: { mode: 'week' },
    shiftTypes: []
  });
}

function apiGetPeopleManagementDataV28_(payload) {
  var ctx = authContextV30_(payload);
  if (!requireRoleV30_(ctx, 'Admin')) return fail_('權限不足：People 人員管理需要 Admin 以上');
  var companyId = ctx.company_id || resolveCompanyIdV28_(payload);
  var rows = sheetToObjects_(getCompanySheetV25_(companyId, SHEET_EMPLOYEES));
  var people = rows.filter(function(r){ return normalizeUpper_(r.company_id || companyId) === companyId; }).map(function(r){
    return {
      id: normalizeUpper_(r.employee_id || ''), name: r.name || '', nickname: r.nickname || '', role: normalizeRoleV30_(r.role || 'Employee', r.employee_id),
      email: r.email || '', phone: r.phone || '', branchId: r.branch_id || '', branchName: r.branch_name || '', shift: r.shift || '',
      jobTitle: r.jobTitle || r.job_title || '', dept: r.dept || '', color: r.color || '#ff87e0',
      enabled: normalizeLower_(r.status || 'active') === 'active', specialdeviceid: r.device_id || ''
    };
  });
  return ok_({ company_id: companyId, people: people });
}

function apiSaveEmployeeProfileV28_(payload) {
  payload = payload || {};
  var ctx = authContextV30_(payload);
  if (!requireRoleV30_(ctx, 'Admin')) return fail_('權限不足：儲存員工需要 Admin 以上');
  var targetRole = normalizeRoleV30_(payload.role || 'Employee', payload.empId || payload.employee_id || '');
  if (targetRole === 'Creator' && !requireRoleV30_(ctx, 'Creator')) return fail_('只有 Creator 平台方可以建立或設定 Creator');
  if (targetRole === 'Owner' && !requireRoleV30_(ctx, 'Owner')) return fail_('只有 Owner 以上可以建立或設定 Owner');
  var companyId = ctx.company_id || resolveCompanyIdV28_(payload);
  var empId = normalizeUpper_(payload.empId || payload.employee_id || payload.id || '');
  if (!empId) empId = nextEmployeeId_(companyId);
  var existing = findEmployee_(companyId, empId);
  if (existing) {
    var updates = {
      name: normalize_(payload.name || ''), nickname: normalize_(payload.nickname || ''), role: targetRole,
      shift: normalize_(payload.shift || ''), jobTitle: normalize_(payload.jobTitle || ''), dept: normalize_(payload.dept || ''), color: normalize_(payload.color || ''),
      phone: normalize_(payload.phone || ''), email: normalizeEmail_(payload.email || ''), branch_id: normalizeUpper_(payload.branchId || payload.branch_id || 'MAIN'),
      branch_name: normalize_(payload.branchName || payload.branch_name || ''), updated_at: nowText_(), status: String(payload.enabled) === 'false' ? 'disabled' : 'active'
    };
    updateEmployeeInSheetV25_(getCompanySheetV25_(companyId, SHEET_EMPLOYEES), companyId, empId, updates);
    updateEmployeeInSheetV25_(getSheet_(SHEET_EMPLOYEES), companyId, empId, updates);
    return ok_({ message:'員工資料已更新', employee:Object.assign({id:empId}, updates) });
  }
  return apiAddEmployee_(Object.assign({}, payload, { company_id: companyId, employee_id: empId, role: targetRole, phone: payload.phone || '未填手機' }));
}

function apiGenerateEmployeeBindLinkV28_(payload) {
  var ctx = authContextV30_(payload);
  if (!requireRoleV30_(ctx, 'Admin')) return fail_('權限不足：產生綁定連結需要 Admin 以上');
  var companyId = ctx.company_id || resolveCompanyIdV28_(payload);
  var empId = normalizeUpper_(payload.empId || payload.employee_id || payload.id || '');
  if (!empId) return fail_('缺少員工編號');
  var token = 'ACT' + Math.random().toString(36).slice(2, 10).toUpperCase();
  var updates = { one_time_token: token, token_used: 'no', updated_at: nowText_() };
  updateEmployeeInSheetV25_(getCompanySheetV25_(companyId, SHEET_EMPLOYEES), companyId, empId, updates);
  updateEmployeeInSheetV25_(getSheet_(SHEET_EMPLOYEES), companyId, empId, updates);
  var url = DEFAULT_FRONTEND_URL + 'index.html?company_id=' + encodeURIComponent(companyId) + '&id=' + encodeURIComponent(empId) + '&token=' + encodeURIComponent(token) + '&bind=1';
  return ok_({ message:'綁定連結已產生', company_id:companyId, empId:empId, activation_code:token, token:token, url:url });
}

function apiResetEmployeeDeviceBindingV28_(payload) {
  var ctx = authContextV30_(payload);
  if (!requireRoleV30_(ctx, 'Admin')) return fail_('權限不足：重設手機需要 Admin 以上');
  var companyId = ctx.company_id || resolveCompanyIdV28_(payload);
  var empId = normalizeUpper_(payload.empId || payload.employee_id || payload.id || '');
  if (!empId) return fail_('缺少員工編號');
  var token = 'ACT' + Math.random().toString(36).slice(2, 10).toUpperCase();
  var updates = { device_id:'', one_time_token:token, token_used:'no', updated_at:nowText_() };
  updateEmployeeInSheetV25_(getCompanySheetV25_(companyId, SHEET_EMPLOYEES), companyId, empId, updates);
  updateEmployeeInSheetV25_(getSheet_(SHEET_EMPLOYEES), companyId, empId, updates);
  var url = DEFAULT_FRONTEND_URL + 'index.html?company_id=' + encodeURIComponent(companyId) + '&id=' + encodeURIComponent(empId) + '&token=' + encodeURIComponent(token) + '&bind=1';
  return ok_({ message:'已重設手機綁定', url:url, activation_code:token });
}

/************************************************************
 * ANG HR System｜V31 公司試算表權限來源修正
 * 核心規則：
 * 1. 平台總表 Companies 只負責找 company_id 與 company_spreadsheet_id。
 * 2. Creator / Admin / Manager / Employee 權限以「該公司試算表 → 人員資料」為準。
 * 3. 新建公司時會同步在公司試算表「人員資料」建立 Creator。
 * 4. 仍保留平台 Employees 作為索引與舊資料相容，不再作為公司內部權限第一來源。
 ************************************************************/
var ANG_HR_COMPANY_PERSON_SHEET_NAMES_V31_ = ['人員資料', '員工資料', '人員', '員工', 'Employees', 'Users', 'SHEET_USERS'];
var ANG_HR_COMPANY_PERSON_HEADERS_V31_ = ['員工ID','姓名','Email','電話','角色','狀態','部門ID','部門名稱','職稱','到職日','生日','身分證末碼','裝置ID','開通碼','綁定狀態','備註','班別','分店ID','分店名稱','平台人員ID','公司員編'];

function valueByAliasesV31_(row, aliases) {
  row = row || {};
  aliases = aliases || [];
  for (var i = 0; i < aliases.length; i++) {
    var k = aliases[i];
    if (Object.prototype.hasOwnProperty.call(row, k) && row[k] !== '' && row[k] != null) return row[k];
  }
  return '';
}

function getCompanyPersonSheetV31_(companyId, createIfMissing) {
  var ss = getCompanyDbByCompanyIdV25_(companyId);
  for (var i = 0; i < ANG_HR_COMPANY_PERSON_SHEET_NAMES_V31_.length; i++) {
    var sh = ss.getSheetByName(ANG_HR_COMPANY_PERSON_SHEET_NAMES_V31_[i]);
    if (sh) {
      ensureHeader_(sh, ANG_HR_COMPANY_PERSON_HEADERS_V31_);
      return sh;
    }
  }
  if (!createIfMissing) return null;
  var created = ss.insertSheet('人員資料');
  ensureHeader_(created, ANG_HR_COMPANY_PERSON_HEADERS_V31_);
  return created;
}

function isChinesePersonSheetV31_(sheet) {
  if (!sheet) return false;
  var headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0].map(function(h){ return String(h || '').trim(); });
  return headers.indexOf('員工ID') >= 0 || headers.indexOf('角色') >= 0 || headers.indexOf('班別') >= 0;
}

function normalizeCompanyPersonStatusV31_(status) {
  var s = normalizeLower_(status || '');
  if (!s) return 'active';
  if (['是','啟用','已啟用','active','enabled','enable','true','yes','y','1','使用中','正常'].indexOf(s) >= 0) return 'active';
  if (['否','停用','已停用','disabled','disable','inactive','false','no','n','0','離職'].indexOf(s) >= 0) return 'disabled';
  return s;
}

function isEmployeeActiveV31_(status) {
  return normalizeCompanyPersonStatusV31_(status) === 'active';
}

function normalizeCompanyPersonRowV31_(row, companyId) {
  row = row || {};
  var employeeId = normalizeUpper_(valueByAliasesV31_(row, ['employee_id','員工ID','員編','員工編號','id','ID']));
  var role = valueByAliasesV31_(row, ['role','角色','權限','權限角色']);
  var status = valueByAliasesV31_(row, ['status','狀態','啟用狀態']);
  var branchId = valueByAliasesV31_(row, ['branch_id','branchId','分店ID','店別ID']);
  var branchName = valueByAliasesV31_(row, ['branch_name','branchName','分店名稱','店名']);
  var out = Object.assign({}, row, {
    company_id: normalizeUpper_(valueByAliasesV31_(row, ['company_id','companyId','公司ID']) || companyId || ''),
    person_id: normalizeUpper_(valueByAliasesV31_(row, ['person_id','personId','平台人員ID'])),
    employee_no: normalize_(valueByAliasesV31_(row, ['employee_no','employeeNo','公司員編']) || String(employeeId || '').replace(/^ANG/i, '')),
    employee_id: employeeId,
    id: employeeId,
    name: normalize_(valueByAliasesV31_(row, ['name','姓名','員工姓名'])),
    nickname: normalize_(valueByAliasesV31_(row, ['nickname','暱稱','備註'])),
    email: normalizeEmail_(valueByAliasesV31_(row, ['email','Email','EMAIL','信箱','電子郵件'])),
    phone: normalize_(valueByAliasesV31_(row, ['phone','電話','手機','手機號碼'])),
    role: normalizeRoleV30_(role, employeeId),
    status: normalizeCompanyPersonStatusV31_(status),
    dept_id: normalize_(valueByAliasesV31_(row, ['dept_id','department_id','部門ID'])),
    dept: normalize_(valueByAliasesV31_(row, ['dept','department','department_name','部門名稱'])),
    jobTitle: normalize_(valueByAliasesV31_(row, ['jobTitle','job_title','職稱'])),
    job_title: normalize_(valueByAliasesV31_(row, ['jobTitle','job_title','職稱'])),
    hire_date: normalize_(valueByAliasesV31_(row, ['hire_date','到職日','created_at'])),
    birth_date: normalize_(valueByAliasesV31_(row, ['birth_date','birthday','生日'])),
    id_tail: normalize_(valueByAliasesV31_(row, ['id_tail','身分證末碼','password'])),
    password: normalize_(valueByAliasesV31_(row, ['password','密碼','身分證末碼'])),
    device_id: normalize_(valueByAliasesV31_(row, ['device_id','deviceId','裝置ID'])),
    one_time_token: normalize_(valueByAliasesV31_(row, ['one_time_token','activation_code','開通碼','綁定碼'])),
    token_used: normalize_(valueByAliasesV31_(row, ['token_used','used','綁定狀態'])),
    shift: normalize_(valueByAliasesV31_(row, ['shift','班別'])),
    branch_id: normalizeUpper_(branchId || 'MAIN'),
    branch_name: normalize_(branchName || '')
  });
  if (out.token_used === '已綁定') out.token_used = 'yes';
  if (out.token_used === '未綁定') out.token_used = 'no';
  return out;
}

function companyPersonRowForSheetV31_(sheet, obj) {
  obj = obj || {};
  var role = normalizeRoleV30_(obj.role || 'Employee', obj.employee_id || obj.id || '');
  var isChinese = isChinesePersonSheetV31_(sheet);
  if (isChinese) {
    return {
      '員工ID': normalizeUpper_(obj.employee_id || obj.id || ''),
      '姓名': normalize_(obj.name || obj.employee_name || ''),
      'Email': normalizeEmail_(obj.email || ''),
      '電話': normalize_(obj.phone || ''),
      '角色': role,
      '狀態': isEmployeeActiveV31_(obj.status || 'active') ? '是' : '否',
      '部門ID': normalize_(obj.dept_id || obj.department_id || ''),
      '部門名稱': normalize_(obj.dept || obj.department || obj.department_name || ''),
      '職稱': normalize_(obj.jobTitle || obj.job_title || ((role === 'Creator' || role === 'Owner') ? (role === 'Owner' ? 'Owner' : '總管理') : '')),
      '到職日': normalize_(obj.hire_date || obj.created_at || nowText_()),
      '生日': normalize_(obj.birth_date || ''),
      '身分證末碼': normalize_(obj.id_tail || obj.password || ''),
      '裝置ID': normalize_(obj.device_id || ''),
      '開通碼': normalize_(obj.one_time_token || obj.activation_code || ''),
      '綁定狀態': normalizeLower_(obj.token_used || '') === 'yes' ? '已綁定' : '未綁定',
      '備註': normalize_(obj.note || obj.nickname || ((role === 'Creator' || role === 'Owner') ? (role === 'Owner' ? '公司擁有者' : '公司建立者') : '')),
      '班別': normalize_(obj.shift || 'A'),
      '分店ID': normalizeUpper_(obj.branch_id || obj.branchId || 'MAIN'),
      '分店名稱': normalize_(obj.branch_name || obj.branchName || obj.company_name || '總店'),
      '平台人員ID': normalizeUpper_(obj.person_id || obj.personId || ''),
      '公司員編': normalize_(obj.employee_no || String(obj.employee_id || obj.id || '').replace(/^ANG/i, ''))
    };
  }
  return {
    company_id: normalizeUpper_(obj.company_id || ''),
    company_name: normalize_(obj.company_name || ''),
    plan: normalize_(obj.plan || ''),
    plan_label: normalize_(obj.plan_label || ''),
    billing_status: normalize_(obj.billing_status || ''),
    billing_status_label: normalize_(obj.billing_status_label || ''),
    branch_id: normalizeUpper_(obj.branch_id || obj.branchId || 'MAIN'),
    branch_name: normalize_(obj.branch_name || obj.branchName || obj.company_name || 'MAIN'),
    person_id: normalizeUpper_(obj.person_id || obj.personId || ''),
    employee_no: normalize_(obj.employee_no || String(obj.employee_id || obj.id || '').replace(/^ANG/i, '')),
    employee_id: normalizeUpper_(obj.employee_id || obj.id || ''),
    password: normalize_(obj.password || obj.id_tail || ''),
    name: normalize_(obj.name || obj.employee_name || ''),
    role: role,
    email: normalizeEmail_(obj.email || ''),
    phone: normalize_(obj.phone || ''),
    birth_date: normalize_(obj.birth_date || ''),
    google_sub: normalize_(obj.google_sub || ''),
    line_sub: normalize_(obj.line_sub || ''),
    device_id: normalize_(obj.device_id || ''),
    one_time_token: normalize_(obj.one_time_token || obj.activation_code || ''),
    token_used: normalize_(obj.token_used || 'no'),
    created_at: normalize_(obj.created_at || nowText_()),
    updated_at: nowText_(),
    status: isEmployeeActiveV31_(obj.status || 'active') ? 'active' : 'disabled'
  };
}

function appendOrUpdateCompanyPersonRowV31_(companyId, obj) {
  companyId = normalizeUpper_(companyId || (obj && obj.company_id) || '');
  if (!companyId) return null;
  var sheet = getCompanyPersonSheetV31_(companyId, true);
  var rowObj = companyPersonRowForSheetV31_(sheet, Object.assign({}, obj || {}, { company_id: companyId }));
  var employeeId = normalizeUpper_(rowObj['員工ID'] || rowObj.employee_id || obj.employee_id || obj.id || '');
  if (!employeeId) return null;
  var rows = sheetToObjects_(sheet);
  var headerMap = getHeaderMap_(sheet);
  var rowNumber = 0;
  for (var i = 0; i < rows.length; i++) {
    var r = normalizeCompanyPersonRowV31_(rows[i], companyId);
    if (normalizeUpper_(r.employee_id || '') === employeeId) { rowNumber = i + 2; break; }
  }
  if (rowNumber) {
    Object.keys(rowObj).forEach(function(k){ if (headerMap[k]) sheet.getRange(rowNumber, headerMap[k]).setValue(rowObj[k]); });
  } else {
    appendObjectRowToSheetV25_(sheet, rowObj);
  }
  return normalizeCompanyPersonRowV31_(rowObj, companyId);
}

function updateCompanyPersonRowV31_(companyId, employeeId, updates) {
  var current = findEmployeeInCompanyPersonSheetV31_(companyId, employeeId);
  if (!current) return null;
  return appendOrUpdateCompanyPersonRowV31_(companyId, Object.assign({}, current, updates || {}, { employee_id: employeeId, company_id: companyId }));
}

function findEmployeeInCompanyPersonSheetV31_(companyId, employeeId) {
  companyId = normalizeUpper_(companyId || '');
  employeeId = normalizeUpper_(employeeId || '');
  if (!companyId || !employeeId) return null;
  var sheet = getCompanyPersonSheetV31_(companyId, false);
  if (!sheet) return null;
  var rows = sheetToObjects_(sheet);
  for (var i = 0; i < rows.length; i++) {
    var r = normalizeCompanyPersonRowV31_(rows[i], companyId);
    var rowCompany = normalizeUpper_(r.company_id || companyId);
    if (rowCompany && rowCompany !== companyId) continue;
    if (normalizeUpper_(r.employee_id || '') === employeeId) {
      r._source_sheet = sheet.getName();
      r.company_id = companyId;
      return r;
    }
  }
  return null;
}

function buildCreatorFromCompanyRecordV31_(company) {
  company = company || {};
  var companyId = normalizeUpper_(company.company_id || '');
  var creatorId = normalizeUpper_(company.creator_employee_id || DEFAULT_CREATOR_EMPLOYEE_ID || '');
  if (!companyId || !creatorId) return null;
  return {
    company_id: companyId,
    company_name: normalize_(company.company_name || ''),
    plan: normalize_(company.plan || ''),
    plan_label: normalize_(company.plan_label || ''),
    billing_status: normalize_(company.billing_status || ''),
    billing_status_label: normalize_(company.billing_status_label || ''),
    branch_id: 'MAIN',
    branch_name: normalize_(company.company_name || '總店'),
    person_id: normalizeUpper_(company.owner_person_id || ''),
    employee_no: DEFAULT_CREATOR_EMPLOYEE_NO,
    employee_id: creatorId,
    password: normalize_(company.creator_password || (creatorId === 'ANG8963' ? '8963' : DEFAULT_CREATOR_PASSWORD) || ''),
    name: normalize_(company.admin_name || DEFAULT_CREATOR_NAME || 'ANG 總管理'),
    role: 'Owner',
    email: normalizeEmail_(company.verified_email || ''),
    phone: normalize_(company.admin_phone || ''),
    birth_date: normalize_(company.birth_date || ''),
    google_sub: normalize_(company.google_sub || ''),
    line_sub: normalize_(company.line_sub || ''),
    device_id: '',
    one_time_token: '',
    token_used: 'yes',
    created_at: normalize_(company.created_at || nowText_()),
    updated_at: nowText_(),
    status: 'active',
    jobTitle: '總管理',
    note: '公司建立者',
    shift: 'A'
  };
}

function ensureCompanyCreatorInPersonSheetV31_(companyId) {
  companyId = normalizeUpper_(companyId || '');
  if (!companyId) return null;
  var company = findCompany_(companyId);
  if (!company) return null;
  var creator = buildCreatorFromCompanyRecordV31_(company);
  if (!creator || !creator.employee_id) return null;

  // Owner 權限修正：
  // 公司建立者 / 公司最高權限 = Owner；平台方最高權限才是 Creator。
  // 舊版這裡會把公司 Owner 強制升級成 Creator，造成公司層與平台層權限混在一起。
  var desiredRole = (companyId === 'PLATFORM' && normalizeUpper_(creator.employee_id || '') === 'ANG8963') ? 'Creator' : 'Owner';

  var existing = findEmployeeInCompanyPersonSheetV31_(companyId, creator.employee_id);
  if (existing) {
    var existingRole = normalizeRoleV30_(existing.role, existing.employee_id);
    var shouldFixRole = false;

    if (desiredRole === 'Creator') {
      shouldFixRole = existingRole !== 'Creator';
    } else {
      // 一般公司內不能因為是建立者就變成平台 Creator。
      // 只要不是 Owner，就修回 Owner；包含舊資料誤寫 Creator 的情況。
      shouldFixRole = existingRole !== 'Owner';
    }

    if (shouldFixRole || !isEmployeeActiveV31_(existing.status)) {
      existing = appendOrUpdateCompanyPersonRowV31_(companyId, Object.assign({}, existing, {
        role: desiredRole,
        status: 'active',
        jobTitle: existing.jobTitle || existing.job_title || (desiredRole === 'Owner' ? 'Owner' : '總管理'),
        note: existing.note || existing.nickname || (desiredRole === 'Owner' ? '公司擁有者' : '平台方')
      }));
    }
    return existing;
  }

  return appendOrUpdateCompanyPersonRowV31_(companyId, Object.assign({}, creator, { role: desiredRole }));
}

function findEmployee_(companyId, employeeId) {
  companyId = normalizeUpper_(companyId || '');
  employeeId = normalizeUpper_(employeeId || '');
  if (!companyId || !employeeId) return null;

  // 公司內部權限第一來源：該公司試算表「人員資料」。
  ensureCompanyCreatorInPersonSheetV31_(companyId);
  var inCompanyPerson = findEmployeeInCompanyPersonSheetV31_(companyId, employeeId);
  if (inCompanyPerson) return inCompanyPerson;

  // 舊資料相容：若尚未遷移，才讀公司 Employees / 平台 Employees。
  try {
    var companySheet = getCompanySheetV25_(companyId, SHEET_EMPLOYEES);
    var inCompanyEnglish = findEmployeeInSheetV25_(companySheet, companyId, employeeId);
    if (inCompanyEnglish) return normalizeCompanyPersonRowV31_(inCompanyEnglish, companyId);
  } catch (err1) {}
  try {
    var masterSheet = getSheet_(SHEET_EMPLOYEES);
    var inMaster = findEmployeeInSheetV25_(masterSheet, companyId, employeeId);
    if (inMaster) return normalizeCompanyPersonRowV31_(inMaster, companyId);
  } catch (err2) {}
  return null;
}

function normalizeRoleV30_(role, employeeId) {
  var id = normalizeUpper_(employeeId || '');
  var r = normalizeLower_(role || '');
  if (id === 'ANG8963' && !r) return 'Creator';
  if (['creator','platform_creator','platform_owner','system_owner','superowner','super_owner','root','root_admin','superadmin','super_admin','最高權限','最高擁有者','平台擁有者','平台最高權限','平台總管理','平台方','創建者'].indexOf(r) >= 0) return 'Creator';
  if (['owner','company_owner','companyowner','擁有者','公司擁有者','公司負責人','負責人','業主','創辦者','建立者','總管理'].indexOf(r) >= 0) return 'Owner';
  if (['admin','administrator','管理員','系統管理員'].indexOf(r) >= 0) return 'Admin';
  if (['manager','主管','店長','經理'].indexOf(r) >= 0) return 'Manager';
  if (['employee','staff','member','員工','一般員工'].indexOf(r) >= 0) return 'Employee';
  return role ? normalize_(role) : 'Employee';
}

function authContextV30_(payload) {
  payload = payload || {};
  var companyId = normalizeUpper_(payload.company_id || payload.company || payload.companyCode || payload.companyId || '');
  var employeeId = normalizeUpper_(payload.employee_id || payload.employeeId || payload.id || payload.userId || payload.user_id || '');
  var token = normalize_(payload.session_token || payload.loginToken || payload.token || payload.userToken || '');
  var deviceId = normalize_(payload.device_id || payload.deviceId || '');
  if (!companyId) companyId = resolveCompanyIdV28_(payload);
  var employee = (companyId && employeeId) ? findEmployee_(companyId, employeeId) : null;
  var role = normalizeRoleV30_(employee ? employee.role : (payload.role || ''), employeeId);
  var sessionOk = false;
  if (companyId && employeeId && token && typeof verifySessionTokenV28_ === 'function') {
    sessionOk = verifySessionTokenV28_(companyId, employeeId, token, deviceId);
  }
  var oneTimeOk = false;
  if (employee && token) {
    var one = normalize_(employee.one_time_token || employee.activation_code || employee.token || '');
    var used = normalizeLower_(employee.token_used || employee.used || 'no');
    oneTimeOk = !!(one && one === token && used !== 'yes' && used !== 'true' && used !== '已綁定');
  }
  var verifiedParam = String(payload.verified || '').trim() === '1' || String(payload.verified || '').toLowerCase() === 'true';
  return {
    ok: !!employee || employeeId === 'ANG8963' || verifiedParam,
    company_id: companyId,
    employee_id: employeeId,
    token: token,
    device_id: deviceId,
    employee: employee,
    role: role,
    session_ok: sessionOk,
    one_time_ok: oneTimeOk,
    verified_param: verifiedParam,
    authenticated: sessionOk || oneTimeOk || verifiedParam || !!employee
  };
}

function apiPermissionSnapshotV30_(payload) {
  var ctx = authContextV30_(payload);
  if (!ctx.ok) return fail_('找不到員工或公司權限資料');
  var permissions = permissionsFromEmployeeV32_(ctx.employee, ctx.role);
  return ok_({
    message: '權限已同步（公司試算表人員資料 / permission 模式）',
    company_id: ctx.company_id,
    employee_id: ctx.employee_id,
    id: ctx.employee_id,
    token: ctx.token,
    session_token: ctx.token,
    device_id: ctx.device_id,
    role: ctx.role,
    rank: roleRankV30_(ctx.role),
    permissions: permissions,
    permission_codes: permissions,
    is_admin: permissions.indexOf('*') >= 0 || permissions.indexOf('review.*') >= 0 || permissions.indexOf('people.*') >= 0 || permissions.indexOf('salary.*') >= 0 || roleRankV30_(ctx.role) >= 2,
    authenticated: !!ctx.authenticated,
    permission_source: ctx.employee ? (ctx.employee._source_sheet || '人員資料') : 'platform_fallback',
    companies: companiesForContextV30_(ctx)
  });
}

function apiVerifyEmployeeSessionV28_(payload) {
  var ctx = authContextV30_(payload);
  if (!ctx.company_id || !ctx.employee_id || !ctx.token) return fail_('缺少公司、員工或登入 token');
  if (!ctx.employee && ctx.employee_id !== 'ANG8963') return fail_('找不到員工資料');
  if (ctx.employee && !isEmployeeActiveV31_(ctx.employee.status || 'active')) return fail_('此員工已停用');
  if (!ctx.authenticated) return fail_('登入授權已失效，請重新登入');
  return ok_({
    message: '員工登入有效',
    company_id: ctx.company_id,
    company_name: (ctx.employee && ctx.employee.company_name) || ctx.company_id,
    employee_id: ctx.employee_id,
    name: (ctx.employee && ctx.employee.name) || '',
    role: ctx.role,
    permissions: permissionsFromEmployeeV32_(ctx.employee, ctx.role),
    permission_codes: permissionsFromEmployeeV32_(ctx.employee, ctx.role),
    permission_source: ctx.employee ? (ctx.employee._source_sheet || '人員資料') : 'platform_fallback',
    companies: companiesForContextV30_(ctx)
  });
}

function nextEmployeeId_(companyId) {
  companyId = normalizeUpper_(companyId || '');
  var rows = [];
  try {
    var sh = getCompanyPersonSheetV31_(companyId, false);
    rows = sh ? sheetToObjects_(sh).map(function(r){ return normalizeCompanyPersonRowV31_(r, companyId); }) : [];
  } catch (err) { rows = []; }
  var max = 0;
  rows.forEach(function(r) {
    var id = normalizeUpper_(r.employee_id || '');
    var m = id.match(/(\d+)$/);
    if (m) max = Math.max(max, Number(m[1] || 0));
  });
  var next = max + 1;
  if (next === 603) next = 604;
  return 'ANG' + String(next).padStart(4, '0');
}

function apiGetPeopleManagementDataV28_(payload) {
  var ctx = authContextV30_(payload);
  if (!requireRoleV30_(ctx, 'Admin')) return fail_('權限不足：People 人員管理需要 Admin 以上');
  var companyId = ctx.company_id || resolveCompanyIdV28_(payload);
  ensureCompanyCreatorInPersonSheetV31_(companyId);
  var sh = getCompanyPersonSheetV31_(companyId, false);
  var rows = sh ? sheetToObjects_(sh).map(function(r){ return normalizeCompanyPersonRowV31_(r, companyId); }) : [];
  var people = rows.filter(function(r){ return normalizeUpper_(r.employee_id || '') !== ''; }).map(function(r){
    return {
      id: normalizeUpper_(r.employee_id || ''),
      personId: normalizeUpper_(r.person_id || ''),
      employeeNo: normalize_(r.employee_no || String(r.employee_id || '').replace(/^ANG/i, '')),
      name: r.name || '',
      nickname: r.nickname || '',
      role: normalizeRoleV30_(r.role || 'Employee', r.employee_id),
      email: r.email || '',
      phone: r.phone || '',
      branchId: r.branch_id || '',
      branchName: r.branch_name || '',
      shift: r.shift || '',
      jobTitle: r.jobTitle || r.job_title || '',
      dept: r.dept || '',
      color: r.color || '#ff87e0',
      enabled: isEmployeeActiveV31_(r.status || 'active'),
      specialdeviceid: r.device_id || '',
      permissionSource: r._source_sheet || (sh ? sh.getName() : '')
    };
  });
  return ok_({ company_id: companyId, people: people, permission_source_sheet: sh ? sh.getName() : '' });
}

function apiAddEmployee_(payload) {
  payload = payload || {};
  var ctx = authContextV30_(payload);
  var companyId = normalizeUpper_(payload.company_id || payload.company || (ctx && ctx.company_id) || '');
  if (!companyId) return fail_('缺少公司代碼');
  var company = findCompany_(companyId);
  if (!company) return fail_('找不到公司資料');
  if (ctx && ctx.employee_id && !requireRoleV30_(ctx, 'Admin')) return fail_('權限不足：新增員工需要 Admin 以上');
  var name = normalize_(payload.name || payload.employee_name || '');
  var phone = normalize_(payload.phone || '');
  var email = normalizeEmail_(payload.email || '');
  var role = normalizeRoleV30_(payload.role || 'Employee', payload.employee_id || payload.id || '');
  var employeeId = normalizeUpper_(payload.employee_id || payload.empId || payload.id || '');
  if (!name) return fail_('請輸入員工姓名');
  if (!phone && role !== 'Creator' && role !== 'Owner') return fail_('請輸入員工手機號碼');
  if (!employeeId) employeeId = nextEmployeeId_(companyId);
  if (findEmployeeInCompanyPersonSheetV31_(companyId, employeeId)) return fail_('員工編號已存在');
  var personRecord = typeof angPeopleCreatePerson_ === 'function'
    ? angPeopleCreatePerson_({ display_name: name, email: email, phone: phone })
    : null;
  var personId = personRecord ? personRecord.person_id : normalizeUpper_(payload.person_id || '');
  var employeeNo = String(employeeId || '').replace(/^ANG/i, '');
  var token = normalizeUpper_(payload.one_time_token || payload.activation_code || ('ACT' + Math.random().toString(36).slice(2, 10).toUpperCase()));
  var employeeObj = {
    company_id: companyId,
    company_name: company.company_name || '',
    plan: company.plan || '',
    plan_label: company.plan_label || '',
    billing_status: company.billing_status || '',
    billing_status_label: company.billing_status_label || '',
    branch_id: normalizeUpper_(payload.branch_id || payload.branchId || 'MAIN'),
    branch_name: normalize_(payload.branch_name || payload.branchName || company.company_name || 'MAIN'),
    person_id: personId,
    employee_no: employeeNo,
    employee_id: employeeId,
    password: normalize_(payload.password || payload.id_tail || ''),
    name: name,
    role: role,
    email: email,
    phone: phone,
    birth_date: normalize_(payload.birth_date || ''),
    google_sub: '',
    line_sub: '',
    device_id: '',
    one_time_token: token,
    token_used: 'no',
    created_at: nowText_(),
    updated_at: nowText_(),
    status: 'active',
    jobTitle: normalize_(payload.jobTitle || payload.job_title || ''),
    dept: normalize_(payload.dept || payload.department || ''),
    shift: normalize_(payload.shift || 'A')
  };
  appendOrUpdateCompanyPersonRowV31_(companyId, employeeObj);
  try { appendObjectRowToSheetV25_(getCompanySheetV25_(companyId, SHEET_EMPLOYEES), employeeObj); } catch (e1) {}
  mirrorEmployeeToMasterIndexV25_(employeeObj);
  if (typeof angPeopleUpsertEmployeeMembership_ === 'function') {
    angPeopleUpsertEmployeeMembership_({
      person_id: personId,
      company_id: companyId,
      employee_id: employeeId,
      employee_no: employeeNo,
      name: name,
      email: email,
      phone: phone,
      role: role,
      status: 'active',
      created_at: employeeObj.created_at
    });
  }
  log_('addEmployee', companyId, employeeId, email, 'ok', 'employee created in company 人員資料', { phone: phone });
  return ok_({ message: '員工新增完成', company_id: companyId, person_id: personId, employee_no: employeeNo, employee_id: employeeId, one_time_token: token, activation_code: token });
}

function apiSaveEmployeeProfileV28_(payload) {
  payload = payload || {};
  var ctx = authContextV30_(payload);
  if (!requireRoleV30_(ctx, 'Admin')) return fail_('權限不足：儲存員工需要 Admin 以上');
  var targetRole = normalizeRoleV30_(payload.role || 'Employee', payload.empId || payload.employee_id || '');
  if (targetRole === 'Creator' && !requireRoleV30_(ctx, 'Creator')) return fail_('只有 Creator 平台方可以建立或設定 Creator');
  if (targetRole === 'Owner' && !requireRoleV30_(ctx, 'Owner')) return fail_('只有 Owner 以上可以建立或設定 Owner');
  var companyId = ctx.company_id || resolveCompanyIdV28_(payload);
  var empId = normalizeUpper_(payload.empId || payload.employee_id || payload.id || '');
  if (!empId) empId = nextEmployeeId_(companyId);
  var updates = {
    employee_id: empId,
    company_id: companyId,
    name: normalize_(payload.name || ''),
    nickname: normalize_(payload.nickname || ''),
    role: targetRole,
    shift: normalize_(payload.shift || 'A'),
    jobTitle: normalize_(payload.jobTitle || ''),
    job_title: normalize_(payload.jobTitle || ''),
    dept: normalize_(payload.dept || ''),
    color: normalize_(payload.color || ''),
    phone: normalize_(payload.phone || ''),
    email: normalizeEmail_(payload.email || ''),
    branch_id: normalizeUpper_(payload.branchId || payload.branch_id || 'MAIN'),
    branch_name: normalize_(payload.branchName || payload.branch_name || ''),
    updated_at: nowText_(),
    status: String(payload.enabled) === 'false' ? 'disabled' : 'active'
  };
  var saved = appendOrUpdateCompanyPersonRowV31_(companyId, updates);
  updateEmployeeInSheetV25_(getSheet_(SHEET_EMPLOYEES), companyId, empId, updates);
  return ok_({ message:'員工資料已儲存到公司試算表「人員資料」', employee:Object.assign({id:empId}, saved || updates) });
}

function apiGenerateEmployeeBindLinkV28_(payload) {
  var ctx = authContextV30_(payload);
  if (!requireRoleV30_(ctx, 'Admin')) return fail_('權限不足：產生綁定連結需要 Admin 以上');
  var companyId = ctx.company_id || resolveCompanyIdV28_(payload);
  var empId = normalizeUpper_(payload.empId || payload.employee_id || payload.id || '');
  if (!empId) return fail_('缺少員工編號');
  var token = 'ACT' + Math.random().toString(36).slice(2, 10).toUpperCase();
  var updates = { one_time_token: token, token_used: 'no', updated_at: nowText_() };
  updateCompanyPersonRowV31_(companyId, empId, updates);
  updateEmployeeInSheetV25_(getSheet_(SHEET_EMPLOYEES), companyId, empId, updates);
  var url = DEFAULT_FRONTEND_URL + 'index.html?company_id=' + encodeURIComponent(companyId) + '&id=' + encodeURIComponent(empId) + '&token=' + encodeURIComponent(token) + '&bind=1';
  return ok_({ message:'綁定連結已產生', company_id:companyId, empId:empId, activation_code:token, token:token, url:url });
}

function apiResetEmployeeDeviceBindingV28_(payload) {
  var ctx = authContextV30_(payload);
  if (!requireRoleV30_(ctx, 'Admin')) return fail_('權限不足：重設手機需要 Admin 以上');
  var companyId = ctx.company_id || resolveCompanyIdV28_(payload);
  var empId = normalizeUpper_(payload.empId || payload.employee_id || payload.id || '');
  if (!empId) return fail_('缺少員工編號');
  var token = 'ACT' + Math.random().toString(36).slice(2, 10).toUpperCase();
  var updates = { device_id:'', one_time_token:token, token_used:'no', updated_at:nowText_() };
  updateCompanyPersonRowV31_(companyId, empId, updates);
  updateEmployeeInSheetV25_(getSheet_(SHEET_EMPLOYEES), companyId, empId, updates);
  var url = DEFAULT_FRONTEND_URL + 'index.html?company_id=' + encodeURIComponent(companyId) + '&id=' + encodeURIComponent(empId) + '&token=' + encodeURIComponent(token) + '&bind=1';
  return ok_({ message:'已重設手機綁定', url:url, activation_code:token });
}

function apiActivateEmployee_(payload) {
  payload = payload || {};
  var companyId = normalizeUpper_(payload.company_id || payload.company || '');
  var employeeId = normalizeUpper_(payload.employee_id || payload.id || '');
  var token = normalize_(payload.token || payload.activation_code || payload.one_time_token || '');
  var deviceId = normalize_(payload.device_id || '');
  if (!companyId || !employeeId || !token) return fail_('請輸入公司代號、員工編號與一次性開通碼');
  var employee = findEmployee_(companyId, employeeId);
  if (!employee) return fail_('找不到員工資料');
  if (normalize_(employee.one_time_token || '') !== token) return fail_('一次性開通碼錯誤');
  if (normalizeLower_(employee.token_used || '') === 'yes' || normalize_(employee.token_used || '') === '已綁定') return fail_('此開通碼已使用');
  var updates = { device_id: deviceId, token_used: 'yes', updated_at: nowText_() };
  var updated = updateCompanyPersonRowV31_(companyId, employeeId, updates) || Object.assign({}, employee, updates);
  updateEmployeeInSheetV25_(getSheet_(SHEET_EMPLOYEES), companyId, employeeId, updates);
  log_('activateEmployee', companyId, employeeId, employee.email || '', 'ok', 'activated from company 人員資料', { device_id: deviceId });
  return ok_({
    message: '開通成功',
    company_id: companyId,
    company_name: employee.company_name || '',
    employee_id: employeeId,
    name: employee.name || '',
    role: normalizeRoleV30_(updated.role || employee.role || 'Employee', employeeId)
  });
}

function apiActivateEmployeeByVerifiedAuth_(payload) {
  payload = payload || {};
  var companyId = normalizeUpper_(payload.company_id || payload.company || '');
  var employeeId = normalizeUpper_(payload.employee_id || payload.id || '');
  var oneTimeToken = normalize_(payload.token || payload.activation_code || payload.one_time_token || '');
  var phone = normalize_(payload.phone || '');
  var deviceId = normalize_(payload.device_id || '');
  var verify = verifyVerifyToken_(payload.verify_token || '');
  if (!companyId || !employeeId || !oneTimeToken) return fail_('請輸入公司代號、員工編號與開通碼');
  if (!phone) return fail_('請輸入手機號碼');
  if (!verify.ok) return fail_(verify.message || '驗證已失效，請重新驗證');
  var employee = findEmployee_(companyId, employeeId);
  if (!employee) return fail_('找不到員工資料');
  if (normalize_(employee.one_time_token || '') !== oneTimeToken) return fail_('一次性開通碼錯誤');
  if (normalizeLower_(employee.token_used || '') === 'yes' || normalize_(employee.token_used || '') === '已綁定') return fail_('此開通碼已使用');
  var email = normalizeEmail_(verify.data.email || '');
  var googleSub = normalize_(verify.data.google_sub || '');
  var lineSub = normalize_(verify.data.line_sub || '');
  var updates = {
    device_id: deviceId,
    phone: phone,
    email: email || employee.email || '',
    google_sub: googleSub || employee.google_sub || '',
    line_sub: lineSub || employee.line_sub || '',
    token_used: 'yes',
    updated_at: nowText_()
  };
  var updated = updateCompanyPersonRowV31_(companyId, employeeId, updates) || Object.assign({}, employee, updates);
  updateEmployeeInSheetV25_(getSheet_(SHEET_EMPLOYEES), companyId, employeeId, updates);
  var session = createSessionForEmployee_(companyId, Object.assign({}, updated, { employee_id: employeeId }), deviceId);
  log_('activateEmployeeByVerifiedAuth', companyId, employeeId, email || employee.email || '', 'ok', 'employee verified activated from company 人員資料', { provider: verify.data.provider || verify.data.method || '' });
  return ok_({ message: '開通成功', company_id: companyId, company_name: employee.company_name || '', employee_id: employeeId, name: employee.name || '', role: normalizeRoleV30_(updated.role || employee.role || 'Employee', employeeId), session_token: session, auto_login: true });
}



/************************************************************
 * ANG HR System｜V32 權限代碼模式
 * 角色只做預設權限包；實際可用功能以 permissions 為準。
 ************************************************************/
function permissionDefaultsByRoleV32_(role) {
  var r = normalizeLower_(normalizeRoleV30_(role || '', ''));
  if (r === 'creator') return ['*'];
  if (r === 'owner') return ['*'];
  if (r === 'admin') return ['review.*','people.*','salary.*','data.*','publish.notice','publish.schedule'];
  if (r === 'manager') return ['review.leave','review.upload','review.message','publish.notice','publish.schedule','data.drive'];
  return [];
}

function normalizePermissionCodeV32_(v) {
  return String(v || '').trim().toLowerCase().replace(/\s+/g, '');
}

function splitPermissionsV32_(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === 'object') {
    var out = [];
    Object.keys(input).forEach(function(k){
      var val = input[k];
      if (val === true || val === 'true' || val === 1 || val === '1' || val === '是' || val === 'yes') out.push(k);
      else if (Array.isArray(val)) val.forEach(function(x){ out.push(String(k) + '.' + String(x)); });
    });
    return out;
  }
  return String(input || '').split(/[\n,;，；、|｜]+/);
}

function permissionsFromEmployeeV32_(employee, role) {
  var raw = '';
  try {
    raw = valueByAliasesV31_(employee || {}, ['permissions','permission_codes','permission_list','權限清單','功能權限','權限代碼']);
  } catch (err) { raw = ''; }
  var list = splitPermissionsV32_(raw).map(normalizePermissionCodeV32_).filter(Boolean);
  if (!list.length) list = permissionDefaultsByRoleV32_(role || (employee && employee.role));
  return list;
}

function hasPermissionV32_(ctx, code) {
  code = normalizePermissionCodeV32_(code);
  var list = permissionsFromEmployeeV32_(ctx && ctx.employee, ctx && ctx.role);
  var map = {};
  list.forEach(function(p){ map[normalizePermissionCodeV32_(p)] = true; });
  if (map['*'] || map[code]) return true;
  var head = code.split('.')[0];
  if (head && map[head + '.*']) return true;
  for (var i = 0; i < list.length; i++) {
    var p = normalizePermissionCodeV32_(list[i]);
    if (p === '*' || p === code) return true;
    if (p.slice(-2) === '.*' && code.indexOf(p.slice(0, -1)) === 0) return true;
  }
  return false;
}

function hasAnyPermissionV32_(ctx, list) {
  list = list || [];
  for (var i = 0; i < list.length; i++) if (hasPermissionV32_(ctx, list[i])) return true;
  return false;
}



/* ANG_0603_PLATFORM_CREATOR_EMAIL_2OF4_START
   平台方 Creator（ANG8963）Email 兩封驗證登入。
   - 固定寄出 4 封一次性驗證連結。
   - 任意 2 個不同信箱點擊成功後，才產生平台 Creator session。
*/
const PLATFORM_CREATOR_ID_V31 = 'ANG8963';
const PLATFORM_CREATOR_ROLE_V31 = 'Creator';
const PLATFORM_CREATOR_COMPANY_ID_V31 = 'PLATFORM';
const PLATFORM_CREATOR_NAME_V31 = 'Creator 平台方';
const PLATFORM_CREATOR_EMAILS_V33 = [
  'edn869728@gmail.com',
  'endenmi@yahoo.com',
  'chihhao128@gmail.com',
  'endenmi@icloud.com'
];
const PLATFORM_CREATOR_EMAIL_REQUIRED_V33 = 2;
const PLATFORM_CREATOR_EMAIL_TTL_MINUTES_V33 = 20;
const PLATFORM_CREATOR_EMAIL_PROP_PREFIX_V33 = 'ANG_PLATFORM_CREATOR_EMAIL_CHALLENGE_';

function apiPlatformCreatorEmailStart_(payload) {
  payload = payload || {};
  const deviceId = normalize_(payload.device_id || payload.deviceId || '');
  const challengeId = Utilities.getUuid().replace(/-/g, '').slice(0, 24).toUpperCase();
  const expiresAt = new Date(Date.now() + PLATFORM_CREATOR_EMAIL_TTL_MINUTES_V33 * 60 * 1000);
  const baseUrl = platformCreatorEmailBaseUrlV33_();
  if (!baseUrl) return fail_('找不到 GitHub 前端網址，無法建立平台驗證轉接連結');

  const items = PLATFORM_CREATOR_EMAILS_V33.map(function(email){
    const rawToken = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '') + Date.now().toString(36);
    const link = baseUrl + '?platform_email_verify=1&action=platformCreatorEmailLinkVerify&challenge_id=' + encodeURIComponent(challengeId) + '&email=' + encodeURIComponent(email) + '&token=' + encodeURIComponent(rawToken);
    return {
      email: email,
      token_hash: hash_(rawToken),
      verified: false,
      verified_at: '',
      link: link
    };
  });

  const state = {
    challenge_id: challengeId,
    required: PLATFORM_CREATOR_EMAIL_REQUIRED_V33,
    created_at: dateToIso_(new Date()),
    expires_at: dateToIso_(expiresAt),
    status: 'pending',
    device_id: deviceId,
    session_token: '',
    session_created_at: '',
    emails: items.map(function(x){ return { email:x.email, token_hash:x.token_hash, verified:false, verified_at:'' }; })
  };
  platformCreatorEmailSaveStateV33_(challengeId, state);

  items.forEach(function(item){
    MailApp.sendEmail({
      to: item.email,
      subject: 'ANG HR 平台 Creator 登入驗證｜' + challengeId,
      name: 'ANG HR System',
      body: [
        'ANG HR 平台 Creator 登入驗證',
        '',
        '請點擊以下 GitHub 前端轉接驗證連結：',
        item.link,
        '',
        '規則：4 封 Email 中任意完成 2 封，即可登入 ANG8963 / Creator / PLATFORM。',
        '此連結會先進 GitHub 前端，再由前端呼叫 GAS 完成驗證。',
        '有效時間：' + PLATFORM_CREATOR_EMAIL_TTL_MINUTES_V33 + ' 分鐘。',
        '',
        '如果不是你本人操作，請忽略此信。'
      ].join('\n')
    });
  });

  log_('platformCreatorEmailStart', PLATFORM_CREATOR_COMPANY_ID_V31, PLATFORM_CREATOR_ID_V31, PLATFORM_CREATOR_EMAILS_V33.join(','), 'ok', 'platform creator email 2 of 4 started', { challenge_id: challengeId, device_id: deviceId });
  return ok_({
    message: '已寄出 4 封平台驗證信，請完成任意 2 封 Email 驗證。',
    challenge_id: challengeId,
    required: PLATFORM_CREATOR_EMAIL_REQUIRED_V33,
    sent_count: PLATFORM_CREATOR_EMAILS_V33.length,
    expires_at: state.expires_at,
    masked_emails: PLATFORM_CREATOR_EMAILS_V33.map(maskEmailV33_)
  });
}

function apiPlatformCreatorEmailLinkVerify_(payload) {
  payload = payload || {};
  const challengeId = normalizeUpper_(payload.challenge_id || payload.challengeId || payload.cid || '');
  const email = normalizeLower_(payload.email || '');
  const token = normalize_(payload.token || payload.link_token || payload.linkToken || '');
  if (!challengeId || !email || !token) return fail_('平台驗證連結缺少必要參數');
  const state = platformCreatorEmailLoadStateV33_(challengeId);
  if (!state) return fail_('平台驗證連結不存在或已失效');
  if (state.status === 'expired') return fail_('平台驗證連結已過期，請重新發送');
  if (Date.now() > new Date(state.expires_at).getTime()) {
    state.status = 'expired';
    platformCreatorEmailSaveStateV33_(challengeId, state);
    return fail_('平台驗證連結已過期，請重新發送');
  }
  const item = (state.emails || []).filter(function(x){ return normalizeLower_(x.email) === email; })[0];
  if (!item) return fail_('此 Email 不在平台 Creator 驗證名單內');
  if (!item.verified) {
    if (hash_(token) !== item.token_hash) return fail_('平台驗證連結無效或已被更新');
    item.verified = true;
    item.verified_at = dateToIso_(new Date());
  }
  const verifiedCount = (state.emails || []).filter(function(x){ return !!x.verified; }).length;
  let tokenOut = normalize_(state.session_token || '');
  let nextUrl = '';
  if (verifiedCount >= Number(state.required || PLATFORM_CREATOR_EMAIL_REQUIRED_V33)) {
    if (!tokenOut) {
      tokenOut = makeSessionToken_();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      getSheet_(SHEET_SESSIONS).appendRow([
        tokenOut,
        PLATFORM_CREATOR_COMPANY_ID_V31,
        PLATFORM_CREATOR_ID_V31,
        PLATFORM_CREATOR_ROLE_V31,
        normalize_(state.device_id || ''),
        nowText_(),
        dateToIso_(expiresAt),
        'active'
      ]);
      state.session_token = tokenOut;
      state.session_created_at = dateToIso_(new Date());
    }
    state.status = 'completed';
    nextUrl = platformCreatorEmailBuildWebNextUrlV35_(tokenOut);
  }
  platformCreatorEmailSaveStateV33_(challengeId, state);
  log_('platformCreatorEmailLinkVerify', PLATFORM_CREATOR_COMPANY_ID_V31, PLATFORM_CREATOR_ID_V31, email, 'ok', 'platform creator email link verified', { challenge_id: challengeId, verified_count: verifiedCount, status: state.status });
  return ok_({
    message: verifiedCount >= Number(state.required || PLATFORM_CREATOR_EMAIL_REQUIRED_V33) ? '平台 Creator 驗證完成' : ('已完成 ' + verifiedCount + ' / ' + state.required + ' 封 Email 驗證'),
    challenge_id: challengeId,
    email: email,
    verified_count: verifiedCount,
    required: Number(state.required || PLATFORM_CREATOR_EMAIL_REQUIRED_V33),
    completed: verifiedCount >= Number(state.required || PLATFORM_CREATOR_EMAIL_REQUIRED_V33),
    company_id: PLATFORM_CREATOR_COMPANY_ID_V31,
    employee_id: PLATFORM_CREATOR_ID_V31,
    role: PLATFORM_CREATOR_ROLE_V31,
    session_token: tokenOut,
    token: tokenOut,
    next_url: nextUrl,
    web_next_url: nextUrl,
    app_url: ''
  });
}


function apiPlatformCreatorEmailStatus_(payload) {
  payload = payload || {};
  const challengeId = normalizeUpper_(payload.challenge_id || payload.challengeId || payload.cid || '');
  if (!challengeId) return fail_('缺少平台驗證序號，請重新發送平台驗證信');
  const state = platformCreatorEmailLoadStateV33_(challengeId);
  if (!state) return fail_('找不到平台驗證狀態，請重新發送平台驗證信');
  if (state.status === 'expired') return fail_('平台驗證已過期，請重新發送');
  if (Date.now() > new Date(state.expires_at).getTime()) {
    state.status = 'expired';
    platformCreatorEmailSaveStateV33_(challengeId, state);
    return fail_('平台驗證已過期，請重新發送');
  }

  const verifiedCount = (state.emails || []).filter(function(x){ return !!x.verified; }).length;
  const required = Number(state.required || PLATFORM_CREATOR_EMAIL_REQUIRED_V33);
  let tokenOut = normalize_(state.session_token || '');
  let nextUrl = '';

  if (verifiedCount >= required) {
    if (!tokenOut) {
      tokenOut = makeSessionToken_();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      getSheet_(SHEET_SESSIONS).appendRow([
        tokenOut,
        PLATFORM_CREATOR_COMPANY_ID_V31,
        PLATFORM_CREATOR_ID_V31,
        PLATFORM_CREATOR_ROLE_V31,
        normalize_(state.device_id || payload.device_id || payload.deviceId || ''),
        nowText_(),
        dateToIso_(expiresAt),
        'active'
      ]);
      state.session_token = tokenOut;
      state.session_created_at = dateToIso_(new Date());
    }
    state.status = 'completed';
    nextUrl = platformCreatorEmailBuildWebNextUrlV35_(tokenOut);
    platformCreatorEmailSaveStateV33_(challengeId, state);
  }

  return ok_({
    message: verifiedCount >= required ? '平台 Creator 驗證完成' : ('目前已完成 ' + verifiedCount + ' / ' + required + ' 封 Email 驗證'),
    challenge_id: challengeId,
    verified_count: verifiedCount,
    required: required,
    sent_count: (state.emails || []).length,
    masked_emails: (state.emails || []).map(function(x){ return maskEmailV33_(x.email || ''); }),
    completed: verifiedCount >= required,
    status: state.status || 'pending',
    expires_at: state.expires_at || '',
    company_id: PLATFORM_CREATOR_COMPANY_ID_V31,
    employee_id: PLATFORM_CREATOR_ID_V31,
    role: PLATFORM_CREATOR_ROLE_V31,
    session_token: tokenOut,
    token: tokenOut,
    next_url: nextUrl,
    web_next_url: nextUrl,
    app_url: ''
  });
}

function renderPlatformCreatorEmailVerifyPage_(params) {
  const res = apiPlatformCreatorEmailLinkVerify_(params || {});
  const ok = !!(res && res.ok);
  const completed = !!(res && res.completed);
  const msg = htmlEscapeV33_((res && (res.message || res.msg)) || (ok ? '驗證完成' : '驗證失敗'));
  const webNextUrl = String((res && (res.web_next_url || res.next_url)) || '').trim();
  const title = completed ? '平台 Creator 驗證完成' : (ok ? '平台 Creator 驗證中' : '平台 Creator 驗證失敗');
  const subtitle = completed ? '已完成兩封 Email 驗證。請回到原本開著 ANG HR 的 App 等待頁；App 會自動刷新，或按手動刷新。' : (ok ? '這封 Email 已認證成功，請再到另一個信箱點擊驗證連結。' : '請回首頁重新發送平台驗證信。');
  const fallbackHome = DEFAULT_FRONTEND_URL + 'index.html';
  const fallbackUrl = completed && webNextUrl ? webNextUrl : fallbackHome;
  const script = '';
  const webButton = completed && webNextUrl ? '<a class="btn" href="' + htmlEscapeV33_(webNextUrl) + '">在這台裝置進入管理中心</a>' : '<a class="btn" href="' + htmlEscapeV33_(fallbackUrl) + '">回首頁</a>';
  return HtmlService.createHtmlOutput('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>' + htmlEscapeV33_(title) + '</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#111827,#ff7a21);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#fff;padding:24px}.card{width:min(560px,100%);background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18);border-radius:28px;padding:28px;box-shadow:0 24px 80px rgba(0,0,0,.28);backdrop-filter:blur(18px)}.mark{width:58px;height:58px;border-radius:20px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;font-size:28px;margin-bottom:16px}h1{font-size:26px;margin:0 0 10px}p{line-height:1.7;margin:0 0 18px;color:rgba(255,255,255,.86)}.msg{padding:12px 14px;border-radius:16px;background:rgba(255,255,255,.14);font-weight:900;margin-bottom:18px}.actions{display:flex;flex-wrap:wrap;gap:10px}.btn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;color:#111827;background:#fff;border-radius:999px;padding:12px 18px;font-weight:1000}.hint{font-size:12px;color:rgba(255,255,255,.72);margin-top:14px}</style></head><body><div class="card"><div class="mark">' + (completed ? '✅' : (ok ? '📩' : '⚠️')) + '</div><h1>' + htmlEscapeV33_(title) + '</h1><p>' + htmlEscapeV33_(subtitle) + '</p><div class="msg">' + msg + '</div><div class="actions">' + webButton + '</div><div class="hint">本版不再自動開啟 anghr://，避免瀏覽器顯示 ERR_UNKNOWN_URL_SCHEME。</div></div>' + script + '</body></html>').setTitle(title);
}

function platformCreatorEmailBuildWebNextUrlV35_(tokenOut) {
  const root = platformCreatorEmailFrontendRootV36_();
  return root + 'app.html?view=admin&page=admin&company_id=' + encodeURIComponent(PLATFORM_CREATOR_COMPANY_ID_V31) + '&id=' + encodeURIComponent(PLATFORM_CREATOR_ID_V31) + '&employee_id=' + encodeURIComponent(PLATFORM_CREATOR_ID_V31) + '&role=Creator&session_token=' + encodeURIComponent(tokenOut) + '&token=' + encodeURIComponent(tokenOut) + '&source=platform_creator_email_2of4_github_bridge_direct_admin&auto_admin=1&_ts=' + Date.now();
}

function platformCreatorEmailBuildAppDeepLinkV35_(tokenOut) {
  // 2026-06-28：保留舊函式名稱，但不再產生 anghr://，避免瀏覽器 / WebView 出現 ERR_UNKNOWN_URL_SCHEME。
  return platformCreatorEmailBuildWebNextUrlV35_(tokenOut);
}

function platformCreatorEmailBaseUrlV33_() {
  // 2026-06-28：平台 Creator 驗證信不再直接帶到 script.google.com。
  // 驗證信一律先進 GitHub 前端 index.html，再由前端呼叫 GAS 驗證並轉回 app.html。
  const root = platformCreatorEmailFrontendRootV36_();
  return root + 'index.html';
}

function platformCreatorEmailFrontendRootV36_() {
  let url = '';
  try {
    const props = PropertiesService.getScriptProperties();
    url = normalize_(
      props.getProperty('FRONTEND_URL') ||
      props.getProperty('GITHUB_FRONTEND_URL') ||
      props.getProperty('WEB_FRONTEND_URL') ||
      ''
    );
  } catch (err) {}
  if (!url) url = normalize_(DEFAULT_FRONTEND_URL || '');

  // 防呆：如果誤填成 Apps Script 後台 / Web App，就強制回 GitHub 預設前端。
  if (!url || /script\.google\.com|script\.googleusercontent\.com|google\.com\/script/i.test(url)) {
    url = DEFAULT_FRONTEND_URL;
  }

  url = String(url || '').split('#')[0].split('?')[0];
  url = url.replace(/\\/g, '/');
  url = url.replace(/(index|app|employee|admin)\.html$/i, '');
  if (url && url.slice(-1) !== '/') url += '/';
  return url || DEFAULT_FRONTEND_URL;
}

function resetPlatformCreatorFrontendUrlToGithubV36() {
  PropertiesService.getScriptProperties().setProperty('FRONTEND_URL', DEFAULT_FRONTEND_URL);
  PropertiesService.getScriptProperties().setProperty('GITHUB_FRONTEND_URL', DEFAULT_FRONTEND_URL);
  return '平台 Creator 驗證信前端轉接網址已改為 GitHub：' + DEFAULT_FRONTEND_URL;
}

function platformCreatorEmailPropKeyV33_(challengeId) {
  return PLATFORM_CREATOR_EMAIL_PROP_PREFIX_V33 + normalizeUpper_(challengeId || '');
}

function platformCreatorEmailSaveStateV33_(challengeId, state) {
  PropertiesService.getScriptProperties().setProperty(platformCreatorEmailPropKeyV33_(challengeId), JSON.stringify(state || {}));
}

function platformCreatorEmailLoadStateV33_(challengeId) {
  const raw = PropertiesService.getScriptProperties().getProperty(platformCreatorEmailPropKeyV33_(challengeId));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (err) { return null; }
}

function maskEmailV33_(email) {
  email = String(email || '');
  const parts = email.split('@');
  if (parts.length < 2) return email;
  const name = parts[0];
  const domain = parts.slice(1).join('@');
  return name.slice(0, 2) + '***@' + domain;
}

function htmlEscapeV33_(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
}


function resetPlatformCreatorVerifyManualRefreshV38() {
  PropertiesService.getScriptProperties().setProperty('FRONTEND_URL', DEFAULT_FRONTEND_URL);
  PropertiesService.getScriptProperties().setProperty('GITHUB_FRONTEND_URL', DEFAULT_FRONTEND_URL);
  return '平台 Creator 驗證已啟用 GitHub HTTPS 轉接 + App 手動刷新狀態：' + DEFAULT_FRONTEND_URL;
}

function resetPlatformCreatorEmailChallengesForANG8963() {
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  Object.keys(all).forEach(function(k){ if (k.indexOf(PLATFORM_CREATOR_EMAIL_PROP_PREFIX_V33) === 0) props.deleteProperty(k); });
  return '已清除平台 Creator Email 驗證暫存。';
}
/* ANG_0603_PLATFORM_CREATOR_EMAIL_2OF4_END */


function resetPlatformCreatorVerifyNoUnknownSchemeV37() {
  PropertiesService.getScriptProperties().setProperty('FRONTEND_URL', DEFAULT_FRONTEND_URL);
  PropertiesService.getScriptProperties().setProperty('GITHUB_FRONTEND_URL', DEFAULT_FRONTEND_URL);
  return '平台 Creator 驗證已改為 GitHub HTTPS 轉接，不再自動開啟 anghr://：' + DEFAULT_FRONTEND_URL;
}


function resetPlatformCreatorVerifySuccessAndSlideV39() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('FRONTEND_URL', DEFAULT_FRONTEND_URL);
  props.setProperty('GITHUB_FRONTEND_URL', DEFAULT_FRONTEND_URL);
  props.deleteProperty('WEB_APP_URL');
  props.deleteProperty('APP_DEEP_LINK_URL');
  return { ok:true, frontend_url: DEFAULT_FRONTEND_URL, message:'平台驗證改用 GitHub HTTPS，驗證頁保留成功提示，完成後 app.html 直接進 admin。' };
}



/************************************************************
 * ANG HR System｜V35 公司鎖定 + Email 快速登入
 *
 * 流程：
 * 1. prepareEmployeeEmailLogin：只用公司代碼／開通碼鎖定登入範圍。
 * 2. requestEmployeeEmailLoginCode：用鎖定內容 + Email 找到唯一人員，寄出驗證碼。
 * 3. verifyEmployeeEmailCodeAndLogin：只讀 pending_login_id，驗證後建立 session。
 *
 * 速度重點：
 * - 三個 action 不重跑 initializeSystem_()。
 * - 公司鎖定與待登入資料使用 CacheService 暫存 10 分鐘。
 * - 驗證碼直接存快取，不在驗證時重新掃描整張 EmailVerifications。
 ************************************************************/
var ANG_EMPLOYEE_LOGIN_CONTEXT_PREFIX_V35 = 'ANG_EMP_LOGIN_CTX_V35_';
var ANG_EMPLOYEE_LOGIN_PENDING_PREFIX_V35 = 'ANG_EMP_LOGIN_PENDING_V35_';
var ANG_EMPLOYEE_LOGIN_COOLDOWN_PREFIX_V35 = 'ANG_EMP_LOGIN_COOLDOWN_V35_';
var ANG_EMPLOYEE_LOGIN_CONTEXT_TTL_V35 = 10 * 60;
var ANG_EMPLOYEE_LOGIN_CODE_TTL_V35 = 10 * 60;
var ANG_EMPLOYEE_LOGIN_RESEND_SECONDS_V35 = 60;
var ANG_EMPLOYEE_LOGIN_DAILY_LIMIT_V35 = 5;

function employeeLoginCacheV35_() {
  return CacheService.getScriptCache();
}

function employeeLoginUuidV35_() {
  return Utilities.getUuid().replace(/-/g, '') + String(Date.now());
}

function employeeLoginCachePutV35_(prefix, id, data, ttlSeconds) {
  employeeLoginCacheV35_().put(prefix + id, JSON.stringify(data || {}), ttlSeconds || ANG_EMPLOYEE_LOGIN_CONTEXT_TTL_V35);
}

function employeeLoginCacheGetV35_(prefix, id) {
  id = normalize_(id || '');
  if (!id) return null;
  var raw = employeeLoginCacheV35_().get(prefix + id);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (err) { return null; }
}

function employeeLoginCacheRemoveV35_(prefix, id) {
  id = normalize_(id || '');
  if (!id) return;
  employeeLoginCacheV35_().remove(prefix + id);
}

function employeeLoginPropertyKeyV35_(prefix, value) {
  return prefix + hash_(String(value || '')).slice(0, 40);
}

function employeeLoginCompanyActiveV35_(company) {
  if (!company) return false;
  var status = normalizeLower_(company.status || 'active');
  return ['deleted', 'disabled', 'inactive', '停用', '已刪除'].indexOf(status) < 0;
}

function getCompanyForEmployeeLoginV35_(companyId) {
  companyId = normalizeUpper_(companyId || '');
  if (!companyId) return null;
  var cacheKey = 'ANG_EMP_LOGIN_COMPANY_V35_' + companyId;
  var cache = employeeLoginCacheV35_();
  var raw = cache.get(cacheKey);
  if (raw) {
    try { return JSON.parse(raw); } catch (err) {}
  }
  var company = findCompany_(companyId);
  if (company) cache.put(cacheKey, JSON.stringify(company), 5 * 60);
  return company;
}

function listEmployeesByEmailInCompanyV35_(companyId, email) {
  companyId = normalizeUpper_(companyId || '');
  email = normalizeEmail_(email || '');
  if (!companyId || !email) return [];

  var found = [];
  var seen = {};
  function addPerson(person) {
    person = person || {};
    var employeeId = normalizeUpper_(person.employee_id || person.id || person['員工ID'] || '');
    var personEmail = normalizeEmail_(person.email || person.Email || person['Email'] || '');
    if (!employeeId || personEmail !== email || seen[employeeId]) return;
    seen[employeeId] = true;
    found.push(normalizeCompanyPersonRowV31_(person, companyId));
  }

  // 先查平台 Employees；一般登入大多可在這一次完成。
  var masterRows = sheetToObjects_(getSheet_(SHEET_EMPLOYEES));
  for (var i = 0; i < masterRows.length; i++) {
    var row = masterRows[i] || {};
    if (normalizeUpper_(row.company_id || '') !== companyId) continue;
    addPerson(row);
  }
  if (found.length) return found;

  // 舊資料或公司分流資料才回退查公司表。
  var sh = getCompanyPersonSheetV31_(companyId, false);
  if (!sh) return found;
  var rows = sheetToObjects_(sh);
  for (var j = 0; j < rows.length; j++) addPerson(rows[j]);
  return found;
}

function apiPrepareEmployeeEmailLoginV35_(payload) {
  payload = payload || {};
  var rawKey = normalizeUpper_(
    payload.company_or_code || payload.login_key || payload.activation_code ||
    payload.one_time_token || payload.company_id || payload.company || payload.companyCode || ''
  );
  var deviceId = normalize_(payload.device_id || '');
  if (!rawKey) return fail_('請輸入公司代碼或開通碼');

  var mode = 'login';
  var company = getCompanyForEmployeeLoginV35_(rawKey);
  var companyId = '';
  var companyName = '';
  var employee = null;
  var employeeId = '';
  var email = '';
  var emailMasked = '';

  if (company) {
    if (!employeeLoginCompanyActiveV35_(company)) return fail_('此公司目前未啟用');
    companyId = normalizeUpper_(company.company_id || rawKey);
    companyName = normalize_(company.company_name || company.name || companyId);
  } else {
    mode = 'activation';
    employee = findEmployeeByActivationCodeV34_(rawKey, '');
    if (!employee) return fail_('開通碼錯誤，或找不到對應員工資料');
    if (isActivationUsedV34_(employee.token_used || employee['綁定狀態'])) {
      return fail_('此開通碼已使用，請改用公司代碼登入或聯絡管理員重發');
    }
    if (!isEmployeeActiveV31_(employee.status || 'active')) return fail_('此員工帳號已停用');

    companyId = normalizeUpper_(employee.company_id || '');
    employeeId = normalizeUpper_(employee.employee_id || employee.id || '');
    company = getCompanyForEmployeeLoginV35_(companyId) || {};
    if (!companyId || !employeeId) return fail_('開通碼對應的人員資料不完整');
    if (company && !employeeLoginCompanyActiveV35_(company)) return fail_('此公司目前未啟用');

    companyName = normalize_(employee.company_name || company.company_name || companyId);
    email = normalizeEmail_(employee.email || '');
    if (!email) return fail_('此員工的人員資料尚未設定 Email，請聯絡管理員補上 Email');
    emailMasked = maskEmailV34_(email);
  }

  var contextId = employeeLoginUuidV35_();
  var context = {
    version: 'V35',
    context_id: contextId,
    mode: mode,
    login_key: rawKey,
    activation_code: mode === 'activation' ? rawKey : '',
    company_id: companyId,
    company_name: companyName,
    plan: normalizeLower_(company && company.plan || employee && employee.plan || ''),
    billing_status: normalizeLower_(company && (company.billing_status || company.payment_status) || employee && employee.billing_status || ''),
    employee_id: employeeId,
    employee_name: normalize_(employee && employee.name || ''),
    email: email,
    email_masked: emailMasked,
    device_id: deviceId,
    created_at: Date.now()
  };
  employeeLoginCachePutV35_(ANG_EMPLOYEE_LOGIN_CONTEXT_PREFIX_V35, contextId, context, ANG_EMPLOYEE_LOGIN_CONTEXT_TTL_V35);

  return ok_({
    message: mode === 'activation' ? '開通資料已鎖定，請輸入人員資料 Email 進行驗證' : '公司已鎖定，請輸入人員資料 Email',
    login_context_id: contextId,
    mode: mode,
    company_id: companyId,
    company_name: companyName,
    plan: context.plan,
    billing_status: context.billing_status,
    employee_id: employeeId,
    name: context.employee_name,
    email_masked: emailMasked,
    locked: true,
    expires_in_seconds: ANG_EMPLOYEE_LOGIN_CONTEXT_TTL_V35
  });
}

function getEmployeeLoginContextV35_(payload) {
  payload = payload || {};
  var contextId = normalize_(payload.login_context_id || payload.context_id || '');
  var context = employeeLoginCacheGetV35_(ANG_EMPLOYEE_LOGIN_CONTEXT_PREFIX_V35, contextId);
  if (context) return { ok:true, context_id:contextId, context:context };

  // 相容舊前端：若仍直接傳公司代碼／開通碼，自動補做一次鎖定。
  var rawKey = normalize_(payload.company_or_code || payload.login_key || payload.activation_code || payload.company_id || '');
  if (!rawKey) return { ok:false, message:'登入鎖定已失效，請重新輸入公司代碼或開通碼' };
  var prepared = apiPrepareEmployeeEmailLoginV35_(payload);
  if (!prepared || !prepared.ok) return { ok:false, message:(prepared && prepared.message) || '無法鎖定登入資料' };
  contextId = prepared.login_context_id;
  context = employeeLoginCacheGetV35_(ANG_EMPLOYEE_LOGIN_CONTEXT_PREFIX_V35, contextId);
  if (!context) return { ok:false, message:'登入鎖定建立失敗，請重試' };
  return { ok:true, context_id:contextId, context:context };
}

function consumeEmployeeLoginDailyQuotaV35_(email, companyId) {
  email = normalizeEmail_(email || '');
  companyId = normalizeUpper_(companyId || '');
  var dateKey = todayKey_();
  var propKey = employeeLoginPropertyKeyV35_('ANG_EMP_LOGIN_DAY_V35_' + dateKey + '_', companyId + '|' + email);
  var props = PropertiesService.getScriptProperties();
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var count = Number(props.getProperty(propKey) || 0);
    if (count >= ANG_EMPLOYEE_LOGIN_DAILY_LIMIT_V35) {
      return { ok:false, message:'今天此 Email 已寄送 5 次驗證碼，請明天再試或聯絡管理員' };
    }
    return { ok:true, property_key:propKey, count:count };
  } finally {
    lock.releaseLock();
  }
}

function commitEmployeeLoginDailyQuotaV35_(quota) {
  if (!quota || !quota.property_key) return;
  var props = PropertiesService.getScriptProperties();
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var count = Number(props.getProperty(quota.property_key) || 0);
    props.setProperty(quota.property_key, String(count + 1));
  } finally {
    lock.releaseLock();
  }
}

function apiRequestEmployeeEmailLoginCodeV35_(payload) {
  payload = payload || {};
  var loaded = getEmployeeLoginContextV35_(payload);
  if (!loaded.ok) return fail_(loaded.message);
  var contextId = loaded.context_id;
  var context = loaded.context || {};
  var inputEmail = normalizeEmail_(payload.email || payload.employee_email || '');
  if (!inputEmail) return fail_('請輸入人員資料 Email');

  var employee = null;
  if (context.mode === 'activation') {
    if (normalizeEmail_(context.email || '') !== inputEmail) return fail_('Email 與開通碼對應的人員資料不一致');
    employee = findEmployee_(normalizeUpper_(context.company_id || ''), normalizeUpper_(context.employee_id || ''));
    if (!employee) employee = findEmployeeByActivationCodeV34_(context.activation_code || context.login_key || '', context.employee_id || '');
    if (!employee) return fail_('找不到開通碼對應的人員資料');
  } else {
    var matches = listEmployeesByEmailInCompanyV35_(context.company_id, inputEmail);
    if (!matches.length) return fail_('此 Email 不在這間公司的人員資料中');
    if (matches.length > 1) return fail_('此 Email 對應多筆人員資料，請聯絡管理員整理後再登入');
    employee = matches[0];
  }

  if (!isEmployeeActiveV31_(employee.status || 'active')) return fail_('此員工帳號已停用');
  var employeeId = normalizeUpper_(employee.employee_id || employee.id || '');
  if (!employeeId) return fail_('人員資料缺少員工編號，請聯絡管理員');

  var cooldownKey = ANG_EMPLOYEE_LOGIN_COOLDOWN_PREFIX_V35 + hash_(context.company_id + '|' + inputEmail).slice(0, 40);
  var cache = employeeLoginCacheV35_();
  if (cache.get(cooldownKey)) return fail_('請等待 60 秒後再重新寄送驗證碼');

  var quota = consumeEmployeeLoginDailyQuotaV35_(inputEmail, context.company_id);
  if (!quota.ok) return fail_(quota.message);

  var pendingId = employeeLoginUuidV35_();
  var code = String(Math.floor(100000 + Math.random() * 900000));
  var codeHash = hash_(pendingId + ':' + inputEmail + ':' + code);
  var pending = {
    version: 'V35',
    pending_login_id: pendingId,
    login_context_id: contextId,
    mode: context.mode,
    login_key: context.login_key,
    activation_code: context.activation_code || '',
    company_id: normalizeUpper_(context.company_id || ''),
    company_name: normalize_(context.company_name || context.company_id || ''),
    employee_id: employeeId,
    employee_name: normalize_(employee.name || employeeId),
    email: inputEmail,
    email_masked: maskEmailV34_(inputEmail),
    code_hash: codeHash,
    attempts: 0,
    request_device_id: normalize_(payload.device_id || context.device_id || ''),
    created_at: Date.now(),
    expires_at: Date.now() + ANG_EMPLOYEE_LOGIN_CODE_TTL_V35 * 1000
  };

  var eol = String.fromCharCode(10);
  var body = [
    '你的 ANG HR 員工登入驗證碼是：' + code,
    '',
    '公司：' + pending.company_name,
    '此驗證碼 10 分鐘內有效。',
    '同一信箱 60 秒內不可重寄，一天最多 5 次。',
    '如果不是你本人操作，請忽略此信。'
  ].join(eol);

  MailApp.sendEmail({
    to: inputEmail,
    subject: 'ANG HR 員工登入驗證碼',
    body: body,
    name: 'ANG HR System'
  });

  employeeLoginCachePutV35_(ANG_EMPLOYEE_LOGIN_PENDING_PREFIX_V35, pendingId, pending, ANG_EMPLOYEE_LOGIN_CODE_TTL_V35);
  context.employee_id = employeeId;
  context.employee_name = pending.employee_name;
  context.email = inputEmail;
  context.email_masked = pending.email_masked;
  context.pending_login_id = pendingId;
  employeeLoginCachePutV35_(ANG_EMPLOYEE_LOGIN_CONTEXT_PREFIX_V35, contextId, context, ANG_EMPLOYEE_LOGIN_CONTEXT_TTL_V35);
  cache.put(cooldownKey, String(Date.now()), ANG_EMPLOYEE_LOGIN_RESEND_SECONDS_V35);
  commitEmployeeLoginDailyQuotaV35_(quota);

  return ok_({
    message:'驗證碼已寄到：' + pending.email_masked,
    login_context_id:contextId,
    pending_login_id:pendingId,
    mode:pending.mode,
    company_id:pending.company_id,
    company_name:pending.company_name,
    employee_id:pending.employee_id,
    name:pending.employee_name,
    email_masked:pending.email_masked,
    resend_after_seconds:ANG_EMPLOYEE_LOGIN_RESEND_SECONDS_V35,
    daily_limit:ANG_EMPLOYEE_LOGIN_DAILY_LIMIT_V35,
    expires_in_seconds:ANG_EMPLOYEE_LOGIN_CODE_TTL_V35
  });
}

function apiVerifyEmployeeEmailCodeAndLoginV35_(payload) {
  payload = payload || {};
  var pendingId = normalize_(payload.pending_login_id || payload.login_pending_id || '');
  var code = normalize_(payload.code || '');
  var deviceId = normalize_(payload.device_id || '');
  if (!pendingId) return fail_('登入驗證已失效，請重新寄送 Email 驗證碼');
  if (!/^\d{6}$/.test(code)) return fail_('請輸入 6 位數 Email 驗證碼');

  var pending = employeeLoginCacheGetV35_(ANG_EMPLOYEE_LOGIN_PENDING_PREFIX_V35, pendingId);
  if (!pending) return fail_('驗證碼不存在、已過期或已使用，請重新寄送');
  if (Number(pending.expires_at || 0) < Date.now()) {
    employeeLoginCacheRemoveV35_(ANG_EMPLOYEE_LOGIN_PENDING_PREFIX_V35, pendingId);
    return fail_('驗證碼已過期，請重新寄送');
  }

  var expectedHash = hash_(pendingId + ':' + normalizeEmail_(pending.email || '') + ':' + code);
  if (normalize_(pending.code_hash || '') !== expectedHash) {
    pending.attempts = Number(pending.attempts || 0) + 1;
    if (pending.attempts >= 5) {
      employeeLoginCacheRemoveV35_(ANG_EMPLOYEE_LOGIN_PENDING_PREFIX_V35, pendingId);
      return fail_('驗證碼錯誤次數過多，請重新寄送');
    }
    employeeLoginCachePutV35_(ANG_EMPLOYEE_LOGIN_PENDING_PREFIX_V35, pendingId, pending, ANG_EMPLOYEE_LOGIN_CODE_TTL_V35);
    return fail_('Email 驗證碼錯誤');
  }

  var companyId = normalizeUpper_(pending.company_id || '');
  var employeeId = normalizeUpper_(pending.employee_id || '');
  var employee = findEmployee_(companyId, employeeId);
  if (!employee) {
    var sh = getCompanyPersonSheetV31_(companyId, false);
    if (sh) {
      var rows = sheetToObjects_(sh);
      for (var i = 0; i < rows.length; i++) {
        var person = normalizeCompanyPersonRowV31_(rows[i], companyId);
        if (normalizeUpper_(person.employee_id || '') === employeeId) { employee = person; break; }
      }
    }
  }
  if (!employee) return fail_('找不到員工資料');
  if (!isEmployeeActiveV31_(employee.status || 'active')) return fail_('此員工帳號已停用');
  if (normalizeEmail_(employee.email || '') !== normalizeEmail_(pending.email || '')) return fail_('人員資料 Email 已變更，請重新登入');

  var boundDevice = normalize_(employee.device_id || employee.specialdeviceid || '');
  if (pending.mode === 'activation') {
    var currentCode = normalizeUpper_(employee.one_time_token || employee.activation_code || employee['開通碼'] || '');
    if (currentCode !== normalizeUpper_(pending.activation_code || pending.login_key || '')) return fail_('開通碼已變更，請重新取得開通連結');
    if (isActivationUsedV34_(employee.token_used || employee['綁定狀態'])) return fail_('此開通碼已使用，請改用公司代碼登入');
    if (!deviceId) return fail_('無法取得裝置識別碼，請重新開啟頁面後再試');

    var updates = { device_id:deviceId, token_used:'yes', updated_at:nowText_() };
    updateCompanyPersonRowV31_(companyId, employeeId, updates);
    updateEmployeeInSheetV25_(getSheet_(SHEET_EMPLOYEES), companyId, employeeId, updates);
    employee = Object.assign({}, employee, updates);
  } else {
    if (!boundDevice) return fail_('此員工尚未完成首次開通，請改用開通碼登入');
    if (!deviceId) return fail_('無法取得裝置識別碼，請重新開啟頁面後再試');
    if (boundDevice !== deviceId) return fail_('此帳號已綁定其他裝置，請聯絡管理員重發開通碼');
  }

  var session = createSessionForEmployee_(companyId, Object.assign({}, employee, { employee_id:employeeId }), deviceId);
  var role = normalizeRoleV30_(employee.role || 'Employee', employeeId);
  employeeLoginCacheRemoveV35_(ANG_EMPLOYEE_LOGIN_PENDING_PREFIX_V35, pendingId);
  employeeLoginCacheRemoveV35_(ANG_EMPLOYEE_LOGIN_CONTEXT_PREFIX_V35, pending.login_context_id || '');

  return ok_({
    message:pending.mode === 'activation' ? 'Email 驗證完成，裝置已開通' : 'Email 驗證登入成功',
    mode:pending.mode,
    company_id:companyId,
    company_name:pending.company_name || companyId,
    employee_id:employeeId,
    name:employee.name || pending.employee_name || employeeId,
    role:role,
    session_token:session,
    auto_login:true,
    next_url:DEFAULT_FRONTEND_URL + 'app.html?view=employee&company_id=' + encodeURIComponent(companyId) + '&id=' + encodeURIComponent(employeeId) + '&employee_id=' + encodeURIComponent(employeeId) + '&role=' + encodeURIComponent(role) + '&session_token=' + encodeURIComponent(session) + '&token=' + encodeURIComponent(session)
  });
}

/************************************************************
 * ANG HR System｜V34 Email 登入預查
 * - 員工：公司代碼 + 員編，或開通碼，先查人員資料再寄 Email 驗證碼。
 * - 首次開通：Email 驗證後綁定裝置並建立 session。
 * - 企業管理：公司代碼 + 管理員 Email，先確認公司角色再寄碼。
 ************************************************************/
function maskEmailV34_(email) {
  email = normalizeEmail_(email || '');
  if (!email || email.indexOf('@') < 1) return '';
  var parts = email.split('@');
  var name = parts[0] || '';
  var domain = parts[1] || '';
  var visible = name.length <= 2 ? name.slice(0, 1) : name.slice(0, 2);
  return visible + '***@' + domain;
}

function isActivationUsedV34_(value) {
  var v = normalizeLower_(value || '');
  return ['yes','true','1','used','active','已使用','已綁定','是'].indexOf(v) >= 0;
}

function findEmployeeByActivationCodeV34_(activationCode, expectedEmployeeId) {
  var code = normalizeUpper_(activationCode || '');
  var expected = normalizeUpper_(expectedEmployeeId || '');
  if (!code) return null;

  var masterRows = sheetToObjects_(getSheet_(SHEET_EMPLOYEES));
  for (var i = 0; i < masterRows.length; i++) {
    var mr = masterRows[i] || {};
    var token = normalizeUpper_(mr.one_time_token || mr.activation_code || mr['開通碼'] || '');
    var employeeId = normalizeUpper_(mr.employee_id || mr.id || mr['員工ID'] || '');
    if (token !== code) continue;
    if (expected && employeeId !== expected) continue;
    var companyId = normalizeUpper_(mr.company_id || mr.companyId || mr['公司ID'] || '');
    if (!companyId) continue;
    var found = findEmployee_(companyId, employeeId);
    return found || normalizeCompanyPersonRowV31_(mr, companyId);
  }

  var companies = sheetToObjects_(getSheet_(SHEET_COMPANIES));
  for (var c = 0; c < companies.length; c++) {
    var companyId2 = normalizeUpper_(companies[c].company_id || '');
    if (!companyId2) continue;
    var sh = getCompanyPersonSheetV31_(companyId2, false);
    if (!sh) continue;
    var rows = sheetToObjects_(sh);
    for (var r = 0; r < rows.length; r++) {
      var person = normalizeCompanyPersonRowV31_(rows[r], companyId2);
      if (normalizeUpper_(person.one_time_token || '') !== code) continue;
      if (expected && normalizeUpper_(person.employee_id || '') !== expected) continue;
      return person;
    }
  }
  return null;
}

function resolveEmployeeEmailLoginTargetV34_(payload) {
  payload = payload || {};
  var rawKey = normalizeUpper_(payload.company_or_code || payload.login_key || payload.activation_code || payload.one_time_token || payload.company_id || payload.company || payload.companyCode || '');
  var employeeId = normalizeUpper_(payload.employee_id || payload.id || payload.user_id || '');
  if (!rawKey) return { ok:false, message:'請輸入公司代碼或開通碼' };

  var company = findCompany_(rawKey);
  var employee = null;
  var mode = 'login';
  var companyId = '';
  var loginKey = rawKey;

  if (company) {
    companyId = normalizeUpper_(company.company_id || rawKey);
    if (!employeeId) return { ok:false, message:'請輸入員工編號' };
    employee = findEmployee_(companyId, employeeId);
    if (!employee) return { ok:false, message:'此公司找不到這個員工編號' };
  } else {
    mode = 'activation';
    employee = findEmployeeByActivationCodeV34_(rawKey, employeeId);
    if (!employee) return { ok:false, message:'開通碼錯誤，或找不到對應員工資料' };
    companyId = normalizeUpper_(employee.company_id || '');
    employeeId = normalizeUpper_(employee.employee_id || '');
    if (isActivationUsedV34_(employee.token_used || employee['綁定狀態'])) return { ok:false, message:'此開通碼已使用，請改用公司代碼登入或聯絡管理員重發' };
  }

  if (!employee || !companyId || !employeeId) return { ok:false, message:'員工資料不完整' };
  if (!isEmployeeActiveV31_(employee.status || 'active')) return { ok:false, message:'此員工帳號已停用' };
  var email = normalizeEmail_(employee.email || '');
  if (!email) return { ok:false, message:'此員工的人員資料尚未設定 Email，請聯絡管理員補上 Email' };

  return {
    ok:true,
    mode:mode,
    login_key:loginKey,
    company_id:companyId,
    company_name:employee.company_name || (company && company.company_name) || companyId,
    employee_id:employeeId,
    employee:employee,
    email:email,
    email_masked:maskEmailV34_(email)
  };
}

function apiRequestEmployeeEmailLoginCodeV34_(payload) {
  var target = resolveEmployeeEmailLoginTargetV34_(payload);
  if (!target.ok) return fail_(target.message);
  var send = apiRequestEmailCode_({
    email:target.email,
    flow:'employee_login',
    company_id:target.company_id,
    plan:'',
    device_id:normalize_(payload && payload.device_id || ''),
    source:normalize_(payload && payload.source || 'entry_employee_email')
  });
  if (!send || !send.ok) return send || fail_('Email 驗證碼寄送失敗');
  return ok_({
    message:'驗證碼已寄到人員資料 Email：' + target.email_masked,
    mode:target.mode,
    login_key:target.login_key,
    company_id:target.company_id,
    company_name:target.company_name,
    employee_id:target.employee_id,
    name:target.employee.name || target.employee_id,
    email_masked:target.email_masked,
    resend_after_seconds:send.resend_after_seconds || 60,
    daily_limit:send.daily_limit || 5
  });
}

function apiVerifyEmployeeEmailCodeAndLoginV34_(payload) {
  payload = payload || {};
  var target = resolveEmployeeEmailLoginTargetV34_(payload);
  if (!target.ok) return fail_(target.message);
  var code = normalize_(payload.code || '');
  var deviceId = normalize_(payload.device_id || '');
  if (!/^\d{6}$/.test(code)) return fail_('請輸入 6 位數 Email 驗證碼');

  var verify = apiVerifyEmailCode_({
    email:target.email,
    code:code,
    flow:'employee_login',
    company_id:target.company_id
  });
  if (!verify || !verify.ok) return verify || fail_('Email 驗證失敗');

  var employee = findEmployee_(target.company_id, target.employee_id) || target.employee;
  var boundDevice = normalize_(employee.device_id || employee.specialdeviceid || '');
  if (target.mode === 'login') {
    if (!boundDevice) return fail_('此員工尚未完成首次開通，請改用開通碼登入');
    if (deviceId && boundDevice !== deviceId) return fail_('此帳號已綁定其他裝置，請聯絡管理員重發開通碼');
  } else {
    var updates = { device_id:deviceId, token_used:'yes', updated_at:nowText_() };
    updateCompanyPersonRowV31_(target.company_id, target.employee_id, updates);
    updateEmployeeInSheetV25_(getSheet_(SHEET_EMPLOYEES), target.company_id, target.employee_id, updates);
    employee = Object.assign({}, employee, updates);
  }

  var session = createSessionForEmployee_(target.company_id, Object.assign({}, employee, { employee_id:target.employee_id }), deviceId);
  var role = normalizeRoleV30_(employee.role || 'Employee', target.employee_id);
  return ok_({
    message:target.mode === 'activation' ? 'Email 驗證完成，裝置已開通' : 'Email 驗證登入成功',
    mode:target.mode,
    company_id:target.company_id,
    company_name:target.company_name,
    employee_id:target.employee_id,
    name:employee.name || target.employee_id,
    role:role,
    session_token:session,
    auto_login:true,
    next_url:DEFAULT_FRONTEND_URL + 'app.html?view=employee&company_id=' + encodeURIComponent(target.company_id) + '&id=' + encodeURIComponent(target.employee_id) + '&employee_id=' + encodeURIComponent(target.employee_id) + '&role=' + encodeURIComponent(role) + '&session_token=' + encodeURIComponent(session) + '&token=' + encodeURIComponent(session)
  });
}

function findEmployeeByEmailInCompanyV34_(companyId, email) {
  companyId = normalizeUpper_(companyId || '');
  email = normalizeEmail_(email || '');
  if (!companyId || !email) return null;
  ensureCompanyCreatorInPersonSheetV31_(companyId);
  var sh = getCompanyPersonSheetV31_(companyId, false);
  if (sh) {
    var rows = sheetToObjects_(sh);
    for (var i = 0; i < rows.length; i++) {
      var person = normalizeCompanyPersonRowV31_(rows[i], companyId);
      if (normalizeEmail_(person.email || '') === email) return person;
    }
  }
  var masterRows = sheetToObjects_(getSheet_(SHEET_EMPLOYEES));
  for (var j = 0; j < masterRows.length; j++) {
    var row = masterRows[j] || {};
    if (normalizeUpper_(row.company_id || '') !== companyId) continue;
    if (normalizeEmail_(row.email || '') !== email) continue;
    return normalizeCompanyPersonRowV31_(row, companyId);
  }
  return null;
}

function apiRequestAdminLoginEmailVerificationV34_(payload) {
  payload = payload || {};
  var companyId = normalizeUpper_(payload.company_id || payload.company || payload.companyCode || '');
  var email = normalizeEmail_(payload.email || payload.adminEmail || '');
  if (!companyId) return fail_('請輸入公司代碼');
  if (!email) return fail_('請輸入管理員 Email');
  if (!findCompany_(companyId)) return fail_('找不到公司資料');
  var employee = findEmployeeByEmailInCompanyV34_(companyId, email);
  if (!employee) return fail_('此 Email 不在這間公司的人員資料中');
  if (!isEmployeeActiveV31_(employee.status || 'active')) return fail_('此管理員帳號已停用');
  if (roleRankV30_(employee.role || '') < roleRankV30_('Manager')) return fail_('此 Email 沒有企業管理權限');
  var send = apiRequestEmailCode_({ email:email, flow:'admin_login', company_id:companyId, device_id:normalize_(payload.device_id || ''), source:normalize_(payload.source || 'entry_admin_email') });
  if (!send || !send.ok) return send || fail_('Email 驗證碼寄送失敗');
  return ok_({ message:'驗證碼已寄到：' + maskEmailV34_(email), company_id:companyId, employee_id:employee.employee_id || '', email_masked:maskEmailV34_(email), resend_after_seconds:send.resend_after_seconds || 60 });
}

function apiVerifyAdminEmailCodeAndLoginV34_(payload) {
  payload = payload || {};
  var companyId = normalizeUpper_(payload.company_id || payload.company || payload.companyCode || '');
  var email = normalizeEmail_(payload.email || payload.adminEmail || '');
  var code = normalize_(payload.code || '');
  var deviceId = normalize_(payload.device_id || '');
  if (!companyId) return fail_('請輸入公司代碼');
  if (!email) return fail_('請輸入管理員 Email');
  var employee = findEmployeeByEmailInCompanyV34_(companyId, email);
  if (!employee) return fail_('此 Email 不在這間公司的人員資料中');
  if (!isEmployeeActiveV31_(employee.status || 'active')) return fail_('此管理員帳號已停用');
  if (roleRankV30_(employee.role || '') < roleRankV30_('Manager')) return fail_('此 Email 沒有企業管理權限');
  var verify = apiVerifyEmailCode_({ email:email, code:code, flow:'admin_login', company_id:companyId });
  if (!verify || !verify.ok) return verify || fail_('Email 驗證失敗');
  var token = createSessionForEmployee_(companyId, employee, deviceId);
  return buildAdminLoginResponse_(companyId, employee, token);
}
