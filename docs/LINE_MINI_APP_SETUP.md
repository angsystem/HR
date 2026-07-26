# ANG HR｜LINE MINI App 建置說明

## 結論

LINE MINI App 不是在 LINE Developers Console 裡直接拖拉製作的原生 App。
它是部署在 HTTPS 網址上的 Web App，再由 LINE MINI App Channel／LIFF 將它放進 LINE 內執行。

ANG HR 採用以下架構：

```text
LINE 官方帳號／QR Code／LIFF URL
                ↓
https://angsystem.github.io/HR/line-mini-app.html
                ↓
LIFF SDK：取得 LINE ID token
                ↓
GAS：驗證 ID token、建立或登入 ANG HR 帳號
                ↓
既有 ANG HR 員工／企業管理／方案功能
```

## 已建立檔案

- `line-mini-app.html`：LINE MINI App 專用入口，不註冊 Service Worker，避免 LINE 內建瀏覽器讀到舊快取。
- `line-mini-app-config.js`：Developing／Review／Published 三環境 LIFF ID 與 Endpoint URL。
- `line-mini-app-bridge.js`：初始化 LIFF，取得 ID token、profile、context，並發出 `anghr:line-identity-ready` 事件。

## LINE Developers Console 設定

1. 登入 LINE Developers Console。
2. 在 ANG HR 所屬 Provider 建立 `LINE MINI App` Channel。
3. 服務地區與公司／擁有者地區需依實際資料設定。
4. 填寫名稱、圖示、服務說明、隱私權政策網址、服務條款網址。
5. 在 Web app settings 填入各環境 Endpoint URL。
6. 將 Console 顯示的三組 LIFF ID 填入 `line-mini-app-config.js`。
7. 將自己的 LINE 帳號加入 Tester，以 Developing 環境測試。

### Endpoint URL

```text
Developing
https://angsystem.github.io/HR/line-mini-app.html?miniapp_env=developing

Review
https://angsystem.github.io/HR/line-mini-app.html?miniapp_env=review

Published
https://angsystem.github.io/HR/line-mini-app.html?miniapp_env=published
```

## GAS 後端尚需新增

建議新增 action：

```text
verifyLineMiniAppIdToken
```

前端傳入：

```json
{
  "id_token": "LIFF 取得的 ID token",
  "environment": "developing | review | published",
  "device_id": "ANG HR 裝置識別碼"
}
```

後端流程：

1. 依環境選擇正確的 LINE MINI App Channel ID。
2. 從 GAS 後端呼叫 LINE `POST /oauth2/v2.1/verify`。
3. 驗證回傳 `aud` 等於該環境 Channel ID、`exp` 尚未過期。
4. 以驗證後的 `sub` 作為 LINE 穩定使用者識別，不信任前端自行傳來的 userId／profile。
5. 查 ANG HR 綁定資料：
   - 已綁定：直接登入並依身分導向。
   - 未綁定且從方案入口進入：建立帳號並續接所選方案。
   - 未綁定且從一般登入進入：顯示註冊／綁定流程。
6. 回傳 ANG HR 自己的短效登入 session，不直接把 LINE token 當 ANG HR session。

## ANG HR MINI App 第一階段範圍

- LINE 自動驗證／登入
- 員工與企業身分導向
- 手動打卡＋HTML5 定位確認
- 動態 QR Code 開啟 MINI App 後打卡
- 排班、請假、薪資、管理頁
- LINE 官方帳號 Rich Menu 單一入口

## NFC 注意事項

MINI App 本身是 Web App，不應把「直接讀取 NFC」當成所有 iPhone／Android 都一致支援的核心流程。
第一階段建議將 NFC 標籤寫成 LINE MINI App 永久連結：手機感應標籤後開啟該網址，再由後端驗證標籤代碼與一次性簽章。

## 台灣發布方式

可先使用未驗證 LINE MINI App 發布與測試。若要申請成為 Verified MINI App，台灣服務目前需由 Certified Provider 名下的 Channel 送審。

## 待填資料

- Developing LIFF ID
- Review LIFF ID
- Published LIFF ID
- MINI App Channel ID（三環境）
- 隱私權政策網址
- 服務條款網址
- 綁定的 LINE 官方帳號
