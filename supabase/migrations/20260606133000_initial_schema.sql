-- ============================================================
-- Marquinhos OS CRM - Schema completo
-- Execute no SQL Editor do Supabase
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- TABELAS
-- ============================================================

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'vendedor', 'producao', 'instalador')),
  avatar text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
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
  status text not null default 'novo' check (status in ('novo', 'aguardando_info', 'visita_agendada', 'visita_realizada', 'orcamento_enviado', 'negociacao', 'fechado', 'producao', 'instalacao', 'finalizado')),
  urgency text not null default 'media' check (urgency in ('baixa', 'media', 'alta', 'urgente')),
  availability text,
  observations text,
  ai_summary text,
  assigned_to uuid references public.app_users(id) on delete set null,
  attachments jsonb not null default '[]'::jsonb,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  lead_name text not null,
  phone text not null default '',
  address text not null default '',
  service text not null default '',
  visit_date date not null,
  visit_time text not null,
  observations text,
  assigned_to uuid references public.app_users(id) on delete set null,
  status text not null default 'agendada' check (status in ('agendada', 'realizada', 'cancelada', 'reagendada')),
  photos jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.measurement_sheets (
  id uuid primary key default gen_random_uuid(),
  visit_id uuid references public.visits(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  lead_name text not null,
  service text not null default '',
  lines jsonb not null default '[]'::jsonb,
  general_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  lead_name text not null,
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

create table if not exists public.productions (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid references public.budgets(id) on delete set null,
  lead_id uuid references public.leads(id) on delete cascade,
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
  id uuid primary key default gen_random_uuid(),
  production_id uuid references public.productions(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
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
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
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
create table if not exists public.app_records (
  collection text not null,
  id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

-- ============================================================
-- ÍNDICES
-- ============================================================

create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_origin_idx on public.leads(origin);
create index if not exists visits_date_idx on public.visits(visit_date);
create index if not exists budgets_status_idx on public.budgets(status);
create index if not exists productions_stage_idx on public.productions(current_stage);
create index if not exists installations_date_idx on public.installations(installation_date);
create index if not exists whatsapp_inbox_timestamp_idx on public.whatsapp_inbox(timestamp desc);
create index if not exists whatsapp_inbox_status_idx on public.whatsapp_inbox(status);
create index if not exists app_records_collection_idx on public.app_records(collection);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.app_users enable row level security;
alter table public.leads enable row level security;
alter table public.visits enable row level security;
alter table public.measurement_sheets enable row level security;
alter table public.budgets enable row level security;
alter table public.productions enable row level security;
alter table public.installations enable row level security;
alter table public.knowledge_items enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;
alter table public.whatsapp_inbox enable row level security;
alter table public.app_records enable row level security;

-- ============================================================
-- POLICIES (service_role bypassa RLS por padrão, mas as policies
-- abaixo garantem acesso mesmo que o bypass seja desabilitado,
-- e permitem leitura via anon key se necessário no futuro)
-- ============================================================

-- app_records: acesso total via service_role (backend Vercel)
drop policy if exists "service_role_all_app_records" on public.app_records;
create policy "service_role_all_app_records"
  on public.app_records
  for all
  to service_role
  using (true)
  with check (true);

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

insert into public.app_users (id, name, email, role, phone, active, created_at)
values
  ('00000000-0000-0000-0000-000000000001', 'Marcos Silva', 'admin@marquinhosos.com', 'admin', '(44) 99999-0001', true, '2024-01-01T00:00:00Z'),
  ('00000000-0000-0000-0000-000000000002', 'Ana Santos', 'vendedor@marquinhosos.com', 'vendedor', '(44) 99999-0002', true, '2024-01-15T00:00:00Z'),
  ('00000000-0000-0000-0000-000000000003', 'Carlos Oliveira', 'producao@marquinhosos.com', 'producao', '(44) 99999-0003', true, '2024-02-01T00:00:00Z'),
  ('00000000-0000-0000-0000-000000000004', 'Roberto Lima', 'instalador@marquinhosos.com', 'instalador', '(44) 99999-0004', true, '2024-02-15T00:00:00Z')
on conflict (id) do nothing;

insert into public.subscriptions (
  customer_name, customer_document, customer_email,
  plan, status, amount, billing_cycle, max_users,
  due_day, next_due_date, payment_method, notes
)
values (
  'Marquinhos OS', '00.000.000/0001-00', 'financeiro@marquinhosos.com',
  'professional', 'trial', 297, 'monthly', 10,
  10, current_date + interval '7 days', 'pix',
  'Assinatura em periodo de implantacao.'
)
on conflict do nothing;
