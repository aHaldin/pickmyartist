-- Run this SQL in Supabase SQL Editor.
alter table public.profiles enable row level security;

create policy "Users can select own profile"
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

-- Run this SQL in Supabase SQL Editor.
-- Public can read profiles by slug when a public email is present.
create policy "Public can read public profiles"
  on public.profiles
  for select
  using (email_public is not null);

-- Run this SQL in Supabase SQL Editor.
-- Public can read published profiles (for the directory + homepage).
create policy "Public can read published profiles"
  on public.profiles
  for select
  using (is_published = true);
