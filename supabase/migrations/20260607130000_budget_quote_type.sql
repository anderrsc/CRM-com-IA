alter table public.budgets
  add column if not exists quote_type text default 'calhas'
  check (quote_type in ('calhas', 'esquadrias'));

update public.budgets
set quote_type = 'calhas'
where quote_type is null;

create index if not exists budgets_quote_type_idx on public.budgets(quote_type);
