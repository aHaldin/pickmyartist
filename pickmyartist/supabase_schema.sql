create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  display_name text not null,
  slug text unique not null,
  city text,
  country text,
  genres text[] default '{}',
  price_from int,
  bio text,
  languages text[] default '{}',
  phone text,
  email_public text,
  instagram text,
  website text,
  youtube text,
  cover_url text,
  avatar_url text,
  avatar_path text,
  banner_path text,
  is_published boolean default false,
  is_featured boolean default false,
  has_pickmyset boolean default false
);

alter table public.profiles enable row level security;

create policy "Public profiles are readable"
  on public.profiles
  for select
  using (is_published = true);

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

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  artist_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  email text not null,
  message text not null,
  event_date date,
  event_location text,
  budget text,
  status text default 'new'
);

alter table public.enquiries enable row level security;

create policy "Public can insert enquiries"
  on public.enquiries
  for insert
  with check (true);

create policy "Artists can read own enquiries"
  on public.enquiries
  for select
  using (auth.uid() = artist_id);

create policy "Artists can update own enquiries"
  on public.enquiries
  for update
  using (auth.uid() = artist_id);
