// ANG HR 共用資料與互動層：LINE／Flutter／Web 都只能從這裡呼叫核心 action。
var ANG_HR_CORE_ACTIONS_ = {
  getHomeData: 'coreGetHomeData_',
  getSchedule: 'coreGetSchedule_',
  getLeaveRecords: 'coreGetLeaveRecords_',
  submitLeave: 'coreSubmitLeave_',
  getPayroll: 'coreGetPayroll_',
  getManagementOverview: 'coreGetManagementOverview_',
  clockByLocation: 'coreClockByLocation_',
  clockByQr: 'coreClockByQr_',
  clockByNfc: 'coreClockByNfc_'
};

function executeCoreAction_(context) {
  var handlerName = ANG_HR_CORE_ACTIONS_[context.action];
  if (!handlerName) {
    return apiError_('UNKNOWN_ACTION', '未知 action：' + context.action);
  }

  var handler = globalThis[handlerName];
  if (typeof handler !== 'function') {
    return apiError_(
      'CORE_HANDLER_MISSING',
      '尚未接上共用主程式：' + handlerName,
      { action: context.action, client: context.client }
    );
  }

  return normalizeHandlerResult_(handler(context.params, context));
}

function requireSessionToken_(context) {
  var token = String(context.params.session_token || context.params.sessionToken || '').trim();
  if (!token) {
    var error = new Error('缺少 ANG HR session。');
    error.code = 'SESSION_REQUIRED';
    throw error;
  }
  return token;
}

// 以下函式名稱是共用主程式的固定接點。
// 將現有資料邏輯接到這些函式即可；不要在 LINE／Flutter 檔案重寫一次。
// function coreGetHomeData_(params, context) {}
// function coreGetSchedule_(params, context) {}
// function coreGetLeaveRecords_(params, context) {}
// function coreSubmitLeave_(params, context) {}
// function coreGetPayroll_(params, context) {}
// function coreGetManagementOverview_(params, context) {}
// function coreClockByLocation_(params, context) {}
// function coreClockByQr_(params, context) {}
// function coreClockByNfc_(params, context) {}
