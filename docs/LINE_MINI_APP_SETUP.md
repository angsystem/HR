# ANG HR｜LINE MINI App 獨立版

## 架構決定

LINE MINI App 不再載入 ANG HR 原本的 `index.html`、React bundle、登入卡片、PWA Service Worker 或 Web 管理頁。

除了驗證與共用 GAS 資料 API，其餘入口與功能畫面全部放在獨立目錄：

```text
line-mini-app/
├─ index.html       MINI App 唯一入口
├─ config.js        LIFF ID、GAS URL、環境與功能設定
├─ auth.js          唯一共用層：LINE 驗證後換 ANG HR session
├─ app.js           MINI App 自己的首頁、路由與功能流程
└─ styles.css       MINI App 自己的日夜介面
```

舊的根目錄 `line-mini-app.html` 只保留相容轉址，不再載入任何舊前端檔案。

## 資料流

```text
LINE 官方帳號／QR／NFC 標籤／LIFF URL
                    ↓
line-mini-app/index.html
                    ↓
auth.js：liff.init() → liff.getIDToken()
                    ↓
GAS：verifyLineMiniAppIdToken
                    ↓
回傳 ANG HR 短效 session、帳號、公司、角色
                    ↓
app.js：獨立顯示員工或企業管理功能
```

## 不再共用的內容

- 原本 ANG HR 登入／方案滑動入口
- 原本 `index.html` 與前端 bundle
- 原本 Google／LINE／Email 登入按鈕
- 原本 OAuth callback 前端
- 原本 manager welcome、卡片規則與入口樣式
- 原本 Service Worker 與 PWA 快取
- 原本 employee／admin 頁面 UI

## 唯一共用內容

- GAS 後端 API 網址
- LINE ID token 後端驗證
- ANG HR 帳號、公司、職級與方案資料
- 後端簽發的 ANG HR session
- 排班、請假、薪資、打卡等資料 API

## LINE Developers Console Endpoint URL

建立 LINE MINI App Channel 後，三個環境填入各自 Endpoint URL：

```text
Developing
https://angsystem.github.io/HR/line-mini-app/index.html?env=developing

Review
https://angsystem.github.io/HR/line-mini-app/index.html?env=review

Published
https://angsystem.github.io/HR/line-mini-app/index.html?env=published
```

三個環境各有自己的 LIFF ID，填入 `line-mini-app/config.js`：

```js
liffIds: {
  developing: '',
  review: '',
  published: ''
}
```

## 驗證後端

需要新增 GAS action：

```text
verifyLineMiniAppIdToken
```

前端傳入：

```text
action=verifyLineMiniAppIdToken
id_token=<LIFF ID token>
environment=developing|review|published
source=line-mini-app
```

後端必須：

1. 依環境取得正確的 MINI App Channel ID。
2. 呼叫 LINE 官方 ID token verify endpoint。
3. 確認 `aud`、`exp` 與簽發資訊。
4. 使用驗證後的 `sub` 查找 ANG HR 綁定帳號。
5. 回傳 ANG HR 自己的短效 session，不直接把 LINE token 當系統 session。
6. 回傳公司、角色、person ID 與可用方案，交由 MINI App 決定首頁。

## MINI App 功能 API

獨立前端目前預留：

```text
clockByLocation   手動定位打卡
clockByQr         動態 QR 打卡
clockByNfc        NFC 標籤開啟後打卡
```

以及後續要接的：

```text
getEmployeeHome
getSchedule
createLeaveRequest
getLeaveHistory
getPayrollSummary
getCompanyDashboard
getEmployees
saveSchedule
reviewLeaveRequest
getDynamicQr
```

## 打卡規則

### 手動打卡

- 使用者在 MINI App 內按按鈕。
- 由 HTML5 Geolocation 取得位置。
- GAS 驗證公司範圍與定位精度。

### QR 打卡

- 使用 LIFF QR 掃描能力讀取動態 token。
- QR token 應由後端短效簽發並限制使用次數。
- 不要求定位。

### NFC 打卡

- 不依賴 MINI App 直接讀取 NFC 晶片。
- NFC 標籤寫入 MINI App URL 與短效／可輪替識別資料。
- 手機感應後開啟 MINI App，再把 `nfc_token` 交給後端驗證。
- 不要求定位。

## 尚待完成

- 填入三組 LIFF ID。
- 新增 GAS `verifyLineMiniAppIdToken`。
- 統一 ANG HR session 回傳格式。
- 串接首頁、班表、請假、薪資與管理 API。
- 串接動態 QR 產生與驗證。
- 設計 NFC 標籤 token 輪替／撤銷機制。
- 完成隱私權政策、服務條款與 LINE Console 設定。
