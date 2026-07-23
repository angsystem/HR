(function (window, document) {
  'use strict';
  function config(){ return window.ANG_HR_CONFIG || {}; }
  function gasUrl(){
    var c=config();
    return c.gasApiUrl || c.gasUrl || c.apiUrl || c.webAppUrl || c.GAS_WEBAPP_URL || '';
  }
  function currentFlow(){
    return (document.documentElement.dataset.angRegistration === '1') ? 'company_signup' : 'account_login';
  }
  function selectedPlan(){
    try { var p=JSON.parse(sessionStorage.getItem('ANG_SELECTED_PLAN')||'null'); return p && (p.plan_code||p.key||'') || ''; } catch(e){ return ''; }
  }
  function buildStartUrl(){
    var base=gasUrl();
    if(!base) throw new Error('Facebook 登入尚未設定 GAS Web App URL');
    var q=new URLSearchParams({action:'requestFacebookAuth',flow:currentFlow(),plan:selectedPlan(),app:(window.ANGHRApp?'android':'web')});
    return base + (base.indexOf('?')>=0?'&':'?') + q.toString();
  }
  function start(){
    try{
      var url=buildStartUrl();
      if(window.ANGHRApp && typeof window.ANGHRApp.startFacebookLogin==='function') window.ANGHRApp.startFacebookLogin(url);
      else if(window.ANGHRApp && typeof window.ANGHRApp.openExternal==='function') window.ANGHRApp.openExternal(url);
      else window.location.assign(url);
    }catch(error){ window.dispatchEvent(new CustomEvent('ANG_HR_AUTH_FAILED',{detail:{provider:'facebook',message:error.message}})); }
  }
  function markup(){return '<svg class="provider-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.6 22v-9h3l.45-3.5H13.6V7.27c0-1.01.28-1.7 1.74-1.7h1.86V2.44c-.32-.04-1.43-.14-2.72-.14-2.69 0-4.53 1.64-4.53 4.66V9.5H6.9V13h3.05v9h3.65z"/></svg><span>Facebook</span>';}
  function install(){
    var row=document.querySelector('.social-login-row,[data-social-login],[data-auth-providers]'); if(!row)return;
    var b=row.querySelector('.facebook-login,[data-provider="facebook"]')||document.createElement('button');
    b.type='button'; b.className='facebook-login'; b.dataset.provider='facebook'; b.dataset.angFacebookLogin='true'; b.setAttribute('aria-label','使用 Facebook 登入'); b.innerHTML=markup();
    if(!b.parentNode) row.appendChild(b);
  }
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('.facebook-login,[data-provider="facebook"]');if(!b)return;e.preventDefault();e.stopPropagation();start();},true);
  new MutationObserver(install).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',install); install();
  window.ANG_FACEBOOK_AUTH={start:start,installButton:install};
})(window,document);
