-- ============================================================
-- Marquinhos CRM - Schema completo
-- Execute no SQL Editor do Supabase
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- TABELAS
-- ============================================================

create table if not exists public.app_users (
  id text primary key,
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'gerente', 'vendedor', 'secretaria', 'compras', 'producao', 'instalador')),
  password_hash text not null,
  avatar text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id text primary key,
  name text not null,
  phone text not null,
  email text,
  address text not null default '',
  neighborhood text not null default '',
  city text not null default 'Maringa',
  state text not null default 'PR',
  zip_code text,
  origin text not null check (origin in ('whatsapp', 'instagram', 'telefone', 'indicacao', 'site', 'outro')),
  service text not null default 'A definir',
  status text not null default 'novo' check (status in ('novo', 'primeiro_atendimento', 'qualificado', 'aguardando_medidas', 'aguardando_info', 'visita_agendada', 'visita_realizada', 'orcamento_enviado', 'negociacao', 'fechado', 'producao', 'instalacao', 'pos_venda', 'finalizado', 'perdido')),
  urgency text not null default 'media' check (urgency in ('baixa', 'media', 'alta', 'urgente')),
  availability text,
  observations text,
  ai_summary text,
  assigned_to text,
  potential_value numeric(12,2) not null default 0,
  last_interaction_at timestamptz,
  attachments jsonb not null default '[]'::jsonb,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.visits (
  id text primary key,
  lead_id text,
  lead_name text not null,
  phone text not null default '',
  address text not null default '',
  service text not null default '',
  visit_date date not null,
  visit_time text not null,
  observations text,
  assigned_to text,
  status text not null default 'agendada' check (status in ('agendada', 'realizada', 'cancelada', 'reagendada')),
  photos jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.measurement_sheets (
  id text primary key,
  visit_id text,
  lead_id text,
  lead_name text not null,
  service text not null default '',
  lines jsonb not null default '[]'::jsonb,
  general_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id text primary key,
  lead_id text,
  lead_name text not null,
  quote_type text default 'calhas' check (quote_type in ('calhas', 'esquadrias')),
  items jsonb not null default '[]'::jsonb,
  labor_cost numeric(12,2) not null default 0,
  travel_cost numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  discount_type text not null default 'fixed' check (discount_type in ('percentage', 'fixed')),
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  validity integer not null default 15,
  payment_conditions text not null default '',
  observations text,
  status text not null default 'draft' check (status in ('draft', 'sent', 'approved', 'rejected', 'expired')),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  logo_url text,
  phone text,
  email text,
  header_text text not null default '',
  footer_text text not null default '',
  pix_key text,
  accent_color text not null default '#b91c1c',
  secondary_color text not null default '#111827',
  font_family text not null default 'Arial',
  layout_style text not null default 'moderno' check (layout_style in ('classico', 'moderno', 'compacto')),
  watermark_text text,
  show_qr_code boolean not null default true,
  show_signature boolean not null default true,
  default_validity integer not null default 15,
  default_payment_conditions text not null default '',
  updated_at timestamptz not null default now()
);

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

create table if not exists public.productions (
  id text primary key,
  budget_id text,
  lead_id text,
  lead_name text not null,
  items jsonb not null default '[]'::jsonb,
  current_stage text not null default 'corte' check (current_stage in ('corte', 'montagem', 'vidro', 'pintura', 'embalagem', 'finalizado')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  start_date date not null default current_date,
  estimated_end date,
  assigned_team jsonb not null default '[]'::jsonb,
  notes text,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.installations (
  id text primary key,
  production_id text,
  lead_id text,
  lead_name text not null,
  address text not null default '',
  installation_date date not null,
  installation_time text not null,
  team jsonb not null default '[]'::jsonb,
  items jsonb not null default '[]'::jsonb,
  checklist jsonb not null default '[]'::jsonb,
  photos_before jsonb not null default '[]'::jsonb,
  photos_after jsonb not null default '[]'::jsonb,
  signature text,
  status text not null default 'agendada' check (status in ('agendada', 'em_andamento', 'concluida', 'problema')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.knowledge_items (
  id text primary key,
  category text not null check (category in ('linhas', 'vidros', 'calhas', 'ferragens', 'outros')),
  name text not null,
  description text not null,
  specifications text,
  price_range text,
  images jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id text primary key,
  customer_name text not null,
  customer_document text not null,
  customer_email text not null,
  plan text not null check (plan in ('starter', 'professional', 'enterprise')),
  status text not null check (status in ('trial', 'active', 'overdue', 'blocked', 'canceled')),
  amount numeric(12,2) not null default 0,
  billing_cycle text not null check (billing_cycle in ('monthly', 'quarterly', 'annual')),
  max_users integer not null default 1,
  due_day integer not null default 10 check (due_day between 1 and 31),
  next_due_date date not null,
  last_payment_at timestamptz,
  payment_method text not null check (payment_method in ('pix', 'boleto', 'credit_card', 'manual')),
  invoice_url text,
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id text primary key,
  type text not null check (type in ('info', 'success', 'warning', 'error')),
  title text not null,
  message text not null,
  read boolean not null default false,
  action_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_inbox (
  id text primary key,
  sender_phone text not null,
  contact_name text not null default '',
  text text not null,
  message_type text not null default 'text',
  timestamp timestamptz not null default now(),
  status text not null default 'received' check (status in ('received', 'read', 'answered')),
  analysis jsonb,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabela principal de armazenamento do CRM (coleção genérica)
-- ============================================================
-- ÍNDICES
-- ============================================================

create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_origin_idx on public.leads(origin);
create index if not exists visits_date_idx on public.visits(visit_date);
create index if not exists budgets_status_idx on public.budgets(status);
create index if not exists quote_price_items_lookup_idx on public.quote_price_items(category, thickness, cut, color);
create index if not exists quote_price_items_active_idx on public.quote_price_items(active);
create index if not exists purchases_status_idx on public.purchases(status);
create index if not exists purchases_lead_idx on public.purchases(lead_id);
create index if not exists purchases_purchased_at_idx on public.purchases(purchased_at desc);
create index if not exists productions_stage_idx on public.productions(current_stage);
create index if not exists installations_date_idx on public.installations(installation_date);
create index if not exists whatsapp_inbox_timestamp_idx on public.whatsapp_inbox(timestamp desc);
create index if not exists whatsapp_inbox_status_idx on public.whatsapp_inbox(status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.app_users enable row level security;
alter table public.leads enable row level security;
alter table public.visits enable row level security;
alter table public.measurement_sheets enable row level security;
alter table public.budgets enable row level security;
alter table public.quote_price_items enable row level security;
alter table public.quote_settings enable row level security;
alter table public.purchases enable row level security;
alter table public.productions enable row level security;
alter table public.installations enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.whatsapp_inbox enable row level security;

-- ============================================================
-- POLICIES (service_role bypassa RLS por padrão, mas as policies
-- abaixo garantem acesso mesmo que o bypass seja desabilitado,
-- e permitem leitura via anon key se necessário no futuro)
-- ============================================================

-- whatsapp_inbox
drop policy if exists "service_role_all_whatsapp_inbox" on public.whatsapp_inbox;
create policy "service_role_all_whatsapp_inbox"
  on public.whatsapp_inbox
  for all
  to service_role
  using (true)
  with check (true);

-- app_users
drop policy if exists "service_role_all_app_users" on public.app_users;
create policy "service_role_all_app_users"
  on public.app_users
  for all
  to service_role
  using (true)
  with check (true);

-- leads
drop policy if exists "service_role_all_leads" on public.leads;
create policy "service_role_all_leads"
  on public.leads
  for all
  to service_role
  using (true)
  with check (true);

-- visits
drop policy if exists "service_role_all_visits" on public.visits;
create policy "service_role_all_visits"
  on public.visits
  for all
  to service_role
  using (true)
  with check (true);

-- measurement_sheets
drop policy if exists "service_role_all_measurement_sheets" on public.measurement_sheets;
create policy "service_role_all_measurement_sheets"
  on public.measurement_sheets
  for all
  to service_role
  using (true)
  with check (true);

-- budgets
drop policy if exists "service_role_all_budgets" on public.budgets;
create policy "service_role_all_budgets"
  on public.budgets
  for all
  to service_role
  using (true)
  with check (true);

-- quote_price_items
drop policy if exists "service_role_all_quote_price_items" on public.quote_price_items;
create policy "service_role_all_quote_price_items"
  on public.quote_price_items
  for all
  to service_role
  using (true)
  with check (true);

-- quote_settings
drop policy if exists "service_role_all_quote_settings" on public.quote_settings;
create policy "service_role_all_quote_settings"
  on public.quote_settings
  for all
  to service_role
  using (true)
  with check (true);

-- purchases
drop policy if exists "service_role_all_purchases" on public.purchases;
create policy "service_role_all_purchases"
  on public.purchases
  for all
  to service_role
  using (true)
  with check (true);

-- productions
drop policy if exists "service_role_all_productions" on public.productions;
create policy "service_role_all_productions"
  on public.productions
  for all
  to service_role
  using (true)
  with check (true);

-- installations
drop policy if exists "service_role_all_installations" on public.installations;
create policy "service_role_all_installations"
  on public.installations
  for all
  to service_role
  using (true)
  with check (true);

-- knowledge_items
drop policy if exists "service_role_all_knowledge_items" on public.knowledge_items;
create policy "service_role_all_knowledge_items"
  on public.knowledge_items
  for all
  to service_role
  using (true)
  with check (true);

-- subscriptions
drop policy if exists "service_role_all_subscriptions" on public.subscriptions;
create policy "service_role_all_subscriptions"
  on public.subscriptions
  for all
  to service_role
  using (true)
  with check (true);

-- notifications
drop policy if exists "service_role_all_notifications" on public.notifications;
create policy "service_role_all_notifications"
  on public.notifications
  for all
  to service_role
  using (true)
  with check (true);

-- ============================================================
-- DADOS INICIAIS
-- ============================================================

insert into public.app_users (id, name, email, role, password_hash, phone, active, created_at)
values
  ('admin', 'Administrador', 'marquinhos2026', 'admin', 'pbkdf2_sha256$600000$OG4eH9fcBfA0qS_H8SZX_Q$7kLUxeHxKtDXa/bqG5yJWfgMw6TEUIRLoC5TrLJECIw=', null, true, now())
on conflict (id) do nothing;

insert into public.subscriptions (
  id, customer_name, customer_document, customer_email,
  plan, status, amount, billing_cycle, max_users,
  due_day, next_due_date, payment_method, notes
)
values (
  'main', 'Marquinhos', '00.000.000/0001-00', 'financeiro@marquinhos.com',
  'professional', 'trial', 297, 'monthly', 10,
  10, current_date + interval '7 days', 'pix',
  'Assinatura em periodo de implantacao.'
)
on conflict (id) do nothing;

insert into public.quote_settings (
  id, company_name, document, logo_url, phone, email, header_text, footer_text,
  pix_key, accent_color, secondary_color, font_family, layout_style, watermark_text,
  show_qr_code, show_signature, default_validity, default_payment_conditions, updated_at
)
values (
  'main',
  'Marquinhos',
  '00.000.000/0001-00',
  null,
  '(44) 99999-0000',
  'contato@marquinhos.com',
  'Orcamento profissional para fornecimento e instalacao.',
  'Agradecemos a preferencia. Valores sujeitos a conferencia tecnica.',
  null,
  '#b91c1c',
  '#111827',
  'Arial',
  'moderno',
  null,
  true,
  true,
  15,
  '50% entrada + 50% na entrega',
  now()
)
on conflict (id) do nothing;
