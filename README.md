# Marquinhos CRM

Sistema SaaS/CRM para esquadrias, aluminio, vidros, calhas, rufos e instalacao tecnica.

Visao de produto: transformar o Marquinhos no Salesforce das Esquadrias.
Roadmap completo em `SAAS_ROADMAP.md`.

## Login inicial ADM

```text
Use o login ADM inicial configurado na migration.
```

## Rodar localmente

```bash
npm install
cp .env.example .env

# Terminal 1 - API local
npm run dev:api

# Terminal 2 - Frontend
npm run dev
```

Abra: `http://127.0.0.1:5173`

Para persistencia real de dados e login por senha, configure as credenciais do Supabase no `.env`.
O sistema nao carrega dados de teste: os cadastros comecam vazios e sao salvos no banco.

## Deploy no Vercel

1. Crie um projeto no Supabase.
2. Execute a migration:

```text
supabase/migrations/20260606133000_initial_schema.sql
```

Se o banco ja foi criado antes, execute tambem a migration incremental:

```text
supabase/migrations/20260607093000_salesforce_pipeline_upgrade.sql
supabase/migrations/20260607103000_quote_pricing_and_emission.sql
supabase/migrations/20260607112000_purchases_and_quote_logo.sql
```

3. No Vercel, configure as variaveis de ambiente:

| Variavel | Valor |
|---|---|
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key do Supabase |
| `OPENAI_API_KEY` | chave OpenAI, opcional |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `WHATSAPP_GRAPH_VERSION` | `v23.0` |
| `WHATSAPP_PHONE_NUMBER_ID` | phone number ID, opcional |
| `WHATSAPP_TOKEN` | token WhatsApp, opcional |
| `WHATSAPP_VERIFY_TOKEN` | token secreto do webhook |
| `WHATSAPP_AUTO_REPLY` | `false` |

Nao configure `VITE_API_BASE_URL` no Vercel. Em producao, o frontend usa `/api` no proprio dominio.

Build settings:

- Build Command: `npm run build`
- Output Directory: `dist`
- Framework: Vite

## Estrutura de dados

Os cadastros sao salvos em tabelas reais no Supabase:

- `app_users` - usuarios, perfis e senha hash
- `leads` - clientes e leads
- `visits` - visitas agendadas
- `measurement_sheets` - fichas de medicao
- `budgets` - orcamentos
- `productions` - ordens de producao
- `installations` - instalacoes
- `knowledge_items` - base de conhecimento
- `subscriptions` - configuracao de assinatura

Mensagens WhatsApp sao salvas em `whatsapp_inbox`.

## Webhook WhatsApp

Configure na Meta Developers:

```text
URL: https://SEU-DOMINIO.vercel.app/api/whatsapp/webhook
Token de verificacao: mesmo valor de WHATSAPP_VERIFY_TOKEN
```

## Modulos

| Modulo | Descricao |
|---|---|
| Dashboard | Visao geral com metricas e KPIs |
| Central IA | Analise de mensagens com IA e caixa WhatsApp |
| CRM | Gestao de leads e clientes |
| Funil | Pipeline de vendas Kanban |
| Agenda | Calendario de visitas |
| Fichas de Visita | Geracao e impressao de fichas |
| Orcamentos | Criacao e envio de orcamentos |
| Compras | Materiais, fornecedores, valores e recebimentos |
| Producao | Acompanhamento de ordens de producao |
| Instalacao | Gerenciamento de instalacoes |
| Base de Conhecimento | Catalogo de produtos e servicos |
| Configuracoes | Assinatura, integracoes e dados da empresa |
