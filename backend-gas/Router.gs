// ANG HR GAS 分流器：只判斷 client，然後交給各客戶端檔案。
function routeHttpRequest_(e, method) {
  try {
    var context = buildRequestContext_(e, method);
    var result;

    if (context.client === 'line') result = handleLineClient_(context);
    else if (context.client === 'flutter') result = handleFlutterClient_(context);
    else if (context.client === 'web') result = handleWebClient_(context);
    else result = apiError_('UNSUPPORTED_CLIENT', '不支援的 client：' + context.client);

    return jsonOutput_(result);
  } catch (error) {
    return jsonOutput_(apiError_(
      error && error.code ? error.code : 'SERVER_ERROR',
      error && error.message ? error.message : '伺服器處理失敗。'
    ));
  }
}

function buildRequestContext_(e, method) {
  var params = {};
  var source = e && e.parameter ? e.parameter : {};
  Object.keys(source).forEach(function (key) { params[key] = source[key]; });

  var contentType = e && e.postData && e.postData.type ? String(e.postData.type) : '';
  if (method === 'POST' && contentType.indexOf('application/json') >= 0 && e.postData.contents) {
    var json = JSON.parse(e.postData.contents);
    Object.keys(json || {}).forEach(function (key) { params[key] = json[key]; });
  }

  var client = normalizeClient_(params.client, params.source, params.channel);
  return {
    method: method,
    client: client,
    action: String(params.action || '').trim(),
    params: params,
    rawEvent: e || {},
    requestId: Utilities.getUuid(),
    receivedAt: new Date().toISOString()
  };
}

function normalizeClient_(client, source, channel) {
  var value = String(client || '').toLowerCase().trim();
  if (value === 'line' || value === 'flutter' || value === 'web') return value;

  var hint = [source, channel].join(' ').toLowerCase();
  if (hint.indexOf('line') >= 0 || hint.indexOf('liff') >= 0) return 'line';
  if (hint.indexOf('flutter') >= 0 || hint.indexOf('android') >= 0 || hint.indexOf('ios') >= 0 || hint.indexOf('native') >= 0) return 'flutter';
  return 'web';
}
