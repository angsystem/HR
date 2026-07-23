/***** ANG HR SYSTEMS｜Auth.gs
 * 新增檔案：專門處理 Google / LINE / Email 驗證
 *
 * 需要設定 Script Properties：
 * MASTER_SPREADSHEET_ID
 * ANG_ENTRY_INDEX_URL
 * GOOGLE_CLIENT_ID
 * GOOGLE_CLIENT_SECRET
 * LINE_CHANNEL_ID
 * LINE_CHANNEL_SECRET
 *
 * 可選：
 * GAS_WEBAPP_URL
 * GOOGLE_REDIRECT_URI
 * LINE_REDIRECT_URI
 *****/

function handleAuthAction_(req) {
  var action = String((req && req.action) || '').trim();

  if (action === 'requestGoogleAuth') {
    return angJson_(angRequestGoogleAuth_(req));
  }

  if (action === 'requestLineAuth') {
    return angJson_(angRequestLineAuth_(req));
  }

  if (action === 'requestFacebookAuth') {
    return angJson_(angRequestFacebookAuth_(req));
  }

  if (action === 'oauthCallback') {
    return angHandleOAuthCallback_(req);
  }

  if (action === 'requestEmailVerifyCode') {
    return angJson_(angRequestEmailVerifyCode_(req));
  }

  if (action === 'confirmEmailVerifyCode') {
    return angJson_(angConfirmEmailVerifyCode_(req));
  }

  if (action === 'verifyAuthToken') {
    return angJson_(angVerifyAuthToken_(req));
  }

  if (action === 'verifyNativeGoogleIdToken') {
    return angJson_(angVerifyNativeGoogleIdToken_(req));
  }

  if (action === 'verifyNativeLineIdToken') {
    return angJson_(angVerifyNativeLineIdToken_(req));
  }

  return angJson_({
    ok: false,
    message: 'Auth.gs 未知 action',
    action: action
  });
}

function angRequestGoogleAuth_(req) {
  req = req || {};

  var clientId = angGetScriptProp_('GOOGLE_CLIENT_ID', (typeof GOOGLE_CLIENT_ID !== 'undefined' ? GOOGLE_CLIENT_ID : ''));
  if (!clientId) {
    throw new Error('尚未設定 GOOGLE_CLIENT_ID');
  }

  var provider = 'google';
  var flow = String(req.flow || 'company_signup').trim();
  var plan = angNormalizePlan_(req.plan || '');
  var companyId = angNormalizeCompanyId_(req.company_id || req.company || '');
  var email = angNormalizeEmail_(req.email || '');
  var deviceId = String(req.device_id || '').trim();

  var redirectUri = angGetOAuthRedirectUri_(provider);

  var state = angGenerateVerifyToken_('state');
  var expiredAt = angDateAfterMinutesText_(20);

  var authUrl = angAppendParams_('https://accounts.google.com/o/oauth2/v2/auth', {
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'openid email profile',
    state: state,
    prompt: 'select_account',
    access_type: 'offline',
    include_granted_scopes: 'true'
  });

  angAppendAuthRecord_({
    created_at: angNowText_(),
    flow: flow,
    provider: provider,
    plan: plan,
    company_id: companyId,
    email: email,
    google_user_id: '',
    line_user_id: '',
    verify_token: '',
    state: state,
    auth_code: '',
    status: 'pending',
    ip: String(req.ip || ''),
    user_agent: String(req.user_agent || ''),
    device_id: deviceId,
    expired_at: expiredAt,
    used_at: '',
    redirect_uri: redirectUri,
    auth_url: authUrl,
    profile_name: '',
    raw_response: '',
    note: '',
    updated_at: angNowText_()
  });

  return {
    ok: true,
    provider: provider,
    flow: flow,
    plan: plan,
    company_id: companyId,
    auth_url: authUrl,
    redirect_uri: redirectUri,
    state: state,
    expired_at: expiredAt
  };
}

function angRequestLineAuth_(req) {
  req = req || {};

  var channelId = angGetScriptProp_('LINE_CHANNEL_ID', (typeof LINE_CHANNEL_ID !== 'undefined' ? LINE_CHANNEL_ID : ''));
  if (!channelId) {
    throw new Error('尚未設定 LINE_CHANNEL_ID');
  }

  var provider = 'line';
  var flow = String(req.flow || 'company_signup').trim();
  var plan = angNormalizePlan_(req.plan || '');
  var companyId = angNormalizeCompanyId_(req.company_id || req.company || '');
  var email = angNormalizeEmail_(req.email || '');
  var deviceId = String(req.device_id || '').trim();

  var redirectUri = angGetOAuthRedirectUri_(provider);

  var state = angGenerateVerifyToken_('state');
  var expiredAt = angDateAfterMinutesText_(20);

  var authUrl = angAppendParams_('https://access.line.me/oauth2/v2.1/authorize', {
    response_type: 'code',
    client_id: channelId,
    redirect_uri: redirectUri,
    state: state,
    scope: 'openid profile email',
    bot_prompt: 'normal'
  });

  angAppendAuthRecord_({
    created_at: angNowText_(),
    flow: flow,
    provider: provider,
    plan: plan,
    company_id: companyId,
    email: email,
    google_user_id: '',
    line_user_id: '',
    verify_token: '',
    state: state,
    auth_code: '',
    status: 'pending',
    ip: String(req.ip || ''),
    user_agent: String(req.user_agent || ''),
    device_id: deviceId,
    expired_at: expiredAt,
    used_at: '',
    redirect_uri: redirectUri,
    auth_url: authUrl,
    profile_name: '',
    raw_response: '',
    note: '',
    updated_at: angNowText_()
  });

  return {
    ok: true,
    provider: provider,
    flow: flow,
    plan: plan,
    company_id: companyId,
    auth_url: authUrl,
    redirect_uri: redirectUri,
    state: state,
    expired_at: expiredAt
  };
}


function angRequestFacebookAuth_(req) {
  req = req || {};
  var appId = angGetScriptProp_('FACEBOOK_APP_ID', '');
  if (!appId) throw new Error('尚未設定 FACEBOOK_APP_ID');
  var provider = 'facebook';
  var flow = String(req.flow || 'account_login').trim();
  var plan = angNormalizePlan_(req.plan || '');
  var companyId = angNormalizeCompanyId_(req.company_id || req.company || '');
  var email = angNormalizeEmail_(req.email || '');
  var deviceId = String(req.device_id || '').trim();
  var redirectUri = angGetOAuthRedirectUri_(provider);
  var state = angGenerateVerifyToken_('state');
  var expiredAt = angDateAfterMinutesText_(20);
  var authUrl = angAppendParams_('https://www.facebook.com/v23.0/dialog/oauth', {
    client_id: appId, redirect_uri: redirectUri, response_type: 'code',
    scope: 'public_profile,email', state: state
  });
  angAppendAuthRecord_({created_at:angNowText_(),flow:flow,provider:provider,plan:plan,company_id:companyId,email:email,
    google_user_id:'',line_user_id:'',verify_token:'',state:state,auth_code:'',status:'pending',ip:String(req.ip||''),
    user_agent:String(req.user_agent||''),device_id:deviceId,expired_at:expiredAt,used_at:'',redirect_uri:redirectUri,
    auth_url:authUrl,profile_name:'',raw_response:'',note:'',updated_at:angNowText_()});
  return {ok:true,provider:provider,flow:flow,plan:plan,company_id:companyId,auth_url:authUrl,redirect_uri:redirectUri,state:state,expired_at:expiredAt};
}

function angHandleOAuthCallback_(req) {
  req = req || {};

  var provider = String(req.provider || '').trim().toLowerCase();
  var state = String(req.state || '').trim();
  var code = String(req.code || '').trim();
  var error = String(req.error || '').trim();
  var entryUrl = angGetEntryIndexUrl_();

  try {
    if (!state) {
      throw new Error('OAuth callback 缺少 state');
    }

    var found = angFindAuthByState_(state);
    if (!found || found.row <= 0) {
      throw new Error('找不到驗證 state：' + state);
    }

    var record = found.data || {};
    provider = provider || String(record.provider || '').trim().toLowerCase();

    if (!provider) {
      throw new Error('OAuth callback 缺少 provider');
    }

    if (error) {
      angUpdateAuthRecordByRow_(found.row, {
        status: 'error',
        note: error,
        updated_at: angNowText_()
      });

      return angRedirectHtml_(angAppendParams_(entryUrl, {
        auth_error: '1',
        provider: provider,
        flow: record.flow || '',
        plan: record.plan || '',
        company: record.company_id || '',
        message: error
      }));
    }

    if (!code) {
      throw new Error('OAuth callback 缺少 code');
    }

    var profile;

    if (provider === 'google') {
      profile = angExchangeGoogleCode_(code, record.redirect_uri || angGetOAuthRedirectUri_('google'));
    } else if (provider === 'line') {
      profile = angExchangeLineCode_(code, record.redirect_uri || angGetOAuthRedirectUri_('line'));
    } else if (provider === 'facebook') {
      profile = angExchangeFacebookCode_(code, record.redirect_uri || angGetOAuthRedirectUri_('facebook'));
    } else {
      throw new Error('不支援的 provider：' + provider);
    }

    var verifyToken = angGenerateVerifyToken_('verify');
    var person = null;
    if (typeof angPeopleEnsureFromVerifiedAuth_ === 'function') {
      person = angPeopleEnsureFromVerifiedAuth_({
        provider: provider,
        email: profile.email || record.email || '',
        profile_name: profile.profile_name || '',
        google_user_id: profile.google_user_id || '',
        line_user_id: profile.line_user_id || '',
        facebook_user_id: profile.facebook_user_id || '',
        device_id: record.device_id || ''
      });
    }

    var update = {
      status: 'verified',
      verify_token: verifyToken,
      person_id: person ? person.person_id : '',
      email: profile.email || record.email || '',
      profile_name: profile.profile_name || '',
      google_user_id: profile.google_user_id || '',
      line_user_id: profile.line_user_id || '',
      facebook_user_id: profile.facebook_user_id || '',
      raw_response: profile.raw_response || '',
      updated_at: angNowText_()
    };

    angUpdateAuthRecordByRow_(found.row, update);

    var callbackUrl = angAppendParams_(entryUrl, {
      auth_done: '1',
      provider: provider,
      flow: record.flow || '',
      plan: record.plan || '',
      company: record.company_id || '',
      company_id: record.company_id || '',
      email: profile.email || record.email || '',
      person_id: person ? person.person_id : '',
      verify_token: verifyToken
    });

    if (String(record.user_agent || '').toLowerCase().indexOf('android') >= 0 || String(req.app || '').toLowerCase() === 'android') {
      if (typeof redirectToAndroidAppAfterAuth_ === 'function') {
        return redirectToAndroidAppAfterAuth_({provider:provider,state:state,email:profile.email||record.email||'',person_id:person?person.person_id:'',token:verifyToken,next_url:callbackUrl});
      }
    }
    return angRedirectHtml_(callbackUrl);

  } catch (err) {
    return angRedirectHtml_(angAppendParams_(entryUrl, {
      auth_error: '1',
      provider: provider || '',
      message: err && err.message ? err.message : String(err)
    }));
  }
}

function angExchangeGoogleCode_(code, redirectUri) {
  var clientId = angGetScriptProp_('GOOGLE_CLIENT_ID', (typeof GOOGLE_CLIENT_ID !== 'undefined' ? GOOGLE_CLIENT_ID : ''));
  var clientSecret = angGetScriptProp_('GOOGLE_CLIENT_SECRET', '');

  if (!clientId) throw new Error('尚未設定 GOOGLE_CLIENT_ID');
  if (!clientSecret) throw new Error('尚未設定 GOOGLE_CLIENT_SECRET');

  var tokenRes = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    muteHttpExceptions: true,
    payload: {
      code: code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }
  });

  var tokenText = tokenRes.getContentText() || '{}';
  var tokenData = JSON.parse(tokenText);

  if (tokenRes.getResponseCode() >= 300) {
    throw new Error('Google token 交換失敗：' + tokenText);
  }

  if (!tokenData.id_token) {
    throw new Error('Google token 回傳缺少 id_token');
  }

  var verifyRes = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(tokenData.id_token),
    {
      method: 'get',
      muteHttpExceptions: true
    }
  );

  var verifyText = verifyRes.getContentText() || '{}';
  var profile = JSON.parse(verifyText);

  if (verifyRes.getResponseCode() >= 300) {
    throw new Error('Google id_token 驗證失敗：' + verifyText);
  }

  if (profile.aud && String(profile.aud) !== String(clientId)) {
    throw new Error('Google id_token aud 不符');
  }

  return {
    email: profile.email || '',
    profile_name: profile.name || '',
    google_user_id: profile.sub || '',
    line_user_id: '',
    raw_response: JSON.stringify({
      provider: 'google',
      email: profile.email || '',
      name: profile.name || '',
      sub: profile.sub || '',
      aud: profile.aud || '',
      email_verified: profile.email_verified || '',
      expires_in: tokenData.expires_in || ''
    })
  };
}

function angExchangeLineCode_(code, redirectUri) {
  var channelId = angGetScriptProp_('LINE_CHANNEL_ID', (typeof LINE_CHANNEL_ID !== 'undefined' ? LINE_CHANNEL_ID : ''));
  var channelSecret = angGetScriptProp_('LINE_CHANNEL_SECRET', '');

  if (!channelId) throw new Error('尚未設定 LINE_CHANNEL_ID');
  if (!channelSecret) throw new Error('尚未設定 LINE_CHANNEL_SECRET');

  var tokenRes = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'post',
    muteHttpExceptions: true,
    payload: {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: channelId,
      client_secret: channelSecret
    }
  });

  var tokenText = tokenRes.getContentText() || '{}';
  var tokenData = JSON.parse(tokenText);

  if (tokenRes.getResponseCode() >= 300) {
    throw new Error('LINE token 交換失敗：' + tokenText);
  }

  if (!tokenData.id_token) {
    throw new Error('LINE token 回傳缺少 id_token');
  }

  var verifyRes = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'post',
    muteHttpExceptions: true,
    payload: {
      id_token: tokenData.id_token,
      client_id: channelId
    }
  });

  var verifyText = verifyRes.getContentText() || '{}';
  var profile = JSON.parse(verifyText);

  if (verifyRes.getResponseCode() >= 300) {
    throw new Error('LINE id_token 驗證失敗：' + verifyText);
  }

  if (profile.aud && String(profile.aud) !== String(channelId)) {
    throw new Error('LINE id_token aud 不符');
  }

  return {
    email: profile.email || '',
    profile_name: profile.name || '',
    google_user_id: '',
    line_user_id: profile.sub || '',
    raw_response: JSON.stringify({
      provider: 'line',
      email: profile.email || '',
      name: profile.name || '',
      sub: profile.sub || '',
      aud: profile.aud || ''
    })
  };
}



function angExchangeFacebookCode_(code, redirectUri) {
  var appId = angGetScriptProp_('FACEBOOK_APP_ID', '');
  var appSecret = angGetScriptProp_('FACEBOOK_APP_SECRET', '');
  if (!appId) throw new Error('尚未設定 FACEBOOK_APP_ID');
  if (!appSecret) throw new Error('尚未設定 FACEBOOK_APP_SECRET');
  var tokenUrl = angAppendParams_('https://graph.facebook.com/v23.0/oauth/access_token', {
    client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code: code
  });
  var tokenRes = UrlFetchApp.fetch(tokenUrl,{method:'get',muteHttpExceptions:true});
  var tokenText=tokenRes.getContentText()||'{}'; var tokenData=JSON.parse(tokenText);
  if(tokenRes.getResponseCode()>=300 || !tokenData.access_token) throw new Error('Facebook token 交換失敗：'+tokenText);
  var profileUrl=angAppendParams_('https://graph.facebook.com/me',{fields:'id,name,email',access_token:tokenData.access_token});
  var profileRes=UrlFetchApp.fetch(profileUrl,{method:'get',muteHttpExceptions:true});
  var profileText=profileRes.getContentText()||'{}'; var profile=JSON.parse(profileText);
  if(profileRes.getResponseCode()>=300 || !profile.id) throw new Error('Facebook 使用者資料取得失敗：'+profileText);
  return {email:profile.email||'',profile_name:profile.name||'',google_user_id:'',line_user_id:'',facebook_user_id:profile.id||'',raw_response:JSON.stringify({provider:'facebook',id:profile.id||'',name:profile.name||'',email:profile.email||''})};
}

function angVerifyNativeGoogleIdToken_(req) {
  req = req || {};

  var idToken = String(req.id_token || req.credential || req.loginToken || req.token || '').trim();
  if (!idToken) throw new Error('缺少 Google id_token');

  var clientId = angGetScriptProp_('GOOGLE_CLIENT_ID', (typeof GOOGLE_CLIENT_ID !== 'undefined' ? GOOGLE_CLIENT_ID : ''));
  if (!clientId) throw new Error('尚未設定 GOOGLE_CLIENT_ID');

  var verifyRes = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
    { muteHttpExceptions: true }
  );

  var verifyText = verifyRes.getContentText() || '{}';
  var profile = JSON.parse(verifyText);

  if (verifyRes.getResponseCode() >= 300) {
    throw new Error('Google 原生 id_token 驗證失敗：' + verifyText);
  }

  if (profile.aud && String(profile.aud) !== String(clientId)) {
    throw new Error('Google 原生 id_token aud 不符');
  }

  if (!profile.email || String(profile.email_verified) !== 'true') {
    throw new Error('Google Email 尚未完成驗證');
  }

  return angCreateNativeVerifiedAuth_(req, {
    provider: 'google',
    email: profile.email || req.email || '',
    profile_name: profile.name || '',
    google_user_id: profile.sub || '',
    line_user_id: '',
    raw_response: JSON.stringify({
      provider: 'google_native',
      email: profile.email || '',
      name: profile.name || '',
      sub: profile.sub || '',
      aud: profile.aud || '',
      email_verified: profile.email_verified || ''
    })
  });
}

function angVerifyNativeLineIdToken_(req) {
  req = req || {};

  var idToken = String(req.id_token || req.credential || req.loginToken || req.token || '').trim();
  if (!idToken) throw new Error('缺少 LINE id_token');

  var channelId = angGetScriptProp_('LINE_CHANNEL_ID', (typeof LINE_CHANNEL_ID !== 'undefined' ? LINE_CHANNEL_ID : ''));
  if (!channelId) throw new Error('尚未設定 LINE_CHANNEL_ID');

  var verifyRes = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'post',
    muteHttpExceptions: true,
    payload: {
      id_token: idToken,
      client_id: channelId
    }
  });

  var verifyText = verifyRes.getContentText() || '{}';
  var profile = JSON.parse(verifyText);

  if (verifyRes.getResponseCode() >= 300) {
    throw new Error('LINE 原生 id_token 驗證失敗：' + verifyText);
  }

  if (profile.aud && String(profile.aud) !== String(channelId)) {
    throw new Error('LINE 原生 id_token aud 不符');
  }

  return angCreateNativeVerifiedAuth_(req, {
    provider: 'line',
    email: profile.email || req.email || '',
    profile_name: profile.name || req.profile_name || req.displayName || '',
    google_user_id: '',
    line_user_id: profile.sub || req.line_user_id || req.user_id || '',
    raw_response: JSON.stringify({
      provider: 'line_native',
      email: profile.email || '',
      name: profile.name || '',
      sub: profile.sub || '',
      aud: profile.aud || ''
    })
  });
}

function angCreateNativeVerifiedAuth_(req, profile) {
  req = req || {};
  profile = profile || {};

  var provider = String(profile.provider || req.provider || '').trim().toLowerCase();
  if (!provider) throw new Error('缺少 provider');

  var flow = String(req.flow || 'company_signup').trim();
  var plan = angNormalizePlan_(req.plan || '');
  var companyId = angNormalizeCompanyId_(req.company_id || req.company || '');
  var email = angNormalizeEmail_(profile.email || req.email || '');
  var deviceId = String(req.device_id || '').trim();
  var verifyToken = angGenerateVerifyToken_('verify');
  var person = null;
  if (typeof angPeopleEnsureFromVerifiedAuth_ === 'function') {
    person = angPeopleEnsureFromVerifiedAuth_({
      provider: provider,
      email: email,
      profile_name: profile.profile_name || '',
      google_user_id: profile.google_user_id || '',
      line_user_id: profile.line_user_id || '',
      device_id: deviceId
    });
  }

  angAppendAuthRecord_({
    created_at: angNowText_(),
    flow: flow,
    provider: provider,
    plan: plan,
    company_id: companyId,
    person_id: person ? person.person_id : '',
    email: email,
    google_user_id: profile.google_user_id || '',
    line_user_id: profile.line_user_id || '',
    verify_token: verifyToken,
    state: String(req.state || ''),
    auth_code: '',
    status: 'verified',
    ip: String(req.ip || ''),
    user_agent: String(req.user_agent || ''),
    device_id: deviceId,
    expired_at: angDateAfterMinutesText_(30),
    used_at: '',
    redirect_uri: '',
    auth_url: '',
    profile_name: profile.profile_name || '',
    raw_response: profile.raw_response || '',
    note: 'android_native_bridge',
    updated_at: angNowText_()
  });

  return {
    ok: true,
    provider: provider,
    flow: flow,
    plan: plan,
    company_id: companyId,
    person_id: person ? person.person_id : '',
    email: email,
    google_user_id: profile.google_user_id || '',
    line_user_id: profile.line_user_id || '',
    profile_name: profile.profile_name || '',
    verify_token: verifyToken,
    message: (provider === 'line' ? 'LINE' : 'Google') + ' 原生驗證完成'
  };
}

function angRequestEmailVerifyCode_(req) {
  req = req || {};

  var email = angNormalizeEmail_(req.email || '');
  if (!email) {
    throw new Error('請輸入 Email');
  }

  var flow = String(req.flow || 'company_signup').trim();
  var plan = angNormalizePlan_(req.plan || '');
  var companyId = angNormalizeCompanyId_(req.company_id || req.company || '');
  var deviceId = String(req.device_id || '').trim();

  var code = angGenerateEmailCode_();
  var state = angGenerateVerifyToken_('email');
  var expiredAt = angDateAfterMinutesText_(15);

  angAppendAuthRecord_({
    created_at: angNowText_(),
    flow: flow,
    provider: 'email',
    plan: plan,
    company_id: companyId,
    email: email,
    google_user_id: '',
    line_user_id: '',
    verify_token: '',
    state: state,
    auth_code: code,
    status: 'email_code_sent',
    ip: String(req.ip || ''),
    user_agent: String(req.user_agent || ''),
    device_id: deviceId,
    expired_at: expiredAt,
    used_at: '',
    redirect_uri: '',
    auth_url: '',
    profile_name: '',
    raw_response: '',
    note: '',
    updated_at: angNowText_()
  });

  MailApp.sendEmail({
    to: email,
    subject: 'ANG HR SYSTEMS 驗證碼',
    body: '您的 ANG HR SYSTEMS 驗證碼是：' + code + '\n\n此驗證碼 15 分鐘內有效。'
  });

  return {
    ok: true,
    provider: 'email',
    flow: flow,
    plan: plan,
    company_id: companyId,
    email: email,
    state: state,
    expired_at: expiredAt,
    message: '驗證碼已寄出'
  };
}

function angConfirmEmailVerifyCode_(req) {
  req = req || {};

  var email = angNormalizeEmail_(req.email || '');
  var code = String(req.code || req.auth_code || '').trim();
  var state = String(req.state || '').trim();

  if (!email) throw new Error('缺少 Email');
  if (!code) throw new Error('缺少驗證碼');

  var found = state ? angFindAuthByState_(state) : angFindLatestEmailAuth_(email);

  if (!found || found.row <= 0) {
    throw new Error('找不到 Email 驗證紀錄');
  }

  var record = found.data || {};

  if (String(record.provider || '') !== 'email') {
    throw new Error('此紀錄不是 Email 驗證');
  }

  if (String(record.status || '') !== 'email_code_sent') {
    throw new Error('此驗證狀態不可確認：' + record.status);
  }

  if (String(record.auth_code || '').trim() !== code) {
    throw new Error('驗證碼錯誤');
  }

  var verifyToken = angGenerateVerifyToken_('verify');
  var person = null;
  if (typeof angPeopleEnsureFromVerifiedAuth_ === 'function') {
    person = angPeopleEnsureFromVerifiedAuth_({
      provider: 'email',
      email: record.email || email,
      profile_name: record.profile_name || '',
      device_id: record.device_id || ''
    });
  }

  angUpdateAuthRecordByRow_(found.row, {
    status: 'verified',
    verify_token: verifyToken,
    person_id: person ? person.person_id : '',
    updated_at: angNowText_()
  });

  return {
    ok: true,
    provider: 'email',
    flow: record.flow || '',
    plan: record.plan || '',
    company_id: record.company_id || '',
    person_id: person ? person.person_id : '',
    email: record.email || email,
    verify_token: verifyToken,
    message: 'Email 驗證完成'
  };
}

function angVerifyAuthToken_(req) {
  req = req || {};

  var token = String(req.verify_token || req.token || '').trim();
  if (!token) {
    throw new Error('缺少 verify_token');
  }

  var found = angFindVerifiedAuthByToken_(token);

  if (!found || found.row <= 0) {
    return {
      ok: false,
      message: '驗證 token 無效或已使用'
    };
  }

  return {
    ok: true,
    data: found.data
  };
}

function angGetOAuthRedirectUri_(provider) {
  provider = String(provider || '').trim().toLowerCase();

  if (provider === 'google') {
    var googleUri = angGetScriptProp_('GOOGLE_REDIRECT_URI', '');
    if (googleUri) return googleUri;
  }

  if (provider === 'line') {
    var lineUri = angGetScriptProp_('LINE_REDIRECT_URI', '');
    if (lineUri) return lineUri;
  }

  var common = angGetScriptProp_('OAUTH_REDIRECT_URI', '');
  if (common) return common;

  return angAppendParams_(angGetGasWebAppUrl_(), {
    action: 'oauthCallback',
    provider: provider
  });
}

function angAppendAuthRecord_(record) {
  var ss = angGetMasterSpreadsheet_();
  var sheet = angEnsureSheet_(ss, ANG_MASTER_SHEET_AUTH);
  angEnsureHeader_(sheet, ANG_MASTER_AUTH_HEADERS);
  sheet.appendRow(angObjectToRow_(ANG_MASTER_AUTH_HEADERS, record || {}));
}

function angFindAuthByState_(state) {
  var ss = angGetMasterSpreadsheet_();
  var sheet = angEnsureSheet_(ss, ANG_MASTER_SHEET_AUTH);
  angEnsureHeader_(sheet, ANG_MASTER_AUTH_HEADERS);
  return angFindRowByHeaderValue_(sheet, 'state', state);
}

function angFindLatestEmailAuth_(email) {
  email = angNormalizeEmail_(email);

  var ss = angGetMasterSpreadsheet_();
  var sheet = angEnsureSheet_(ss, ANG_MASTER_SHEET_AUTH);
  angEnsureHeader_(sheet, ANG_MASTER_AUTH_HEADERS);

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return { row: -1, data: null };
  }

  var headers = values[0];
  var emailIndex = headers.indexOf('email');
  var providerIndex = headers.indexOf('provider');
  var statusIndex = headers.indexOf('status');

  for (var i = values.length - 1; i >= 1; i--) {
    var rowEmail = angNormalizeEmail_(values[i][emailIndex]);
    var provider = String(values[i][providerIndex] || '').trim();
    var status = String(values[i][statusIndex] || '').trim();

    if (rowEmail === email && provider === 'email' && status === 'email_code_sent') {
      return {
        row: i + 1,
        data: angRowToObject_(headers, values[i])
      };
    }
  }

  return { row: -1, data: null };
}

function angFindVerifiedAuthByToken_(token) {
  token = String(token || '').trim();

  var ss = angGetMasterSpreadsheet_();
  var sheet = angEnsureSheet_(ss, ANG_MASTER_SHEET_AUTH);
  angEnsureHeader_(sheet, ANG_MASTER_AUTH_HEADERS);

  var values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return { row: -1, data: null };
  }

  var headers = values[0];
  var tokenIndex = headers.indexOf('verify_token');
  var statusIndex = headers.indexOf('status');

  for (var i = values.length - 1; i >= 1; i--) {
    if (String(values[i][tokenIndex] || '').trim() === token) {
      var status = String(values[i][statusIndex] || '').trim();
      if (status === 'verified') {
        return {
          row: i + 1,
          data: angRowToObject_(headers, values[i])
        };
      }
    }
  }

  return { row: -1, data: null };
}

function angMarkAuthTokenUsed_(token, companyId) {
  var found = angFindVerifiedAuthByToken_(token);
  if (!found || found.row <= 0) return false;

  angUpdateAuthRecordByRow_(found.row, {
    status: 'used',
    company_id: companyId || found.data.company_id || '',
    used_at: angNowText_(),
    updated_at: angNowText_()
  });

  return true;
}

function angUpdateAuthRecordByRow_(rowNumber, patch) {
  var ss = angGetMasterSpreadsheet_();
  var sheet = angEnsureSheet_(ss, ANG_MASTER_SHEET_AUTH);
  angEnsureHeader_(sheet, ANG_MASTER_AUTH_HEADERS);
  angUpdateRowByHeaders_(sheet, rowNumber, ANG_MASTER_AUTH_HEADERS, patch || {});
}

function angGenerateEmailCode_() {
  return String(Math.floor(100000 + Math.random() * 900000));
}