ANG HR ONLINE v0.6.0 完整 GitHub Pages 前端包

上傳方式：
1. 解壓縮此 ZIP。
2. 將此資料夾內全部檔案直接放到 GitHub Repository 根目錄。
3. GitHub：Settings → Pages → Deploy from a branch → main → /(root)。
4. 主要入口為 index.html。

正式頁面：
- index.html：v0.6.0 最新入口
- employee.html：員工端
- admin.html：管理端
- creator.html：平台 Creator
- personal.html：Personal
- register.html：註冊與驗證
- app.html：WebView／App 共用殼層
- nfc_clock.html：NFC 打卡
- nfc_admin.html：NFC 管理

GAS：
- 前端共用 config.js 內同一個 GAS Web App URL。
- GAS 原始碼不包含在公開 GitHub Pages 包中，須另外部署。

請勿只上傳 index.html；assets、HTML、JS、CSS、圖片與影片都要一起上傳。
