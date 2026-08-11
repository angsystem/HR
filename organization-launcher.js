(function(){
  'use strict';
  function safe(v){return String(v||'').trim()}
  function getStored(keys){for(var i=0;i<keys.length;i++){try{var v=localStorage.getItem(keys[i]);if(v)return safe(v)}catch(e){}}return''}
  function hasSession(){
    var id=getStored(['ang_hr_active_employee_id','ang_employee_id','employee_id','loginId','emp_logged_in']);
    var token=getStored(['ang_hr_active_login_token','ang_employee_token','session_token','loginToken','emp_login_token']);
    return !!(id&&token);
  }
  function eligiblePage(){return /\/(employee|admin|app|creator|personal)\.html$/i.test(location.pathname||'')}
  function buildUrl(){
    var cfg=window.ANG_HR_CONFIG||{};
    var base=cfg.organizationPageUrl||'./organization.html';
    var api=window.ANG_API;
    var id=api&&api.syncIdentity?api.syncIdentity():{
      company_id:getStored(['ang_hr_active_company_id','ang_company_id','company_id']),
      user_id:getStored(['ang_hr_active_employee_id','ang_employee_id','employee_id','loginId']),
      token:getStored(['ang_hr_active_login_token','ang_employee_token','session_token','loginToken']),
      role:getStored(['ang_user_role','ang_employee_role','role']),
      device_id:getStored(['ang_hr_device_id','ang_device_id','device_id'])
    };
    var u=new URL(base,location.href);
    if(id.company_id)u.searchParams.set('company_id',id.company_id);
    if(id.user_id){u.searchParams.set('id',id.user_id);u.searchParams.set('employee_id',id.user_id)}
    if(id.token)u.searchParams.set('token',id.token);
    if(id.role)u.searchParams.set('role',id.role);
    if(id.device_id)u.searchParams.set('device_id',id.device_id);
    if(/\bLine\//i.test(navigator.userAgent||''))u.searchParams.set('lineMini','1');
    return u.toString();
  }
  function install(){
    if(!eligiblePage()||!hasSession()||document.getElementById('angOrgLauncher'))return;
    var style=document.createElement('style');
    style.id='angOrgLauncherStyle';
    style.textContent='#angOrgLauncher{position:fixed;left:12px;bottom:calc(86px + env(safe-area-inset-bottom));z-index:2147482000;border:0;border-radius:999px;padding:10px 13px;background:rgba(255,255,255,.96);color:#5b66db;font:900 12px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.13);border:1px solid rgba(128,137,255,.18);backdrop-filter:blur(12px)}#angOrgLauncher:active{transform:scale(.97)}';
    document.head.appendChild(style);
    var btn=document.createElement('button');
    btn.id='angOrgLauncher';btn.type='button';btn.textContent='組織圖';btn.setAttribute('aria-label','開啟員工組織圖');
    btn.addEventListener('click',function(){location.href=buildUrl()});
    document.body.appendChild(btn);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
}());
