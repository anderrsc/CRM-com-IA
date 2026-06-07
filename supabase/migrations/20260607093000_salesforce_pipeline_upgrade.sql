-- Marquinhos CRM - upgrade incremental do pipeline e usuarios.
-- Execute este arquivo no Supabase caso o schema inicial ja tenha sido rodado.

alter table public.app_users drop constraint if exists app_users_role_check;
alter table public.app_users
  add constraint app_users_role_check
  check (role in ('admin', 'gerente', 'vendedor', 'secretaria', 'producao', 'instalador'));

alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads
  add constraint leads_status_check
  check (status in (
    'novo',
    'primeiro_atendimento',
    'qualificado',
    'aguardando_medidas',
    'aguardando_info',
    'visita_agendada',
    'visita_realizada',
    'orcamento_enviado',
    'negociacao',
    'fechado',
    'producao',
    'instalacao',
    'pos_venda',
    'finalizado',
    'perdido'
  ));

alter table public.leads
  add column if not exists potential_value numeric(12,2) not null default 0,
  add column if not exists last_interaction_at timestamptz;

update public.leads
set last_interaction_at = coalesce(last_interaction_at, updated_at, created_at)
where last_interaction_at is null;
