/**
 * ANG HR System v0.6.0 backend extension
 * Monthly/weekly rest selection, support clock locations,
 * emergency contact history and audit logs.
 */
var V060_VERSION = '0.6.0';
var V060_SHEET_PRESELECT_SETTINGS = '選休設定';
var V060_SHEET_PRESELECT_SUBMISSIONS = '選休提交';
var V060_SHEET_SUPPORT = '支援指派';
var V060_SHEET_EMERGENCY = '緊急聯絡人歷史';
var V060_SHEET_AUDIT = '個資查閱紀錄';

function v060Text_(v) { return String(v == null ? '' : v).trim(); }
function v060Upper_(v) { return v060Text_(v).toUpperCase(); }
function v060Now_() { return (typeof nowText_ === 'function') ? nowText_() : Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss'); }
function v060Uuid_() { return Utilities.getUuid(); }
function v060Ok_(o) { return (typeof ok_ === 'function') ? ok_(o || {}) : Object.assign({ok:true}, o || {}); }
function v060Fail_(m) { return (typeof fail_ === 'function') ? fail_(m) : {ok:false,message:m}; }
function v060CompanyId_(p) {
  if (typeof resolveCompanyIdV28_ === 'function') return resolveCompanyIdV28_(p || {});
  return v060Upper_((p || {}).company_id || (p || {}).companyId || 'ANG_99');
}
function v060EmployeeId_(p) { return v060Upper_((p || {}).employee_id || (p || {}).employeeId || (p || {}).empId || (p || {}).id || (p || {}).userId); }
function v060Spreadsheet_() {
  if (typeof getSpreadsheet_ === 'function') return getSpreadsheet_();
  return SpreadsheetApp.getActiveSpreadsheet();
}
function v060Sheet_(companyId, name, headers) {
  var sh = null;
  try { if (typeof getCompanySheetV25_ === 'function') sh = getCompanySheetV25_(companyId, name); } catch (e) {}
  if (!sh) {
    var ss = v060Spreadsheet_();
    sh = ss.getSheetByName(name) || ss.insertSheet(name);
  }
  if (sh.getLastRow() === 0 && headers && headers.length) sh.getRange(1,1,1,headers.length).setValues([headers]);
  return sh;
}
function v060Objects_(sh) {
  if (typeof sheetToObjects_ === 'function') return sheetToObjects_(sh);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var h = values[0].map(String);
  return values.slice(1).map(function(r){ var o={}; h.forEach(function(k,i){o[k]=r[i];}); return o; });
}
function v060Append_(sh, obj) {
  if (typeof appendObjectRowToSheetV25_ === 'function') return appendObjectRowToSheetV25_(sh,obj);
  var h = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
  sh.appendRow(h.map(function(k){return obj[k] == null ? '' : obj[k];}));
}
function v060DistanceMeters_(lat1,lng1,lat2,lng2) {
  function rad(x){return x*Math.PI/180;}
  var R=6371000, dLat=rad(lat2-lat1), dLng=rad(lng2-lng1);
  var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(rad(lat1))*Math.cos(rad(lat2))*Math.sin(dLng/2)*Math.sin(dLng/2);
  return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
function v060ParseDates_(v) {
  if (Array.isArray(v)) return v.map(v060Text_).filter(Boolean);
  var s=v060Text_(v); if(!s)return[];
  try { var a=JSON.parse(s); if(Array.isArray(a))return a.map(v060Text_).filter(Boolean); } catch(e) {}
  return s.split(',').map(v060Text_).filter(Boolean);
}

function setupV060Sheets(payload) {
  var cid=v060CompanyId_(payload||{});
  v060Sheet_(cid,V060_SHEET_PRESELECT_SETTINGS,['company_id','mode','period_start','period_end','month','max_selected_days','submission_deadline','locked_at','published_at','updated_by','updated_at','version']);
  v060Sheet_(cid,V060_SHEET_PRESELECT_SUBMISSIONS,['submission_id','company_id','employee_id','mode','period','selected_dates','selected_count','status','submitted_at','updated_at','version']);
  v060Sheet_(cid,V060_SHEET_SUPPORT,['support_assignment_id','company_id','employee_id','home_branch_id','support_branch_id','support_location_name','latitude','longitude','radius_meters','valid_from','valid_until','allow_home_branch_clock','status','note','created_by','created_at','updated_at','version']);
  v060Sheet_(cid,V060_SHEET_EMERGENCY,['history_id','company_id','employee_id','contact_name','relationship','relationship_other','phone','valid_from','valid_until','is_current','change_reason','changed_by','changed_at','version']);
  v060Sheet_(cid,V060_SHEET_AUDIT,['audit_id','company_id','employee_id','target_employee_id','action','data_type','reference_id','reason','created_at','version']);
  return v060Ok_({message:'v0.6.0 資料表已建立',version:V060_VERSION});
}

function savePreselectSettingsV060_(p) {
  p=p||{}; var cid=v060CompanyId_(p), mode=v060Text_(p.mode||p.leave_selection_mode||'week').toLowerCase();
  mode=(mode==='month'||mode==='monthly')?'month':'week';
  var sh=v060Sheet_(cid,V060_SHEET_PRESELECT_SETTINGS,['company_id','mode','period_start','period_end','month','max_selected_days','submission_deadline','locked_at','published_at','updated_by','updated_at','version']);
  v060Append_(sh,{company_id:cid,mode:mode,period_start:p.period_start||p.selection_period_start||'',period_end:p.period_end||p.selection_period_end||'',month:p.month||'',max_selected_days:Number(p.max_selected_days||p.maxSelectedDays||8),submission_deadline:p.submission_deadline||p.deadline||'',locked_at:p.locked_at||'',published_at:p.published_at||'',updated_by:v060EmployeeId_(p),updated_at:v060Now_(),version:V060_VERSION});
  return v060Ok_({message:'選休規則已儲存',settings:getPreselectSettingsV060_(p).settings});
}
function getPreselectSettingsV060_(p) {
  p=p||{}; var cid=v060CompanyId_(p), sh=v060Sheet_(cid,V060_SHEET_PRESELECT_SETTINGS,['company_id','mode','period_start','period_end','month','max_selected_days','submission_deadline','locked_at','published_at','updated_by','updated_at','version']);
  var rows=v060Objects_(sh).filter(function(r){return v060Upper_(r.company_id||cid)===cid;});
  var r=rows.length?rows[rows.length-1]:{mode:'week',max_selected_days:8};
  return v060Ok_({settings:{mode:v060Text_(r.mode||'week'),leave_selection_mode:v060Text_(r.mode||'week')==='month'?'monthly':'weekly',period_start:r.period_start||'',period_end:r.period_end||'',month:r.month||'',max_selected_days:Number(r.max_selected_days||8),submission_deadline:r.submission_deadline||'',locked_at:r.locked_at||'',published_at:r.published_at||''}});
}
function submitPreselectV060_(p) {
  p=p||{}; var cid=v060CompanyId_(p), eid=v060EmployeeId_(p); if(!eid)return v060Fail_('缺少員工編號');
  var settings=getPreselectSettingsV060_(p).settings, dates=v060ParseDates_(p.selected_dates||p.selectedDates||p.dates);
  var max=Number(settings.max_selected_days||8); if(dates.length>max)return v060Fail_('最多只能選 '+max+' 天');
  if(settings.submission_deadline){var dl=new Date(settings.submission_deadline);if(!isNaN(dl.getTime())&&Date.now()>dl.getTime())return v060Fail_('選休已截止');}
  var mode=v060Text_(p.mode||settings.mode||'week'), period=v060Text_(p.period||p.month||settings.month||settings.period_start||'');
  var sh=v060Sheet_(cid,V060_SHEET_PRESELECT_SUBMISSIONS,['submission_id','company_id','employee_id','mode','period','selected_dates','selected_count','status','submitted_at','updated_at','version']);
  v060Append_(sh,{submission_id:v060Uuid_(),company_id:cid,employee_id:eid,mode:mode,period:period,selected_dates:JSON.stringify(dates),selected_count:dates.length,status:'submitted',submitted_at:v060Now_(),updated_at:v060Now_(),version:V060_VERSION});
  return v060Ok_({message:'選休已送出',mode:mode,period:period,selected_dates:dates,selected_count:dates.length});
}
function getEmployeePreselectV060_(p){
  var cid=v060CompanyId_(p||{}),eid=v060EmployeeId_(p||{}),sh=v060Sheet_(cid,V060_SHEET_PRESELECT_SUBMISSIONS,['submission_id','company_id','employee_id','mode','period','selected_dates','selected_count','status','submitted_at','updated_at','version']);
  var rows=v060Objects_(sh).filter(function(r){return v060Upper_(r.employee_id)===eid;}); var r=rows.length?rows[rows.length-1]:null;
  return v060Ok_({submission:r?Object.assign({},r,{selected_dates:v060ParseDates_(r.selected_dates)}):null,settings:getPreselectSettingsV060_(p).settings});
}

function createSupportAssignmentV060_(p){
  p=p||{};var cid=v060CompanyId_(p),eid=v060EmployeeId_(p);if(!eid)return v060Fail_('缺少支援員工');
  var lat=Number(p.latitude||p.lat),lng=Number(p.longitude||p.lng),rad=Number(p.radius_meters||p.radius||200);
  if(!isFinite(lat)||!isFinite(lng))return v060Fail_('支援座標不正確');
  if(!p.valid_from||!p.valid_until)return v060Fail_('請設定支援起訖時間');
  var sh=v060Sheet_(cid,V060_SHEET_SUPPORT,['support_assignment_id','company_id','employee_id','home_branch_id','support_branch_id','support_location_name','latitude','longitude','radius_meters','valid_from','valid_until','allow_home_branch_clock','status','note','created_by','created_at','updated_at','version']);
  var id='SUP-'+Utilities.getUuid();v060Append_(sh,{support_assignment_id:id,company_id:cid,employee_id:eid,home_branch_id:v060Upper_(p.home_branch_id||''),support_branch_id:v060Upper_(p.support_branch_id||''),support_location_name:v060Text_(p.support_location_name||p.name),latitude:lat,longitude:lng,radius_meters:rad,valid_from:p.valid_from,valid_until:p.valid_until,allow_home_branch_clock:String(p.allow_home_branch_clock)==='true'?'true':'false',status:'scheduled',note:v060Text_(p.note),created_by:v060EmployeeId_({id:p.created_by||p.userId||p.id}),created_at:v060Now_(),updated_at:v060Now_(),version:V060_VERSION});
  return v060Ok_({message:'支援打卡點已建立',support_assignment_id:id});
}
function listSupportAssignmentsV060_(p){
  var cid=v060CompanyId_(p||{}),eid=v060EmployeeId_(p||{}),sh=v060Sheet_(cid,V060_SHEET_SUPPORT,['support_assignment_id','company_id','employee_id','home_branch_id','support_branch_id','support_location_name','latitude','longitude','radius_meters','valid_from','valid_until','allow_home_branch_clock','status','note','created_by','created_at','updated_at','version']);
  var rows=v060Objects_(sh).filter(function(r){return !eid||v060Upper_(r.employee_id)===eid;});return v060Ok_({assignments:rows});
}
function activeSupportV060_(p){
  var res=listSupportAssignmentsV060_(p),now=Date.now(),rows=(res.assignments||[]).filter(function(r){var a=new Date(r.valid_from).getTime(),b=new Date(r.valid_until).getTime(),s=v060Text_(r.status||'scheduled');return s!=='cancelled'&&!isNaN(a)&&!isNaN(b)&&a<=now&&now<=b;});
  return rows.length?rows[rows.length-1]:null;
}
function cancelSupportAssignmentV060_(p){
  var cid=v060CompanyId_(p||{}),id=v060Text_(p.support_assignment_id||p.id),sh=v060Sheet_(cid,V060_SHEET_SUPPORT,['support_assignment_id','company_id','employee_id','home_branch_id','support_branch_id','support_location_name','latitude','longitude','radius_meters','valid_from','valid_until','allow_home_branch_clock','status','note','created_by','created_at','updated_at','version']);
  var vals=sh.getDataRange().getValues(),h=vals[0].map(String),ci=h.indexOf('support_assignment_id'),cs=h.indexOf('status'),cu=h.indexOf('updated_at');for(var i=1;i<vals.length;i++){if(v060Text_(vals[i][ci])===id){sh.getRange(i+1,cs+1).setValue('cancelled');if(cu>=0)sh.getRange(i+1,cu+1).setValue(v060Now_());return v060Ok_({message:'支援指派已取消'});}}return v060Fail_('找不到支援指派');
}

function employeeClockV060_(p){
  p=p||{};var cid=v060CompanyId_(p),eid=v060EmployeeId_(p),lat=Number(p.latitude||p.lat),lng=Number(p.longitude||p.lng),support=activeSupportV060_(p),clockType=v060Text_(p.clock_type||p.clockType||p.clock_action||'上班');
  var meta={source:p.source||'app',site_id:'',note:v060Text_(p.note),support_assignment_id:'',support_location_name:'',distance_meters:'',is_support_clock:'false'};
  if(support){
    if(!isFinite(lat)||!isFinite(lng))return v060Fail_('支援打卡需要定位');
    var dist=v060DistanceMeters_(lat,lng,Number(support.latitude),Number(support.longitude)),radius=Number(support.radius_meters||200);
    if(dist>radius)return v060Fail_('距離支援打卡點約 '+Math.round(dist)+' 公尺，超出允許範圍 '+radius+' 公尺');
    meta.site_id=v060Text_(support.support_branch_id||support.support_location_name);meta.support_assignment_id=support.support_assignment_id;meta.support_location_name=support.support_location_name;meta.distance_meters=Math.round(dist);meta.is_support_clock='true';meta.note=(meta.note?meta.note+'｜':'')+'支援打卡｜'+support.support_location_name+'｜'+support.support_assignment_id;
  }
  var sh=v060Sheet_(cid,(typeof SHEET_CLOCK_RECORDS!=='undefined'?SHEET_CLOCK_RECORDS:'打卡原始記錄'),['record_id','company_id','employee_id','clock_type','source','site_id','nfc_key','lat','lng','accuracy','device_id','created_at','note','support_assignment_id','support_location_name','distance_meters','is_support_clock']);
  v060Append_(sh,{record_id:v060Uuid_(),company_id:cid,employee_id:eid,clock_type:clockType,source:meta.source,site_id:meta.site_id,nfc_key:'',lat:isFinite(lat)?lat:'',lng:isFinite(lng)?lng:'',accuracy:p.accuracy||'',device_id:p.device_id||'',created_at:v060Now_(),note:meta.note,support_assignment_id:meta.support_assignment_id,support_location_name:meta.support_location_name,distance_meters:meta.distance_meters,is_support_clock:meta.is_support_clock});
  return v060Ok_({message:clockType+'打卡完成',support:!!support,support_assignment_id:meta.support_assignment_id,support_location_name:meta.support_location_name,distance_meters:meta.distance_meters});
}

function saveEmergencyContactV060_(p){
  p=p||{};var cid=v060CompanyId_(p),eid=v060EmployeeId_(p),name=v060Text_(p.contact_name||p.emergency_contact_name),rel=v060Text_(p.relationship),other=v060Text_(p.relationship_other),phone=v060Text_(p.phone||p.emergency_phone);
  if(!eid||!name||!rel||!phone)return v060Fail_('緊急聯絡人姓名、關係與電話皆為必填');if(rel==='其他'&&!other)return v060Fail_('請填寫其他關係');
  var sh=v060Sheet_(cid,V060_SHEET_EMERGENCY,['history_id','company_id','employee_id','contact_name','relationship','relationship_other','phone','valid_from','valid_until','is_current','change_reason','changed_by','changed_at','version']);
  var vals=sh.getDataRange().getValues(),h=vals[0].map(String),ce=h.indexOf('employee_id'),cc=h.indexOf('is_current'),cu=h.indexOf('valid_until');for(var i=1;i<vals.length;i++){if(v060Upper_(vals[i][ce])===eid&&String(vals[i][cc])==='true'){sh.getRange(i+1,cc+1).setValue('false');if(cu>=0)sh.getRange(i+1,cu+1).setValue(v060Now_());}}
  var id=v060Uuid_();v060Append_(sh,{history_id:id,company_id:cid,employee_id:eid,contact_name:name,relationship:rel,relationship_other:other,phone:phone,valid_from:v060Now_(),valid_until:'',is_current:'true',change_reason:v060Text_(p.change_reason),changed_by:v060Upper_(p.changed_by||p.userId||p.id),changed_at:v060Now_(),version:V060_VERSION});return v060Ok_({message:'緊急聯絡人已更新並保留歷史',history_id:id});
}
function getEmergencyContactHistoryV060_(p){
  var cid=v060CompanyId_(p||{}),target=v060Upper_(p.target_employee_id||p.employee_id||p.empId),viewer=v060EmployeeId_(p||{}),sh=v060Sheet_(cid,V060_SHEET_EMERGENCY,['history_id','company_id','employee_id','contact_name','relationship','relationship_other','phone','valid_from','valid_until','is_current','change_reason','changed_by','changed_at','version']);
  var rows=v060Objects_(sh).filter(function(r){return v060Upper_(r.employee_id)===target;});var audit=v060Sheet_(cid,V060_SHEET_AUDIT,['audit_id','company_id','employee_id','target_employee_id','action','data_type','reference_id','reason','created_at','version']);v060Append_(audit,{audit_id:v060Uuid_(),company_id:cid,employee_id:viewer,target_employee_id:target,action:'view',data_type:'emergency_contact_history',reference_id:'',reason:v060Text_(p.reason),created_at:v060Now_(),version:V060_VERSION});return v060Ok_({history:rows});
}

function enrichEmployeeBootstrapV060_(base,p){
  base=base||{};var s=getPreselectSettingsV060_(p).settings,sub=getEmployeePreselectV060_(p).submission,support=activeSupportV060_(p);base.preselectSettings=s;base.preselectSubmission=sub;base.activeSupport=support;base.version=V060_VERSION;return base;
}
