// ANG HR Web／PWA 客戶端：保留既有網站驗證與請求，不混入 LINE／Flutter。
function handleWebClient_(context) {
  if (context.action === 'authenticate') {
    return authenticateWebClient_(context);
  }

  requireSessionToken_(context);
  return executeCoreAction_(context);
}

function authenticateWebClient_(context) {
  var handler = globalThis.coreAuthenticateWebClient_;
  if (typeof handler !== 'function') {
    return apiError_(
      'WEB_AUTH_HANDLER_MISSING',
      '尚未接上 Web 驗證主程式。',
      { requiredHandler: 'coreAuthenticateWebClient_' }
    );
  }

  return normalizeHandlerResult_(handler(context.params, context));
}

// 共用主程式固定接點：
// function coreAuthenticateWebClient_(params, context) {
//   接回現有 Email／Google／LINE Web OAuth 流程並建立 ANG HR session。
// }
