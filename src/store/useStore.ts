import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  User, Lead, Visit, Budget, Production, Installation, MeasurementSheet, Subscription,
  KnowledgeItem, Notification, LeadStatus 
} from '../types';
import { api } from '../services/api';

const syncSave = <T extends { id: string }>(collection: string, item: T) => {
  api.saveData(collection, item).catch((error) => console.warn(`Erro ao salvar ${collection}`, error));
};

const syncDelete = (collection: string, id: string) => {
  api.deleteData(collection, id).catch((error) => console.warn(`Erro ao excluir ${collection}`, error));
};

interface AppState {
  hydrateFromDatabase: () => Promise<void>;
  databaseHydrated: boolean;

  // Auth
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  
  // Users
  users: User[];
  addUser: (user: User & { password?: string }) => void;
  updateUser: (id: string, updates: Partial<User> & { password?: string }) => void;
  deleteUser: (id: string) => void;

  // Subscription
  subscription: Subscription;
  updateSubscription: (updates: Partial<Subscription>) => void;
  
  // Leads
  leads: Lead[];
  addLead: (lead: Lead) => void;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  deleteLead: (id: string) => void;
  
  // Visits
  visits: Visit[];
  addVisit: (visit: Visit) => void;
  updateVisit: (id: string, updates: Partial<Visit>) => void;
  deleteVisit: (id: string) => void;

  // Measurement Sheets
  measurementSheets: MeasurementSheet[];
  saveMeasurementSheet: (sheet: MeasurementSheet) => void;
  
  // Budgets
  budgets: Budget[];
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  
  // Productions
  productions: Production[];
  addProduction: (production: Production) => void;
  updateProduction: (id: string, updates: Partial<Production>) => void;
  
  // Installations
  installations: Installation[];
  addInstallation: (installation: Installation) => void;
  updateInstallation: (id: string, updates: Partial<Installation>) => void;
  
  // Knowledge Base
  knowledgeBase: KnowledgeItem[];
  addKnowledgeItem: (item: KnowledgeItem) => void;
  updateKnowledgeItem: (id: string, updates: Partial<KnowledgeItem>) => void;
  deleteKnowledgeItem: (id: string) => void;
  
  // Notifications
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      databaseHydrated: false,
      hydrateFromDatabase: async () => {
        try {
          const [
            leads,
            visits,
            budgets,
            productions,
            installations,
            measurementSheets,
            knowledgeBase,
            subscriptions,
            users,
            notifications,
          ] = await Promise.all([
            api.listData<Lead>('leads'),
            api.listData<Visit>('visits'),
            api.listData<Budget>('budgets'),
            api.listData<Production>('productions'),
            api.listData<Installation>('installations'),
            api.listData<MeasurementSheet>('measurementSheets'),
            api.listData<KnowledgeItem>('knowledgeBase'),
            api.listData<Subscription & { id: string }>('subscriptions'),
            api.listData<User>('users'),
            api.listData<Notification>('notifications'),
          ]);

          set((state) => ({
            databaseHydrated: true,
            leads,
            visits,
            budgets,
            productions,
            installations,
            measurementSheets,
            knowledgeBase,
            subscription: subscriptions[0] || state.subscription,
            users,
            notifications,
          }));
        } catch (error) {
          console.warn('Banco indisponivel, usando dados locais', error);
          set({ databaseHydrated: true });
        }
      },

      // Auth
      currentUser: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        const { user } = await api.login(email, password);
        set({ currentUser: user, isAuthenticated: true, users: [user] });
        return true;
      },
      logout: () => set({ currentUser: null, isAuthenticated: false }),
      
      // Users
      users: [],
      addUser: (user) => set((state) => {
        syncSave('users', user);
        const { password: _password, ...safeUser } = user;
        return { users: [safeUser, ...state.users] };
      }),
      updateUser: (id, updates) => set((state) => {
        const { password: newPassword, ...safeUpdates } = updates;
        const users = state.users.map(user => user.id === id ? { ...user, ...safeUpdates } : user);
        const updated = users.find(user => user.id === id);
        if (updated) syncSave('users', { ...updated, password: newPassword });
        return { users };
      }),
      deleteUser: (id) => set((state) => {
        syncDelete('users', id);
        return { users: state.users.filter(user => user.id !== id) };
      }),

      // Subscription
      subscription: {
        customerName: 'Marquinhos',
        customerDocument: '00.000.000/0001-00',
        customerEmail: 'financeiro@marquinhos.com',
        plan: 'professional',
        status: 'trial',
        amount: 297,
        billingCycle: 'monthly',
        maxUsers: 10,
        dueDay: 10,
        nextDueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        paymentMethod: 'pix',
        invoiceUrl: '',
        notes: 'Assinatura em periodo de implantacao.',
        updatedAt: new Date(),
      },
      updateSubscription: (updates) => set((state) => {
        const subscription = { ...state.subscription, ...updates, updatedAt: new Date() };
        syncSave('subscriptions', { id: 'main', ...subscription });
        return { subscription };
      }),
      
      // Leads
      leads: [],
      addLead: (lead) => set((state) => {
        syncSave('leads', lead);
        return { leads: [lead, ...state.leads] };
      }),
      updateLead: (id, updates) => set((state) => {
        const leads = state.leads.map(l => l.id === id ? { ...l, ...updates, updatedAt: new Date() } : l);
        const updated = leads.find(l => l.id === id);
        if (updated) syncSave('leads', updated);
        return { leads };
      }),
      updateLeadStatus: (id, status) => set((state) => {
        const leads = state.leads.map(l => l.id === id ? { ...l, status, lastInteractionAt: new Date(), updatedAt: new Date() } : l);
        const updated = leads.find(l => l.id === id);
        if (updated) syncSave('leads', updated);
        return { leads };
      }),
      deleteLead: (id) => set((state) => {
        syncDelete('leads', id);
        return { leads: state.leads.filter(l => l.id !== id) };
      }),
      
      // Visits
      visits: [],
      addVisit: (visit) => set((state) => {
        syncSave('visits', visit);
        return { visits: [visit, ...state.visits] };
      }),
      updateVisit: (id, updates) => set((state) => {
        const visits = state.visits.map(v => v.id === id ? { ...v, ...updates } : v);
        const updated = visits.find(v => v.id === id);
        if (updated) syncSave('visits', updated);
        return { visits };
      }),
      deleteVisit: (id) => set((state) => {
        syncDelete('visits', id);
        return { visits: state.visits.filter(v => v.id !== id) };
      }),

      // Measurement Sheets
      measurementSheets: [],
      saveMeasurementSheet: (sheet) => set((state) => {
        const exists = state.measurementSheets.some(s => s.id === sheet.id);
        syncSave('measurementSheets', sheet);
        return {
          measurementSheets: exists
            ? state.measurementSheets.map(s => s.id === sheet.id ? sheet : s)
            : [sheet, ...state.measurementSheets]
        };
      }),
      
      // Budgets
      budgets: [],
      addBudget: (budget) => set((state) => {
        syncSave('budgets', budget);
        return { budgets: [budget, ...state.budgets] };
      }),
      updateBudget: (id, updates) => set((state) => {
        const budgets = state.budgets.map(b => b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b);
        const updated = budgets.find(b => b.id === id);
        if (updated) syncSave('budgets', updated);
        return { budgets };
      }),
      deleteBudget: (id) => set((state) => {
        syncDelete('budgets', id);
        return { budgets: state.budgets.filter(b => b.id !== id) };
      }),
      
      // Productions
      productions: [],
      addProduction: (production) => set((state) => {
        syncSave('productions', production);
        return { productions: [production, ...state.productions] };
      }),
      updateProduction: (id, updates) => set((state) => {
        const productions = state.productions.map(p => p.id === id ? { ...p, ...updates } : p);
        const updated = productions.find(p => p.id === id);
        if (updated) syncSave('productions', updated);
        return { productions };
      }),
      
      // Installations
      installations: [],
      addInstallation: (installation) => set((state) => {
        syncSave('installations', installation);
        return { installations: [installation, ...state.installations] };
      }),
      updateInstallation: (id, updates) => set((state) => {
        const installations = state.installations.map(i => i.id === id ? { ...i, ...updates } : i);
        const updated = installations.find(i => i.id === id);
        if (updated) syncSave('installations', updated);
        return { installations };
      }),
      
      // Knowledge Base
      knowledgeBase: [],
      addKnowledgeItem: (item) => set((state) => {
        syncSave('knowledgeBase', item);
        return { knowledgeBase: [item, ...state.knowledgeBase] };
      }),
      updateKnowledgeItem: (id, updates) => set((state) => {
        const knowledgeBase = state.knowledgeBase.map(k => k.id === id ? { ...k, ...updates } : k);
        const updated = knowledgeBase.find(k => k.id === id);
        if (updated) syncSave('knowledgeBase', updated);
        return { knowledgeBase };
      }),
      deleteKnowledgeItem: (id) => set((state) => {
        syncDelete('knowledgeBase', id);
        return { knowledgeBase: state.knowledgeBase.filter(k => k.id !== id) };
      }),
      
      // Notifications
      notifications: [],
      addNotification: (notification) => set((state) => {
        syncSave('notifications', notification);
        return { notifications: [notification, ...state.notifications].slice(0, 50) };
      }),
      markNotificationRead: (id) => set((state) => {
        const notifications = state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
        const updated = notifications.find(n => n.id === id);
        if (updated) syncSave('notifications', updated);
        return { notifications };
      }),
      clearNotifications: () => set((state) => {
        state.notifications.forEach((notification) => syncDelete('notifications', notification.id));
        return { notifications: [] };
      }),
      
      // UI State
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      activeTab: 'dashboard',
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'marquinhos-storage',
      version: 3,
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
