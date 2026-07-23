/***** ANG HR SYSTEMS｜SheetSetup.gs
 * 新增檔案：總表初始化 / 公司範本初始化 / 共用工具
 *
 * 原本 程式碼.js 的 action router 需要先呼叫：
 *
 * var routed = angHandleApiAction_(req);
 * if (routed) return routed;
 *****/

/***** 總表工作表名稱 *****/
var ANG_MASTER_SHEET_COMPANIES = '公司清單';
var ANG_MASTER_SHEET_AUTH = '驗證紀錄';
var ANG_MASTER_SHEET_PAYMENTS = '付款紀錄';
var ANG_MASTER_SHEET_ACTIVATION = '開通碼紀錄';
var ANG_MASTER_SHEET_FREE_TRIAL = '免費試用申請';
var ANG_MASTER_SHEET_PRIVILEGE = '特權碼紀錄';
var ANG_MASTER_SHEET_COMPANY_CREATE = '公司建立紀錄';
var ANG_MASTER_SHEET_SETTINGS = '系統設定';

/***** 公司表工作表名稱 *****/
var ANG_COMPANY_SHEET_COMPANY_SETTINGS = '公司設定';
var ANG_COMPANY_SHEET_SYSTEM_SETTINGS = '系統設定';
var ANG_COMPANY_SHEET_BRANCH = '分店設定';
var ANG_COMPANY_SHEET_DEPARTMENT = '部門設定';
var ANG_COMPANY_SHEET_PERMISSION = '權限管理';
var ANG_COMPANY_SHEET_SHIFT = '班別設定';
var ANG_COMPANY_SHEET_USERS = '人員資料';
var ANG_COMPANY_SHEET_CLOCK_RAW = '打卡原始記錄';
var ANG_COMPANY_SHEET_LEAVE = '請假申請';
var ANG_COMPANY_SHEET_MISSED_CLOCK = '補打卡申請';
var ANG_COMPANY_SHEET_OFF_REQUEST = '選休提報';
var ANG_COMPANY_SHEET_SCHEDULE_FINAL = '正式排班紀錄';
var ANG_COMPANY_SHEET_UPLOAD_REVIEW = '資料接收審核';
var ANG_COMPANY_SHEET_SALARY_REVIEW = '薪資審核';
var ANG_COMPANY_SHEET_NOTICE = '通知發布';
var ANG_COMPANY_SHEET_MESSAGE = '留言審核';
var ANG_COMPANY_SHEET_CHANGE_LOG = '資料修改紀錄';
var ANG_COMPANY_SHEET_LOGIN_LOG = '登入紀錄';

/***** 總表欄位 *****/
var ANG_MASTER_COMPANY_HEADERS = [
  'company_id',
  'company_code',
  'company_name',
  'company_sub_name',
  'plan',
  'plan_code',
  'status',
  'payment_status',
  'is_paid',
  'trial_started_at',
  'trial_ends_at',
  'spreadsheet_id',
  'spreadsheet_url',
  'frontend_url',
  'gas_api_url',
  'owner_person_id',
  'creator_employee_no',
  'creator_employee_id',
  'owner_email',
  'owner_name',
  'owner_phone',
  'auth_provider',
  'google_user_id',
  'line_user_id',
  'created_at',
  'updated_at'
];

var ANG_MASTER_AUTH_HEADERS = [
  'created_at',
  'flow',
  'provider',
  'plan',
  'company_id',
  'person_id',
  'email',
  'google_user_id',
  'line_user_id',
  'verify_token',
  'state',
  'auth_code',
  'status',
  'ip',
  'user_agent',
  'device_id',
  'expired_at',
  'used_at',
  'redirect_uri',
  'auth_url',
  'profile_name',
  'raw_response',
  'note',
  'updated_at'
];

var ANG_MASTER_PAYMENT_HEADERS = [
  'created_at',
  'company_id',
  'plan',
  'payment_status',
  'is_paid',
  'amount',
  'currency',
  'start_at',
  'end_at',
  'method',
  'transaction_id',
  'note',
  'updated_at'
];

var ANG_MASTER_ACTIVATION_HEADERS = [
  'created_at',
  'company_id',
  'employee_id',
  'employee_name',
  'activation_code',
  'device_id',
  'status',
  'expired_at',
  'used_at',
  'created_by',
  'note'
];

var ANG_MASTER_FREE_TRIAL_HEADERS = [
  'created_at',
  'company_name',
  'owner_email',
  'owner_name',
  'owner_phone',
  'plan',
  'status',
  'verify_token',
  'company_id',
  'note',
  'updated_at'
];

var ANG_MASTER_PRIVILEGE_HEADERS = [
  'created_at',
  'privilege_code',
  'company_id',
  'plan',
  'status',
  'issued_by',
  'used_by_email',
  'used_at',
  'expired_at',
  'note'
];

var ANG_MASTER_COMPANY_CREATE_HEADERS = [
  'created_at',
  'company_id',
  'company_code',
  'company_name',
  'plan',
  'template_file_id',
  'new_spreadsheet_id',
  'new_spreadsheet_url',
  'created_by',
  'note'
];

var ANG_KEY_VALUE_HEADERS = [
  'key',
  'value',
  'note'
];

/***** 公司表欄位 *****/
/***** 注意：人員資料 Q欄固定是班別 *****/
var ANG_COMPANY_USER_HEADERS = [
  '員工ID',       // A
  '姓名',         // B
  'Email',        // C
  '電話',         // D
  '角色',         // E
  '狀態',         // F
  '部門ID',       // G
  '部門名稱',     // H
  '職稱',         // I
  '到職日',       // J
  '生日',         // K
  '身分證末碼',   // L
  '裝置ID',       // M
  '開通碼',       // N
  '綁定狀態',     // O
  '備註',         // P
  '班別',         // Q：固定班別
  '分店ID',       // R
  '分店名稱',     // S
  '平台人員ID',   // T
  '公司員編'      // U
];

var ANG_COMPANY_CLOCK_HEADERS = [
  'created_at',
  '員工ID',
  '姓名',
  '日期',
  '時間',
  '動作',
  '班別',
  '分店ID',
  '裝置ID',
  '來源',
  'GPS',
  '狀態',
  '備註'
];

var ANG_COMPANY_LEAVE_HEADERS = [
  '申請時間',
  '員工ID',
  '姓名',
  '假別',
  '開始日期',
  '開始小時',
  '開始分鐘',
  '結束日期',
  '結束小時',
  '結束分鐘',
  '請假天數',
  '請假時數',
  '狀態',
  '審核人',
  '審核時間',
  '備註'
];

var ANG_COMPANY_MISSED_CLOCK_HEADERS = [
  '申請時間',
  '員工ID',
  '姓名',
  '補卡日期',
  '補卡小時',
  '補卡分鐘',
  '動作',
  '原因',
  '狀態',
  '審核人',
  '審核時間',
  '備註'
];

var ANG_COMPANY_OFF_REQUEST_HEADERS = [
  '提報時間',
  '週期類型',
  '週期開始',
  '週期結束',
  '員工ID',
  '姓名',
  '日期',
  '是否可上班',
  '備註',
  '狀態'
];

var ANG_COMPANY_SCHEDULE_FINAL_HEADERS = [
  '發布時間',
  '週期類型',
  '週期開始',
  '週期結束',
  '日期',
  '員工ID',
  '姓名',
  '班別',
  '分店ID',
  '狀態',
  '發布人',
  '備註'
];

var ANG_COMPANY_SALARY_HEADERS = [
  '建立時間',
  '結算週期',
  '結算開始',
  '結算結束',
  '員工ID',
  '姓名',
  '正常工時',
  '加班時數',
  '請假時數',
  '遲到分鐘',
  '應發薪資',
  '狀態',
  '審核人',
  '備註'
];

var ANG_COMPANY_NOTICE_HEADERS = [
  '發布時間',
  '公告ID',
  '標題',
  '內容',
  '對象',
  '分店ID',
  '狀態',
  '發布人',
  '更新時間'
];

var ANG_COMPANY_MESSAGE_HEADERS = [
  '留言時間',
  '留言ID',
  '員工ID',
  '姓名',
  '內容',
  '狀態',
  '審核人',
  '審核時間',
  '備註'
];

var ANG_COMPANY_BRANCH_HEADERS = [
  '分店ID',
  '分店名稱',
  '地址',
  '電話',
  'LOGO_URL',
  '狀態',
  '備註'
];

var ANG_COMPANY_DEPARTMENT_HEADERS = [
  '部門ID',
  '部門名稱',
  '分店ID',
  '主管員工ID',
  '狀態',
  '備註'
];

var ANG_COMPANY_PERMISSION_HEADERS = [
  '角色',
  '功能代碼',
  '可查看',
  '可新增',
  '可修改',
  '可刪除',
  '備註'
];

var ANG_COMPANY_SHIFT_HEADERS = [
  '班別',
  '上班時間',
  '下班時間',
  '正常工時',
  '上班寬限分鐘',
  '下班寬限分鐘',
  '單位分鐘',
  '狀態',
  '備註'
];

var ANG_COMPANY_UPLOAD_REVIEW_HEADERS = [
  '建立時間',
  '資料ID',
  '員工ID',
  '姓名',
  '資料類型',
  '檔案URL',
  '狀態',
  '審核人',
  '審核時間',
  '備註'
];

var ANG_COMPANY_CHANGE_LOG_HEADERS = [
  '時間',
  '操作者',
  '功能',
  '目標',
  '原資料',
  '新資料',
  '備註'
];

var ANG_COMPANY_LOGIN_LOG_HEADERS = [
  '時間',
  'company_id',
  '帳號',
  '角色',
  'provider',
  'device_id',
  '狀態',
  'ip',
  'user_agent',
  '備註'
];

/***** 主路由：給原本 程式碼.js 呼叫 *****/
function angHandleApiAction_(req) {
  req = req || {};
  var action = String(req.action || '').trim();

  if (!action) return null;

  var authActions = {
    requestGoogleAuth: true,
    requestLineAuth: true,
    oauthCallback: true,
    requestEmailVerifyCode: true,
    confirmEmailVerifyCode: true,
    verifyAuthToken: true,
    verifyNativeGoogleIdToken: true,
    verifyNativeLineIdToken: true
  };

  var companyActions = {
    setupMaster: true,
    setupCompanyTemplateCurrent: true,
    createCompany: true,
    getCompany: true,
    listCompanies: true,
    getCompanySettings: true,
    createActivationCode: true
  };

  if (authActions[action]) {
    if (typeof handleAuthAction_ === 'function') {
      return handleAuthAction_(req);
    }
    return null;
  }

  if (companyActions[action]) {
    return handleCompanyAction_(req);
  }

  return null;
}

/***** 初始化總表 *****/
function angSetupMasterSpreadsheet() {
  var ss = angGetMasterSpreadsheet_();

  var companySheet = angEnsureSheet_(ss, ANG_MASTER_SHEET_COMPANIES);
  angEnsureHeader_(companySheet, ANG_MASTER_COMPANY_HEADERS);

  var authSheet = angEnsureSheet_(ss, ANG_MASTER_SHEET_AUTH);
  angEnsureHeader_(authSheet, ANG_MASTER_AUTH_HEADERS);

  var paymentSheet = angEnsureSheet_(ss, ANG_MASTER_SHEET_PAYMENTS);
  angEnsureHeader_(paymentSheet, ANG_MASTER_PAYMENT_HEADERS);

  var activationSheet = angEnsureSheet_(ss, ANG_MASTER_SHEET_ACTIVATION);
  angEnsureHeader_(activationSheet, ANG_MASTER_ACTIVATION_HEADERS);

  var freeTrialSheet = angEnsureSheet_(ss, ANG_MASTER_SHEET_FREE_TRIAL);
  angEnsureHeader_(freeTrialSheet, ANG_MASTER_FREE_TRIAL_HEADERS);

  var privilegeSheet = angEnsureSheet_(ss, ANG_MASTER_SHEET_PRIVILEGE);
  angEnsureHeader_(privilegeSheet, ANG_MASTER_PRIVILEGE_HEADERS);

  var createSheet = angEnsureSheet_(ss, ANG_MASTER_SHEET_COMPANY_CREATE);
  angEnsureHeader_(createSheet, ANG_MASTER_COMPANY_CREATE_HEADERS);

  var settingSheet = angEnsureSheet_(ss, ANG_MASTER_SHEET_SETTINGS);
  angEnsureHeader_(settingSheet, ANG_KEY_VALUE_HEADERS);

  angUpsertKeyValueDefaults_(settingSheet, [
    ['default_trial_days', '30', '免費試用天數，可改 15 或 30'],
    ['default_plan', 'business_basic', '預設方案'],
    ['company_code_prefix', 'ANG', '所有公司代號一律 ANG 開頭'],
    ['employee_id_prefix', 'ANG', '所有公司內帳號一律 ANG 開頭'],
    ['company_creator_employee_no', '0603', '每間公司建立者固定公司員編'],
    ['company_creator_employee_id', 'ANG0603', '每間公司建立者固定登入員編'],
    ['platform_creator_id', 'ANG8963', '平台最高管理，不占用公司 0603'],
    ['company_template_file_id', '', '新公司建立時複製的公司資料範本試算表ID'],
    ['entry_index_url', angGetScriptProp_('ANG_ENTRY_INDEX_URL', 'https://edn869728-jpg.github.io/ANG-99-HR-System/index.html'), '入口 index.html'],
    ['gas_webapp_url', angGetScriptProp_('GAS_WEBAPP_URL', ''), 'GAS Web App URL'],
    ['support_email', 'endenmi@ang-system.com', '官方客服信箱']
  ]);

  if (typeof angPeopleInitSystem === 'function') {
    angPeopleInitSystem();
  }

  return {
    ok: true,
    message: '平台總控分流表與人員方案中心已初始化',
    spreadsheet_id: ss.getId(),
    spreadsheet_url: ss.getUrl()
  };
}

/***** 初始化公司試算表 / 公司資料範本 *****/
function angSetupCompanySpreadsheet(ss, company) {
  company = company || {};

  if (!ss) {
    throw new Error('缺少公司試算表');
  }

  var requiredSheets = [
    ANG_COMPANY_SHEET_COMPANY_SETTINGS,
    ANG_COMPANY_SHEET_SYSTEM_SETTINGS,
    ANG_COMPANY_SHEET_BRANCH,
    ANG_COMPANY_SHEET_DEPARTMENT,
    ANG_COMPANY_SHEET_PERMISSION,
    ANG_COMPANY_SHEET_SHIFT,
    ANG_COMPANY_SHEET_USERS,
    ANG_COMPANY_SHEET_CLOCK_RAW,
    ANG_COMPANY_SHEET_LEAVE,
    ANG_COMPANY_SHEET_MISSED_CLOCK,
    ANG_COMPANY_SHEET_OFF_REQUEST,
    ANG_COMPANY_SHEET_SCHEDULE_FINAL,
    ANG_COMPANY_SHEET_UPLOAD_REVIEW,
    ANG_COMPANY_SHEET_SALARY_REVIEW,
    ANG_COMPANY_SHEET_NOTICE,
    ANG_COMPANY_SHEET_MESSAGE,
    ANG_COMPANY_SHEET_CHANGE_LOG,
    ANG_COMPANY_SHEET_LOGIN_LOG
  ];

  requiredSheets.forEach(function(name) {
    angEnsureSheet_(ss, name);
  });

  var companySettingSheet = angEnsureSheet_(ss, ANG_COMPANY_SHEET_COMPANY_SETTINGS);
  angResetKeyValueSheet_(companySettingSheet);
  angWriteKeyValueRows_(companySettingSheet, [
    ['company_id', angNormalizeCompanyId_(company.company_id || ''), '公司代碼'],
    ['company_code', angNormalizeCompanyId_(company.company_code || company.company_id || ''), '公司代號，固定 ANG 開頭'],
    ['owner_person_id', company.owner_person_id || '', '平台永久 PersonID'],
    ['creator_employee_no', '0603', '公司建立者固定員編'],
    ['creator_employee_id', 'ANG0603', '公司建立者固定登入員編'],
    ['company_name', company.company_name || '', '公司名稱'],
    ['company_sub_name', company.company_sub_name || '', '公司副名稱'],
    ['plan', company.plan || 'business_basic', '方案代碼'],
    ['plan_code', company.plan_code || company.plan || 'business_basic', '七種方案正式代碼'],
    ['status', company.status || 'active', '公司狀態'],
    ['payment_status', company.payment_status || '', '付款狀態'],
    ['spreadsheet_id', ss.getId(), '本公司試算表ID'],
    ['spreadsheet_url', ss.getUrl(), '本公司試算表網址'],
    ['frontend_url', company.frontend_url || '', '前端網址'],
    ['gas_api_url', company.gas_api_url || '', 'GAS API 網址'],
    ['owner_email', company.owner_email || '', '建立者 Email'],
    ['owner_name', company.owner_name || '', '建立者姓名'],
    ['owner_phone', company.owner_phone || '', '建立者電話'],
    ['theme_color_1', '#FF87E0', '預設主題色1'],
    ['theme_color_2', '#CCA4FF', '預設主題色2'],
    ['theme_color_3', '#8089FF', '預設主題色3'],
    ['theme_color_4', '#59DDFF', '預設主題色4'],
    ['created_at', company.created_at || angNowText_(), '建立時間'],
    ['updated_at', angNowText_(), '更新時間']
  ]);

  var systemSettingSheet = angEnsureSheet_(ss, ANG_COMPANY_SHEET_SYSTEM_SETTINGS);
  angEnsureHeader_(systemSettingSheet, ANG_KEY_VALUE_HEADERS);
  angUpsertKeyValueDefaults_(systemSettingSheet, [
    ['schedule_mode', 'week', 'week / month'],
    ['week_start_day', '1', '1=週一，7=週日'],
    ['month_start_day', '1', '每月起始日'],
    ['week_schedule_deadline_day', '7', '週選休提報截止日'],
    ['week_schedule_deadline_time', '23:59', '週選休截止時間'],
    ['month_schedule_deadline_day', '25', '月選休提報截止日'],
    ['month_schedule_deadline_time', '23:59', '月選休截止時間'],
    ['clock_dup_minutes', '15', '重複打卡忽略分鐘'],
    ['clock_round_unit_minutes', '30', '工時計算單位分鐘，可設 5/10/15/30'],
    ['clock_in_grace_minutes', '0', '上班寬限分鐘'],
    ['clock_out_grace_minutes', '5', '下班寬限分鐘'],
    ['normal_hours_limit', '8', '正常工時上限'],
    ['leave_minute_step', '5', '請假分鐘固定 5 分鐘一格'],
    ['leave_day_integer_only', 'TRUE', '請假天數只整數'],
    ['leave_hour_step', '0.5', '請假時數可 0.5'],
    ['default_shift_A', '08:00-16:00', 'A班'],
    ['default_shift_B', '08:00-12:00', 'B班'],
    ['default_shift_C', '13:00-19:00', 'C班'],
    ['default_shift_D', '08:00-19:00', 'D班']
  ]);

  angEnsureHeader_(angEnsureSheet_(ss, ANG_COMPANY_SHEET_BRANCH), ANG_COMPANY_BRANCH_HEADERS);
  angEnsureHeader_(angEnsureSheet_(ss, ANG_COMPANY_SHEET_DEPARTMENT), ANG_COMPANY_DEPARTMENT_HEADERS);
  angEnsureHeader_(angEnsureSheet_(ss, ANG_COMPANY_SHEET_PERMISSION), ANG_COMPANY_PERMISSION_HEADERS);
  angEnsureHeader_(angEnsureSheet_(ss, ANG_COMPANY_SHEET_SHIFT), ANG_COMPANY_SHIFT_HEADERS);
  angEnsureHeader_(angEnsureSheet_(ss, ANG_COMPANY_SHEET_USERS), ANG_COMPANY_USER_HEADERS);
  angEnsureHeader_(angEnsureSheet_(ss, ANG_COMPANY_SHEET_CLOCK_RAW), ANG_COMPANY_CLOCK_HEADERS);
  angEnsureHeader_(angEnsureSheet_(ss, ANG_COMPANY_SHEET_LEAVE), ANG_COMPANY_LEAVE_HEADERS);
  angEnsureHeader_(angEnsureSheet_(ss, ANG_COMPANY_SHEET_MISSED_CLOCK), ANG_COMPANY_MISSED_CLOCK_HEADERS);
  angEnsureHeader_(angEnsureSheet_(ss, ANG_COMPANY_SHEET_OFF_REQUEST), ANG_COMPANY_OFF_REQUEST_HEADERS);
  angEnsureHeader_(angEnsureSheet_(ss, ANG_COMPANY_SHEET_SCHEDULE_FINAL), ANG_COMPANY_SCHEDULE_FINAL_HEADERS);
  angEnsureHeader_(angEnsureSheet_(ss, ANG_COMPANY_SHEET_UPLOAD_REVIEW), ANG_COMPANY_UPLOAD_REVIEW_HEADERS);
  angEnsureHeader_(angEnsureSheet_(ss, ANG_COMPANY_SHEET_SALARY_REVIEW), ANG_COMPANY_SALARY_HEADERS);
  angEnsureHeader_(angEnsureSheet_(ss, ANG_COMPANY_SHEET_NOTICE), ANG_COMPANY_NOTICE_HEADERS);
  angEnsureHeader_(angEnsureSheet_(ss, ANG_COMPANY_SHEET_MESSAGE), ANG_COMPANY_MESSAGE_HEADERS);
  angEnsureHeader_(angEnsureSheet_(ss, ANG_COMPANY_SHEET_CHANGE_LOG), ANG_COMPANY_CHANGE_LOG_HEADERS);
  angEnsureHeader_(angEnsureSheet_(ss, ANG_COMPANY_SHEET_LOGIN_LOG), ANG_COMPANY_LOGIN_LOG_HEADERS);

  angSeedShiftDefaults_(ss);
  angRemoveDefaultBlankSheets_(ss);

  return {
    ok: true,
    message: '公司試算表已初始化',
    spreadsheet_id: ss.getId(),
    spreadsheet_url: ss.getUrl()
  };
}

function angSeedShiftDefaults_(ss) {
  var sheet = angEnsureSheet_(ss, ANG_COMPANY_SHEET_SHIFT);
  angEnsureHeader_(sheet, ANG_COMPANY_SHIFT_HEADERS);

  if (sheet.getLastRow() >= 2) return;

  sheet.getRange(2, 1, 4, ANG_COMPANY_SHIFT_HEADERS.length).setValues([
    angObjectToRow_(ANG_COMPANY_SHIFT_HEADERS, {
      '班別': 'A',
      '上班時間': '08:00',
      '下班時間': '16:00',
      '正常工時': '8',
      '上班寬限分鐘': '0',
      '下班寬限分鐘': '5',
      '單位分鐘': '30',
      '狀態': 'active',
      '備註': '預設 A 班'
    }),
    angObjectToRow_(ANG_COMPANY_SHIFT_HEADERS, {
      '班別': 'B',
      '上班時間': '08:00',
      '下班時間': '12:00',
      '正常工時': '4',
      '上班寬限分鐘': '0',
      '下班寬限分鐘': '5',
      '單位分鐘': '30',
      '狀態': 'active',
      '備註': '預設 B 班'
    }),
    angObjectToRow_(ANG_COMPANY_SHIFT_HEADERS, {
      '班別': 'C',
      '上班時間': '13:00',
      '下班時間': '19:00',
      '正常工時': '6',
      '上班寬限分鐘': '0',
      '下班寬限分鐘': '5',
      '單位分鐘': '30',
      '狀態': 'active',
      '備註': '預設 C 班'
    }),
    angObjectToRow_(ANG_COMPANY_SHIFT_HEADERS, {
      '班別': 'D',
      '上班時間': '08:00',
      '下班時間': '19:00',
      '正常工時': '11',
      '上班寬限分鐘': '0',
      '下班寬限分鐘': '5',
      '單位分鐘': '30',
      '狀態': 'active',
      '備註': '預設 D 班'
    })
  ]);
}

/***** 共用工具 *****/
function angGetScriptProp_(key, defaultValue) {
  var value = PropertiesService.getScriptProperties().getProperty(key);
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  return value;
}

function angGetMasterSpreadsheetId_() {
  var id = '';

  try {
    if (typeof MASTER_SPREADSHEET_ID !== 'undefined' && MASTER_SPREADSHEET_ID) {
      id = String(MASTER_SPREADSHEET_ID || '').trim();
    }
  } catch (err) {}

  if (!id) {
    id = String(
      angGetScriptProp_('MASTER_SPREADSHEET_ID', '') ||
      angGetScriptProp_('ANG_MASTER_SPREADSHEET_ID', '')
    ).trim();
  }

  if (!id || id === '請填總控分流試算表ID') {
    throw new Error('尚未設定 MASTER_SPREADSHEET_ID');
  }

  return id;
}

function angGetMasterSpreadsheet_() {
  return SpreadsheetApp.openById(angGetMasterSpreadsheetId_());
}

function angGetGasWebAppUrl_() {
  var propUrl = String(
    angGetScriptProp_('GAS_WEBAPP_URL', '') ||
    angGetScriptProp_('ANG_GAS_WEBAPP_URL', '') ||
    ''
  ).trim();

  if (propUrl) return propUrl;

  try {
    var url = ScriptApp.getService().getUrl();
    if (url) return url;
  } catch (err) {}

  throw new Error('尚未設定 GAS_WEBAPP_URL，且 ScriptApp.getService().getUrl() 取不到網址');
}

function angGetEntryIndexUrl_() {
  var fromProp = String(
    angGetScriptProp_('ANG_ENTRY_INDEX_URL', '') ||
    angGetScriptProp_('ENTRY_INDEX_URL', '') ||
    ''
  ).trim();

  if (fromProp) return fromProp;

  try {
    var fromSheet = angGetMasterSetting_('entry_index_url', '');
    if (fromSheet) return fromSheet;
  } catch (err) {}

  return 'https://angsystem.github.io/HR/index.html';
}

function angGetMasterSetting_(key, defaultValue) {
  var ss = angGetMasterSpreadsheet_();
  var sheet = angEnsureSheet_(ss, ANG_MASTER_SHEET_SETTINGS);
  angEnsureHeader_(sheet, ANG_KEY_VALUE_HEADERS);

  var data = angReadKeyValueSheet_(sheet);
  var value = data[key];

  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return value;
}

function angEnsureSheet_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function angEnsureHeader_(sheet, headers) {
  if (!sheet) throw new Error('缺少工作表');
  headers = headers || [];

  var lastColumn = Math.max(sheet.getLastColumn(), headers.length, 1);
  var current = [];

  if (sheet.getLastRow() >= 1) {
    current = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  }

  var changed = sheet.getLastRow() === 0;

  for (var i = 0; i < headers.length; i++) {
    if (String(current[i] || '').trim() !== String(headers[i] || '').trim()) {
      changed = true;
      break;
    }
  }

  if (changed) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
}

function angObjectToRow_(headers, obj) {
  obj = obj || {};
  return headers.map(function(header) {
    var value = obj[header];
    return value === undefined || value === null ? '' : value;
  });
}

function angRowToObject_(headers, row) {
  var obj = {};
  headers.forEach(function(header, index) {
    var key = String(header || '').trim();
    if (key) {
      obj[key] = row[index];
    }
  });
  return obj;
}

function angFindRowByHeaderValue_(sheet, headerName, value) {
  var values = sheet.getDataRange().getValues();

  if (!values.length) {
    return { row: -1, data: null };
  }

  var headers = values[0];
  var index = headers.indexOf(headerName);

  if (index < 0) {
    throw new Error('缺少欄位：' + headerName);
  }

  var target = String(value || '').trim();

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][index] || '').trim() === target) {
      return {
        row: i + 1,
        data: angRowToObject_(headers, values[i])
      };
    }
  }

  return { row: -1, data: null };
}

function angUpdateRowByHeaders_(sheet, rowNumber, headers, patch) {
  patch = patch || {};

  if (!rowNumber || rowNumber < 2) {
    throw new Error('更新資料列失敗，rowNumber 不正確');
  }

  var range = sheet.getRange(rowNumber, 1, 1, headers.length);
  var row = range.getValues()[0];

  headers.forEach(function(header, index) {
    if (Object.prototype.hasOwnProperty.call(patch, header)) {
      row[index] = patch[header];
    }
  });

  range.setValues([row]);
}

function angReadKeyValueSheet_(sheet) {
  var values = sheet.getDataRange().getValues();
  var obj = {};

  for (var i = 1; i < values.length; i++) {
    var key = String(values[i][0] || '').trim();
    if (key) {
      obj[key] = values[i][1];
    }
  }

  return obj;
}

function angResetKeyValueSheet_(sheet) {
  sheet.clearContents();
  angEnsureHeader_(sheet, ANG_KEY_VALUE_HEADERS);
}

function angWriteKeyValueRows_(sheet, rows) {
  rows = rows || [];
  angEnsureHeader_(sheet, ANG_KEY_VALUE_HEADERS);

  if (!rows.length) return;

  sheet.getRange(2, 1, rows.length, 3).setValues(rows);
}

function angUpsertKeyValueDefaults_(sheet, rows) {
  rows = rows || [];
  angEnsureHeader_(sheet, ANG_KEY_VALUE_HEADERS);

  var values = sheet.getDataRange().getValues();
  var keyMap = {};

  for (var i = 1; i < values.length; i++) {
    var key = String(values[i][0] || '').trim();
    if (key) {
      keyMap[key] = {
        row: i + 1,
        value: values[i][1]
      };
    }
  }

  rows.forEach(function(row) {
    var key = String(row[0] || '').trim();
    var value = row[1];
    var note = row[2] || '';

    if (!key) return;

    if (!keyMap[key]) {
      sheet.appendRow([key, value, note]);
    } else if (keyMap[key].value === '' || keyMap[key].value === null || keyMap[key].value === undefined) {
      sheet.getRange(keyMap[key].row, 2, 1, 2).setValues([[value, note]]);
    }
  });
}

function angIsEmptyRow_(row) {
  return row.every(function(value) {
    return String(value || '').trim() === '';
  });
}

function angNormalizeCompanyId_(value) {
  var id = String(value || '').trim().replace(/\s+/g, '').toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  if (id && id.indexOf('ANG') !== 0) id = 'ANG' + id;
  return id;
}

function angNormalizeEmail_(value) {
  return String(value || '').trim().toLowerCase();
}

function angNormalizePlan_(value) {
  var plan = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');

  if (plan === 'personal_lite' || plan === 'personal_solo' || plan === 'personal_performance') return plan;
  if (plan === 'business_lite' || plan === 'business_basic' || plan === 'business_pro' || plan === 'business_premium') return plan;

  if (plan === 'free' || plan === 'lite') return 'business_lite';
  if (plan === 'basic') return 'business_basic';
  if (plan === 'plus' || plan === 'pro') return 'business_pro';
  if (plan === 'premium') return 'business_premium';
  if (plan === 'solo') return 'personal_solo';
  if (plan === 'performance') return 'personal_performance';
  if (plan === 'private' || plan === 'enterprise') return 'private';

  return '';
}

function angGenerateCompanyId_() {
  var raw = Utilities.getUuid().replace(/-/g, '').slice(0, 6).toUpperCase();
  return 'ANG' + raw;
}

function angGenerateVerifyToken_(prefix) {
  prefix = String(prefix || 'token').trim();
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '') + '_' + Math.random().toString(36).slice(2, 10);
}

function angGenerateActivationCode_() {
  return 'HR' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function angNowText_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
}

function angDateAfterMinutesText_(minutes) {
  var date = new Date();
  date.setMinutes(date.getMinutes() + Number(minutes || 0));
  return Utilities.formatDate(date, Session.getScriptTimeZone() || 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
}

function angDateAfterDaysText_(days) {
  var date = new Date();
  date.setDate(date.getDate() + Number(days || 0));
  return Utilities.formatDate(date, Session.getScriptTimeZone() || 'Asia/Taipei', 'yyyy-MM-dd');
}

function angAppendParams_(url, params) {
  url = String(url || '').trim();
  params = params || {};

  var pairs = [];

  Object.keys(params).forEach(function(key) {
    var value = params[key];

    if (value === undefined || value === null || value === '') return;

    pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)));
  });

  if (!pairs.length) return url;

  return url + (url.indexOf('?') >= 0 ? '&' : '?') + pairs.join('&');
}

function angJson_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj || {}, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function angRedirectHtml_(url) {
  url = String(url || '').trim();

  var html = ''
    + '<!doctype html>'
    + '<html lang="zh-Hant">'
    + '<head>'
    + '<meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>ANG HR 驗證中</title>'
    + '</head>'
    + '<body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;background:#050816;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">'
    + '<div style="text-align:center;padding:24px;">'
    + '<div style="font-size:18px;font-weight:800;margin-bottom:10px;">正在完成驗證</div>'
    + '<div style="font-size:13px;opacity:.72;">請稍候，系統將自動返回 ANG HR。</div>'
    + '</div>'
    + '<script>location.replace(' + JSON.stringify(url) + ');</script>'
    + '</body>'
    + '</html>';

  return HtmlService
    .createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function angRemoveDefaultBlankSheets_(ss) {
  var sheets = ss.getSheets();

  sheets.forEach(function(sheet) {
    var name = sheet.getName();
    var isDefault = /^工作表\d*$|^Sheet\d*$/i.test(name);

    if (isDefault && ss.getSheets().length > 1) {
      ss.deleteSheet(sheet);
    }
  });
}
