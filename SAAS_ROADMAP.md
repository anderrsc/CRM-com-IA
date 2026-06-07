# Marquinhos - Salesforce das Esquadrias

## Objetivo

Transformar o Marquinhos em uma plataforma SaaS operacional para empresas de esquadrias, aluminio, vidros, calhas, rufos e instalacao tecnica.

O produto deve unir CRM, atendimento, IA comercial, agenda, orcamentos, producao, instalacao, pos-venda, financeiro basico e relatorios em uma experiencia premium.

## Estado atual implementado

- CRM com cadastro de leads e clientes.
- Funil visual com drag and drop.
- Login real com usuarios no Supabase e senha em hash.
- Area ADM para criar usuarios.
- Tabelas reais no Supabase para leads, visitas, fichas de medicao, orcamentos, producao, instalacao, conhecimento, assinatura e notificacoes.
- IA comercial preparada para OpenAI.
- Webhook e envio WhatsApp preparados para configuracao.
- Orçamentos com itens, totais, desconto e impressao.
- Producao e instalacao com status, checklist, equipe e notificacoes.
- Base de conhecimento para produtos e servicos.
- Painel de assinatura e usuarios.

## Upgrade desta fase

- Branding retornado para Marquinhos.
- Papeis ampliados: administrador, gerente, vendedor, secretaria, producao e instalacao.
- Funil alinhado ao modelo Salesforce das Esquadrias:
  - Novo Lead
  - Primeiro Atendimento
  - Qualificado
  - Aguardando Medidas
  - Em Orcamento
  - Negociacao
  - Fechado
  - Producao
  - Instalacao
  - Pos-venda
  - Perdido
- Cards do funil passam a exibir cidade, origem, valor potencial e ultima interacao.
- Leads passam a ter `potential_value` e `last_interaction_at` no banco.
- Migration incremental criada para atualizar Supabase ja existente.

## Roadmap recomendado

### Fase 1 - Operacao comercial redonda

- Historico completo por lead.
- Tarefas e follow-ups.
- Registro de ligacoes.
- Arquivos/anexos reais via Supabase Storage.
- Campos de responsavel com permissao por perfil.
- Relatorio de conversao por origem e vendedor.

### Fase 2 - IA e atendimento

- Caixa de entrada WhatsApp dentro do CRM.
- Triagem automatica por tipo de servico.
- Criacao automatica de lead a partir do WhatsApp.
- Resumo automatico da conversa.
- Classificacao quente, morno ou frio.
- Sugestao de proxima acao.

### Fase 3 - Orcamento profissional

- Catalogo de produtos com espessura, corte, cor e unidade.
- Tabela de precos para calhas, rufos e pingadeiras.
- PDF com layout premium.
- Assinatura digital.
- QR Code PIX.
- Aprovacao de orcamento acima de valor definido.

### Fase 4 - Automacoes estilo Flow

- Criador visual de regras.
- Regras por evento, condicao e acao.
- Lead parado gera tarefa.
- Venda fechada gera OS.
- Instalacao concluida envia pos-venda.
- Orcamento alto exige aprovacao.

### Fase 5 - ERP leve

- Contas a receber e a pagar.
- Fluxo de caixa.
- Comissao de vendedores.
- Metas.
- Parcelamentos.
- Relatorios financeiros.

### Fase 6 - SaaS completo

- Multiempresa.
- Planos e limites.
- Auditoria de acoes.
- Permissoes por modulo.
- Backend separado com Prisma/JWT caso seja necessario escalar fora do modelo Vercel/Supabase.

## Nota tecnica

O sistema atual usa React, TypeScript, Vite, APIs serverless e Supabase. A especificacao ideal cita Next.js, Prisma, Express e PostgreSQL separado. Essa migracao pode ser feita depois, mas nao e obrigatoria para o CRM funcionar agora no Vercel com Supabase.
