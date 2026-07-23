(function(){
  'use strict';

  var PLANS = [
    {key:'basic', family:'Business', title:'Basic', slogan:'無痛管理', accent:'#2f73d9', metal:'#b87333', summary:'員工主檔、排班、GPS／QR 打卡與基本出勤管理。', features:['員工主檔','排班發布','GPS／QR 打卡','基本出勤','基礎報表']},
    {key:'pro', family:'Business', title:'Pro', slogan:'進階人氣', accent:'#e94e9b', metal:'#c8ced8', summary:'加入審核、薪資、加班津貼、支援打卡點與管理報表。', features:['包含 Basic','請假補卡審核','薪資與津貼','支援打卡點','進階權限','管理報表']},
    {key:'premium', family:'Business', title:'Premium', slogan:'超值首選', accent:'#48207a', metal:'#d8ad43', summary:'多公司、多分店、七層權限、進階分析與最高擴充彈性。', features:['包含 Pro','多公司／多分店','完整七層權限','進階分析','自訂流程','安全稽核']},
    {key:'lite', family:'Personal', title:'Lite', slogan:'個人體驗', accent:'#10b9ad', metal:'#c8ced8', summary:'免費體驗基礎打卡、工時、排班與 40 天歷史。', features:['個人打卡','工時統計','排班月曆','請假紀錄','40 天歷史']},
    {key:'solo', family:'Personal', title:'Solo', slogan:'基礎管理', accent:'#7863d9', metal:'#c8ced8', summary:'個人排班、工時、薪資收入、請假、提醒集中管理。', features:['個人排班','工時與加班','薪資簡估','週領／月領','提醒備忘']},
    {key:'performance', family:'Personal', title:'Performance', slogan:'完整規劃', accent:'#c94db5', metal:'#d8ad43', summary:'包含 Solo，再加入目標、KPI、績效與趨勢分析。', features:['包含 Solo','目標 KPI','績效週期','自評與回饋','趨勢分析','績效報表']}
  ];

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]});}

  function getHost(){
    return document.querySelector('.manager-card.intro .feature-modal-inline') || document.querySelector('.manager-card.intro .manager-card-body');
  }

  function cardMarkup(plan){
    return '<button type="button" class="ang-plan-showcase-card" data-ang-plan-showcase="'+plan.key+'" style="--plan-accent:'+plan.accent+';--plan-metal:'+plan.metal+'">'+
      '<span class="ang-plan-showcase-family">'+esc(plan.family)+'</span>'+
      '<strong>'+esc(plan.title)+'</strong>'+
      '<small>'+esc(plan.slogan)+'</small>'+
      '<p>'+esc(plan.summary)+'</p>'+
      '<i aria-hidden="true">'+esc(plan.title.charAt(0))+'</i>'+
    '</button>';
  }

  function install(){
    var host=getHost();
    if(!host||host.querySelector('.ang-plan-showcase')) return !!host;
    var wrap=document.createElement('section');
    wrap.className='ang-plan-showcase';
    wrap.innerHTML='<div class="ang-plan-showcase-head"><span>ANG HR 方案總覽</span><h2>一次看完六個方案</h2><p>點選方案即可在上方查看完整功能，不再塞進旁邊的小卡片裡。</p></div><div class="ang-plan-showcase-detail" data-ang-plan-detail></div><div class="ang-plan-showcase-grid">'+PLANS.map(cardMarkup).join('')+'</div>';
    host.prepend(wrap);
    render('pro');
    return true;
  }

  function render(key){
    var plan=PLANS.find(function(p){return p.key===key})||PLANS[1];
    var wrap=document.querySelector('.ang-plan-showcase');
    if(!wrap)return;
    var detail=wrap.querySelector('[data-ang-plan-detail]');
    detail.style.setProperty('--plan-accent',plan.accent);
    detail.style.setProperty('--plan-metal',plan.metal);
    detail.innerHTML='<div><span>'+esc(plan.family)+'｜'+esc(plan.title)+'</span><h3>'+esc(plan.summary)+'</h3><ul>'+plan.features.map(function(f){return '<li>'+esc(f)+'</li>'}).join('')+'</ul></div><button type="button" data-ang-plan-select="'+plan.key+'">選擇 '+esc(plan.title)+'</button>';
    wrap.querySelectorAll('[data-ang-plan-showcase]').forEach(function(btn){btn.classList.toggle('active',btn.dataset.angPlanShowcase===plan.key)});
  }

  function removeLargePlanBoxes(){
    document.querySelectorAll('.manager-card.free,.manager-card.personal,.manager-card.business').forEach(function(card){
      card.classList.add('ang-compact-plan-card');
      card.querySelectorAll('.ang-plan-detail-v2,.ang-v070-plan-summary').forEach(function(el){el.remove()});
    });
  }

  function selectPlan(key){
    var plan=PLANS.find(function(p){return p.key===key});
    if(!plan)return;
    var target;
    if(plan.family==='Business'){
      target=document.querySelector('.manager-card.business');
      var selector='.'+plan.key+'-option';
      var option=target&&target.querySelector(selector);
      if(option) option.click();
      var action=target&&target.querySelector('.business-select-action');
      if(action) action.click();
    }else if(plan.key==='lite'){
      target=document.querySelector('.manager-card.free');
      var lite=target&&target.querySelector('.personal-lite');
      if(lite) lite.click();
    }else{
      target=document.querySelector('.manager-card.personal');
      var pOpt=target&&target.querySelector('.'+plan.key+'-option');
      if(pOpt) pOpt.click();
      var pAction=target&&target.querySelector('.personal-select-action');
      if(pAction) pAction.click();
    }
  }

  document.addEventListener('click',function(e){
    var card=e.target.closest&&e.target.closest('[data-ang-plan-showcase]');
    if(card){e.preventDefault();render(card.dataset.angPlanShowcase);return;}
    var select=e.target.closest&&e.target.closest('[data-ang-plan-select]');
    if(select){e.preventDefault();selectPlan(select.dataset.angPlanSelect);}
  });

  function apply(){install();removeLargePlanBoxes();}
  function start(){apply();var root=document.getElementById('root')||document.body;var queued=false;new MutationObserver(function(){if(queued)return;queued=true;requestAnimationFrame(function(){queued=false;apply()})}).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['class','aria-pressed']});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
}());
