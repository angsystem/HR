# ANG HR Supabase Foundation RLS Policy Matrix — Actual

## App role matrix

`service_role` 與資料庫管理者是未來可信任 server-side 路徑；本表描述 `anon` 與 `authenticated` App 呼叫。

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | 本人；`profiles_select_own` | 禁止 | 本人且只授權 `display_name/email/phone/status`；`profiles_update_own` | 禁止 |
| `companies` | 有效會員可讀；`companies_select_active_member` | 禁止 | 禁止 | 禁止 |
| `memberships` | 只讀自己的 membership；`memberships_select_own` | 禁止 | 禁止 | 禁止 |
| `employees` | 有效會員只讀 `profile_id = auth.uid()` 的本人 employee；`employees_select_self` | 禁止 | 禁止 | 禁止 |
| `membership_workspaces` | 只讀自己 membership 的 workspace；`membership_workspaces_select_own` | 禁止 | 禁止 | 禁止 |
| `audit_events` | 未開放 | 未開放 | 未開放 | 未開放 |
| `idempotency_keys` | 未開放 | 未開放 | 未開放 | 未開放 |

補充：

- `anon` 沒有任何 foundation table privilege。
- `profiles.id` 沒有授予 authenticated UPDATE column privilege，並受 policy `WITH CHECK` 雙重保護。
- Companies 的建立與刪除保留給後續可信任 Edge Function；本階段沒有 Edge Function。
- Membership 與 workspace 沒有 App mutation privilege，因此使用者不能自行提高權限或開啟 workspace。
- Audit 與 idempotency tables 雖已建立並啟用/強制 RLS，但沒有一般 App policy 或 table privilege。

## Helper functions

| Function | Security | Identity source | 用途 |
|---|---|---|---|
| `auth_user_id()` | STABLE、固定 `search_path` | `auth.uid()` | 統一取得目前 Supabase Auth user UUID |
| `is_company_member(target_company_id)` | STABLE、SECURITY DEFINER、固定 `search_path` | `auth.uid()` | 檢查 caller 是否為該公司有效會員 |
| `current_employee_id(target_company_id)` | STABLE、SECURITY DEFINER、固定 `search_path` | `auth.uid()` | 取得 caller 在公司內綁定且有效的 employee UUID |
| `has_workspace(target_company_id, workspace_key)` | STABLE、SECURITY DEFINER、固定 `search_path` | `auth.uid()` | 檢查 caller 的有效 membership 是否啟用指定 workspace |

三個查表 helper 由 migration owner 執行底層查詢，避免 policy 查詢再次進入同一組 RLS。所有 function 都撤銷 PUBLIC execute，只授權 `authenticated`；沒有任何 helper 接受 user ID 作為身份參數。
