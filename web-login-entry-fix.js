(function(){
  'use strict';
  var VERSION='20260815-web-login-reference-v3';
  var cfg=window.ANG_HR_CONFIG||{};

  function q(sel,root){try{return (root||document).querySelector(sel);}catch(_){return null;}}
  function qa(sel,root){try{return Array.prototype.slice.call((root||document).querySelectorAll(sel));}catch(_){return [];}}
  function text(el){return String((el&&el.textContent)||'').trim();}
  function getLoginCard(){return q('.manager-card.login-unified');}
  function getSocialRow(card){return card&&q('.social-login-row',card);}
  function getMainInput(card){return card&&q('input[aria-label="帳號或 Email"],input[aria-label="Email或帳號"],input[aria-label="Email、帳號或公司代號"],input[aria-label="Email或使用者代號"],input[type="email"],input[type="text"],input[type="tel"]',card);}
  function getVerifyButton(card){return card&&q('.login-verify-button',card);}

  function showInlineMessage(card,message,state){
    if(!card)return;
    var box=q('.ang-web-login-note',card);
    if(!box){
      box=document.createElement('div');
      box.className='ang-web-login-note';
      var body=q('.unified-login-body,.login-card-body',card)||card;
      body.appendChild(box);
    }
    box.textContent=message||'';
    box.dataset.state=state||'';
  }

  function setInputMode(card,mode){
    var input=getMainInput(card);
    if(!input)return;
    card.dataset.angLoginMode=mode;
    qa('.ang-login-mode-row button',card).forEach(function(btn){btn.classList.toggle('active',btn.dataset.mode===mode);});
    if(mode==='phone'){
      input.type='tel';
      input.inputMode='tel';
      input.autocomplete='tel';
      input.placeholder='手機號碼，例如 0912345678';
      input.setAttribute('aria-label','手機號碼');
      input.style.textTransform='none';
      showInlineMessage(card,'使用已綁定 ANG HR 的手機號碼驗證；後端確認成功才會登入。','info');
    }else{
      input.type='text';
      input.inputMode='text';
      input.autocomplete='username';
      input.placeholder='帳號或 Email';
      input.setAttribute('aria-label','帳號或 Email');
      input.style.textTransform='';
      showInlineMessage(card,'可使用員工平台代號、帳號或 Email。Email 採信箱連結驗證，不使用 6 位驗證碼。','info');
    }
    try{input.focus();}catch(_){}
  }

  function ensureModeRow(card){
    if(q('.ang-login-mode-row',card))return;
    var input=getMainInput(card);
    if(!input)return;
    var row=document.createElement('div');
    row.className='ang-login-mode-row';
    row.innerHTML='<button type="button" data-mode="account" class="active">帳號 / Email</button><button type="button" data-mode="phone">手機</button>';
    var wrap=input.closest('label,.login-input-wrap,.field,.input-wrap')||input.parentNode;
    if(wrap&&wrap.parentNode)wrap.parentNode.insertBefore(row,wrap);
    else (q('.unified-login-body,.login-card-body',card)||card).insertBefore(row,input);
    qa('button',row).forEach(function(btn){btn.addEventListener('click',function(){setInputMode(card,btn.dataset.mode);});});
    card.dataset.angLoginMode='account';
  }

  function ensurePhoneButton(row){
    if(q('.ang-login-provider-phone',row))return;
    var button=document.createElement('button');
    button.type='button';
    button.className='ang-login-provider-phone';
    button.textContent='手機';
    row.appendChild(button);
  }

  function ensureAppleButton(card,row){
    var latest=window.ANG_HR_CONFIG||cfg||{};
    var url=String(latest.appleLoginUrl||latest.appleOAuthUrl||'').trim();
    var existing=q('.ang-login-provider-apple',row);
    if(!url){
      if(existing)existing.remove();
      return;
    }
    if(existing)return;
    var button=document.createElement('button');
    button.type='button';
    button.className='ang-login-provider-apple';
    button.setAttribute('aria-label','使用 Apple 登入');
    button.title='Apple 登入';
    button.textContent=' Apple';
    button.addEventListener('click',function(){
      var current=window.ANG_HR_CONFIG||cfg||{};
      var target=String(current.appleLoginUrl||current.appleOAuthUrl||'').trim();
      if(!target){
        button.remove();
        return;
      }
      window.location.href=target;
    });
    row.appendChild(button);
  }

  function bindLineButton(card,row){
    var lineButton=qa('button,a',row).find(function(el){
      var label=(text(el)+' '+String(el.getAttribute('aria-label')||'')+' '+String(el.title||'')).toLowerCase();
      return label.indexOf('line')!==-1;
    });
    if(!lineButton||lineButton.dataset.angLiffBound===VERSION)return;
    lineButton.dataset.angLiffBound=VERSION;
    lineButton.addEventListener('click',function(ev){
      var latest=window.ANG_HR_CONFIG||cfg||{};
      var liffId=String(latest.lineLiffId||'').trim();
      if(!liffId){showInlineMessage(card,'尚未設定 LINE LIFF ID。','error');return;}
      ev.preventDefault();
      ev.stopPropagation();
      window.location.href='https://liff.line.me/'+encodeURIComponent(liffId);
    },true);
  }

  function bindPhoneValidation(card){
    var verify=getVerifyButton(card);
    if(!verify||verify.dataset.angPhoneValidation===VERSION)return;
    verify.dataset.angPhoneValidation=VERSION;
    verify.addEventListener('click',function(ev){
      if(card.dataset.angLoginMode!=='phone')return;
      var input=getMainInput(card);
      var value=String((input&&input.value)||'').replace(/[\s-]/g,'');
      if(!/^09\d{8}$/.test(value)&&!/^\+8869\d{8}$/.test(value)){
        ev.preventDefault();
        ev.stopImmediatePropagation();
        showInlineMessage(card,'請輸入正確的台灣手機號碼，例如 0912345678。','error');
        return false;
      }
      if(input)input.value=value;
      showInlineMessage(card,'正在送交 ANG HR 後端驗證手機綁定資料…','info');
    },true);
  }

  function normalizeProviderOrder(row){
    if(!row)return;
    var children=qa(':scope > button,:scope > a',row);
    if(!children.length)return;
    var weights={google:1,line:2,apple:3,phone:99};
    children.sort(function(a,b){
      function key(el){
        var s=(text(el)+' '+String(el.getAttribute('aria-label')||'')+' '+String(el.title||'')+' '+String(el.className||'')).toLowerCase();
        if(s.indexOf('google')!==-1)return weights.google;
        if(s.indexOf('line')!==-1)return weights.line;
        if(s.indexOf('apple')!==-1||s.indexOf('')!==-1)return weights.apple;
        if(s.indexOf('phone')!==-1||s.indexOf('手機')!==-1)return weights.phone;
        return 50;
      }
      return key(a)-key(b);
    });
    children.forEach(function(el){row.appendChild(el);});
  }

  function patch(){
    var card=getLoginCard();
    if(!card)return;
    card.dataset.webLoginEntryFix=VERSION;
    ensureModeRow(card);
    bindPhoneValidation(card);
    var row=getSocialRow(card);
    if(!row)return;
    ensurePhoneButton(row);
    ensureAppleButton(card,row);
    bindLineButton(card,row);
    normalizeProviderOrder(row);
    if(!q('.ang-web-login-note',card))showInlineMessage(card,'登入必須由後端驗證成功後才會進入系統。','info');
  }

  var scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;patch();});}
  function start(){
    patch();
    new MutationObserver(schedule).observe(q('#root')||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','aria-expanded']});
    window.addEventListener('pageshow',schedule,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
}());
