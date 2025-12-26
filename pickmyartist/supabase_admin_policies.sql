-- Run this SQL in the Supabase SQL Editor after the base schema.
-- It adds admin-ready profile fields and tightens RLS for the admin dashboard.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text default 'user',
  created_at timestamptz default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text default 'user';
alter table public.profiles add column if not exists created_at timestamptz default now();

alter table public.profiles enable row level security;

drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can update any profile" on public.profiles;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Public profiles are readable" on public.profiles;
drop policy if exists "Public can read public profiles" on public.profiles;
drop policy if exists "Public can read published profiles" on public.profiles;

create policy "Admins can read all profiles"
  on public.profiles
  for select
  using (
    exists (
      select 1
      from public.profiles as admin_profiles
      where admin_profiles.id = auth.uid()
        and admin_profiles.role = 'admin'
    )
  );

create policy "Users can read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

create policy "Admins can update any profile"
  on public.profiles
  for update
  using (
    exists (
      select 1
      from public.profiles as admin_profiles
      where admin_profiles.id = auth.uid()
        and admin_profiles.role = 'admin'
    )
  );
