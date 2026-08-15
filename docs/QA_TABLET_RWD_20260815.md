# ANG HR Web QA — Tablet RWD breakpoint

巡檢發現 `web-login-entry-fix.css` 的 Desktop Web breakpoint 使用 `min-width:768px`，會讓 iPad / Android 平板在常見寬度直接套用 Desktop 寬版工作區，與目前「平板屬於 Mobile Web」的產品規則衝突。

本次修正只調整 Web override：Desktop 寬版改為 `min-width:1100px` 且要求 `hover:hover`、`pointer:fine`。Touch-first 平板、LINE WebView、LIFF 維持 Mobile/Tablet App-style carousel。未修改 Flutter、驗證、權限與資料流程。
