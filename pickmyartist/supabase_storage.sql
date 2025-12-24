-- Run this SQL in Supabase SQL Editor (MVP: public bucket).
insert into storage.buckets (id, name, public)
values ('profiles', 'profiles', true)
on conflict (id) do nothing;
