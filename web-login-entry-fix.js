(function(){
  'use strict';
  var VERSION='20260815-web-login-entry-fix-v1';
  var cfg=window.ANG_HR_CONFIG||{};

  function q(sel,root){try{return (root||document).querySelector(sel);}catch(_){return null;}}
  function qa(sel,root){try{return Array.prototype.slice.call((root||document).querySelectorAll(sel));}catch(_){return [];}}
  function text(el){return String((el&&el.textContent)||'').trim();}

  function getLoginCard(){return q('.manager-card.login-unified');}
  function getSocialRow(card){return card&&q('.social-login-row',card);}
  function getMainInput(card){
    return card&&q('input[aria-label="帳號或 Email"],input[aria-label="Email或帳號"],input[aria-label="Email、帳號或公司代號"],input[aria-label="Email或使用者代號"],input[type="email"],input[type="text"]',card);
  }

  function showInlineMessage(card,message){
    if(!card)return;
    var box=q('.ang-web-login-note',card);
    if(!box){
      box=document.createElement('div');
      box.className='ang-web-login-note';
      box.style.cssText='margin:9px 2px 0;text-align:center;font-size:12px;font-weight:800;line-height:1.45;opacity:.78';
      var body=q('.unified-login-body,.login-card-body',card)||card;
      body.appendChild(box);
    }
    box.textContent=message||'';
  }

  function ensurePhoneButton(card,row){
    if(q('.ang-login-provider-phone',row))return;
    var button=document.createElement('button');
    button.type='button';
    button.className='ang-login-provider-phone';
    button.setAttribute('aria-label','使用手機號碼登入');
    button.title='手機登入';
    button.textContent='手機';
    button.addEventListener('click',function(){
      var input=getMainInput(card);
      if(!input)return;
      input.type='tel';
      input.inputMode='tel';
      input.autocomplete='tel';
      input.placeholder='手機號碼';
      input.setAttribute('aria-label','手機號碼');
      input.style.textTransform='none';
      showInlineMessage(card,'輸入已綁定 ANG HR 的手機號碼，再按「驗證」。');
      try{input.focus();}catch(_){}
    });
    row.appendChild(button);
  }

  function ensureAppleButton(card,row){
    if(q('.ang-login-provider-apple',row))return;
    var button=document.createElement('button');
    button.type='button';
    button.className='ang-login-provider-apple';
    button.setAttribute('aria-label','使用 Apple 登入');
    button.title='Apple 登入';
    button.textContent='';
    button.addEventListener('click',function(){
      var latest=window.ANG_HR_CONFIG||cfg||{};
      var url=String(latest.appleLoginUrl||latest.appleOAuthUrl||'').trim();
      if(url){window.location.href=url;return;}
      showInlineMessage(card,'Apple 登入入口已保留；後台 Apple OAuth 尚未設定完成，暫時請使用 Email、手機、Google 或 LINE。');
      try{window.dispatchEvent(new CustomEvent('ANG_HR_APPLE_LOGIN_REQUEST'));}catch(_){}
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
      if(!liffId)return;
      ev.preventDefault();
      ev.stopPropagation();
      window.location.href='https://liff.line.me/'+encodeURIComponent(liffId);
    },true);
  }

  function normalizeProviderOrder(row){
    if(!row)return;
    var children=qa(':scope > button,:scope > a',row);
    if(!children.length)return;
    var weights={email:1,phone:2,google:3,line:4,apple:5};
    children.sort(function(a,b){
      function key(el){
        var s=(text(el)+' '+String(el.getAttribute('aria-label')||'')+' '+String(el.title||'')+' '+String(el.className||'')).toLowerCase();
        if(s.indexOf('mail')!==-1||s.indexOf('email')!==-1||s.indexOf('信箱')!==-1)return weights.email;
        if(s.indexOf('phone')!==-1||s.indexOf('手機')!==-1)return weights.phone;
        if(s.indexOf('google')!==-1)return weights.google;
        if(s.indexOf('line')!==-1)return weights.line;
        if(s.indexOf('apple')!==-1||s.indexOf('')!==-1)return weights.apple;
        return 99;
      }
      return key(a)-key(b);
    });
    children.forEach(function(el){row.appendChild(el);});
  }

  function patch(){
    var card=getLoginCard();
    if(!card)return;
    card.dataset.webLoginEntryFix=VERSION;
    var row=getSocialRow(card);
    if(!row)return;
    ensurePhoneButton(card,row);
    ensureAppleButton(card,row);
    bindLineButton(card,row);
    normalizeProviderOrder(row);
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
