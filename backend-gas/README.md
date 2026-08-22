# ANG HR GAS 分流架構

## 原則

- `Code.gs`：只保留 `doGet`／`doPost`。
- `Router.gs`：只判斷 `client=line|flutter|web`。
- `LineClient.gs`：只處理 LIFF、LINE ID token、LINE 帳號接入。
- `FlutterClient.gs`：只處理 Flutter／原生 App 驗證接入。
- `WebClient.gs`：只處理 Web／PWA 驗證接入。
- `CoreApi.gs`：只把共用 action 交給真正的 ANG HR 主程式。
- `Config.gs`：只讀 Script Properties。
- `Response.gs`：統一 JSON 回傳格式。

LINE、Flutter、Web 不得互相呼叫對方的 client 檔案，也不得在各自檔案重寫打卡、排班、請假、薪資資料邏輯。

## 請求格式

### LINE MINI App

```text
client=line
action=authenticate
provider=line-mini-app
id_token=<LIFF ID token>
environment=developing
```

驗證成功後的所有資料請求：

```text
client=line
action=getSchedule
session_token=<ANG HR session>
```

### Flutter

```text
client=flutter
action=authenticate
provider=google|line|email
id_token=<provider token>
device_id=<device id>
platform=android|ios
```

### Web／PWA

```text
client=web
action=authenticate
...
```

舊前端沒有帶 `client` 時，`Router.gs` 會依 `source`／`channel` 判斷；仍無法判斷時暫時歸到 `web`，避免舊網站立即中斷。

## 共用主程式固定接點

把現有 ANG HR 真正資料邏輯接到以下函式，不要搬進 LINE／Flutter 檔案：

```javascript
function coreLoginOrBindLineIdentity_(identity, context) {}
function coreAuthenticateFlutterClient_(credentials, context) {}
function coreAuthenticateWebClient_(params, context) {}

function coreGetHomeData_(params, context) {}
function coreGetSchedule_(params, context) {}
function coreGetLeaveRecords_(params, context) {}
function coreSubmitLeave_(params, context) {}
function coreGetPayroll_(params, context) {}
function coreGetManagementOverview_(params, context) {}
function coreClockByLocation_(params, context) {}
function coreClockByQr_(params, context) {}
function coreClockByNfc_(params, context) {}
```

## LINE Script Properties

在 GAS 專案設定加入：

```text
LINE_MINI_CHANNEL_ID_DEVELOPING
LINE_MINI_CHANNEL_ID_REVIEW
LINE_MINI_CHANNEL_ID_PUBLISHED
LINE_MINI_DEFAULT_ENVIRONMENT
```

Channel ID 不得寫死在前端或公開檔案。

## 部署順序

1. 先把現有 `doGet`／`doPost` 內的主程式內容抽到對應的 `core..._` 函式。
2. 再放入本資料夾的 `.gs` 檔案。
3. 確認 GAS 專案只有一組 `doGet`／`doPost`。
4. 先測 `client=web`，確認舊網站未斷線。
5. 再測 `client=line` 與 `client=flutter`。
