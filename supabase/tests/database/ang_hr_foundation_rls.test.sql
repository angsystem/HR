begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(21);

-- The local seed uses two synthetic Auth users and two isolated companies.
select results_eq(
  $$
    select count(*)::bigint
    from public.profiles
    where id in (
      '10000000-0000-0000-0000-000000000001'::uuid,
      '20000000-0000-0000-0000-000000000002'::uuid
    )
  $$,
  $$ values (2::bigint) $$,
  'Auth insert trigger created exactly one profile for each seeded user'
);

select is(
  (
    select count(*)
    from public.profiles
    where id = '10000000-0000-0000-0000-000000000001'
  ),
  1::bigint,
  'Auth profile projection is unique by auth.users.id'
);

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
set local request.jwt.claim.role = 'authenticated';

select results_eq(
  $$
    select count(*)::bigint
    from public.companies
    where id = 'a0000000-0000-0000-0000-000000000001'
  $$,
  $$ values (1::bigint) $$,
  'Company A user can read Company A'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.companies
    where id = 'b0000000-0000-0000-0000-000000000002'
  $$,
  $$ values (0::bigint) $$,
  'Company A user cannot read Company B'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.employees
    where company_id = 'b0000000-0000-0000-0000-000000000002'
  $$,
  $$ values (0::bigint) $$,
  'Company A user cannot read Company B employees'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.memberships
    where user_id = '20000000-0000-0000-0000-000000000002'
  $$,
  $$ values (0::bigint) $$,
  'A user cannot read another user membership'
);

select results_eq(
  $$
    select id
    from public.memberships
  $$,
  $$ values ('a1000000-0000-0000-0000-000000000001'::uuid) $$,
  'A user can read only their own membership'
);

select results_eq(
  $$
    select workspace_key
    from public.membership_workspaces
    where enabled
    order by workspace_key
  $$,
  $$ values ('employee'::text) $$,
  'A user can read only their own enabled employee workspace'
);

select is(
  public.has_workspace(
    'a0000000-0000-0000-0000-000000000001',
    'employee'
  ),
  true,
  'has_workspace recognizes the caller employee workspace'
);

select is(
  public.has_workspace(
    'a0000000-0000-0000-0000-000000000001',
    'management'
  ),
  false,
  'has_workspace denies an unassigned management workspace'
);

select throws_ok(
  $$
    insert into public.membership_workspaces (
      company_id,
      membership_id,
      workspace_key,
      enabled
    )
    values (
      'a0000000-0000-0000-0000-000000000001',
      'a1000000-0000-0000-0000-000000000001',
      'settings',
      true
    )
  $$,
  '42501',
  'permission denied for table membership_workspaces',
  'A user cannot add or enable their own settings workspace'
);

select throws_ok(
  $$
    update public.membership_workspaces
    set enabled = true
    where membership_id = 'a1000000-0000-0000-0000-000000000001'
      and workspace_key in ('management', 'settings', 'platform')
  $$,
  '42501',
  'permission denied for table membership_workspaces',
  'A user cannot enable management settings or platform workspaces'
);

select results_eq(
  $$
    with changed as (
      update public.profiles
      set display_name = 'Unauthorized Change'
      where id = '20000000-0000-0000-0000-000000000002'
      returning id
    )
    select count(*)::bigint from changed
  $$,
  $$ values (0::bigint) $$,
  'A user cannot update another user profile'
);

select results_eq(
  $$
    with changed as (
      update public.profiles
      set display_name = 'Company A Local User Updated'
      where id = '10000000-0000-0000-0000-000000000001'
      returning id
    )
    select count(*)::bigint from changed
  $$,
  $$ values (1::bigint) $$,
  'A user can update their own non-identity profile fields'
);

select ok(
  not has_column_privilege(
    'authenticated',
    'public.profiles',
    'id',
    'update'
  ),
  'Authenticated users cannot update profiles.id'
);

select throws_ok(
  $$
    insert into public.audit_events (
      company_id,
      actor_user_id,
      action,
      resource_type,
      resource_id
    )
    values (
      'a0000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      'unauthorized.insert',
      'test',
      gen_random_uuid()
    )
  $$,
  '42501',
  'permission denied for table audit_events',
  'An app user cannot write directly to audit_events'
);

select ok(
  not has_table_privilege('authenticated', 'public.audit_events', 'update')
  and not has_table_privilege('authenticated', 'public.audit_events', 'delete'),
  'App users cannot update or delete audit events'
);

select ok(
  not has_table_privilege('authenticated', 'public.idempotency_keys', 'select')
  and not has_table_privilege('authenticated', 'public.idempotency_keys', 'insert')
  and not has_table_privilege('authenticated', 'public.idempotency_keys', 'update')
  and not has_table_privilege('authenticated', 'public.idempotency_keys', 'delete'),
  'Flutter-facing authenticated users have no idempotency_keys privileges'
);

select ok(
  not has_table_privilege('authenticated', 'public.companies', 'insert')
  and not has_table_privilege('authenticated', 'public.companies', 'delete'),
  'Authenticated users cannot create or delete companies directly'
);

reset role;
set local role anon;
set local request.jwt.claim.sub = '';
set local request.jwt.claim.role = 'anon';

select throws_ok(
  $$ select count(*) from public.companies $$,
  '42501',
  'permission denied for table companies',
  'Anonymous users cannot read tenant-owned company data'
);

select throws_ok(
  $$ select count(*) from public.employees $$,
  '42501',
  'permission denied for table employees',
  'Anonymous users cannot read tenant-owned employee data'
);

reset role;

select * from finish();
rollback;
