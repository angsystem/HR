(function(){
  'use strict';

  var VERSION='20260821-register-google-guard-v1';

  function setStatus(type,message){
    var box=document.getElementById('status');
    if(!box)return;
    box.className='status';
    if(!message){box.textContent='';return;}
    box.classList.add('show',type||'info');
    box.textContent=message;
  }

  function hasNativeGoogle(){
    try{
      return !!(window.isAngHrNativeApp&&window.isAngHrNativeApp()&&window.startAppNativeGoogleLogin);
    }catch(_){return false;}
  }

  function hasGasRunner(){
    try{return !!(window.google&&google.script&&google.script.run);}catch(_){return false;}
  }

  function install(){
    if(window.__ANG_REGISTER_GOOGLE_GUARD_VERSION===VERSION)return;
    var original=window.submitFreeUse;
    if(typeof original!=='function')return;

    window.__ANG_REGISTER_GOOGLE_GUARD_VERSION=VERSION;
    window.submitFreeUse=function(verify){
      if(String(verify||'').toLowerCase()==='google'&&!hasNativeGoogle()&&!hasGasRunner()){
        setStatus('error','Google 註冊驗證尚未接上公開 Web 的正式 OAuth 回程。請先使用 Email 驗證建立；系統不會在未取得 Google 驗證結果時送出註冊。');
        return;
      }
      return original.apply(this,arguments);
    };
  }

  function start(){
    install();
    window.setTimeout(install,0);
    window.setTimeout(install,120);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}());