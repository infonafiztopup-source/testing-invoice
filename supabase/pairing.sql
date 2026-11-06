-- Run once in Supabase SQL editor (adds per-pairing app secrets)
create table if not exists pairing_keys (
  id uuid primary key default gen_random_uuid(),
  key_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  verified_at timestamptz,
  revoked boolean not null default false
);
alter table pairing_keys enable row level security;
