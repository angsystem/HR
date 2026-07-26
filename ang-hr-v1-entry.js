(function(){
'use strict';
var slogans=['今天的每一步，都在替未來累積力量。','把複雜交給系統，把時間留給真正重要的事。','好的管理，不是增加負擔，而是減少混亂。','每一次準時完成，都是可靠的證明。','讓工作有紀錄，讓努力被看見。','清楚的排班，換來安心的一天。','從今天開始，把時間用在更值得的地方。','穩定不是停下來，而是每一步都算數。','你負責前進，ANG HR 負責整理。','把日常做好，就是最可靠的成長。','每一筆紀錄，都在替你留下價值。','今天也一起，把事情做得更俐落。','好的流程，讓每個人都更輕鬆。','少一點反覆確認，多一點專注前進。','工作可以很忙，但管理不必混亂。','讓資訊一致，讓合作更順。','每個班次都有安排，每份努力都有位置。','把事情排好，心也會跟著安定。','效率不是趕快，而是少走冤枉路。','清楚，就是最好的默契。','讓今天的安排，成為明天的餘裕。','每一次整理，都是在替自己省時間。','把重要的事，放在看得見的地方。','穩穩完成，比慌忙開始更有力量。','日常有秩序，團隊就有餘裕。','讓管理跟上你的節奏。','每一個角色，都值得更清楚的工作方式。','把時間留下來，做真正需要你判斷的事。','從一張班表開始，讓整個團隊更順。','今天的清楚，是明天的安心。','不用記住全部，系統會替你留下。','把流程做好，合作自然會更好。','讓每個人知道現在要做什麼。','少一點猜測，多一點確定。','工作有節奏，生活也更有空間。','管理不是盯著人，而是讓資訊流動。','每一天都值得被好好安排。','讓努力不只發生，也能被記錄。','把重複的事交給系統，把創意留給自己。','歡迎回來，今天也一起順順完成。'];
var fixed='';try{fixed=sessionStorage.getItem('ang_hr_entry_slogan_once')||''}catch(e){}if(!fixed){fixed=slogans[Math.floor(Math.random()*slogans.length)];try{sessionStorage.setItem('ang_hr_entry_slogan_once',fixed)}catch(e){}}
function q(s,r){try{return(r||document).querySelector(s)}catch(e){return null}}
function all(s,r){try{return Array.from((r||document).querySelectorAll(s))}catch(e){return[]}}
function text(n,v){if(n&&n.textContent!==v)n.textContent=v}
function patch(){
 var card=q('.manager-card.login-unified');
 if(card){
  text(q('.login-card-title h2,.manager-card-title h2,h2',card),'歡迎回來，請登入系統');
  var input=q('input[aria-label="帳號或 Email"],input[aria-label="Email或帳號"],input[aria-label="Email、帳號或公司代號"],input[aria-label="Email或使用者代號"],input[type="email"],input[type="text"]',card);
  if(input){input.setAttribute('aria-label','使用者名稱或帳號');input.setAttribute('placeholder','請輸入使用者名稱或帳號');input.setAttribute('autocomplete','username')}
  var vb=q('.login-verify-button,button[type="submit"]',card);if(vb&&!/驗證碼|確認登入/.test(vb.textContent||''))text(vb,'驗證');
  all('.social-login-row button,.social-login-row a',card).forEach(function(b){var t=(b.textContent||'')+(b.dataset.provider||'');if(/google/i.test(t))label(b,'Google 驗證');if(/line/i.test(t))label(b,'LINE 驗證')});
  var success=card.classList.contains('login-system-confirmed')||/驗證成功|登入成功|已完成驗證/.test(card.textContent||'');if(success)card.setAttribute('data-auth-state','success');else card.removeAttribute('data-auth-state');
  guide(card);
 }
 var st=q('.manager-welcome-text,.manager-welcome-slogan,.welcome-slogan,.encouragement-text,.landing-slogan,[data-manager-slogan],[data-slogan]');if(st)text(st,fixed);
 snap();
}
function label(b,v){var s=q('span:last-child,span',b);text(s||b,v)}
function guide(card){var body=q('.unified-login-body,.login-card-body,.manager-card-body',card);if(!body)return;var code=q('input[autocomplete="one-time-code"],input[aria-label*="驗證碼"],input[placeholder*="驗證碼"],input[inputmode="numeric"]',card);var show=!!code||/驗證信已寄|輸入驗證碼|重新寄送|確認您的信箱/.test(card.textContent||'');var g=q('.ang-v1-email-guide',body);if(!show){if(g)g.remove();return}if(!g){g=document.createElement('section');g.className='ang-v1-email-guide';g.innerHTML='<div class="ang-v1-email-guide-icon">✉️</div><div><strong>請確認您的 Email 信箱</strong><p>我們已寄出最新的 ANG HR 登入驗證信。您可以直接點擊信件中的登入連結，或回到這裡輸入信件內的驗證碼。</p><small>若沒有收到，請先檢查垃圾郵件與促銷內容資料夾，再使用重新寄送。</small></div>';body.appendChild(g)}}
function snap(){var c=q('.manager-carousel');if(!c||c.dataset.v1snap)return;c.dataset.v1snap='1';var timer;c.addEventListener('scroll',function(){clearTimeout(timer);timer=setTimeout(function(){var cards=all(':scope>.manager-card',c);if(!cards.length)return;var center=c.scrollLeft+c.clientWidth/2,best=cards[0],d=1e9;cards.forEach(function(x){var z=Math.abs(x.offsetLeft+x.offsetWidth/2-center);if(z<d){d=z;best=x}});c.scrollTo({left:Math.max(0,best.offsetLeft-(c.clientWidth-best.clientWidth)/2),behavior:'smooth'})},120)},{passive:true})}
var raf=0;function schedule(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;patch()})}
function start(){patch();new MutationObserver(schedule).observe(document.getElementById('root')||document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','aria-pressed','hidden']});window.addEventListener('ANG_HR_AUTH_VERIFIED',schedule);window.addEventListener('ANG_HR_AUTH_FAILED',schedule);window.addEventListener('pageshow',schedule)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
