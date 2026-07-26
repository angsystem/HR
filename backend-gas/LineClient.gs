// ANG HR LINE 客戶端：只處理 LIFF／LINE 身分與 LINE 請求。
function handleLineClient_(context) {
  if (context.action === 'authenticate') {
    return authenticateLineMiniApp_(context);
  }

  requireSessionToken_(context);
  return executeCoreAction_(context);
}

function authenticateLineMiniApp_(context) {
  var provider = String(context.params.provider || 'line-mini-app').toLowerCase();
  if (provider !== 'line-mini-app' && provider !== 'line') {
    return apiError_('INVALID_LINE_PROVIDER', 'LINE client 不接受此 provider。');
  }

  var idToken = String(context.params.id_token || '').trim();
  if (!idToken) return apiError_('LINE_ID_TOKEN_MISSING', '缺少 LINE ID token。');

  var claims = verifyLineMiniAppIdToken_(idToken, context.params.environment);
  var loginHandler = globalThis.coreLoginOrBindLineIdentity_;
  if (typeof loginHandler !== 'function') {
    return apiError_(
      'LINE_ACCOUNT_HANDLER_MISSING',
      'LINE 身分已驗證，但尚未接上 ANG HR 帳號綁定主程式。',
      { requiredHandler: 'coreLoginOrBindLineIdentity_' }
    );
  }

  return normalizeHandlerResult_(loginHandler({
    provider: 'line-mini-app',
    externalUserId: claims.sub,
    email: claims.email || '',
    displayName: claims.name || '',
    pictureUrl: claims.picture || '',
    environment: String(context.params.environment || 'developing')
  }, context));
}

function verifyLineMiniAppIdToken_(idToken, environment) {
  var channelId = getLineChannelId_(environment);
  if (!channelId) {
    var configError = new Error('尚未設定此環境的 LINE MINI App Channel ID。');
    configError.code = 'LINE_CHANNEL_ID_MISSING';
    throw configError;
  }

  var response = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'post',
    payload: {
      id_token: idToken,
      client_id: channelId
    },
    muteHttpExceptions: true
  });

  var status = response.getResponseCode();
  var text = response.getContentText();
  var claims;
  try {
    claims = JSON.parse(text || '{}');
  } catch (error) {
    claims = {};
  }

  if (status < 200 || status >= 300 || !claims.sub) {
    var verifyError = new Error(claims.error_description || claims.error || 'LINE ID token 驗證失敗。');
    verifyError.code = 'LINE_ID_TOKEN_INVALID';
    throw verifyError;
  }

  if (String(claims.aud || '') !== String(channelId)) {
    var audienceError = new Error('LINE ID token 的 Channel ID 不符。');
    audienceError.code = 'LINE_ID_TOKEN_AUDIENCE_MISMATCH';
    throw audienceError;
  }

  return claims;
}

// 共用主程式固定接點：
// function coreLoginOrBindLineIdentity_(identity, context) {
//   以 identity.externalUserId 查 ANG HR 帳號，建立 ANG HR session 後回傳。
// }
