# ANG HR Web 品質巡檢｜2026-08-17

## Desktop Web
- 發現：登入後 Employee／Admin 工作區在大型桌面螢幕仍可拉到整個 viewport 寬度，卡片與表格過寬，資訊密度不佳。
- 修正：僅在 >=1100px + hover:hover + pointer:fine 的真正 Desktop 條件下，將 `.safe` 工作區上限設為 1440px 並置中；Desktop 雙欄 gap 由 12px 調整為 16px。
- 未修改：Admin 放射式 FAB 與 Employee／Admin／Owner 共用導航屬較大架構工作，本輪不以 CSS 假裝完成。

## Mobile Web
- 本輪沒有修改 Mobile／Tablet 規則；原有 touch-first breakpoint、Safe Area 與 context switcher 避讓維持不變。
- 未碰登入驗證、權限、資料流程、LINE／LIFF 或 Flutter 基線。
