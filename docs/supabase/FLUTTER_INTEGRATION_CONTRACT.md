# ANG HR Flutter ↔ Supabase Foundation Integration Contract

本文件只固定 Phase 0 與 Supabase foundation 的共同識別欄位。它不建立 Flutter repository，也不提前建立 Capability/Scope 模型。

## 唯一身份權威

- Flutter 身份 session 只能來自 Supabase Auth。
- `auth.users.id` 是唯一 user identity；`profiles.id` 與它一對一相同。
- Flutter 不得提交 `user_id` 來主張身份；資料庫授權只相信 JWT 對應的 `auth.uid()`。
- Flutter App 不得持有 `service_role` key。
- 本契約沒有 Logto subject、token、repository 或 SDK。

## 固定共同 ID

| Key | Transport type | 本階段來源與語意 |
|---|---|---|
| `auth_user_id` | UUID string | Supabase Auth session `user.id`；亦可由 DB helper `auth_user_id()` 取得 |
| `company_id` | UUID string | `companies.id`；目前使用者必須有有效 membership |
| `membership_id` | UUID string | `memberships.id`；RLS 只回傳目前使用者自己的 membership |
| `employee_id` | UUID string or null | `employees.id`；尚未綁定登入帳號時可不存在 |
| `workspace_key` | string | 僅允許 `employee`、`management`、`settings`、`platform` |
| `capability_key` | string | 保留契約名稱；本階段沒有 table、RLS、seed 或假 capability |
| `scope_type` | string | 保留契約名稱；本階段沒有 table、RLS、seed 或假 scope |
| `scope_id` | UUID string or null | 保留契約名稱；本階段不建立 scope resource 關聯 |

欄位名稱大小寫固定為 snake_case。UUID 在 Flutter/API payload 中使用標準小寫含連字號字串，在 PostgreSQL 中使用原生 `uuid`。

## Foundation bootstrap 讀取契約

登入成功後，Flutter 可在 RLS 保護下：

1. 以 Auth session 的 user ID 讀取自己的 `profiles`。
2. 讀取自己的 `memberships`；不可假設永遠只有一家公司。
3. 依 membership 的 `company_id` 讀取可見 `companies`。
4. 讀取與本人 profile 綁定的 `employees`；零筆代表尚未綁定 employee。
5. 讀取自己的 `membership_workspaces`，只把 `enabled = true` 視為可進入 workspace。

Flutter 不可直接：

- 建立或刪除 company。
- 修改 membership 或 workspace entitlement。
- 寫入 audit event。
- 存取 idempotency key。

## 錯誤與空結果語意

- RLS 隱藏其他租戶或其他使用者資料時，SELECT 會得到空結果，不代表資料不存在。
- 未授權 table operation 會得到 PostgreSQL/PostgREST permission error；Flutter 不應重試成更高權限操作。
- `current_employee_id(company_id)` 可回傳 null，Flutter 必須支援未綁定員工身份。
- `has_workspace(company_id, workspace_key)` 只代表目前 caller 的 entitlement，不接受 user ID。

## 待 Flutter Phase 0 確認

- 多公司 membership 的公司選擇與持久化方式。
- `employee_id = null` 時的畫面與導引狀態。
- `display_name`、`email`、`phone` 的 null 顯示策略。
- status 值在 Dart 的 enum/unknown fallback 策略。
- `timestamptz` 使用 UTC ISO-8601、`date` 使用 `YYYY-MM-DD` 的序列化規則。
- `capability_key`、`scope_type`、`scope_id` 在後續 Capability/Scope Phase 啟用前必須保持未使用，不得用本機假模型填補。
