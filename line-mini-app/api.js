// ANG HR LINE MINI App：LINE 專用 API 轉接層
(function (window) {
  'use strict';

  var config = window.ANG_HR_MINI_CONFIG || {};
  var sessionProvider = function () { return ''; };

  function createError(code, message, details) {
    var error = new Error(message || '操作失敗。');
    error.code = code || 'LINE_API_ERROR';
    error.details = details || null;
    return error;
  }

  function setSessionProvider(provider) {
    sessionProvider = typeof provider === 'function' ? provider : function () { return ''; };
  }

  async function request(action, payload, options) {
    options = options || {};
    var body = new URLSearchParams();
    body.set('client', 'line');
    body.set('channel', 'line-mini-app');
    body.set('action', String(action || ''));
    body.set('environment', config.environment || 'developing');
    body.set('api_version', config.apiVersion || 'v1');

    if (!options.skipSession) {
      var sessionToken = String(sessionProvider() || '');
      if (sessionToken) body.set('session_token', sessionToken);
    }

    Object.keys(payload || {}).forEach(function (key) {
      var value = payload[key];
      if (value !== undefined && value !== null) body.set(key, String(value));
    });

    var response = await fetch(config.gasApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: body.toString(),
      redirect: 'follow'
    });

    if (!response.ok) {
      throw createError('LINE_API_HTTP_ERROR', 'ANG HR 後端暫時無法連線。', { status: response.status });
    }

    var result;
    try {
      result = await response.json();
    } catch (error) {
      throw createError('LINE_API_INVALID_RESPONSE', 'ANG HR 後端回傳格式不正確。');
    }

    if (!result || result.ok !== true) {
      throw createError(
        result && result.code ? result.code : 'LINE_API_REQUEST_FAILED',
        result && result.message ? result.message : '操作失敗。',
        result
      );
    }

    return result;
  }

  window.ANG_HR_LINE_API = {
    setSessionProvider: setSessionProvider,
    request: request,
    authenticate: function (idToken) {
      return request('authenticate', {
        provider: 'line-mini-app',
        id_token: idToken
      }, { skipSession: true });
    },
    clockByLocation: function (payload) { return request('clockByLocation', payload); },
    clockByQr: function (qrToken) { return request('clockByQr', { qr_token: qrToken }); },
    clockByNfc: function (nfcToken) { return request('clockByNfc', { nfc_token: nfcToken }); },
    getHomeData: function () { return request('getHomeData'); },
    getSchedule: function (payload) { return request('getSchedule', payload); },
    getLeaveRecords: function (payload) { return request('getLeaveRecords', payload); },
    submitLeave: function (payload) { return request('submitLeave', payload); },
    getPayroll: function (payload) { return request('getPayroll', payload); },
    getManagementOverview: function () { return request('getManagementOverview'); }
  };
}(window));
