# Marquinhos OS CRM

Sistema CRM completo para esquadrias, alumínio, vidros e calhas.

## Login de demonstração

```
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
| `OPENAI_API_KEY` | sua chave OpenAI (opcional) |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `WHATSAPP_GRAPH_VERSION` | `v23.0` |
| `WHATSAPP_PHONE_NUMBER_ID` | seu phone number ID (opcional) |
| `WHATSAPP_TOKEN` | seu token WhatsApp (opcional) |
| `WHATSAPP_VERIFY_TOKEN` | um token secreto para o webhook |
| `WHATSAPP_AUTO_REPLY` | `false` |

> **Não configure** `VITE_API_BASE_URL` no Vercel. Em produção o frontend usa `/api` no próprio domínio automaticamente.

3. Build settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Framework:** Vite

---

## Rodar localmente

```bash
npm install
cp .env.example .env
# Edite .env com suas credenciais do Supabase

# Terminal 1 - API server
npm run dev:api

# Terminal 2 - Frontend
npm run dev
```

Abra: http://127.0.0.1:5173

---

## Estrutura de dados

Os cadastros são salvos em `app_records` no Supabase por coleção:

- `leads` — Clientes e leads
- `visits` — Visitas agendadas
- `measurementSheets` — Fichas de medição
- `budgets` — Orçamentos
- `productions` — Ordens de produção
- `installations` — Instalações
- `knowledgeBase` — Base de conhecimento
- `subscriptions` — Configuração de assinatura

Mensagens WhatsApp são salvas em `whatsapp_inbox`.

---

## Webhook WhatsApp

Configure na Meta Developers:

```
URL: https://SEU-DOMINIO.vercel.app/api/whatsapp/webhook
Token de verificação: (mesmo valor de WHATSAPP_VERIFY_TOKEN)
```

---

## Módulos do sistema

| Módulo | Descrição |
|---|---|
| Dashboard | Visão geral com métricas e KPIs |
| Central IA | Análise de mensagens com IA + caixa WhatsApp |
| CRM | Gestão de leads e clientes |
| Funil | Pipeline de vendas Kanban |
| Agenda | Calendário de visitas |
| Fichas de Visita | Geração e impressão de fichas |
| Orçamentos | Criação e envio de orçamentos |
| Produção | Acompanhamento de ordens de produção |
| Instalação | Gerenciamento de instalações |
| Base de Conhecimento | Catálogo de produtos e serviços |
| Configurações | Assinatura, integrações e dados da empresa |
