/* ANG HR Deep Link / Native Auth Receiver */
(function(){
  'use strict';
  function safeJsonParse(v){ try { return JSON.parse(v || '{}'); } catch(e){ return {}; } }
  function pick(obj, keys){ obj=obj||{}; for(var i=0;i<keys.length;i++){var k=keys[i]; if(obj[k]!==undefined&&obj[k]!==null&&String(obj[k]).trim()!=='') return obj[k];} return ''; }
  function normalizeAuth(raw){
    var res=raw||{}; var auth=res.gas_response||res.auth||res.data||res; if(auth.gas_response) auth=auth.gas_response;
    var ok=auth.ok===true||auth.success===true||auth.status==='success'||auth.status==='verified';
    var passed=auth.auth_passed===true||auth.verified===true||auth.status==='verified'||ok;
    auth.ok=ok; auth.auth_passed=passed;
    auth.provider=pick(auth,['provider','auth_provider'])||pick(res,['provider']);
    auth.email=pick(auth,['email','user_email','account']);
    auth.company_id=pick(auth,['company_id','companyId','company_code','companyCode']);
    auth.employee_id=pick(auth,['employee_id','emp_id','employeeId','id','loginId']);
    auth.name=pick(auth,['name','employee_name','displayName','profile_name']);
    auth.role=pick(auth,['role','permission','auth_role']);
    auth.login_at=auth.login_at||Date.now();
    return auth;
  }
  function saveAuthState(auth){
    if(!auth||auth.auth_passed!==true) return false;
    try{
      localStorage.setItem('ang_auth_state',JSON.stringify(auth));
      localStorage.setItem('isLoggedIn','true');
      if(auth.email) localStorage.setItem('loginEmail',String(auth.email));
      if(auth.company_id) localStorage.setItem('ang_company_id',String(auth.company_id));
      if(auth.role) localStorage.setItem('ang_role',String(auth.role));
      if(auth.employee_id){localStorage.setItem('emp_logged_in',String(auth.employee_id).toUpperCase());localStorage.setItem('loginId',String(auth.employee_id).toUpperCase());}
      if(auth.name) localStorage.setItem('emp_name',String(auth.name));
      return true;
    }catch(e){console.error('ANG HR 寫入 auth_state 失敗',e);return false;}
  }
  function routeAfterAuth(auth){
    if(!auth||auth.auth_passed!==true) return;
    var role=String(auth.role||'').toLowerCase();
    var emp=auth.employee_id||localStorage.getItem('emp_logged_in')||'';
    var base=location.origin+location.pathname;
    if(auth.next_url){location.href=auth.next_url;return;}
    if(auth.next){location.href=base+'?page='+encodeURIComponent(auth.next)+(emp?'&id='+encodeURIComponent(emp):'');return;}
    if(role==='creator'||role==='admin'||role==='manager'||role==='boss'){location.href=base+'?page=boss';return;}
    if(emp){location.href=base+'?page=employee&id='+encodeURIComponent(String(emp).toUpperCase());}
  }
  window.ANG_DEEP_LINK_AUTH_RECEIVER=function(auth,raw){
    var normalized=normalizeAuth(auth||raw||{}); window.__ANG_AUTH_STATE=normalized;
    try{localStorage.setItem('ang_last_auth_raw',JSON.stringify(raw||auth||{}));}catch(e){}
    if(saveAuthState(normalized)){window.dispatchEvent(new CustomEvent('ANG_HR_AUTH_PASSED',{detail:normalized})); routeAfterAuth(normalized);}
    else{window.dispatchEvent(new CustomEvent('ANG_HR_AUTH_FAILED',{detail:normalized})); console.warn('ANG HR Deep Link 驗證未通過',normalized);}
  };
  window.ANG_NATIVE_GAS_RESULT_RECEIVER=function(res){var auth=normalizeAuth(res||{}); window.ANG_DEEP_LINK_AUTH_RECEIVER(auth,res);};
  window.handleNativeAuthResult=window.handleNativeAuthResult||function(res){
    window.__ANG_LAST_NATIVE_AUTH_RESULT=res; try{localStorage.setItem('ang_last_native_auth_result',JSON.stringify(res||{}));}catch(e){}
    try{
      if(window.ANGHRApp&&typeof window.ANGHRApp.verifyNativeAuthWithGas==='function'){
        var payload=JSON.stringify(res||{}); var bytes=new TextEncoder().encode(payload); var bin='';
        for(var i=0;i<bytes.length;i++) bin+=String.fromCharCode(bytes[i]);
        window.ANGHRApp.verifyNativeAuthWithGas(btoa(bin)); return;
      }
    }catch(e){console.error('呼叫 Android 原生 GAS 驗證失敗',e);}
    window.ANG_DEEP_LINK_AUTH_RECEIVER(res,res);
  };
  window.ANG_NATIVE_LOGIN_RECEIVER=window.ANG_NATIVE_LOGIN_RECEIVER||window.handleNativeAuthResult;
  window.addEventListener('ANG_HR_DEEP_LINK_AUTH',function(ev){var detail=ev.detail||{}; window.ANG_DEEP_LINK_AUTH_RECEIVER(detail.auth||detail.raw||{},detail.raw||detail.auth||{});});
  setTimeout(function(){var last=safeJsonParse(localStorage.getItem('ang_last_deep_link_auth_result')); if(last&&(last.ok===true||last.gas_response)){window.ANG_DEEP_LINK_AUTH_RECEIVER(last.gas_response||last,last);}},300);
})();
