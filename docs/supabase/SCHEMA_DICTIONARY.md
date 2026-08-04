# ANG HR Supabase Foundation Schema Dictionary

## 共通規則

- 主鍵與關聯 ID 使用 `uuid`。
- 時間點使用 `timestamptz`；聘僱日期使用 `date`。
- 所有可變 foundation tables 都有 `created_at`、`updated_at` 與自動更新 `updated_at` 的 trigger。
- `audit_events` 是 append-only event table，因此只有 `created_at`。
- `companies` 是租戶根；其餘 tenant-owned records 以 `company_id` 隔離。

## `profiles`

| 欄位 | 型別 | Null | Default / 說明 |
|---|---|---:|---|
| `id` | uuid | 否 | PK；FK → `auth.users.id`，刪除 Auth user 時 cascade |
| `display_name` | text | 是 | Auth metadata 初始投影，可由本人更新 |
| `email` | text | 是 | 識別資料，不是授權依據 |
| `phone` | text | 是 | 可選識別資料 |
| `status` | text | 否 | `active`；允許 `active/inactive/suspended` |
| `created_at` | timestamptz | 否 | `now()` |
| `updated_at` | timestamptz | 否 | `now()`；trigger 維護 |

## `companies`

| 欄位 | 型別 | Null | Default / 說明 |
|---|---|---:|---|
| `id` | uuid | 否 | PK；`gen_random_uuid()` |
| `company_code` | text | 否 | 全域 unique、不得空白 |
| `legal_name` | text | 否 | 不得空白 |
| `display_name` | text | 否 | 不得空白 |
| `status` | text | 否 | `active`；允許 `active/inactive/suspended` |
| `created_by` | uuid | 否 | FK → `auth.users.id`，刪除受 restrict |
| `created_at` | timestamptz | 否 | `now()` |
| `updated_at` | timestamptz | 否 | `now()`；trigger 維護 |

索引：`company_code` unique index、`created_by` index。

## `memberships`

| 欄位 | 型別 | Null | Default / 說明 |
|---|---|---:|---|
| `id` | uuid | 否 | PK；`gen_random_uuid()` |
| `company_id` | uuid | 否 | FK → `companies.id`，cascade |
| `user_id` | uuid | 否 | FK → `auth.users.id`，cascade |
| `membership_status` | text | 否 | `active`；允許 `invited/active/suspended/ended` |
| `joined_at` | timestamptz | 是 | 加入時間 |
| `ended_at` | timestamptz | 是 | 不得早於 `joined_at` |
| `created_at` | timestamptz | 否 | `now()` |
| `updated_at` | timestamptz | 否 | `now()`；trigger 維護 |

Constraints：`unique(company_id, user_id)`；另有 `unique(company_id, id)` 供跨租戶 composite FK 使用。索引：`user_id`。

## `employees`

| 欄位 | 型別 | Null | Default / 說明 |
|---|---|---:|---|
| `id` | uuid | 否 | PK；`gen_random_uuid()` |
| `company_id` | uuid | 否 | FK → `companies.id`，cascade |
| `profile_id` | uuid | 是 | FK → `profiles.id`；Auth 身份刪除時設為 null，支援未綁定帳號 |
| `employee_code` | text | 否 | 公司內 unique、不得空白 |
| `display_name` | text | 否 | 不得空白 |
| `employment_status` | text | 否 | `active`；允許 `active/inactive/terminated` |
| `hired_at` | date | 是 | 到職日期 |
| `terminated_at` | date | 是 | 不得早於 `hired_at` |
| `created_at` | timestamptz | 否 | `now()` |
| `updated_at` | timestamptz | 否 | `now()`；trigger 維護 |

Constraints：`unique(company_id, employee_code)`；非空 `profile_id` 另受 `unique(company_id, profile_id)` partial index 約束。索引：非空 `profile_id`。

## `membership_workspaces`

| 欄位 | 型別 | Null | Default / 說明 |
|---|---|---:|---|
| `company_id` | uuid | 否 | 與 `membership_id` 組成 composite FK，防止跨公司錯接 |
| `membership_id` | uuid | 否 | Composite PK 的第一部分 |
| `workspace_key` | text | 否 | Composite PK 的第二部分；限四個既定值 |
| `enabled` | boolean | 否 | `false` |
| `created_at` | timestamptz | 否 | `now()` |
| `updated_at` | timestamptz | 否 | `now()`；trigger 維護 |

Primary key：`(membership_id, workspace_key)`。Composite FK：`(company_id, membership_id)` → `memberships(company_id, id)`，cascade。索引：`company_id`。

## `audit_events`

| 欄位 | 型別 | Null | Default / 說明 |
|---|---|---:|---|
| `id` | uuid | 否 | PK；`gen_random_uuid()` |
| `company_id` | uuid | 是 | FK → `companies.id`；平台級事件可為空，刪除公司時設為 null |
| `actor_user_id` | uuid | 是 | FK → `auth.users.id`，刪除時設為 null |
| `action` | text | 否 | 不得空白 |
| `resource_type` | text | 否 | 不得空白 |
| `resource_id` | uuid | 是 | 被稽核資源 ID |
| `before_data` | jsonb | 是 | 若存在必須是 object |
| `after_data` | jsonb | 是 | 若存在必須是 object |
| `context` | jsonb | 否 | `{}`；必須是 object |
| `created_at` | timestamptz | 否 | `now()` |

索引：`(company_id, created_at desc)`、`actor_user_id`、`(resource_type, resource_id)`。

## `idempotency_keys`

| 欄位 | 型別 | Null | Default / 說明 |
|---|---|---:|---|
| `id` | uuid | 否 | PK；`gen_random_uuid()` |
| `company_id` | uuid | 否 | FK → `companies.id`，cascade |
| `user_id` | uuid | 否 | FK → `auth.users.id`，cascade |
| `idempotency_key` | text | 否 | 不得空白 |
| `request_scope` | text | 否 | 不得空白 |
| `response_digest` | text | 是 | 完成後可保存摘要 |
| `status` | text | 否 | `processing`；允許 `processing/completed/failed/expired` |
| `expires_at` | timestamptz | 否 | 必須晚於 `created_at` |
| `created_at` | timestamptz | 否 | `now()` |
| `updated_at` | timestamptz | 否 | `now()`；trigger 維護 |

Constraints：`unique(company_id, request_scope, idempotency_key)`。索引：`user_id`、`expires_at`。
