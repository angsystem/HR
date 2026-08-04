# ANG HR Supabase Foundation — Actual

更新日期：2026-08-05
工作分支：`codex/supabase-foundation`

## 結論

本階段已建立可由空資料庫重建的本機 Supabase foundation。`auth.users` 是唯一身份權威，`public.profiles` 只是 Auth 身份的應用層投影。專案未導入 Logto，未連結或推送遠端 Supabase project，也未修改 Flutter。

唯一 migration：

- `20260804222650_ang_hr_foundation.sql`

本機 seed：

- `Company A` 與 `Company B`
- 各一個 `.invalid` 測試身份、membership 與 employee
- 各自只有啟用的 `employee` workspace
- 所有名稱、UUID、Email 與密碼均為合成的本機測試值

## 架構邊界

- 全域身份：`auth.users`
- 全域身份投影：`public.profiles`
- 租戶根：`public.companies`
- 帶 `company_id` 的租戶資料：`memberships`、`employees`、`membership_workspaces`、`audit_events`（平台事件可為空）、`idempotency_keys`
- workspace 僅接受：`employee`、`management`、`settings`、`platform`
- 權限沒有被壓成單一 role 欄位；membership 狀態與 workspace entitlement 分開保存
- Governance、Grade、Position、Capability、Scope 均未放入 memberships

## Auth profile 同步

`auth.users` 的 `AFTER INSERT` trigger 會呼叫 `public.handle_new_auth_user()`：

1. 以 `auth.users.id` 寫入 `public.profiles.id`。
2. 只投影 display name、Email 與 phone，不儲存明文或雜湊密碼。
3. 使用 `ON CONFLICT (id) DO UPDATE`，重複執行不會建立第二筆 profile。
4. 函式為 `SECURITY DEFINER`，並固定 `search_path = ''`。

## 安全實作

- 七張 public tables 全部啟用並強制 RLS。
- `anon` 沒有 foundation table 權限。
- `authenticated` 只有必要的 SELECT，以及 profile 非 ID 欄位的 UPDATE。
- `audit_events` 與 `idempotency_keys` 沒有提供 App 使用者直接權限。
- 複雜 membership/workspace helper 使用固定 search path 的 `SECURITY DEFINER`，從底層表查詢，避免 RLS policy 互相遞迴。
- 所有身份判斷只使用 `auth.uid()`，helper 不接受前端提供的 user ID。
- 外鍵欄位與 RLS 常用路徑均建立索引。

## 本機驗證

| 命令 | 結果 |
|---|---|
| `npx supabase db reset` | PASS；由空資料庫套用 migration、seed，並重啟容器 |
| `npx supabase test db` | PASS；1 個檔案、21 個 pgTAP assertions |
| `npx supabase db lint` | PASS；`public` 與 `extensions` 無 schema errors |
| `npx supabase migration list` | 未執行遠端連結；CLI 因沒有 project ref 正常拒絕 |
| `npx supabase migration list --local` | PASS；本機版本 `20260804222650` 已套用 |

未執行：

- `supabase link`
- `supabase db push`
- 任何遠端正式環境部署

## 明確未建立

- 計薪、排班、打卡、招募與面試資料模型
- 完整組織樹與 Assignment 模型
- 買斷模組
- Support Access Grant
- Capability/Scope 實體與假資料
- Edge Functions
- Flutter Repository、UI、登入畫面、主題、動畫、Deep Link 或原生打卡修改
