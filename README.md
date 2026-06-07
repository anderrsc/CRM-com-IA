# Marquinhos OS CRM

Sistema CRM completo para esquadrias, aluminio, vidros e calhas.

## Login de demonstracao

```text
admin@marquinhosos.com
senha: 123456
```

---

## Deploy no Vercel (produção)

### 1. Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em **SQL Editor** e execute o arquivo:
   ```
   supabase/migrations/20260606133000_initial_schema.sql
   ```
3. Anote a **Project URL** e a **service_role key** em **Settings → API**

### 2. Deploy no Vercel

1. Conecte o repositório no [vercel.com](https://vercel.com)
2. Em **Project Settings → Environment Variables**, adicione:

| Variável | Valor |
|---|---|
| `SUPABASE_URL` | `https://SEU-PROJETO.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | sua service role key |
| `OPENAI_API_KEY` | sua chave OpenAI (opcional, mas necessária para IA avançada) |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `WHATSAPP_GRAPH_VERSION` | `v23.0` |
| `WHATSAPP_PHONE_NUMBER_ID` | seu phone number ID |
| `WHATSAPP_TOKEN` | seu token WhatsApp |
| `WHATSAPP_VERIFY_TOKEN` | um token secreto para o webhook |
| `WHATSAPP_AUTO_REPLY` | `false` |

> **Não configure** `VITE_API_BASE_URL` no Vercel. Em produção o frontend usa `/api` no próprio domínio automaticamente.
>
> Observação: `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são obrigatórios para o banco funcionar. `WHATSAPP_TOKEN` e `WHATSAPP_PHONE_NUMBER_ID` também são necessários se você quiser usar WhatsApp. `OPENAI_API_KEY` é opcional, mas sem ela o sistema irá usar um fallback heurístico em vez da IA do OpenAI.

3. Build settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Framework:** Vite

---

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

Para persistencia real de dados, configure as credenciais do Supabase no `.env`.
Sem Supabase, o app roda com fallback local/mock para demonstracao.

## Deploy no Vercel

1. Crie um projeto no Supabase.
2. Execute a migration:

```text
supabase/migrations/20260606133000_initial_schema.sql
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

Os cadastros sao salvos em `app_records` no Supabase por colecao:

- `leads` - clientes e leads
- `visits` - visitas agendadas
- `measurementSheets` - fichas de medicao
- `budgets` - orcamentos
- `productions` - ordens de producao
- `installations` - instalacoes
- `knowledgeBase` - base de conhecimento
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
| Producao | Acompanhamento de ordens de producao |
| Instalacao | Gerenciamento de instalacoes |
| Base de Conhecimento | Catalogo de produtos e servicos |
| Configuracoes | Assinatura, integracoes e dados da empresa |
