create table if not exists payment_numbers (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('bkash','nagad','rocket','upay')),
  number text not null,
  kind text not null default 'Payment',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  customer_name text,
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending','paid')),
  method text,
  submitted_trx text,
  paid_trx text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  event_id text unique,
  idempotency_key text unique,
  provider text not null,
  trx_id text not null,
  amount numeric(12,2) not null,
  sim_slot int,
  invoice_id uuid references invoices(id),
  raw jsonb,
  created_at timestamptz not null default now()
);

alter table payment_numbers enable row level security;
alter table invoices enable row level security;
alter table payments enable row level security;
-- No policies on purpose: only the server (service role key) touches these tables.

create or replace function try_match(p_invoice uuid) returns boolean
language plpgsql as $$
declare inv invoices; pay payments;
begin
  select * into inv from invoices where id = p_invoice and status = 'pending' for update;
  if not found or inv.submitted_trx is null then return false; end if;
  select * into pay from payments
   where upper(trx_id) = upper(inv.submitted_trx)
     and invoice_id is null
     and amount = inv.amount
     and (inv.method is null or provider = inv.method)
   for update;
  if not found then return false; end if;
  update payments set invoice_id = inv.id where id = pay.id;
  update invoices set status = 'paid', paid_trx = pay.trx_id, paid_at = now() where id = inv.id;
  return true;
end $$;
