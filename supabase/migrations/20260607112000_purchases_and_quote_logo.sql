-- Marquinhos CRM - modulo de compras e logo no orcamento.
-- Execute no Supabase caso o schema inicial ja tenha sido rodado.

alter table public.app_users drop constraint if exists app_users_role_check;
alter table public.app_users
  add constraint app_users_role_check
  check (role in ('admin', 'gerente', 'vendedor', 'secretaria', 'compras', 'producao', 'instalador'));

alter table public.quote_settings
  add column if not exists logo_url text;

create table if not exists public.purchases (
  id text primary key,
  lead_id text,
  lead_name text not null default '',
  supplier text not null,
  item_name text not null,
  quantity numeric(12,2) not null default 0,
  unit text not null default 'un',
  unit_cost numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment_method text not null default 'outro' check (payment_method in ('pix', 'boleto', 'cartao', 'dinheiro', 'transferencia', 'outro')),
  purchased_by text not null,
  purchased_at timestamptz not null default now(),
  expected_at timestamptz,
  received_at timestamptz,
  status text not null default 'comprado' check (status in ('comprado', 'recebido', 'cancelado')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists purchases_status_idx on public.purchases(status);
create index if not exists purchases_lead_idx on public.purchases(lead_id);
create index if not exists purchases_purchased_at_idx on public.purchases(purchased_at desc);

alter table public.purchases enable row level security;

drop policy if exists "service_role_all_purchases" on public.purchases;
create policy "service_role_all_purchases"
  on public.purchases
  for all
  to service_role
  using (true)
  with check (true);
