# ANG HR Web RWD handoff

2026-08-20：Desktop Web workspace topbar density 巡檢修正。

- 共用 `web-rwd-tablet-guard-20260816.css` 在真正 Desktop breakpoint（>=1100px + hover + fine pointer）統一 `.topbar .brand-logo` 為 48×48px。
- 原因：Employee 仍使用 72×72px mobile-first logo，而 Admin 已為 48×48px，造成 Desktop sticky header 高度與資訊密度不一致。
- 僅改共用 RWD 視覺層，不動登入、LINE/LIFF、Employee/Admin/Owner 權限、資料流程或 Flutter 基線。
