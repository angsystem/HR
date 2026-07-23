ANG HR｜Index 卡片規則修正版｜2026-07-22

本包包含：
1. index-card-rules.js：卡片手勢、方案來源判斷、一般登入查無帳號提示。
2. index-card-rules.css：方案雙色登入卡、深綠驗證成功、紅色查無帳號狀態。
3. index.html：載入上述兩個補丁檔，並更新 Service Worker 版本。
4. sw.js：加入新補丁檔至 PWA 快取，避免手機仍顯示舊版。
5. 套用並推送.bat：放在 angsystem/HR 儲存庫根目錄後執行，可提交這四個檔案到 main。

已實作規則：
- 驗證前只鎖登入卡向上展開，不鎖左右滑動。
- 展開卡左右滑未達半頁，回原卡並保持展開。
- 展開卡左右滑超過半頁，自動收回並沿原方向切卡。
- 從方案卡到登入卡，改為方案金屬色＋大卡主色各半。
- Premium＝金＋深紫；Pro＝銀＋桃紅；Basic＝銅＋藍。
- 從方案卡查無帳號，改走註冊所選方案，不顯示紅色。
- 一般登入查無帳號，顯示紅色與「再試一次／查看方案」。
- 查看方案會先收回登入卡，再平順向右滑至方案卡。

GitHub 寫入狀態：
ChatGPT GitHub App 對 angsystem/HR 回傳 403 Resource not accessible by integration，
因此本次無法由連線直接寫入儲存庫；檔案本身已完成並通過 node --check 語法檢查。
