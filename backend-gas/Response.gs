// ANG HR GAS 統一回傳格式。
function apiOk_(data, message) {
  return {
    ok: true,
    message: message || '',
    data: data == null ? {} : data
  };
}

function apiError_(code, message, details) {
  return {
    ok: false,
    code: code || 'API_ERROR',
    message: message || '操作失敗。',
    details: details || null
  };
}

function jsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizeHandlerResult_(result) {
  if (result && typeof result === 'object' && typeof result.ok === 'boolean') return result;
  return apiOk_(result == null ? {} : result);
}
