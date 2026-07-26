<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
  <title>ANG HR 打卡中心</title>
  <script src="./config.js"></script>
  <style>
    :root{--bg:#f4f6fb;--card:rgba(255,255,255,.96);--text:#101827;--muted:#667085;--line:#dfe4ec;--main:#ff7a21;--ok:#047857;--err:#b42318;--blue:#2563eb;--purple:#7c3aed}
    *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
    body{margin:0;min-height:100vh;background:radial-gradient(circle at 10% 0,#fff7ed 0,transparent 36%),radial-gradient(circle at 100% 0,#eef2ff 0,transparent 40%),var(--bg);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans TC",sans-serif;color:var(--text);padding:18px}
    .wrap{width:100%;max-width:520px;margin:0 auto;padding-bottom:38px}.brand{display:flex;align-items:center;gap:12px;margin:4px 4px 16px}.logo{width:56px;height:56px;border-radius:19px;background:linear-gradient(135deg,#ff9a3d,#ff6d1d);color:#fff;font-weight:1000;display:flex;align-items:center;justify-content:center;box-shadow:0 16px 34px rgba(255,122,33,.28)}
    h1{font-size:25px;margin:0}.sub{font-size:13px;color:var(--muted);margin-top:4px}.card{background:var(--card);border:1px solid var(--line);border-radius:25px;padding:18px;box-shadow:0 18px 45px rgba(16,24,39,.1);margin-bottom:13px}.card h2{font-size:16px;margin:0 0 12px}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
    label{display:block;font-size:12px;font-weight:900;color:#344054;margin:10px 0 6px}input,select,textarea{width:100%;border:1px solid #cfd5df;border-radius:13px;background:#fff;color:#101827;font-size:15px;padding:11px 12px}textarea{min-height:90px;resize:vertical}.method{border:1px dashed #f5a24a;background:#fff8eb;border-radius:18px;padding:13px;margin-bottom:10px}.method b{display:block;margin-bottom:4px}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;word-break:break-all;color:#92400e;font-size:13px}
    button{border:0;border-radius:15px;padding:13px 10px;font-size:14px;font-weight:1000;cursor:pointer}.primary{width:100%;background:linear-gradient(135deg,#ff8a2a,#ff6517);color:#fff}.nfc{background:#fff7ed;color:#9a3412;border:1px solid #fed7aa}.qr{background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe}.gps{background:#ecfdf3;color:#047857;border:1px solid #a7f3d0}.manual{background:#f5f3ff;color:#6d28d9;border:1px solid #ddd6fe}.ghost{width:100%;background:#fff;color:#344054;border:1px solid var(--line);margin-top:9px}.action.active{outline:3px solid rgba(255,122,33,.22);background:#ffedd5;color:#9a3412}.status{border:1px solid var(--line);border-radius:16px;background:#f8fafc;padding:12px;font-size:13px;line-height:1.6;white-space:pre-wrap}.status.ok{border-color:#a7f3d0;background:#ecfdf3;color:var(--ok)}.status.err{border-color:#fecaca;background:#fef2f2;color:var(--err)}.tiny{font-size:12px;color:var(--muted);line-height:1.55}.hidden{display:none!important}.chiprow{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}.chip{font-size:11px;font-weight:900;border-radius:999px;padding:6px 9px;background:#f2f4f7;color:#475467}.spinner{opacity:.65;pointer-events:none}
    html[data-display-mode="lite"] body{background:#f4f6fb}html[data-display-mode="lite"] .card,html[data-display-mode="lite"] .logo{box-shadow:none}html[data-display-mode="lite"] *{transition:none!important;animation:none!important;backdrop-filter:none!important}
  </style>
  <link rel="stylesheet" href="./display-mode.css" />
</head>
<body>
<main class="wrap">
  <header class="brand"><div class="logo">ANG</div><div><h1>打卡中心</h1><div class="sub">NFC 優先｜QR 備援｜GPS 定位｜手動補卡審核</div></div></header>

  <section class="card">
    <h2>身分與打卡動作</h2>
    <div class="grid2">
      <div><label for="companyCode">公司代碼</label><input id="companyCode" placeholder="ANG_HR" autocomplete="organization"></div>
      <div><label for="empId">員工編號</label><input id="empId" placeholder="ANG0603" autocomplete="username"></div>
    </div>
    <label>打卡類型</label>
    <div class="grid3">
      <button type="button" class="action active" data-clock="上班">上班</button>
      <button type="button" class="action" data-clock="下班">下班</button>
      <button type="button" class="action" data-clock="加班">加班</button>
    </div>
    <div class="chiprow"><span class="chip" id="deviceChip">裝置：讀取中</span><span class="chip" id="networkChip">網路：讀取中</span><span class="chip" id="modeChip">模式：標準</span></div>
  </section>

  <section class="card">
    <h2>正式打卡</h2>
    <div class="method"><b>NFC 標籤</b><div class="mono" id="nfcValue">尚未讀取</div></div>
    <div class="method"><b>QR 打卡碼</b><div class="mono" id="qrValue">尚未讀取</div></div>
    <div class="grid3">
      <button type="button" class="nfc" id="nfcBtn">感應 NFC</button>
      <button type="button" class="qr" id="qrBtn">掃描 QR</button>
      <button type="button" class="gps" id="gpsBtn">GPS 打卡</button>
    </div>
    <label for="qrManual">舊設備／網頁備援：貼上 QR 內容</label>
    <div class="grid2"><input id="qrManual" placeholder="QR key 或完整網址"><button type="button" class="qr" id="qrManualBtn">使用此 QR</button></div>
    <p class="tiny">每次送出都會取得高精準定位；後端驗證公司、員工 Session、綁定裝置、打卡點半徑、NFC／QR key、支援期間、伺服器時間與 15 分鐘防重複。</p>
  </section>

  <section class="card">
    <h2>手動補打卡申請</h2>
    <div class="grid2"><div><label for="manualTime">補登時間</label><input id="manualTime" type="datetime-local"></div><div><label for="attachmentUrl">附件網址（選填）</label><input id="attachmentUrl" placeholder="https://..."></div></div>
    <label for="manualReason">原因</label><textarea id="manualReason" placeholder="請說明無法使用 NFC／QR／GPS 的原因"></textarea>
    <button type="button" class="manual" id="manualBtn" style="width:100%">送出補打卡申請</button>
  </section>

  <section class="card"><div id="status" class="status">準備中…</div><button type="button" class="ghost" id="backBtn">返回登入／入口</button></section>
</main>
<script>
(function(){
  'use strict';
  const CFG=window.ANG_HR_CONFIG||{};
  const qs=new URLSearchParams(location.search);
  const state={
    companyId:(qs.get('company_id')||qs.get('company_code')||localStorage.getItem('ang_company_id')||localStorage.getItem('ang_company_code')||CFG.defaultCompanyId||'ANG_HR').trim().toUpperCase(),
    employeeId:(qs.get('id')||qs.get('employee_id')||localStorage.getItem('ang_login_id')||'').trim().toUpperCase(),
    token:qs.get('token')||qs.get('loginToken')||localStorage.getItem('ang_login_token')||'',
    deviceId:getDeviceId(),
    gas:qs.get('gas')||CFG.apiBaseUrl||CFG.gasApiUrl||'',
    clockType:'上班', nfcKey:'', nfcText:'', qrKey:'', busy:false
  };
  window.ANG_ATTENDANCE_STATE=state;
  const $=id=>document.getElementById(id);
  $('companyCode').value=state.companyId;$('empId').value=state.employeeId;
  $('deviceChip').textContent='裝置：'+(state.deviceId||'未取得');
  $('networkChip').textContent='網路：'+getNetworkType();
  $('modeChip').textContent='模式：'+((localStorage.getItem('ang-hr-display-mode')||qs.get('mode'))==='lite'?'Lite':'標準');
  const now=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);$('manualTime').value=now;

  document.querySelectorAll('[data-clock]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-clock]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');state.clockType=btn.dataset.clock;}));
  $('nfcBtn').addEventListener('click',()=>{try{if(window.ANGHRApp&&ANGHRApp.requestNfcScan){ANGHRApp.requestNfcScan();setStatus('請將手機靠近 NFC 標籤。');return;}}catch(e){}setStatus('此瀏覽器無法主動讀 NFC。Android App 可直接感應；iPhone 請用 NFC 標籤開啟本頁。','err');});
  $('qrBtn').addEventListener('click',()=>{try{if(window.ANGHRApp&&ANGHRApp.requestQrScan){ANGHRApp.requestQrScan();setStatus('相機已開啟，請對準公司 QR Code。');return;}}catch(e){}setStatus('此裝置未提供原生 QR 掃描，請將 QR 內容貼到下方欄位。','err');});
  $('gpsBtn').addEventListener('click',()=>submitFormal('gps',''));
  $('qrManualBtn').addEventListener('click',()=>{const raw=$('qrManual').value.trim();if(!raw)return setStatus('請先貼上 QR 內容。','err');state.qrKey=parseQrKey(raw);$('qrValue').textContent=state.qrKey;submitFormal('qr',state.qrKey);});
  $('manualBtn').addEventListener('click',submitManual);
  $('backBtn').addEventListener('click',()=>{location.href='./index_connected.html?company_id='+encodeURIComponent(readIdentity().companyId);});

  window.addEventListener('ANG_HR_NFC_SCAN',e=>{const d=e.detail||{};state.nfcKey=String(d.uid||d.id||d.nfc_id||'').trim().toUpperCase();state.nfcText=String(d.ndef||d.text||'').trim();$('nfcValue').textContent=state.nfcKey||state.nfcText||'讀取失敗';if(state.nfcKey)submitFormal('nfc',state.nfcKey);else setStatus('NFC 標籤沒有可用 UID。','err');});
  window.addEventListener('ANG_HR_QR_SCAN',e=>{const d=e.detail||{};const raw=String(d.text||d.rawValue||d.value||'').trim();state.qrKey=parseQrKey(raw);$('qrValue').textContent=state.qrKey||raw||'讀取失敗';if(state.qrKey)submitFormal('qr',state.qrKey);else setStatus('QR Code 沒有可用打卡碼。','err');});
  window.addEventListener('ANG_HR_NFC_STATUS',e=>setStatus((e.detail&&e.detail.message)||'等待 NFC…'));
  window.addEventListener('ANG_HR_ERROR',e=>setStatus((e.detail&&e.detail.message)||'裝置發生錯誤','err'));

  if(!state.gas)setStatus('尚未設定 GAS API 網址，請先更新 config.js。','err');
  else if(!state.employeeId)setStatus('請輸入員工編號，並確認已完成登入與裝置綁定。');
  else setStatus('已就緒。建議先使用 NFC；失敗時再使用 QR 或 GPS。');

  function readIdentity(){state.companyId=$('companyCode').value.trim().toUpperCase();state.employeeId=$('empId').value.trim().toUpperCase();localStorage.setItem('ang_company_id',state.companyId);localStorage.setItem('ang_company_code',state.companyId);if(state.employeeId)localStorage.setItem('ang_login_id',state.employeeId);return state;}
  async function submitFormal(method,key){
    if(state.busy)return;readIdentity();if(!state.gas)return setStatus('尚未設定 GAS API 網址。','err');if(!state.companyId||!state.employeeId)return setStatus('請輸入公司代碼與員工編號。','err');
    state.busy=true;document.body.classList.add('spinner');setStatus('正在取得定位並驗證 '+method.toUpperCase()+' 打卡…');
    try{
      const pos=await getPosition();
      const payload={action:'formalClockV060',company_id:state.companyId,company_code:state.companyId,id:state.employeeId,employee_id:state.employeeId,token:state.token,loginToken:state.token,device_id:state.deviceId,clock_type:state.clockType,method:method,source:method,nfc_key:method==='nfc'?key:'',nfc_text:state.nfcText,qr_key:method==='qr'?key:'',latitude:pos.latitude,longitude:pos.longitude,accuracy:pos.accuracy,client_time:new Date().toISOString(),user_agent:navigator.userAgent};
      const data=await api(payload);if(!data.ok)throw new Error(data.message||'打卡失敗');
      let detail=data.message||state.clockType+'打卡完成';if(data.point)detail+='\n地點：'+(data.point.name||data.point.point_id||'打卡點')+'（距離 '+(data.point.distance_meters??'—')+' 公尺）';if(data.support)detail+='\n本次套用臨時支援打卡點。';setStatus(detail,'ok');notify('ANG HR',data.message||'打卡完成');
    }catch(err){setStatus(err.message||String(err),'err');}finally{state.busy=false;document.body.classList.remove('spinner');}
  }
  async function submitManual(){
    if(state.busy)return;readIdentity();const reason=$('manualReason').value.trim(),requested=$('manualTime').value;if(!reason)return setStatus('補打卡必須填寫原因。','err');if(!requested)return setStatus('請選擇補登時間。','err');
    state.busy=true;document.body.classList.add('spinner');setStatus('正在送出補打卡申請…');
    try{const data=await api({action:'requestManualClockV060',company_id:state.companyId,id:state.employeeId,employee_id:state.employeeId,token:state.token,loginToken:state.token,clock_type:state.clockType,requested_time:new Date(requested).toISOString(),reason:reason,attachment_url:$('attachmentUrl').value.trim(),device_id:state.deviceId});if(!data.ok)throw new Error(data.message||'申請失敗');setStatus((data.message||'補打卡申請已送出')+'\n狀態：等待審核','ok');}
    catch(err){setStatus(err.message||String(err),'err');}finally{state.busy=false;document.body.classList.remove('spinner');}
  }
  async function api(payload){const res=await fetch(state.gas,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(payload)});const text=await res.text();let data;try{data=JSON.parse(text);}catch(e){throw new Error('後端回應格式錯誤：'+text.slice(0,120));}return data;}
  function getPosition(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('此裝置不支援定位'));navigator.geolocation.getCurrentPosition(p=>resolve({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy}),e=>reject(new Error(e.code===1?'定位權限未開啟':'無法取得定位，請移到訊號較佳的位置')), {enableHighAccuracy:true,timeout:12000,maximumAge:10000});});}
  function parseQrKey(raw){try{const u=new URL(raw,location.href);return String(u.searchParams.get('qr_key')||u.searchParams.get('qr')||u.searchParams.get('code')||raw).trim().toUpperCase();}catch(e){return raw.trim().toUpperCase();}}
  function setStatus(msg,type){$('status').textContent=msg||'';$('status').className='status'+(type?' '+type:'');}
  function notify(title,message){try{if(window.ANGHRApp&&ANGHRApp.notify)ANGHRApp.notify(title,message);}catch(e){}}
  function getDeviceId(){try{if(window.ANGHRApp&&ANGHRApp.getDeviceId){const v=String(ANGHRApp.getDeviceId()||'').trim();if(v){localStorage.setItem('ang_device_id',v);return v;}}}catch(e){}let v=qs.get('device_id')||localStorage.getItem('ang_device_id')||'';if(!v){v='web-'+Date.now()+'-'+Math.random().toString(16).slice(2);localStorage.setItem('ang_device_id',v);}return v;}
  function getNetworkType(){try{return window.ANGHRApp&&ANGHRApp.getNetworkType?String(ANGHRApp.getNetworkType()||'unknown'):navigator.onLine?'online':'offline';}catch(e){return navigator.onLine?'online':'offline';}}
})();
</script>
<script src="./display-mode.js" defer></script>
</body>
</html>
