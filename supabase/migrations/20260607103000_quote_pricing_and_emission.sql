-- Marquinhos CRM - precos de orcamento e personalizacao de emissao.
-- Execute no Supabase caso o schema inicial ja tenha sido rodado.

create table if not exists public.quote_price_items (
  id text primary key,
  name text not null,
  category text not null default 'outro' check (category in ('calha', 'rufo', 'pingadeira', 'esquadria', 'vidro', 'acessorio', 'instalacao', 'outro')),
  thickness text,
  cut text,
  color text,
  unit text not null default 'un',
  unit_price numeric(12,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quote_settings (
  id text primary key,
  company_name text not null default 'Marquinhos',
  document text not null default '',
  phone text,
  email text,
  header_text text not null default '',
  footer_text text not null default '',
  pix_key text,
  default_validity integer not null default 15,
  default_payment_conditions text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists quote_price_items_lookup_idx on public.quote_price_items(category, thickness, cut, color);
create index if not exists quote_price_items_active_idx on public.quote_price_items(active);

alter table public.quote_price_items enable row level security;
alter table public.quote_settings enable row level security;

drop policy if exists "service_role_all_quote_price_items" on public.quote_price_items;
create policy "service_role_all_quote_price_items"
  on public.quote_price_items
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "service_role_all_quote_settings" on public.quote_settings;
create policy "service_role_all_quote_settings"
  on public.quote_settings
  for all
  to service_role
  using (true)
  with check (true);

insert into public.quote_settings (
  id, company_name, document, phone, email, header_text, footer_text,
  pix_key, default_validity, default_payment_conditions, updated_at
)
values (
  'main',
  'Marquinhos',
  '00.000.000/0001-00',
  '(44) 99999-0000',
  'contato@marquinhos.com',
  'Orcamento profissional para fornecimento e instalacao.',
  'Agradecemos a preferencia. Valores sujeitos a conferencia tecnica.',
  null,
  15,
  '50% entrada + 50% na entrega',
  now()
)
on conflict (id) do nothing;
