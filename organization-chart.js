(function(){
  'use strict';

  var cfg=window.ANG_HR_CONFIG||{};
  var api=window.ANG_API||null;
  var state={layout:'vertical',identity:null,role:'Employee',people:[],source:'none'};

  function qs(id){return document.getElementById(id)}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')}
  function normRole(v){
    var s=String(v||'').trim().toLowerCase();
    if(/creator|platform_creator|root|super_admin|superadmin/.test(s))return'Creator';
    if(/owner|company_owner/.test(s))return'Owner';
    if(/admin|administrator/.test(s))return'Admin';
    if(/manager|主管|店長|經理/.test(s))return'Manager';
    if(/assistant_manager|副理|副店長/.test(s))return'Assistant Manager';
    if(/supervisor|主任/.test(s))return'Supervisor';
    if(/section_leader|組長/.test(s))return'Section Leader';
    if(/team_leader|領班|班長/.test(s))return'Team Leader';
    return'Employee';
  }
  function roleRank(v){
    var r=normRole(v);
    return {'Creator':9,'Owner':8,'Admin':7,'Manager':6,'Assistant Manager':5,'Supervisor':4,'Section Leader':3,'Team Leader':2,'Employee':1}[r]||1;
  }
  function isManagement(){return roleRank(state.role)>=2}

  function normalizePerson(p){
    p=p||{};
    var secondary=p.secondary===true||p.isSecondary===true||String(p.position_type||p.positionType||'').toLowerCase()==='secondary'||String(p.assignment_type||p.assignmentType||'').toLowerCase()==='secondary';
    return {
      id:String(p.id||p.employee_id||p.employeeId||p.empId||p.user_id||'').trim().toUpperCase(),
      name:String(p.name||p.nickname||p.displayName||p.employee_name||'').trim(),
      nickname:String(p.nickname||'').trim(),
      role:normRole(p.role||p.positionRole||p.level||''),
      dept:String(p.dept||p.department||p.department_name||'').trim(),
      jobTitle:String(p.jobTitle||p.job_title||p.title||p.position||'').trim(),
      branchId:String(p.branchId||p.branch_id||'').trim(),
      branchName:String(p.branchName||p.branch_name||'').trim(),
      managerId:String(p.managerId||p.manager_id||p.supervisorId||p.supervisor_id||p.parentId||p.parent_id||'').trim().toUpperCase(),
      secondary:secondary,
      enabled:!(p.enabled===false||String(p.enabled).toLowerCase()==='false')
    };
  }

  function setStatus(text,type){
    var el=qs('orgStatus');if(!el)return;
    el.className='org-status'+(type?' '+type:'');el.textContent=text;
  }

  function readSelfFallback(){
    var i=state.identity||{};
    var name='';try{name=localStorage.getItem('emp_name')||localStorage.getItem('ang_verified_name')||''}catch(e){}
    return normalizePerson({id:i.user_id||i.employee_id||i.id||'',name:name,role:state.role});
  }

  async function loadIdentity(){
    if(!api)throw new Error('ANG_API 未載入');
    state.identity=api.syncIdentity();
    var snap=await api.verifySession({silent:true});
    if(snap){
      if(snap.role)state.role=normRole(snap.role);
      if(snap.employee_id||snap.id){state.identity.employee_id=snap.employee_id||snap.id;state.identity.user_id=snap.employee_id||snap.id;state.identity.id=snap.employee_id||snap.id}
      if(snap.company_id)state.identity.company_id=snap.company_id;
    }else{
      state.role=normRole(state.identity.role||'Employee');
    }
    var me=String(state.identity.user_id||state.identity.employee_id||state.identity.id||'').trim();
    if(!me)throw new Error('找不到登入中的員工身分');
    var roleEl=qs('orgRoleBadge');if(roleEl)roleEl.textContent=state.role;
  }

  async function loadPeople(){
    var payload=Object.assign({},state.identity||{});
    var result=null;

    // 新版專用組織圖 API：若 GAS 已提供，優先使用並遵守後端可見範圍。
    result=await api.request('angGetOrganizationChart',payload,{silent:true,timeout:12000});
    if(result){
      var rows=result.people||result.members||result.nodes||result.organization||result.data;
      if(Array.isArray(rows)){state.people=rows.map(normalizePerson).filter(function(x){return x.id&&x.enabled});state.source='organization_api';return;}
    }

    // 現有管理端已使用的 API。僅管理角色嘗試，避免員工端繞過權限。
    if(isManagement()){
      result=await api.request('getPeopleManagementData',payload,{silent:true,timeout:12000});
      if(result){
        var people=result.people||result.members||result.data;
        if(Array.isArray(people)){state.people=people.map(normalizePerson).filter(function(x){return x.id&&x.enabled});state.source='people_management';return;}
      }
    }

    // 員工端沒有主管關係 API 時，只顯示本人；絕不自行假設誰是主管。
    var me=readSelfFallback();
    state.people=me.id?[me]:[];
    state.source='self_only';
  }

  function visiblePeople(){
    if(isManagement())return state.people.slice();
    var me=String((state.identity&&state.identity.user_id)||'').toUpperCase();
    var byId={};state.people.forEach(function(p){byId[p.id]=p});
    var out=[];var cur=byId[me];var guard=0;
    while(cur&&guard<3){out.push(cur);cur=cur.managerId?byId[cur.managerId]:null;guard++;}
    if(!out.length){var own=state.people.filter(function(p){return p.id===me})[0];if(own)out=[own]}
    return out;
  }

  function groupLevels(list){
    var explicit=list.some(function(p){return !!p.managerId});
    if(!explicit){
      var ranks={};list.forEach(function(p){var r=roleRank(p.role);(ranks[r]||(ranks[r]=[])).push(p)});
      return Object.keys(ranks).map(Number).sort(function(a,b){return b-a}).map(function(k){return ranks[k]});
    }
    var byId={};list.forEach(function(p){byId[p.id]=p});
    var depthMemo={};
    function depth(p,seen){
      if(depthMemo[p.id]!==undefined)return depthMemo[p.id];
      seen=seen||{};if(seen[p.id])return 0;seen[p.id]=1;
      if(!p.managerId||!byId[p.managerId])return depthMemo[p.id]=0;
      return depthMemo[p.id]=depth(byId[p.managerId],seen)+1;
    }
    var levels=[];list.forEach(function(p){var d=depth(p,{});(levels[d]||(levels[d]=[])).push(p)});
    return levels.filter(Boolean);
  }

  function cardHtml(p){
    var me=String((state.identity&&state.identity.user_id)||'').toUpperCase();
    var cls='org-card'+(p.secondary?' secondary':'')+(p.id===me?' self':'');
    var branch=p.branchName||p.branchId||'';
    var meta=[p.dept,p.jobTitle,branch].filter(Boolean).join('｜')||'尚未設定部門／職稱';
    return '<article class="'+cls+'">'
      +'<div class="org-name">'+esc(p.name||p.nickname||p.id)+'<span class="org-id">'+esc(p.id)+'</span></div>'
      +'<span class="org-role">'+esc(p.role)+(p.secondary?'｜兼任':'｜主職')+'</span>'
      +'<div class="org-meta">'+esc(meta)+'</div>'
      +(p.managerId?'<div class="org-manager">直屬主管：'+esc(p.managerId)+'</div>':'')
      +'</article>';
  }

  function render(){
    var canvas=qs('orgCanvas');if(!canvas)return;
    var list=visiblePeople();
    if(!list.length){canvas.innerHTML='<div class="org-empty">目前沒有可顯示的組織資料。</div>';return}
    var levels=groupLevels(list);
    var html='<div class="org-tree">'+levels.map(function(level){return '<div class="org-level">'+level.map(cardHtml).join('')+'</div>'}).join('')+'</div>';
    canvas.classList.toggle('org-horizontal',state.layout==='horizontal');
    canvas.innerHTML=html;
    var sourceText=state.source==='organization_api'?'組織權限資料已載入':state.source==='people_management'?'使用現有人員管理資料顯示':state.source==='self_only'?'目前後端沒有提供員工主管關係，因此僅顯示本人，不推測主管':'資料已載入';
    setStatus(sourceText,state.source==='self_only'?'':'ok');
  }

  function toggleLayout(){
    state.layout=state.layout==='vertical'?'horizontal':'vertical';
    var btn=qs('layoutBtn');if(btn)btn.textContent=state.layout==='vertical'?'切換橫向':'切換直向';
    render();
  }

  function goBack(){
    var role=state.role;var target=roleRank(role)>=2?(cfg.adminPageUrl||'./admin.html'):(cfg.employeePageUrl||'./employee.html');
    var id=state.identity||{};var u=new URL(target,window.location.href);
    if(id.company_id)u.searchParams.set('company_id',id.company_id);
    if(id.user_id){u.searchParams.set('id',id.user_id);u.searchParams.set('employee_id',id.user_id)}
    if(id.token)u.searchParams.set('token',id.token);
    if(role)u.searchParams.set('role',role);
    window.location.href=u.toString();
  }

  async function boot(){
    qs('layoutBtn').addEventListener('click',toggleLayout);
    qs('backBtn').addEventListener('click',goBack);
    qs('refreshBtn').addEventListener('click',async function(){setStatus('正在重新讀取組織資料…');await loadPeople();render()});
    try{
      setStatus('正在確認登入身分與組織可見範圍…');
      await loadIdentity();
      await loadPeople();
      render();
    }catch(err){
      console.error('[ANG HR Organization]',err);
      setStatus(err&&err.message?err.message:'組織圖載入失敗','error');
      qs('orgCanvas').innerHTML='<div class="org-empty">請先從 ANG HR 登入後再開啟組織圖。</div>';
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}());
