(function(window){
  'use strict';
  var cfg=window.ANG_HR_CONFIG=window.ANG_HR_CONFIG||{};
  cfg.lineChannelId='2010402308';
  cfg.lineLiffId='2010402308-aEXeFYXe';
  cfg.lineLiffEnvironment='published';
  cfg.lineLiffIds=Object.assign({},cfg.lineLiffIds||{},{published:'2010402308-aEXeFYXe'});
  cfg.lineMiniAppEndpoint='https://angsystem.github.io/HR/index.html';
  cfg.lineMiniAppScopes=['openid','profile','email'];
  cfg.enabledLoginProviders=['email','phone','google','line','apple'];
  if(typeof cfg.appleLoginUrl!=='string')cfg.appleLoginUrl='';
})(window);
