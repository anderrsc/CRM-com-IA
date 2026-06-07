# Configuracao do Supabase - Marquinhos

## 1. Criar o banco de dados

1. Acesse `supabase.com` e crie um projeto.
2. Aguarde a inicializacao.
3. Abra **SQL Editor**.
4. Cole o conteudo de `supabase/migrations/20260606133000_initial_schema.sql`.
5. Clique em **Run**.

O script cria tabelas, indices, RLS, policies e dados iniciais.

Se o banco ja existe e voce ja rodou o script inicial, rode tambem:

```text
supabase/migrations/20260607093000_salesforce_pipeline_upgrade.sql
supabase/migrations/20260607103000_quote_pricing_and_emission.sql
```

Esses upgrades adicionam o novo funil, papeis de gerente/secretaria, valor potencial, ultima interacao, tabela de precos de orcamento e personalizacao da emissao.

## 2. Tabelas usadas pelo CRM

- `app_users` - usuarios, perfis e senha hash
- `leads` - clientes e leads
- `visits` - visitas agendadas
- `measurement_sheets` - fichas de medicao
- `budgets` - orcamentos
- `quote_price_items` - tabela de precos para calhas, rufos, pingadeiras e itens especiais
- `quote_settings` - dados personalizados da emissao do orcamento
- `productions` - ordens de producao
- `installations` - instalacoes
- `knowledge_items` - base de conhecimento
- `subscriptions` - assinatura e cobranca
- `notifications` - notificacoes
- `whatsapp_inbox` - mensagens recebidas pelo webhook do WhatsApp

## 3. Login inicial

Usuario inicial:

```text
ADM inicial configurado na migration.
```

Dentro da area ADM, crie os demais usuarios, senhas e perfis.
As senhas ficam salvas como hash PBKDF2 em `app_users.password_hash`.

## 4. Credenciais para o Vercel

Em **Settings > API** no Supabase:

- **Project URL** -> `SUPABASE_URL`
- **service_role** -> `SUPABASE_SERVICE_ROLE_KEY`

No Vercel, configure:

```text
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
WHATSAPP_GRAPH_VERSION=v23.0
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TOKEN=
WHATSAPP_VERIFY_TOKEN=marquinhos-webhook-token-2024
WHATSAPP_AUTO_REPLY=false
```

Nao configure `VITE_API_BASE_URL` no Vercel.

## 5. Verificar

Depois do deploy, abra:

```text
https://SEU-DOMINIO.vercel.app/api/health
```

Resposta esperada com Supabase configurado:

```json
{
  "ok": true,
  "supabaseConfigured": true,
  "openAiConfigured": false,
  "whatsappConfigured": false
}
```
