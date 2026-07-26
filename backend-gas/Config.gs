// ANG HR GAS 後端設定：敏感資料全部放 Script Properties，不寫死在程式碼。
function getBackendConfig_() {
  var properties = PropertiesService.getScriptProperties();
  return {
    lineChannelIds: {
      developing: properties.getProperty('LINE_MINI_CHANNEL_ID_DEVELOPING') || '',
      review: properties.getProperty('LINE_MINI_CHANNEL_ID_REVIEW') || '',
      published: properties.getProperty('LINE_MINI_CHANNEL_ID_PUBLISHED') || ''
    },
    defaultEnvironment: properties.getProperty('LINE_MINI_DEFAULT_ENVIRONMENT') || 'developing'
  };
}

function getLineChannelId_(environment) {
  var config = getBackendConfig_();
  var env = String(environment || config.defaultEnvironment || 'developing').toLowerCase();
  return config.lineChannelIds[env] || '';
}
