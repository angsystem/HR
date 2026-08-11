/************************************************************
 * ANG HR｜LINE MINI App 已驗證員工直接登入
 * 版本：2026-08-11
 *
 * 用途：
 * - 前端先以 verifyNativeLineIdToken 取得 verify_token。
 * - 再以 getEmployeeCompaniesByVerifiedAuth 找到已綁定公司／員工。
 * - 本檔 employeeLoginByVerifiedAuth 會再次驗證 verify_token 與員工綁定，
 *   通過後才建立正式 ANG HR session_token。
 *
 * 安全原則：
 * - 不把 verify_token 當 HR session_token。
 * - 必須比對 company_id + employee_id。
 * - LINE 登入必須比對 line_sub；Google／Email 可沿用同一函式。
 * - 已停用帳號不可登入。
 * - 已啟用單裝置綁定的員工，裝置必須一致。
 * - 尚未完成首次開通者不可藉第三方驗證繞過開通碼。
 ************************************************************/

function apiEmployeeLoginByVerifiedAuth_(payload) {
  payload = payload || {};

  var companyId = normalizeUpper_(payload.company_id || payload.company || '');
  var employeeId = normalizeUpper_(payload.employee_id || payload.employeeId || payload.id || '');
  var deviceId = normalize_(payload.device_id || payload.deviceId || '');
  var verifyToken = normalize_(payload.verify_token || payload.verifyToken || '');

  if (!companyId) return fail_('缺少公司代碼');
  if (!employeeId) return fail_('缺少員工編號');
  if (!verifyToken) return fail_('缺少第三方驗證 token，請重新驗證');
  if (!deviceId) return fail_('無法取得裝置識別碼，請重新開啟頁面後再試');

  var verify = verifyVerifyToken_(verifyToken);
  if (!verify || !verify.ok) return fail_((verify && verify.message) || '驗證已失效，請重新驗證');

  var verified = verify.data || {};
  var provider = normalizeLower_(verified.provider || verified.method || payload.provider || '');
  var verifiedEmail = normalizeEmail_(verified.email || '');
  var verifiedGoogleSub = normalize_(verified.google_sub || (provider === 'google' ? verified.sub : '') || '');
  var verifiedLineSub = normalize_(verified.line_sub || (provider === 'line' ? verified.sub : '') || '');

  var employee = findEmployee_(companyId, employeeId);

  // V31 起部分公司人員資料在公司專屬「人員資料」工作表；
  // 與 Email 登入流程相同，主表找不到時再查公司人員資料。
  if (!employee && typeof getCompanyPersonSheetV31_ === 'function') {
    var personSheet = getCompanyPersonSheetV31_(companyId, false);
    if (personSheet) {
      var rows = sheetToObjects_(personSheet);
      for (var i = 0; i < rows.length; i++) {
        var person = typeof normalizeCompanyPersonRowV31_ === 'function'
          ? normalizeCompanyPersonRowV31_(rows[i], companyId)
          : rows[i];
        if (normalizeUpper_(person.employee_id || person.id || '') === employeeId) {
          employee = person;
          break;
        }
      }
    }
  }

  if (!employee) return fail_('找不到員工資料');

  var active = true;
  if (typeof isEmployeeActiveV31_ === 'function') {
    active = isEmployeeActiveV31_(employee.status || 'active');
  } else {
    var status = normalizeLower_(employee.status || 'active');
    active = ['disabled','inactive','停用','離職'].indexOf(status) < 0;
  }
  if (!active) return fail_('此員工帳號已停用');

  var employeeEmail = normalizeEmail_(employee.email || '');
  var employeeGoogleSub = normalize_(employee.google_sub || employee.googleSub || '');
  var employeeLineSub = normalize_(employee.line_sub || employee.lineSub || '');

  var sameEmail = !!(verifiedEmail && employeeEmail && verifiedEmail === employeeEmail);
  var sameGoogle = !!(verifiedGoogleSub && employeeGoogleSub && verifiedGoogleSub === employeeGoogleSub);
  var sameLine = !!(verifiedLineSub && employeeLineSub && verifiedLineSub === employeeLineSub);

  // Provider 有明確指定時，必須使用該 provider 的綁定欄位驗證。
  // 尤其 LINE 不允許只因 Email 相同就登入，避免不同 LINE 帳號共用 Email 造成誤登入。
  if (provider === 'line' || provider === 'line-mini-app' || provider === 'line_mini_app') {
    if (!verifiedLineSub) return fail_('LINE 驗證資料缺少 user id，請重新驗證');
    if (!employeeLineSub) return fail_('此 ANG HR 帳號尚未綁定 LINE，請先完成首次綁定');
    if (!sameLine) return fail_('此 LINE 帳號與 ANG HR 員工資料不符');
  } else if (provider === 'google') {
    if (!sameGoogle && !sameEmail) return fail_('Google 驗證身分與 ANG HR 員工資料不符');
  } else if (provider === 'email') {
    if (!sameEmail) return fail_('Email 驗證身分與 ANG HR 員工資料不符');
  } else if (!sameLine && !sameGoogle && !sameEmail) {
    return fail_('第三方驗證身分與 ANG HR 員工資料不符');
  }

  // 沿用既有單裝置登入規則。
  var boundDevice = normalize_(employee.device_id || employee.specialdeviceid || employee.specialDeviceId || '');
  var tokenUsed = employee.token_used || employee['綁定狀態'] || '';
  var activationUsed = typeof isActivationUsedV34_ === 'function'
    ? isActivationUsedV34_(tokenUsed)
    : ['yes','true','1','used','active','已使用','已綁定','是'].indexOf(normalizeLower_(tokenUsed)) >= 0;

  if (!boundDevice || !activationUsed) {
    return fail_('此員工尚未完成首次開通，請先使用開通碼完成裝置綁定');
  }
  if (boundDevice !== deviceId) {
    return fail_('此帳號已綁定其他裝置，請聯絡管理員重設手機後再登入');
  }

  var session = createSessionForEmployee_(
    companyId,
    Object.assign({}, employee, { employee_id: employeeId }),
    deviceId
  );
  if (!session) return fail_('無法建立 ANG HR 工作階段，請重新登入');

  var role = typeof normalizeRoleV30_ === 'function'
    ? normalizeRoleV30_(employee.role || 'Employee', employeeId)
    : (employee.role || 'Employee');

  try {
    log_('employeeLoginByVerifiedAuth', companyId, employeeId, employeeEmail || verifiedEmail || '', 'ok', 'verified employee login ok', {
      provider: provider,
      device_id: deviceId,
      source: payload.source || 'line_mini_app'
    });
  } catch (logError) {}

  var frontendBase = (typeof DEFAULT_FRONTEND_URL !== 'undefined' && DEFAULT_FRONTEND_URL)
    ? String(DEFAULT_FRONTEND_URL)
    : 'https://angsystem.github.io/HR/';
  if (frontendBase.slice(-1) !== '/') frontendBase += '/';

  return ok_({
    message: provider.indexOf('line') === 0 ? 'LINE 驗證登入成功' : '第三方驗證登入成功',
    provider: provider,
    company_id: companyId,
    company_name: employee.company_name || employee.companyName || companyId,
    employee_id: employeeId,
    name: employee.name || employee.nickname || employeeId,
    role: role,
    device_id: deviceId,
    session_token: session,
    auto_login: true,
    next_url: frontendBase
      + (roleRankForLineMini_(role) >= 2 ? 'admin.html' : 'employee.html')
      + '?company_id=' + encodeURIComponent(companyId)
      + '&id=' + encodeURIComponent(employeeId)
      + '&employee_id=' + encodeURIComponent(employeeId)
      + '&role=' + encodeURIComponent(role)
      + '&device_id=' + encodeURIComponent(deviceId)
      + '&session_token=' + encodeURIComponent(session)
      + '&token=' + encodeURIComponent(session)
      + '&lineMini=1'
  });
}

function roleRankForLineMini_(role) {
  var r = normalizeLower_(role || '');
  if (['creator','platform_creator','root','super_admin','superadmin'].indexOf(r) >= 0) return 9;
  if (['owner','deputy_owner','deputy owner'].indexOf(r) >= 0) return 8;
  if (['admin','administrator'].indexOf(r) >= 0) return 7;
  if (['manager','主管','店長','經理'].indexOf(r) >= 0) return 6;
  if (['assistant_manager','assistant manager','副理','副店長'].indexOf(r) >= 0) return 5;
  if (['supervisor','主任'].indexOf(r) >= 0) return 4;
  if (['section_leader','section leader','組長'].indexOf(r) >= 0) return 3;
  if (['team_leader','team leader','領班','班長'].indexOf(r) >= 0) return 2;
  return 1;
}

/*
 * 舊版 handleApi_ switch 請加入：
 *
 *   case 'employeeLoginByVerifiedAuth':
 *   case 'loginEmployeeByVerifiedAuth':
 *     result = apiEmployeeLoginByVerifiedAuth_(payload);
 *     break;
 *
 * 並確認仍保留：
 *
 *   case 'getEmployeeCompaniesByVerifiedAuth':
 *     result = apiGetEmployeeCompaniesByVerifiedAuth_(payload);
 *     break;
 */
