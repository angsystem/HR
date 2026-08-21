(function(){
  'use strict';

  var VERSION='20260821-register-google-guard-v2';

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

  function googleAvailable(){
    return hasNativeGoogle()||hasGasRunner();
  }

  function syncGoogleButton(){
    var buttons=document.querySelectorAll('button[onclick*="submitFreeUse(\'google\')"],button[onclick*="submitFreeUse(&quot;google&quot;)"]');
    var available=googleAvailable();
    Array.prototype.forEach.call(buttons,function(button){
      if(available){
        button.disabled=false;
        button.removeAttribute('aria-disabled');
        button.removeAttribute('title');
        if(button.dataset.angGoogleOriginalLabel)button.textContent=button.dataset.angGoogleOriginalLabel;
        return;
      }
      if(!button.dataset.angGoogleOriginalLabel)button.dataset.angGoogleOriginalLabel=button.textContent||'使用 Google 驗證並建立';
      button.disabled=true;
      button.setAttribute('aria-disabled','true');
      button.setAttribute('title','公開 Web 的 Google 註冊 OAuth 尚未完成，請先使用 Email 驗證建立。');
      button.textContent='Google 註冊尚未開放｜請使用 Email';
    });
  }

  function install(){
    var original=window.submitFreeUse;
    if(typeof original!=='function')return;

    if(window.__ANG_REGISTER_GOOGLE_GUARD_VERSION!==VERSION){
      window.__ANG_REGISTER_GOOGLE_GUARD_VERSION=VERSION;
      window.submitFreeUse=function(verify){
        if(String(verify||'').toLowerCase()==='google'&&!googleAvailable()){
          setStatus('error','Google 註冊驗證尚未接上公開 Web 的正式 OAuth 回程。請先使用 Email 驗證建立；系統不會在未取得 Google 驗證結果時送出註冊。');
          syncGoogleButton();
          return;
        }
        return original.apply(this,arguments);
      };
    }
    syncGoogleButton();
  }

  function start(){
    install();
    window.setTimeout(install,0);
    window.setTimeout(install,120);
    window.setTimeout(syncGoogleButton,600);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}());