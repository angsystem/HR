-- Local-only synthetic data. No production identity, credential, API key, or personal data.

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'company-a-user@example.invalid',
    crypt('local-only-a-not-a-real-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Company A Local User"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '20000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'company-b-user@example.invalid',
    crypt('local-only-b-not-a-real-password', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Company B Local User"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
on conflict (id) do nothing;

insert into public.companies (
  id,
  company_code,
  legal_name,
  display_name,
  status,
  created_by
)
values
  (
    'a0000000-0000-0000-0000-000000000001',
    'LOCAL-A',
    'Company A Local Test Ltd.',
    'Company A',
    'active',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'LOCAL-B',
    'Company B Local Test Ltd.',
    'Company B',
    'active',
    '20000000-0000-0000-0000-000000000002'
  )
on conflict (id) do nothing;

insert into public.memberships (
  id,
  company_id,
  user_id,
  membership_status,
  joined_at
)
values
  (
    'a1000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'active',
    now()
  ),
  (
    'b1000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    'active',
    now()
  )
on conflict (id) do nothing;

insert into public.employees (
  id,
  company_id,
  profile_id,
  employee_code,
  display_name,
  employment_status,
  hired_at
)
values
  (
    'a2000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'A-LOCAL-001',
    'Company A Local Employee',
    'active',
    current_date
  ),
  (
    'b2000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    'B-LOCAL-001',
    'Company B Local Employee',
    'active',
    current_date
  )
on conflict (id) do nothing;

insert into public.membership_workspaces (
  company_id,
  membership_id,
  workspace_key,
  enabled
)
values
  (
    'a0000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'employee',
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'b1000000-0000-0000-0000-000000000002',
    'employee',
    true
  )
on conflict (membership_id, workspace_key) do nothing;
