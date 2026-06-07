# Configuração do Supabase - Marquinhos OS

## 1. Criar o banco de dados

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Aguarde a inicialização (2-3 minutos)
3. Vá em **SQL Editor** (menu lateral esquerdo)
4. Clique em **New query**
5. Cole o conteúdo de `supabase/migrations/20260606133000_initial_schema.sql`
6. Clique em **Run** (▶)

O script cria todas as tabelas, índices, políticas de segurança (RLS) e dados iniciais.

## 2. Obter as credenciais

Em **Settings → API**:

- **Project URL** → `SUPABASE_URL`
- **service_role** (secret) → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ A `service_role` key tem acesso total ao banco. Use **somente** no servidor (Vercel), nunca no frontend.

## 3. Configurar no Vercel

Em **Project Settings → Environment Variables**:

```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

## 4. Como os dados são salvos

O CRM usa a tabela `app_records` como armazenamento flexível (schema-on-write):

```
app_records
  collection  TEXT    -- nome da coleção (leads, visits, etc.)
  id          TEXT    -- id do registro
  payload     JSONB   -- dados completos do registro
  created_at  TIMESTAMPTZ
  updated_at  TIMESTAMPTZ
```

Isso permite salvar qualquer estrutura sem migrações adicionais.

## 5. Tabelas especializadas

Algumas funcionalidades usam tabelas próprias:
- `whatsapp_inbox` — mensagens recebidas via webhook
- `app_users` — usuários do sistema (seed inicial inclui 4 usuários)
- `subscriptions` — dados de assinatura/cobrança

## 6. Verificar se está funcionando

Após o deploy no Vercel, acesse:
```
https://SEU-DOMINIO.vercel.app/api/health
```

Deve retornar:
```json
{
  "ok": true,
  "supabaseConfigured": true,
  "openAiConfigured": true,
  "whatsappConfigured": false
}
```
