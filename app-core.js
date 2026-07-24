
(function(){
  'use strict';
  var mountId = 'angUnifiedMount';
  var currentView = '';
  var generation = 0;

  function qs(id){return document.getElementById(id);}
  function getParam(name){try{return new URLSearchParams(window.location.search).get(name)||'';}catch(e){return '';}}
  function cleanViewName(v){
    v=String(v||'').toLowerCase().trim();
    if(v==='creator'||v==='platform'||v==='platform_creator')return 'creator';
    if(v==='personal'||v==='personal_solo'||v==='personal_team')return 'personal';
    if(v==='admin'||v==='review'||v==='settings'||v==='publish'||v==='people'||v==='personnel'||v==='salary'||v==='data'||v==='home'||v==='manager')return 'admin';
    return 'employee';
  }
  function readTargetView(){
    var view=getParam('view')||getParam('target')||getParam('page')||'';
    if(getParam('auto_admin')==='1') return 'admin';
    return cleanViewName(view||'employee');
  }
  function copySessionToStorage(){
    try{
      var q=new URLSearchParams(window.location.search);
      var id=q.get('id')||q.get('employee_id')||'';
      var token=q.get('token')||q.get('session_token')||q.get('loginToken')||'';
      var role=q.get('role')||'';
      var company=q.get('company_id')||q.get('companyId')||q.get('company')||'';
      var device=q.get('device_id')||q.get('deviceId')||'';
      if(id){localStorage.setItem('ang_hr_active_employee_id',id);localStorage.setItem('ang_employee_id',id);localStorage.setItem('employee_id',id);localStorage.setItem('loginId',id);}
      if(token){localStorage.setItem('ang_hr_active_login_token',token);localStorage.setItem('session_token',token);localStorage.setItem('loginToken',token);localStorage.setItem('emp_login_token',token);localStorage.setItem('ang_employee_token',token);}
      if(role){localStorage.setItem('ang_user_role',role);localStorage.setItem('ang_employee_role',role);}
      if(company){localStorage.setItem('ang_hr_active_company_id',company);localStorage.setItem('ang_company_id',company);localStorage.setItem('company_id',company);}
      if(device){localStorage.setItem('ang_hr_device_id',device);localStorage.setItem('ang_device_id',device);localStorage.setItem('device_id',device);}
      if(id||token)localStorage.setItem('isLoggedIn','1');
    }catch(e){}
  }
  function buildUnifiedUrl(view){
    var old;
    try{old=new URL(window.location.href);}catch(e){old=new URL('app.html', window.location.href);}
    old.pathname = old.pathname.replace(/[^\/]*$/, 'app.html');
    old.searchParams.set('view', cleanViewName(view));
    old.searchParams.set('page', cleanViewName(view));
    old.searchParams.set('_shell_ts', String(Date.now()));
    return old.pathname + '?' + old.searchParams.toString() + old.hash;
  }
  function setViewCss(href){
    var old=qs('angViewCss');
    if(old) old.remove();
    var link=document.createElement('link');
    link.id='angViewCss';
    link.rel='stylesheet';
    link.href=href;
    document.head.appendChild(link);
  }
  function cleanupDynamic(){
    ['angCompanySwitcher','angCompanySwitcherBackdrop'].forEach(function(id){var el=qs(id); if(el)el.remove();});
    document.body.className='';
  }
  function executeScripts(scripts, view, gen){
    (scripts||[]).forEach(function(code, idx){
      if(gen!==generation) return;
      var s=document.createElement('script');
      s.text=String(code||'')+'\n//# sourceURL=unified-'+view+'-'+idx+'.js';
      document.body.appendChild(s);
      s.parentNode.removeChild(s);
    });
  }
  function externalViewUrl(view){
    var file=view==='creator'?'creator.html':view==='personal'?'personal.html':'';
    if(!file)return '';
    var old;
    try{old=new URL(window.location.href);}catch(e){old=new URL('app.html', window.location.href);}
    var cfg=window.ANG_HR_CONFIG||{};
    var targetBase=view==='creator'?cfg.creatorPageUrl:cfg.personalPageUrl;
    var target;
    try{target=new URL(targetBase||file,window.location.href);}catch(e2){target=new URL(file,window.location.href);}
    old.searchParams.forEach(function(value,key){if(key!=='view'&&key!=='page'&&key!=='target')target.searchParams.set(key,value);});
    target.searchParams.set('source','github_app_shell');
    target.searchParams.set('_shell_ts',String(Date.now()));
    return target.href;
  }
  function loadView(view){
    view=cleanViewName(view);
    if(view==='personal'||view==='creator'){
      var external=externalViewUrl(view);
      if(external){window.location.replace(external);return;}
    }
    var def=window.ANG_APP_VIEWS && window.ANG_APP_VIEWS[view];
    if(!def){document.body.innerHTML='<div style="padding:24px;font-family:sans-serif">找不到頁面：'+view+'</div>';return;}
    generation++;
    var gen=generation;
    currentView=view;
    copySessionToStorage();
    cleanupDynamic();
    setViewCss(def.css);
    var mount=qs(mountId);
    if(!mount){mount=document.createElement('div');mount.id=mountId;document.body.innerHTML='';document.body.appendChild(mount);}
    mount.innerHTML=def.html||'';
    executeScripts(def.scripts,view,gen);
  }
  function go(pageName){
    var target=cleanViewName(pageName);
    try{history.replaceState({view:target},'',buildUnifiedUrl(target));}catch(e){}
    loadView(target);
  }
  function reload(){ loadView(currentView||readTargetView()); }
  window.ANG_UNIFIED_APP={go:go,reload:reload,loadView:loadView,getCurrentView:function(){return currentView;}};
  window.addEventListener('popstate',function(){loadView(readTargetView());});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){loadView(readTargetView());});
  else loadView(readTargetView());
})();
