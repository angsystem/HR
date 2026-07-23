ANG HR GAS｜Google／LINE OAuth「未知 action」修正版
=======================================================

已修正
1. requestGoogleAuth、requestLineAuth、oauthCallback 接上 Auth.js。
2. 瀏覽器 GET 開啟 OAuth 時，GAS 會直接轉到 Google／LINE，不再顯示 auth_url JSON。
3. handleApi_ 會先交給 angHandleApiAction_，Company.js actions 也一併接回。
4. Android Deep Link 的 verifyAuthToken(code) 優先由 deep-link patch 驗證。
5. 前端網址全面改為：
   https://angsystem.github.io/HR/
6. 保留既有 v0.6.0、公司、Creator 與其他後端程式，不清空資料。

部署
A. 使用 Apps Script 網頁編輯器
- 用本包同名檔案覆蓋專案內檔案。
- 不要建立「程式碼(29).js」或「Auth(1).js」；檔名請維持本包乾淨名稱。

B. 使用 clasp
- 在本資料夾開 PowerShell：
  npx @google/clasp login
  npx @google/clasp push

部署後一定要做
1. 在 Apps Script 編輯器手動執行一次：
   angSetupDeepLinkPropertiesRun
2. 再執行：
   angCheckOAuthPropertiesRun
   結果 Google／LINE 四個 *_set 都應為 true。
3. 部署 → 管理部署作業 → 編輯 → 版本選「新版本」→ 部署。
   只儲存程式碼不會更新線上 /exec。

測試
- GAS_EXEC?action=requestGoogleAuth&flow=admin_login
  應直接進 Google 選帳號畫面。
- GAS_EXEC?action=requestLineAuth&flow=admin_login
  應直接進 LINE 授權畫面。
- 不應再出現：
  未知 action：requestGoogleAuth
  未知 action：requestLineAuth

Script Properties 必要項目
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- LINE_CHANNEL_ID
- LINE_CHANNEL_SECRET
- MASTER_SPREADSHEET_ID
- ANG_ENTRY_INDEX_URL = https://angsystem.github.io/HR/index.html
- ANDROID_DEEP_LINK_URL = anghr://oauth-success

請勿把 GOOGLE_CLIENT_SECRET 或 LINE_CHANNEL_SECRET 傳到聊天、GitHub 或前端 config.js。
