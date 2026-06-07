import { hashPassword } from './auth.js';

const dateOnly = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const valueOrNull = (value) => (value === undefined || value === '' ? null : value);
const valueOrDefault = (value, fallback) => (value === undefined || value === null ? fallback : value);

const maps = {
  users: {
    table: 'app_users',
    order: 'created_at.asc',
    toApp: (row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      avatar: row.avatar || undefined,
      phone: row.phone || undefined,
      active: row.active,
      createdAt: row.created_at,
    }),
    toDb: (item) => ({
      id: item.id,
      name: item.name,
      email: String(item.email || '').trim().toLowerCase(),
      role: item.role,
      password_hash: item.passwordHash,
      avatar: valueOrNull(item.avatar),
      phone: valueOrNull(item.phone),
      active: valueOrDefault(item.active, true),
      created_at: item.createdAt || new Date().toISOString(),
    }),
  },
  leads: {
    table: 'leads',
    order: 'updated_at.desc',
    toApp: (row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email || undefined,
      address: row.address || '',
      neighborhood: row.neighborhood || '',
      city: row.city || 'Maringa',
      state: row.state || 'PR',
      zipCode: row.zip_code || undefined,
      origin: row.origin,
      service: row.service || 'A definir',
      status: row.status,
      urgency: row.urgency,
      availability: row.availability || undefined,
      observations: row.observations || undefined,
      aiSummary: row.ai_summary || undefined,
      assignedTo: row.assigned_to || undefined,
      potentialValue: Number(row.potential_value || 0),
      lastInteractionAt: row.last_interaction_at || undefined,
      attachments: row.attachments || [],
      messages: row.messages || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
    toDb: (item) => ({
      id: item.id,
      name: item.name,
      phone: item.phone || '',
      email: valueOrNull(item.email),
      address: item.address || '',
      neighborhood: item.neighborhood || '',
      city: item.city || 'Maringa',
      state: item.state || 'PR',
      zip_code: valueOrNull(item.zipCode),
      origin: item.origin || 'outro',
      service: item.service || 'A definir',
      status: item.status || 'novo',
      urgency: item.urgency || 'media',
      availability: valueOrNull(item.availability),
      observations: valueOrNull(item.observations),
      ai_summary: valueOrNull(item.aiSummary),
      assigned_to: valueOrNull(item.assignedTo),
      potential_value: item.potentialValue || 0,
      last_interaction_at: valueOrNull(item.lastInteractionAt) || item.updatedAt || new Date().toISOString(),
      attachments: item.attachments || [],
      messages: item.messages || [],
      created_at: item.createdAt || new Date().toISOString(),
      updated_at: item.updatedAt || new Date().toISOString(),
    }),
  },
  visits: {
    table: 'visits',
    order: 'visit_date.desc',
    toApp: (row) => ({
      id: row.id,
      leadId: row.lead_id,
      leadName: row.lead_name,
      phone: row.phone || '',
      address: row.address || '',
      service: row.service || '',
      date: row.visit_date,
      time: row.visit_time,
      observations: row.observations || undefined,
      assignedTo: row.assigned_to || '',
      status: row.status,
      photos: row.photos || [],
      notes: row.notes || undefined,
      createdAt: row.created_at,
    }),
    toDb: (item) => ({
      id: item.id,
      lead_id: valueOrNull(item.leadId),
      lead_name: item.leadName || '',
      phone: item.phone || '',
      address: item.address || '',
      service: item.service || '',
      visit_date: dateOnly(item.date) || dateOnly(new Date()),
      visit_time: item.time || '09:00',
      observations: valueOrNull(item.observations),
      assigned_to: valueOrNull(item.assignedTo),
      status: item.status || 'agendada',
      photos: item.photos || [],
      notes: valueOrNull(item.notes),
      created_at: item.createdAt || new Date().toISOString(),
    }),
  },
  measurementSheets: {
    table: 'measurement_sheets',
    order: 'updated_at.desc',
    toApp: (row) => ({
      id: row.id,
      visitId: row.visit_id,
      leadId: row.lead_id,
      leadName: row.lead_name,
      service: row.service || '',
      lines: row.lines || [],
      generalNotes: row.general_notes || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
    toDb: (item) => ({
      id: item.id,
      visit_id: valueOrNull(item.visitId),
      lead_id: valueOrNull(item.leadId),
      lead_name: item.leadName || '',
      service: item.service || '',
      lines: item.lines || [],
      general_notes: item.generalNotes || '',
      created_at: item.createdAt || new Date().toISOString(),
      updated_at: item.updatedAt || new Date().toISOString(),
    }),
  },
  budgets: {
    table: 'budgets',
    order: 'updated_at.desc',
    toApp: (row) => ({
      id: row.id,
      leadId: row.lead_id,
      leadName: row.lead_name,
      items: row.items || [],
      laborCost: Number(row.labor_cost || 0),
      travelCost: Number(row.travel_cost || 0),
      discount: Number(row.discount || 0),
      discountType: row.discount_type,
      subtotal: Number(row.subtotal || 0),
      total: Number(row.total || 0),
      validity: row.validity,
      paymentConditions: row.payment_conditions || '',
      observations: row.observations || undefined,
      status: row.status,
      sentAt: row.sent_at || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
    toDb: (item) => ({
      id: item.id,
      lead_id: valueOrNull(item.leadId),
      lead_name: item.leadName || '',
      items: item.items || [],
      labor_cost: item.laborCost || 0,
      travel_cost: item.travelCost || 0,
      discount: item.discount || 0,
      discount_type: item.discountType || 'fixed',
      subtotal: item.subtotal || 0,
      total: item.total || 0,
      validity: item.validity || 15,
      payment_conditions: item.paymentConditions || '',
      observations: valueOrNull(item.observations),
      status: item.status || 'draft',
      sent_at: valueOrNull(item.sentAt),
      created_at: item.createdAt || new Date().toISOString(),
      updated_at: item.updatedAt || new Date().toISOString(),
    }),
  },
  quotePriceItems: {
    table: 'quote_price_items',
    order: 'updated_at.desc',
    toApp: (row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      thickness: row.thickness || undefined,
      cut: row.cut || undefined,
      color: row.color || undefined,
      unit: row.unit,
      unitPrice: Number(row.unit_price || 0),
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
    toDb: (item) => ({
      id: item.id,
      name: item.name || '',
      category: item.category || 'outro',
      thickness: valueOrNull(item.thickness),
      cut: valueOrNull(item.cut),
      color: valueOrNull(item.color),
      unit: item.unit || 'un',
      unit_price: item.unitPrice || 0,
      active: valueOrDefault(item.active, true),
      created_at: item.createdAt || new Date().toISOString(),
      updated_at: item.updatedAt || new Date().toISOString(),
    }),
  },
  quoteSettings: {
    table: 'quote_settings',
    order: 'updated_at.desc',
    toApp: (row) => ({
      id: row.id,
      companyName: row.company_name,
      document: row.document,
      phone: row.phone || undefined,
      email: row.email || undefined,
      headerText: row.header_text || '',
      footerText: row.footer_text || '',
      pixKey: row.pix_key || undefined,
      defaultValidity: row.default_validity,
      defaultPaymentConditions: row.default_payment_conditions || '',
      updatedAt: row.updated_at,
    }),
    toDb: (item) => ({
      id: item.id || 'main',
      company_name: item.companyName || '',
      document: item.document || '',
      phone: valueOrNull(item.phone),
      email: valueOrNull(item.email),
      header_text: item.headerText || '',
      footer_text: item.footerText || '',
      pix_key: valueOrNull(item.pixKey),
      default_validity: item.defaultValidity || 15,
      default_payment_conditions: item.defaultPaymentConditions || '',
      updated_at: item.updatedAt || new Date().toISOString(),
    }),
  },
  productions: {
    table: 'productions',
    order: 'created_at.desc',
    toApp: (row) => ({
      id: row.id,
      budgetId: row.budget_id,
      leadId: row.lead_id,
      leadName: row.lead_name,
      items: row.items || [],
      currentStage: row.current_stage,
      progress: row.progress,
      startDate: row.start_date,
      estimatedEnd: row.estimated_end,
      assignedTeam: row.assigned_team || [],
      notes: row.notes || undefined,
      history: row.history || [],
      createdAt: row.created_at,
    }),
    toDb: (item) => ({
      id: item.id,
      budget_id: valueOrNull(item.budgetId),
      lead_id: valueOrNull(item.leadId),
      lead_name: item.leadName || '',
      items: item.items || [],
      current_stage: item.currentStage || 'corte',
      progress: item.progress || 0,
      start_date: dateOnly(item.startDate) || dateOnly(new Date()),
      estimated_end: dateOnly(item.estimatedEnd),
      assigned_team: item.assignedTeam || [],
      notes: valueOrNull(item.notes),
      history: item.history || [],
      created_at: item.createdAt || new Date().toISOString(),
    }),
  },
  installations: {
    table: 'installations',
    order: 'installation_date.desc',
    toApp: (row) => ({
      id: row.id,
      productionId: row.production_id,
      leadId: row.lead_id,
      leadName: row.lead_name,
      address: row.address || '',
      date: row.installation_date,
      time: row.installation_time,
      team: row.team || [],
      items: row.items || [],
      checklist: row.checklist || [],
      photosBefore: row.photos_before || [],
      photosAfter: row.photos_after || [],
      signature: row.signature || undefined,
      status: row.status,
      notes: row.notes || undefined,
      createdAt: row.created_at,
    }),
    toDb: (item) => ({
      id: item.id,
      production_id: valueOrNull(item.productionId),
      lead_id: valueOrNull(item.leadId),
      lead_name: item.leadName || '',
      address: item.address || '',
      installation_date: dateOnly(item.date) || dateOnly(new Date()),
      installation_time: item.time || '09:00',
      team: item.team || [],
      items: item.items || [],
      checklist: item.checklist || [],
      photos_before: item.photosBefore || [],
      photos_after: item.photosAfter || [],
      signature: valueOrNull(item.signature),
      status: item.status || 'agendada',
      notes: valueOrNull(item.notes),
      created_at: item.createdAt || new Date().toISOString(),
    }),
  },
  knowledgeBase: {
    table: 'knowledge_items',
    order: 'created_at.desc',
    toApp: (row) => ({
      id: row.id,
      category: row.category,
      name: row.name,
      description: row.description,
      specifications: row.specifications || undefined,
      priceRange: row.price_range || undefined,
      images: row.images || [],
      tags: row.tags || [],
      active: row.active,
      createdAt: row.created_at,
    }),
    toDb: (item) => ({
      id: item.id,
      category: item.category || 'outros',
      name: item.name || '',
      description: item.description || '',
      specifications: valueOrNull(item.specifications),
      price_range: valueOrNull(item.priceRange),
      images: item.images || [],
      tags: item.tags || [],
      active: valueOrDefault(item.active, true),
      created_at: item.createdAt || new Date().toISOString(),
    }),
  },
  subscriptions: {
    table: 'subscriptions',
    order: 'updated_at.desc',
    toApp: (row) => ({
      id: row.id,
      customerName: row.customer_name,
      customerDocument: row.customer_document,
      customerEmail: row.customer_email,
      plan: row.plan,
      status: row.status,
      amount: Number(row.amount || 0),
      billingCycle: row.billing_cycle,
      maxUsers: row.max_users,
      dueDay: row.due_day,
      nextDueDate: row.next_due_date,
      lastPaymentAt: row.last_payment_at || undefined,
      paymentMethod: row.payment_method,
      invoiceUrl: row.invoice_url || undefined,
      notes: row.notes || undefined,
      updatedAt: row.updated_at,
    }),
    toDb: (item) => ({
      id: item.id || 'main',
      customer_name: item.customerName || '',
      customer_document: item.customerDocument || '',
      customer_email: item.customerEmail || '',
      plan: item.plan || 'starter',
      status: item.status || 'trial',
      amount: item.amount || 0,
      billing_cycle: item.billingCycle || 'monthly',
      max_users: item.maxUsers || 1,
      due_day: item.dueDay || 10,
      next_due_date: dateOnly(item.nextDueDate) || dateOnly(new Date()),
      last_payment_at: valueOrNull(item.lastPaymentAt),
      payment_method: item.paymentMethod || 'manual',
      invoice_url: valueOrNull(item.invoiceUrl),
      notes: valueOrNull(item.notes),
      updated_at: item.updatedAt || new Date().toISOString(),
    }),
  },
  notifications: {
    table: 'notifications',
    order: 'created_at.desc',
    toApp: (row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      read: row.read,
      actionUrl: row.action_url || undefined,
      createdAt: row.created_at,
    }),
    toDb: (item) => ({
      id: item.id,
      type: item.type || 'info',
      title: item.title || '',
      message: item.message || '',
      read: valueOrDefault(item.read, false),
      action_url: valueOrNull(item.actionUrl),
      created_at: item.createdAt || new Date().toISOString(),
    }),
  },
};

export function getRecordMap(collection) {
  const map = maps[collection];
  if (!map) {
    const error = new Error(`Colecao nao suportada: ${collection}`);
    error.statusCode = 404;
    throw error;
  }
  return map;
}

export async function listRecords(supabaseRequest, collection) {
  const map = getRecordMap(collection);
  const rows = await supabaseRequest(`${map.table}?select=*&order=${map.order}`);
  return (rows || []).map(map.toApp);
}

export async function saveRecord(supabaseRequest, collection, id, item) {
  const map = getRecordMap(collection);
  let record = { ...item, id };

  if (collection === 'users') {
    if (item.password) {
      record.passwordHash = hashPassword(item.password);
    } else {
      const existing = await supabaseRequest(`${map.table}?id=eq.${encodeURIComponent(id)}&select=password_hash&limit=1`);
      record.passwordHash = existing?.[0]?.password_hash;
    }

    if (!record.passwordHash) {
      const error = new Error('Senha obrigatoria para criar usuario');
      error.statusCode = 400;
      throw error;
    }
  }

  const payload = map.toDb(record);
  const results = await supabaseRequest(`${map.table}?on_conflict=id`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(payload),
  });
  const saved = Array.isArray(results) ? results[0] : results;
  return saved ? map.toApp(saved) : { ...item, id };
}

export async function deleteRecord(supabaseRequest, collection, id) {
  const map = getRecordMap(collection);
  await supabaseRequest(`${map.table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  });
}
