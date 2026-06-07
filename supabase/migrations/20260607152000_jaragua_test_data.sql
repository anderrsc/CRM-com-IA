insert into public.leads (
  id, name, phone, email, address, neighborhood, city, state, zip_code,
  origin, service, status, urgency, availability, observations,
  potential_value, last_interaction_at, attachments, messages, created_at, updated_at
)
values
  (
    'teste-jaragua-centro',
    'Cliente Teste Centro',
    '(47) 99901-0001',
    'centro.teste@example.com',
    'Rua Reinoldo Rau, 420',
    'Centro',
    'Jaragua do Sul',
    'SC',
    '89251-600',
    'whatsapp',
    'Orcamento de calha beiral e rufo',
    'orcamento_enviado',
    'media',
    'Periodo da tarde',
    'Registro de teste para validar orcamentos de calhas.',
    6800,
    now(),
    '[]'::jsonb,
    '[]'::jsonb,
    now(),
    now()
  ),
  (
    'teste-jaragua-vila-nova',
    'Cliente Teste Vila Nova',
    '(47) 99901-0002',
    'vila.nova.teste@example.com',
    'Rua Walter Marquardt, 1180',
    'Vila Nova',
    'Jaragua do Sul',
    'SC',
    '89259-700',
    'indicacao',
    'Calha platibanda e pingadeira',
    'aguardando_medidas',
    'alta',
    'Manha',
    'Registro de teste para ficha de visita.',
    4200,
    now(),
    '[]'::jsonb,
    '[]'::jsonb,
    now(),
    now()
  ),
  (
    'teste-jaragua-barra',
    'Cliente Teste Barra do Rio Cerro',
    '(47) 99901-0003',
    'barra.teste@example.com',
    'Rua Pastor Albert Schneider, 850',
    'Barra do Rio Cerro',
    'Jaragua do Sul',
    'SC',
    '89260-000',
    'telefone',
    'Manutencao de calhas',
    'novo',
    'baixa',
    'Sexta-feira',
    'Registro de teste para manutencao.',
    1800,
    now(),
    '[]'::jsonb,
    '[]'::jsonb,
    now(),
    now()
  )
on conflict (id) do nothing;

insert into public.visits (
  id, lead_id, lead_name, phone, address, service,
  visit_date, visit_time, observations, assigned_to, status, photos, notes, created_at
)
values
  (
    'teste-visita-vila-nova',
    'teste-jaragua-vila-nova',
    'Cliente Teste Vila Nova',
    '(47) 99901-0002',
    'Rua Walter Marquardt, 1180 - Vila Nova, Jaragua do Sul - SC',
    'Medicao de calha platibanda e pingadeira',
    current_date + interval '1 day',
    '09:00',
    'Conferir acesso ao telhado e pontos de descida.',
    null,
    'agendada',
    '[]'::jsonb,
    null,
    now()
  ),
  (
    'teste-visita-barra',
    'teste-jaragua-barra',
    'Cliente Teste Barra do Rio Cerro',
    '(47) 99901-0003',
    'Rua Pastor Albert Schneider, 850 - Barra do Rio Cerro, Jaragua do Sul - SC',
    'Manutencao de calhas',
    current_date + interval '3 days',
    '14:00',
    'Verificar vazamento em emenda existente.',
    null,
    'agendada',
    '[]'::jsonb,
    null,
    now()
  )
on conflict (id) do nothing;

insert into public.budgets (
  id, lead_id, lead_name, quote_type, items, labor_cost, travel_cost,
  discount, discount_type, subtotal, total, validity, payment_conditions,
  observations, status, sent_at, created_at, updated_at
)
values
  (
    'teste-orcamento-centro',
    'teste-jaragua-centro',
    'Cliente Teste Centro',
    'calhas',
    '[
      {"id":"item-1","description":"CALHA DE BEIRAL EM ALUMÍNIO 0.5MM C/300MM NA COR NATURAL","quantity":18,"unit":"m","unitPrice":82,"total":1476,"category":"calha","thickness":"0.5","cut":"300","color":"Natural","priceSource":"manual"},
      {"id":"item-2","description":"RUFO COM PINGADEIRA EM ALUMÍNIO 0.6MM C/500MM NA COR NATURAL","quantity":12,"unit":"m","unitPrice":96,"total":1152,"category":"rufo","thickness":"0.6","cut":"500","color":"Natural","priceSource":"manual"},
      {"id":"item-3","description":"MÃO DE OBRA PARA INSTALAÇÃO","quantity":1,"unit":"un","unitPrice":850,"total":850,"category":"instalacao","priceSource":"manual"}
    ]'::jsonb,
    0,
    0,
    0,
    'fixed',
    3478,
    3478,
    7,
    '50% entrada + 50% apos entrega',
    'Teste com estrutura de PDF de calhas.',
    'sent',
    now(),
    now(),
    now()
  ),
  (
    'teste-orcamento-barra',
    'teste-jaragua-barra',
    'Cliente Teste Barra do Rio Cerro',
    'calhas',
    '[
      {"id":"item-1","description":"CALHA DE PLATIBANDA EM ALUMÍNIO 0.6MM C/400MM NA COR BRANCO","quantity":10,"unit":"m","unitPrice":108,"total":1080,"category":"calha","thickness":"0.6","cut":"400","color":"Branco","priceSource":"manual"},
      {"id":"item-2","description":"MÃO DE OBRA PARA PINTURA","quantity":10,"unit":"m","unitPrice":8,"total":80,"category":"instalacao","priceSource":"manual"},
      {"id":"item-3","description":"MATERIAIS NECESSARIOS PARA PINTURA BRANCO","quantity":10,"unit":"m","unitPrice":12,"total":120,"category":"instalacao","priceSource":"manual"}
    ]'::jsonb,
    0,
    0,
    80,
    'fixed',
    1280,
    1200,
    7,
    'A vista no PIX',
    'Teste com pintura automatica.',
    'draft',
    null,
    now(),
    now()
  )
on conflict (id) do nothing;
