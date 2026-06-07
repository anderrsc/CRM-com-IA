alter table public.quote_settings
  add column if not exists accent_color text not null default '#b91c1c',
  add column if not exists secondary_color text not null default '#111827',
  add column if not exists font_family text not null default 'Arial',
  add column if not exists layout_style text not null default 'moderno'
    check (layout_style in ('classico', 'moderno', 'compacto')),
  add column if not exists watermark_text text,
  add column if not exists show_qr_code boolean not null default true,
  add column if not exists show_signature boolean not null default true;
