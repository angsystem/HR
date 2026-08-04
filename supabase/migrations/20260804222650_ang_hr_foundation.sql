-- ANG HR Supabase foundation.
-- Supabase Auth (auth.users) is the sole identity authority.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  email text,
  phone text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_status_check
    check (status in ('active', 'inactive', 'suspended'))
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  company_code text not null,
  legal_name text not null,
  display_name text not null,
  status text not null default 'active',
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_company_code_key unique (company_code),
  constraint companies_company_code_not_blank_check
    check (btrim(company_code) <> ''),
  constraint companies_legal_name_not_blank_check
    check (btrim(legal_name) <> ''),
  constraint companies_display_name_not_blank_check
    check (btrim(display_name) <> ''),
  constraint companies_status_check
    check (status in ('active', 'inactive', 'suspended'))
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  membership_status text not null default 'active',
  joined_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memberships_company_id_user_id_key unique (company_id, user_id),
  constraint memberships_company_id_id_key unique (company_id, id),
  constraint memberships_status_check
    check (membership_status in ('invited', 'active', 'suspended', 'ended')),
  constraint memberships_dates_check
    check (ended_at is null or joined_at is null or ended_at >= joined_at)
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  employee_code text not null,
  display_name text not null,
  employment_status text not null default 'active',
  hired_at date,
  terminated_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employees_company_id_employee_code_key
    unique (company_id, employee_code),
  constraint employees_employee_code_not_blank_check
    check (btrim(employee_code) <> ''),
  constraint employees_display_name_not_blank_check
    check (btrim(display_name) <> ''),
  constraint employees_status_check
    check (employment_status in ('active', 'inactive', 'terminated')),
  constraint employees_dates_check
    check (terminated_at is null or hired_at is null or terminated_at >= hired_at)
);

create unique index employees_company_id_profile_id_key
  on public.employees (company_id, profile_id)
  where profile_id is not null;

create table public.membership_workspaces (
  company_id uuid not null,
  membership_id uuid not null,
  workspace_key text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint membership_workspaces_pkey
    primary key (membership_id, workspace_key),
  constraint membership_workspaces_company_membership_fkey
    foreign key (company_id, membership_id)
    references public.memberships (company_id, id)
    on delete cascade,
  constraint membership_workspaces_workspace_key_check
    check (workspace_key in ('employee', 'management', 'settings', 'platform'))
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete set null,
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  before_data jsonb,
  after_data jsonb,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_events_action_not_blank_check
    check (btrim(action) <> ''),
  constraint audit_events_resource_type_not_blank_check
    check (btrim(resource_type) <> ''),
  constraint audit_events_before_data_object_check
    check (before_data is null or jsonb_typeof(before_data) = 'object'),
  constraint audit_events_after_data_object_check
    check (after_data is null or jsonb_typeof(after_data) = 'object'),
  constraint audit_events_context_object_check
    check (jsonb_typeof(context) = 'object')
);

create table public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  idempotency_key text not null,
  request_scope text not null,
  response_digest text,
  status text not null default 'processing',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint idempotency_keys_company_scope_key_key
    unique (company_id, request_scope, idempotency_key),
  constraint idempotency_keys_key_not_blank_check
    check (btrim(idempotency_key) <> ''),
  constraint idempotency_keys_request_scope_not_blank_check
    check (btrim(request_scope) <> ''),
  constraint idempotency_keys_status_check
    check (status in ('processing', 'completed', 'failed', 'expired')),
  constraint idempotency_keys_expiry_check
    check (expires_at > created_at)
);

-- Foreign keys are not indexed automatically by PostgreSQL.
create index companies_created_by_idx
  on public.companies (created_by);
create index memberships_user_id_idx
  on public.memberships (user_id);
create index employees_profile_id_idx
  on public.employees (profile_id)
  where profile_id is not null;
create index membership_workspaces_company_id_idx
  on public.membership_workspaces (company_id);
create index audit_events_company_id_created_at_idx
  on public.audit_events (company_id, created_at desc);
create index audit_events_actor_user_id_idx
  on public.audit_events (actor_user_id);
create index audit_events_resource_idx
  on public.audit_events (resource_type, resource_id);
create index idempotency_keys_user_id_idx
  on public.idempotency_keys (user_id);
create index idempotency_keys_expires_at_idx
  on public.idempotency_keys (expires_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

create trigger memberships_set_updated_at
before update on public.memberships
for each row execute function public.set_updated_at();

create trigger employees_set_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

create trigger membership_workspaces_set_updated_at
before update on public.membership_workspaces
for each row execute function public.set_updated_at();

create trigger idempotency_keys_set_updated_at
before update on public.idempotency_keys
for each row execute function public.set_updated_at();

-- Safely projects a newly-created Supabase Auth identity into public.profiles.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    email,
    phone,
    status
  )
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', '')
    ),
    new.email,
    new.phone,
    'active'
  )
  on conflict (id) do update
    set display_name = coalesce(excluded.display_name, public.profiles.display_name),
        email = coalesce(excluded.email, public.profiles.email),
        phone = coalesce(excluded.phone, public.profiles.phone);

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Identity helpers. Only auth.uid() supplies caller identity; no user_id input is accepted.
create or replace function public.auth_user_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select auth.uid();
$$;

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships as membership
    where membership.company_id = $1
      and membership.user_id = auth.uid()
      and membership.membership_status = 'active'
  );
$$;

create or replace function public.current_employee_id(target_company_id uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select employee.id
  from public.employees as employee
  inner join public.memberships as membership
    on membership.company_id = employee.company_id
   and membership.user_id = auth.uid()
   and membership.membership_status = 'active'
  where employee.company_id = $1
    and employee.profile_id = auth.uid()
    and employee.employment_status = 'active'
  order by employee.created_at, employee.id
  limit 1;
$$;

create or replace function public.has_workspace(
  target_company_id uuid,
  workspace_key text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships as membership
    inner join public.membership_workspaces as workspace
      on workspace.company_id = membership.company_id
     and workspace.membership_id = membership.id
    where membership.company_id = $1
      and membership.user_id = auth.uid()
      and membership.membership_status = 'active'
      and workspace.workspace_key = $2
      and workspace.enabled
  );
$$;

revoke all on function public.auth_user_id() from public, anon, authenticated;
revoke all on function public.is_company_member(uuid) from public, anon, authenticated;
revoke all on function public.current_employee_id(uuid) from public, anon, authenticated;
revoke all on function public.has_workspace(uuid, text) from public, anon, authenticated;

grant execute on function public.auth_user_id() to authenticated;
grant execute on function public.is_company_member(uuid) to authenticated;
grant execute on function public.current_employee_id(uuid) to authenticated;
grant execute on function public.has_workspace(uuid, text) to authenticated;

-- Explicit table privileges complement RLS. Mutating tenant authority remains server-only.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.companies from anon, authenticated;
revoke all on table public.memberships from anon, authenticated;
revoke all on table public.employees from anon, authenticated;
revoke all on table public.membership_workspaces from anon, authenticated;
revoke all on table public.audit_events from anon, authenticated;
revoke all on table public.idempotency_keys from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name, email, phone, status) on table public.profiles to authenticated;
grant select on table public.companies to authenticated;
grant select on table public.memberships to authenticated;
grant select on table public.employees to authenticated;
grant select on table public.membership_workspaces to authenticated;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.memberships enable row level security;
alter table public.employees enable row level security;
alter table public.membership_workspaces enable row level security;
alter table public.audit_events enable row level security;
alter table public.idempotency_keys enable row level security;

alter table public.profiles force row level security;
alter table public.companies force row level security;
alter table public.memberships force row level security;
alter table public.employees force row level security;
alter table public.membership_workspaces force row level security;
alter table public.audit_events force row level security;
alter table public.idempotency_keys force row level security;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = (select public.auth_user_id()));

create policy profiles_update_own
on public.profiles
for update
to authenticated
using (id = (select public.auth_user_id()))
with check (id = (select public.auth_user_id()));

create policy companies_select_active_member
on public.companies
for select
to authenticated
using ((select public.is_company_member(id)));

create policy memberships_select_own
on public.memberships
for select
to authenticated
using (user_id = (select public.auth_user_id()));

create policy employees_select_self
on public.employees
for select
to authenticated
using (
  profile_id = (select public.auth_user_id())
  and (select public.is_company_member(company_id))
);

create policy membership_workspaces_select_own
on public.membership_workspaces
for select
to authenticated
using (
  exists (
    select 1
    from public.memberships as membership
    where membership.id = membership_workspaces.membership_id
      and membership.company_id = membership_workspaces.company_id
      and membership.user_id = (select public.auth_user_id())
  )
);

comment on table public.profiles is
  'Application profile projected from the sole identity authority, auth.users.';
comment on table public.companies is
  'Tenant root. Tenant-owned child tables carry company_id.';
comment on table public.audit_events is
  'Append-only audit sink reserved for trusted server-side writers.';
comment on table public.idempotency_keys is
  'Idempotency state reserved for trusted server-side functions.';
comment on function public.is_company_member(uuid) is
  'Checks active membership for auth.uid(); bypasses table RLS to prevent policy recursion.';
comment on function public.current_employee_id(uuid) is
  'Returns the active employee linked to auth.uid() in one company.';
comment on function public.has_workspace(uuid, text) is
  'Checks an enabled workspace for the active membership belonging to auth.uid().';
