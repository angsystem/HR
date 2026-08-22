// ANG HR Flutter 客戶端：只處理原生 App 驗證與 Flutter 請求。
function handleFlutterClient_(context) {
  if (context.action === 'authenticate') {
    return authenticateFlutterClient_(context);
  }

  requireSessionToken_(context);
  return executeCoreAction_(context);
}

function authenticateFlutterClient_(context) {
  var handler = globalThis.coreAuthenticateFlutterClient_;
  if (typeof handler !== 'function') {
    return apiError_(
      'FLUTTER_AUTH_HANDLER_MISSING',
      '尚未接上 Flutter 驗證主程式。',
      { requiredHandler: 'coreAuthenticateFlutterClient_' }
    );
  }

  return normalizeHandlerResult_(handler({
    provider: String(context.params.provider || ''),
    idToken: String(context.params.id_token || ''),
    accessToken: String(context.params.access_token || ''),
    deviceId: String(context.params.device_id || context.params.deviceId || ''),
    platform: String(context.params.platform || '')
  }, context));
}

// 共用主程式固定接點：
// function coreAuthenticateFlutterClient_(credentials, context) {
//   驗證 Flutter 傳來的 provider token，建立 ANG HR session 後回傳。
// }
