# ANG HR Supabase Foundation Negative Test Report

執行日期：2026-08-05
測試檔：`supabase/tests/database/ang_hr_foundation_rls.test.sql`

## 最終結果

```text
Files=1, Tests=21
Result: PASS
```

測試包在 transaction 中執行，最後 rollback；它使用本機 seed 的兩個合成身份與 Company A / Company B，不依賴正式資料。

## 已通過 assertions

1. Auth trigger 為兩個 seed users 各建立一筆 profile。
2. Profile 以 `auth.users.id` 唯一，不產生重複投影。
3. Company A user 可以讀 Company A。
4. Company A user 不能讀 Company B。
5. Company A user 不能讀 Company B employees。
6. 使用者不能讀另一個人的 membership。
7. 使用者只能讀自己的 membership。
8. 使用者只能看到自己已啟用的 employee workspace。
9. `has_workspace` 對 employee 回傳 true。
10. `has_workspace` 對未配置的 management 回傳 false。
11. 使用者不能新增並啟用 settings workspace。
12. 使用者不能啟用 management、settings 或 platform workspace。
13. 更新他人 profile 影響零筆。
14. 本人可更新允許的 profile 欄位。
15. Authenticated role 沒有 `profiles.id` 的 UPDATE privilege。
16. App 使用者直接 INSERT `audit_events` 得到 `42501 permission denied`。
17. App 使用者沒有 audit UPDATE 或 DELETE privilege。
18. Flutter-facing authenticated role 對 `idempotency_keys` 沒有任意 CRUD privilege。
19. Authenticated role 不能直接 INSERT 或 DELETE companies。
20. Anonymous role 讀取 companies 得到 `42501 permission denied`。
21. Anonymous role 讀取 employees 得到 `42501 permission denied`。

## 驗證命令

```powershell
npx supabase db reset
npx supabase test db
npx supabase db lint
npx supabase migration list --local
```

最終輸出：migration/seed 可從空資料庫建立；pgTAP 全數通過；database lint 無錯誤。
