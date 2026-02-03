// ========================================
// CONFIGURACIÓN DE LA API
// ========================================
const DEFAULT_API_URL = 'https://sign-boxed-developer-saved.trycloudflare.com/api';
const API_URL = (() => {
  try {
    const params = new URLSearchParams(window.location.search);
    const apiParam = params.get('api');
    if (apiParam) {
      const normalized = apiParam.replace(/\/$/, '');
      const urlWithApi = normalized.endsWith('/api') ? normalized : `${normalized}/api`;
      localStorage.setItem('subs_api_url', urlWithApi);
      return urlWithApi;
    }
    const stored = localStorage.getItem('subs_api_url');
    if (stored) return stored;
  } catch {}
  return DEFAULT_API_URL;
})();
const APP_TIMEZONE = 'America/Bogota';
const USE_LOCAL_STORAGE = false; // Usar servidor

// ========================================
// ESTADO GLOBAL
// ========================================
const AppState = {
  clients: [],
  plans: [],
  subscriptions: [],
  payments: [],
  reminders: [],
  config: {},
  wompiConfig: { publicKey: '', environment: 'test' },
  currentView: 'dashboard',
  isOnline: navigator.onLine,
  serverAvailable: false
};

// ========================================
// UTILIDADES LOCALSTORAGE
// ========================================
const Storage = {
  get(key) {
    const data = localStorage.getItem('subs_' + key);
    return data ? JSON.parse(data) : null;
  },
  set(key, value) {
    localStorage.setItem('subs_' + key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem('subs_' + key);
  }
};

// ========================================
// DATOS DE DEMOSTRACIÓN
// ========================================
const DemoData = {
  clients: [
    { id: 'cli_1', name: 'María García', email: 'maria@ejemplo.com', phone: '+57 300 123 4567', document: 'CC 1234567890', notes: 'Cliente frecuente', createdAt: '2025-01-15T10:00:00Z' },
    { id: 'cli_2', name: 'Carlos Rodríguez', email: 'carlos@ejemplo.com', phone: '+57 311 234 5678', document: 'CC 0987654321', notes: '', createdAt: '2025-02-01T14:30:00Z' },
    { id: 'cli_3', name: 'Ana Martínez', email: 'ana@ejemplo.com', phone: '+57 320 345 6789', document: 'CC 1122334455', notes: 'Prefiere WhatsApp', createdAt: '2025-02-10T09:15:00Z' }
  ],
  plans: [
    { id: 'plan_1', name: 'Plan Básico', price: 50000, billingCycle: 'monthly', description: 'Ideal para comenzar', features: ['Acceso básico', 'Soporte por email', '1 usuario'], featured: false, createdAt: '2025-01-01T00:00:00Z' },
    { id: 'plan_2', name: 'Plan Premium', price: 100000, billingCycle: 'monthly', description: 'Para profesionales', features: ['Acceso completo', 'Soporte prioritario', '5 usuarios', 'Reportes avanzados'], featured: true, createdAt: '2025-01-01T00:00:00Z' },
    { id: 'plan_3', name: 'Plan Anual', price: 500000, billingCycle: 'yearly', description: 'Ahorra 2 meses', features: ['Todo incluido', 'Soporte 24/7', 'Usuarios ilimitados', 'API access'], featured: false, createdAt: '2025-01-01T00:00:00Z' }
  ],
  subscriptions: [
    { id: 'sub_1', clientId: 'cli_1', planId: 'plan_2', amount: 100000, billingCycle: 'monthly', startDate: '2025-01-15T00:00:00Z', nextPaymentDate: '2026-02-15T00:00:00Z', lastPaymentDate: '2026-01-15T00:00:00Z', status: 'active', notes: '', createdAt: '2025-01-15T00:00:00Z' },
    { id: 'sub_2', clientId: 'cli_2', planId: 'plan_1', amount: 50000, billingCycle: 'monthly', startDate: '2025-02-01T00:00:00Z', nextPaymentDate: '2026-01-28T00:00:00Z', lastPaymentDate: '2025-12-28T00:00:00Z', status: 'active', notes: '', createdAt: '2025-02-01T00:00:00Z' },
    { id: 'sub_3', clientId: 'cli_3', planId: 'plan_3', amount: 500000, billingCycle: 'yearly', startDate: '2025-02-10T00:00:00Z', nextPaymentDate: '2026-02-10T00:00:00Z', lastPaymentDate: '2025-02-10T00:00:00Z', status: 'active', notes: '', createdAt: '2025-02-10T00:00:00Z' }
  ],
  payments: [
    { id: 'pay_1', subscriptionId: 'sub_1', clientId: 'cli_1', amount: 100000, status: 'APPROVED', paymentMethod: 'card', createdAt: '2026-01-15T10:30:00Z' },
    { id: 'pay_2', subscriptionId: 'sub_2', clientId: 'cli_2', amount: 50000, status: 'APPROVED', paymentMethod: 'payment_link', createdAt: '2025-12-28T15:45:00Z' },
    { id: 'pay_3', subscriptionId: 'sub_3', clientId: 'cli_3', amount: 500000, status: 'APPROVED', paymentMethod: 'manual', createdAt: '2025-02-10T09:20:00Z' }
  ]
};

// ========================================
// CLIENTE API (con fallback a localStorage)
// ========================================
const API = {
  async checkServer() {
    if (!USE_LOCAL_STORAGE) {
      try {
        const response = await fetch(`${API_URL}/clients`, { method: 'HEAD' });
        AppState.serverAvailable = response.ok;
      } catch {
        AppState.serverAvailable = false;
      }
    }
    return AppState.serverAvailable;
  },

  async getAll(table) {
    // Primero intentar localStorage
    let data = Storage.get(table);
    
    // Si no hay datos, intentar servidor
    if (!data && AppState.serverAvailable) {
      try {
        const response = await fetch(`${API_URL}/${table}`);
        if (response.ok) {
          data = await response.json();
          Storage.set(table, data);
        }
      } catch (error) {
        console.warn(`Servidor no disponible, usando localStorage para ${table}`);
      }
    }
    
    // Si aún no hay datos, usar demo data
    if (!data || data.length === 0) {
      data = DemoData[table] || [];
      Storage.set(table, data);
    }
    
    return data;
  },

  async getOne(table, id) {
    const all = await this.getAll(table);
    return all.find(item => item.id === id);
  },

  async save(table, items) {
    Storage.set(table, items);
    
    if (AppState.serverAvailable) {
      try {
        await fetch(`${API_URL}/${table}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(items)
        });
      } catch (error) {
        console.warn('Error sincronizando con servidor:', error);
      }
    }
    
    return { success: true };
  },

  async update(table, id, item) {
    let items = Storage.get(table) || [];
    const index = items.findIndex(i => i.id === id);
    
    if (index >= 0) {
      items[index] = { ...items[index], ...item };
    } else {
      items.push(item);
    }
    
    Storage.set(table, items);
    
    if (AppState.serverAvailable) {
      try {
        await fetch(`${API_URL}/${table}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      } catch (error) {
        console.warn('Error sincronizando con servidor:', error);
      }
    }
    
    return { success: true };
  },

  async delete(table, id) {
    let items = Storage.get(table) || [];
    items = items.filter(i => i.id !== id);
    Storage.set(table, items);
    
    if (AppState.serverAvailable) {
      try {
        await fetch(`${API_URL}/${table}/${id}`, { method: 'DELETE' });
      } catch (error) {
        console.warn('Error sincronizando con servidor:', error);
      }
    }
    
    return { success: true };
  }
};

// ========================================
// UTILIDADES
// ========================================
const Utils = {
  generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  },

  formatDate(date) {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },

  formatDateTime(date) {
    return new Date(date).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  daysUntil(date) {
    const now = new Date();
    const target = new Date(date);
    const diff = target - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// ========================================
// WOMPI API
// ========================================
const Wompi = {
  async getConfig() {
    try {
      const response = await fetch(`${API_URL}/wompi/config`);
      if (!response.ok) throw new Error('Config no disponible');
      return await response.json();
    } catch (error) {
      console.warn('No se pudo cargar config Wompi desde el servidor');
      return { publicKey: '', environment: 'test' };
    }
  },

  async createPaymentLink(data) {
    // Pedir datos del cliente si no están presentes
    if (!data.customer_email || !data.name) {
      // Mostrar formulario modal para capturar datos
      return new Promise((resolve) => {
        Modal.show(
          'Datos del cliente',
          `<form id="wompi-client-form" class="space-y-4">
            <div>
              <label class="text-sm text-gray-600">Nombre *</label>
              <input type="text" name="name" required class="input-field" placeholder="Nombre completo">
            </div>
            <div>
              <label class="text-sm text-gray-600">Email *</label>
              <input type="email" name="customer_email" required class="input-field" placeholder="correo@ejemplo.com">
            </div>
          </form>`,
          [
            { text: 'Cancelar', onclick: 'Modal.hide()', class: 'btn-secondary' },
            { text: 'Continuar', onclick: 'App._continueWompiLink()', class: 'btn-primary', icon: 'arrow_forward' }
          ]
        );
        App._continueWompiLink = async function() {
          const form = document.getElementById('wompi-client-form');
          const formData = new FormData(form);
          data.name = formData.get('name');
          data.customer_email = formData.get('customer_email');
          Modal.hide();
          const result = await Wompi.createPaymentLink(data);
          resolve(result);
        };
      });
    }
    if (!AppState.serverAvailable) {
      Notifications.show('Necesitas conexión al servidor para crear links de pago', 'warning');
      return null;
    }
    try {
      const response = await fetch(`${API_URL}/wompi/payment-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Error creando link de pago:', error);
      throw error;
    }
  },

  async getAcceptanceToken() {
    try {
      const response = await fetch(`${API_URL}/wompi/acceptance-token`);
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo acceptance token:', error);
      throw error;
    }
  },

  async createTransaction(data) {
    try {
      const response = await fetch(`${API_URL}/wompi/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Error creando transacción:', error);
      throw error;
    }
  },

  async getTransaction(id) {
    try {
      const response = await fetch(`${API_URL}/wompi/transactions/${id}`);
      return await response.json();
    } catch (error) {
      console.error('Error obteniendo transacción:', error);
      throw error;
    }
  },

  async tokenizeCard(cardData) {
    try {
      const response = await fetch(`${API_URL}/wompi/tokens/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardData)
      });
      return await response.json();
    } catch (error) {
      console.error('Error tokenizando tarjeta:', error);
      throw error;
    }
  },

  async createPaymentSource(data) {
    try {
      const response = await fetch(`${API_URL}/wompi/payment-sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Error creando payment source:', error);
      throw error;
    }
  },

  async chargeSource(data) {
    try {
      const response = await fetch(`${API_URL}/wompi/charge-source`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('Error cobrando:', error);
      throw error;
    }
  }
};

// ========================================
// NOTIFICACIONES
// ========================================
const Notifications = {
  show(message, type = 'info') {
    const container = document.getElementById('notifications');
    if (!container) return;

    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-indigo-500'
    };

    const notification = document.createElement('div');
    notification.className = `${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="material-icons-round text-xl">
          ${type === 'success' ? 'check_circle' : type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'info'}
        </span>
        <span>${message}</span>
      </div>
    `;

    container.appendChild(notification);
    
    setTimeout(() => notification.classList.remove('translate-x-full'), 10);
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  },

  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  },

  async sendPush(title, body, data = {}) {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      const registration = await navigator.serviceWorker.ready;
      registration.active.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        options: {
          body,
          icon: 'icon-192.svg',
          badge: 'icon-192.svg',
          data
        }
      });
    }
  }
};

// ========================================
// MODAL
// ========================================
const Modal = {
  show(title, content, actions = []) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalActions = document.getElementById('modal-actions');

    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    
    modalActions.innerHTML = actions.map(action => `
      <button onclick="${action.onclick}" class="${action.class || 'btn-secondary'}">
        ${action.icon ? `<span class="material-icons-round">${action.icon}</span>` : ''}
        ${action.text}
      </button>
    `).join('');

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  hide() {
    const modal = document.getElementById('modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
};

// ========================================
// VISTAS
// ========================================
const Views = {
  // Calcular stats localmente
  getLocalStats() {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Suscripciones activas
    const activeSubs = AppState.subscriptions.filter(s => s.status === 'active').length;

    // Vencidas
    const overdueSubs = AppState.subscriptions.filter(s => {
      return s.status === 'active' && new Date(s.nextPaymentDate) < now;
    }).length;

    // Próximas a vencer (7 días)
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingSubs = AppState.subscriptions.filter(s => {
      const next = new Date(s.nextPaymentDate);
      return s.status === 'active' && next >= now && next <= futureDate;
    }).length;

    // Ingresos del mes
    const monthlyRevenue = AppState.payments
      .filter(p => {
        const date = new Date(p.createdAt);
        return date.getMonth() === thisMonth &&
          date.getFullYear() === thisYear &&
          p.status === 'APPROVED';
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      totalClients: AppState.clients.length,
      activeSubscriptions: activeSubs,
      overdueSubscriptions: overdueSubs,
      upcomingSubscriptions: upcomingSubs,
      monthlyRevenue
    };
  },

  getUpcomingSubscriptions(days = 7) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return AppState.subscriptions
      .filter(sub => {
        const nextPayment = new Date(sub.nextPaymentDate);
        return nextPayment >= now && nextPayment <= futureDate && sub.status === 'active';
      })
      .sort((a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate));
  },

  getOverdueSubscriptions() {
    const now = new Date();
    return AppState.subscriptions
      .filter(sub => {
        const nextPayment = new Date(sub.nextPaymentDate);
        return nextPayment < now && sub.status === 'active';
      })
      .sort((a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate));
  },

  // Dashboard
  async renderDashboard() {
    try {
      const stats = this.getLocalStats();
      const upcoming = this.getUpcomingSubscriptions(7);
      const overdue = this.getOverdueSubscriptions();

      const content = document.getElementById('main-content');
      content.innerHTML = `
        <div class="p-6">
          <h1 class="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
          
          <!-- Stats Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-white rounded-2xl p-5 shadow-sm">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <span class="material-icons-round text-indigo-600">people</span>
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-800">${stats.totalClients}</p>
                  <p class="text-sm text-gray-500">Clientes</p>
                </div>
              </div>
            </div>
            
            <div class="bg-white rounded-2xl p-5 shadow-sm">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <span class="material-icons-round text-green-600">check_circle</span>
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-800">${stats.activeSubscriptions}</p>
                  <p class="text-sm text-gray-500">Activas</p>
                </div>
              </div>
            </div>
            
            <div class="bg-white rounded-2xl p-5 shadow-sm">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <span class="material-icons-round text-red-600">warning</span>
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-800">${stats.overdueSubscriptions}</p>
                  <p class="text-sm text-gray-500">Vencidas</p>
                </div>
              </div>
            </div>
            
            <div class="bg-white rounded-2xl p-5 shadow-sm">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span class="material-icons-round text-blue-600">payments</span>
                </div>
                <div>
                  <p class="text-2xl font-bold text-gray-800">${Utils.formatCurrency(stats.monthlyRevenue)}</p>
                  <p class="text-sm text-gray-500">Este mes</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Alertas -->
          ${overdue.length > 0 ? `
            <div class="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
              <h3 class="font-semibold text-red-800 flex items-center gap-2 mb-3">
                <span class="material-icons-round">error</span>
                Suscripciones Vencidas (${overdue.length})
              </h3>
              <div class="space-y-2">
                ${overdue.slice(0, 5).map(sub => {
                  const client = AppState.clients.find(c => c.id === sub.clientId);
                  return `
                    <div class="flex items-center justify-between bg-white rounded-lg p-3">
                      <div>
                        <p class="font-medium text-gray-800">${client?.name || 'Cliente'}</p>
                        <p class="text-sm text-gray-500">Venció: ${Utils.formatDate(sub.nextPaymentDate)}</p>
                      </div>
                      <button onclick="App.sendPaymentReminder('${sub.id}')" class="btn-primary-sm">
                        <span class="material-icons-round text-sm">send</span>
                        Recordar
                      </button>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Próximos pagos -->
          <div class="bg-white rounded-2xl p-5 shadow-sm">
            <h3 class="font-semibold text-gray-800 flex items-center gap-2 mb-4">
              <span class="material-icons-round text-indigo-600">schedule</span>
              Próximos Pagos (7 días)
            </h3>
            ${upcoming.length > 0 ? `
              <div class="space-y-3">
                ${upcoming.map(sub => {
                  const client = AppState.clients.find(c => c.id === sub.clientId);
                  const plan = AppState.plans.find(p => p.id === sub.planId);
                  const days = Utils.daysUntil(sub.nextPaymentDate);
                  return `
                    <div class="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span class="text-indigo-600 font-semibold">${(client?.name || 'C')[0]}</span>
                        </div>
                        <div>
                          <p class="font-medium text-gray-800">${client?.name || 'Cliente'}</p>
                          <p class="text-sm text-gray-500">${plan?.name || 'Plan'} - ${Utils.formatCurrency(sub.amount)}</p>
                        </div>
                      </div>
                      <div class="text-right">
                        <p class="text-sm font-medium ${days <= 2 ? 'text-red-600' : 'text-gray-600'}">
                          ${days === 0 ? 'Hoy' : days === 1 ? 'Mañana' : `En ${days} días`}
                        </p>
                        <p class="text-xs text-gray-400">${Utils.formatDate(sub.nextPaymentDate)}</p>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <p class="text-gray-500 text-center py-8">No hay pagos próximos</p>
            `}
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error renderizando dashboard:', error);
      Notifications.show('Error cargando dashboard', 'error');
    }
  },

  // Clientes
  renderClients() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold text-gray-800">Clientes</h1>
          <button onclick="App.showClientForm()" class="btn-primary">
            <span class="material-icons-round">add</span>
            Nuevo Cliente
          </button>
        </div>
        
        <div class="mb-4">
          <input type="text" id="search-clients" placeholder="Buscar clientes..." 
            class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            oninput="Views.filterClients(this.value)">
        </div>

        <div id="clients-list" class="space-y-3">
          ${this.renderClientsList(AppState.clients)}
        </div>
      </div>
    `;
  },

  renderClientsList(clients) {
    if (clients.length === 0) {
      return `<p class="text-gray-500 text-center py-8">No hay clientes registrados</p>`;
    }

    return clients.map(client => {
      const subs = AppState.subscriptions.filter(s => s.clientId === client.id && s.status === 'active');
      return `
        <div class="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <span class="text-indigo-600 font-bold text-lg">${client.name[0]}</span>
              </div>
              <div>
                <p class="font-semibold text-gray-800">${client.name}</p>
                <p class="text-sm text-gray-500">${client.email || ''}</p>
                <p class="text-xs text-gray-400">${client.phone || ''}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full">
                ${subs.length} suscripción${subs.length !== 1 ? 'es' : ''}
              </span>
              <button onclick="App.showClientForm('${client.id}')" class="p-2 hover:bg-gray-100 rounded-lg">
                <span class="material-icons-round text-gray-500">edit</span>
              </button>
              <button onclick="App.deleteClient('${client.id}')" class="p-2 hover:bg-red-100 rounded-lg">
                <span class="material-icons-round text-red-500">delete</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  filterClients(query) {
    const filtered = AppState.clients.filter(c => 
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(query.toLowerCase())) ||
      (c.phone && c.phone.includes(query))
    );
    document.getElementById('clients-list').innerHTML = this.renderClientsList(filtered);
  },

  // Planes
  renderPlans() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold text-gray-800">Planes de Suscripción</h1>
          <button onclick="App.showPlanForm()" class="btn-primary">
            <span class="material-icons-round">add</span>
            Nuevo Plan
          </button>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4" id="plans-list">
          ${this.renderPlansList()}
        </div>
      </div>
    `;
  },

  renderPlansList() {
    if (AppState.plans.length === 0) {
      return `<p class="text-gray-500 text-center py-8 col-span-full">No hay planes creados</p>`;
    }

    const cycleLabels = {
      weekly: 'Semanal',
      monthly: 'Mensual',
      yearly: 'Anual'
    };

    return AppState.plans.map(plan => {
      const subsCount = AppState.subscriptions.filter(s => s.planId === plan.id && s.status === 'active').length;
      return `
        <div class="bg-white rounded-2xl p-5 shadow-sm border-2 ${plan.featured ? 'border-indigo-500' : 'border-transparent'}">
          ${plan.featured ? '<span class="text-xs bg-indigo-500 text-white px-2 py-1 rounded-full">Popular</span>' : ''}
          <h3 class="text-xl font-bold text-gray-800 mt-2">${plan.name}</h3>
          <p class="text-3xl font-bold text-indigo-600 my-3">
            ${Utils.formatCurrency(plan.price)}
            <span class="text-sm text-gray-500 font-normal">/${cycleLabels[plan.billingCycle] || plan.billingCycle}</span>
          </p>
          <p class="text-gray-500 text-sm mb-4">${plan.description || ''}</p>
          
          ${plan.features ? `
            <ul class="space-y-2 mb-4">
              ${plan.features.map(f => `
                <li class="flex items-center gap-2 text-sm text-gray-600">
                  <span class="material-icons-round text-green-500 text-base">check</span>
                  ${f}
                </li>
              `).join('')}
            </ul>
          ` : ''}
          
          <div class="flex items-center justify-between pt-4 border-t border-gray-100">
            <span class="text-sm text-gray-500">${subsCount} suscriptor${subsCount !== 1 ? 'es' : ''}</span>
            <div class="flex gap-2">
              <button onclick="App.showPlanForm('${plan.id}')" class="p-2 hover:bg-gray-100 rounded-lg">
                <span class="material-icons-round text-gray-500">edit</span>
              </button>
              <button onclick="App.deletePlan('${plan.id}')" class="p-2 hover:bg-red-100 rounded-lg">
                <span class="material-icons-round text-red-500">delete</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // Suscripciones
  renderSubscriptions() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold text-gray-800">Suscripciones</h1>
          <button onclick="App.showSubscriptionForm()" class="btn-primary">
            <span class="material-icons-round">add</span>
            Nueva Suscripción
          </button>
        </div>
        
        <div class="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
          <button onclick="Views.filterSubscriptions('all')" class="filter-btn active" data-filter="all">Todas</button>
          <button onclick="Views.filterSubscriptions('active')" class="filter-btn" data-filter="active">Activas</button>
          <button onclick="Views.filterSubscriptions('overdue')" class="filter-btn" data-filter="overdue">Vencidas</button>
          <button onclick="Views.filterSubscriptions('cancelled')" class="filter-btn" data-filter="cancelled">Canceladas</button>
        </div>

        <div id="subscriptions-list" class="space-y-3">
          ${this.renderSubscriptionsList(AppState.subscriptions)}
        </div>
      </div>
    `;
  },

  renderSubscriptionsList(subscriptions) {
    if (subscriptions.length === 0) {
      return `<p class="text-gray-500 text-center py-8">No hay suscripciones</p>`;
    }

    const statusColors = {
      active: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
      pending: 'bg-yellow-100 text-yellow-700'
    };

    const statusLabels = {
      active: 'Activa',
      overdue: 'Vencida',
      cancelled: 'Cancelada',
      pending: 'Pendiente'
    };

    return subscriptions.map(sub => {
      const client = AppState.clients.find(c => c.id === sub.clientId);
      const plan = AppState.plans.find(p => p.id === sub.planId);
      const isOverdue = sub.status === 'active' && new Date(sub.nextPaymentDate) < new Date();
      const status = isOverdue ? 'overdue' : sub.status;

      return `
        <div class="bg-white rounded-2xl p-4 shadow-sm">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <span class="text-indigo-600 font-bold">${(client?.name || 'C')[0]}</span>
              </div>
              <div>
                <p class="font-semibold text-gray-800">${client?.name || 'Cliente'}</p>
                <p class="text-sm text-gray-500">${plan?.name || 'Plan'}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs ${statusColors[status]} px-2 py-0.5 rounded-full">
                    ${statusLabels[status]}
                  </span>
                  <span class="text-xs text-gray-400">
                    Próximo: ${Utils.formatDate(sub.nextPaymentDate)}
                  </span>
                </div>
              </div>
            </div>
            <div class="text-right">
              <p class="font-bold text-gray-800">${Utils.formatCurrency(sub.amount)}</p>
              <div class="flex gap-1 mt-2">
                <button onclick="App.showPaymentModal('${sub.id}')" class="p-2 hover:bg-green-100 rounded-lg" title="Cobrar">
                  <span class="material-icons-round text-green-600">payments</span>
                </button>
                <button onclick="App.sendPaymentReminder('${sub.id}')" class="p-2 hover:bg-blue-100 rounded-lg" title="Enviar recordatorio">
                  <span class="material-icons-round text-blue-600">send</span>
                </button>
                <button onclick="App.showSubscriptionForm('${sub.id}')" class="p-2 hover:bg-gray-100 rounded-lg" title="Editar">
                  <span class="material-icons-round text-gray-500">edit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  filterSubscriptions(filter) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    let filtered = AppState.subscriptions;
    const now = new Date();

    if (filter === 'active') {
      filtered = AppState.subscriptions.filter(s => s.status === 'active' && new Date(s.nextPaymentDate) >= now);
    } else if (filter === 'overdue') {
      filtered = AppState.subscriptions.filter(s => s.status === 'active' && new Date(s.nextPaymentDate) < now);
    } else if (filter === 'cancelled') {
      filtered = AppState.subscriptions.filter(s => s.status === 'cancelled');
    }

    document.getElementById('subscriptions-list').innerHTML = this.renderSubscriptionsList(filtered);
  },

  // Pagos
  renderPayments() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-2xl font-bold text-gray-800">Historial de Pagos</h1>
        </div>
        
        <div id="payments-list" class="space-y-3">
          ${this.renderPaymentsList()}
        </div>
      </div>
    `;
  },

  renderPaymentsList() {
    const payments = AppState.payments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (payments.length === 0) {
      return `<p class="text-gray-500 text-center py-8">No hay pagos registrados</p>`;
    }

    const statusColors = {
      APPROVED: 'bg-green-100 text-green-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      DECLINED: 'bg-red-100 text-red-700',
      ERROR: 'bg-red-100 text-red-700',
      VOIDED: 'bg-gray-100 text-gray-700'
    };

    const statusLabels = {
      APPROVED: 'Aprobado',
      PENDING: 'Pendiente',
      DECLINED: 'Rechazado',
      ERROR: 'Error',
      VOIDED: 'Anulado'
    };

    return payments.map(payment => {
      const client = AppState.clients.find(c => c.id === payment.clientId);
      return `
        <div class="bg-white rounded-2xl p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 ${statusColors[payment.status] || 'bg-gray-100'} rounded-full flex items-center justify-center">
                <span class="material-icons-round">
                  ${payment.status === 'APPROVED' ? 'check' : payment.status === 'PENDING' ? 'schedule' : 'close'}
                </span>
              </div>
              <div>
                <p class="font-semibold text-gray-800">${client?.name || 'Cliente'}</p>
                <p class="text-sm text-gray-500">${Utils.formatDateTime(payment.createdAt)}</p>
                <span class="text-xs ${statusColors[payment.status]} px-2 py-0.5 rounded-full">
                  ${statusLabels[payment.status] || payment.status}
                </span>
              </div>
            </div>
            <div class="text-right">
              <p class="font-bold text-gray-800">${Utils.formatCurrency(payment.amount)}</p>
              <p class="text-xs text-gray-400">${payment.paymentMethod || ''}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // Configuración
  renderSettings() {
    const content = document.getElementById('main-content');
    content.innerHTML = `
      <div class="p-6">
        <h1 class="text-2xl font-bold text-gray-800 mb-6">Configuración</h1>
        
        <div class="space-y-4">
          <!-- Notificaciones -->
          <div class="bg-white rounded-2xl p-5 shadow-sm">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span class="material-icons-round text-indigo-600">notifications</span>
              Notificaciones
            </h3>
            <div class="space-y-3">
              <label class="flex items-center justify-between">
                <span class="text-gray-600">Activar notificaciones push</span>
                <button onclick="App.toggleNotifications()" class="toggle-btn" id="notifications-toggle">
                  <span class="toggle-slider"></span>
                </button>
              </label>
              <label class="flex items-center justify-between">
                <span class="text-gray-600">Recordar días antes del vencimiento</span>
                <select class="px-3 py-2 border border-gray-200 rounded-lg" onchange="App.updateReminderDays(this.value)">
                  <option value="1">1 día</option>
                  <option value="3" selected>3 días</option>
                  <option value="7">7 días</option>
                </select>
              </label>
            </div>
          </div>

          <!-- Wompi -->
          <div class="bg-white rounded-2xl p-5 shadow-sm">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span class="material-icons-round text-indigo-600">credit_card</span>
              Configuración Wompi
            </h3>
            <div class="space-y-3">
              <div>
                <label class="text-sm text-gray-500">Ambiente actual</label>
                <p class="font-medium text-gray-800" id="wompi-environment">
                  ${AppState.wompiConfig.environment === 'production' ? '🚀 Producción' : '🧪 Sandbox (Pruebas)'}
                </p>
              </div>
              <div>
                <label class="text-sm text-gray-500">Llave pública</label>
                <p class="font-mono text-xs text-gray-600 break-all">${AppState.wompiConfig.publicKey || 'No configurada'}</p>
              </div>
              <p class="text-xs text-gray-400">
                Para cambiar a producción, edita las credenciales en server.js
              </p>
            </div>
          </div>

          <!-- Negocio -->
          <div class="bg-white rounded-2xl p-5 shadow-sm">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span class="material-icons-round text-indigo-600">business</span>
              Información del Negocio
            </h3>
            <form id="business-form" class="space-y-3">
              <div>
                <label class="text-sm text-gray-500">Nombre del negocio</label>
                <input type="text" name="businessName" class="input-field" placeholder="Mi Negocio">
              </div>
              <div>
                <label class="text-sm text-gray-500">Email de contacto</label>
                <input type="email" name="contactEmail" class="input-field" placeholder="contacto@minegocio.com">
              </div>
              <div>
                <label class="text-sm text-gray-500">Teléfono/WhatsApp</label>
                <input type="tel" name="phone" class="input-field" placeholder="+57 300 123 4567">
              </div>
              <button type="submit" class="btn-primary w-full">
                Guardar Configuración
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  }
};

// ========================================
// APP PRINCIPAL
// ========================================
const App = {
  async init() {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('service-worker.js');
        console.log('Service Worker registrado');
      } catch (error) {
        console.error('Error registrando SW:', error);
      }
    }

    // Cargar datos iniciales
    await this.loadData();

    // Cargar config de Wompi
    try {
      AppState.wompiConfig = await Wompi.getConfig();
    } catch (e) {
      console.warn('No se pudo cargar config Wompi');
    }

    // Renderizar vista inicial
    this.navigate('dashboard');

    // Listeners
    this.setupEventListeners();

    // Verificar recordatorios
    this.checkReminders();
  },

  async loadData() {
    try {
      const [clients, plans, subscriptions, payments] = await Promise.all([
        API.getAll('clients'),
        API.getAll('plans'),
        API.getAll('subscriptions'),
        API.getAll('payments')
      ]);

      AppState.clients = clients;
      AppState.plans = plans;
      AppState.subscriptions = subscriptions;
      AppState.payments = payments;
    } catch (error) {
      console.error('Error cargando datos:', error);
      Notifications.show('Error cargando datos', 'error');
    }
  },

  setupEventListeners() {
    // Navegación
    document.querySelectorAll('[data-view]').forEach(el => {
      el.addEventListener('click', () => this.navigate(el.dataset.view));
    });

    // Cerrar modal
    document.getElementById('modal-overlay')?.addEventListener('click', Modal.hide);

    // Online/Offline
    window.addEventListener('online', () => {
      AppState.isOnline = true;
      Notifications.show('Conexión restaurada', 'success');
    });

    window.addEventListener('offline', () => {
      AppState.isOnline = false;
      Notifications.show('Sin conexión', 'warning');
    });
  },

  navigate(view) {
    AppState.currentView = view;
    
    // Actualizar navegación activa
    document.querySelectorAll('[data-view]').forEach(el => {
      el.classList.toggle('active', el.dataset.view === view);
    });

    // Cerrar sidebar en móvil
    document.getElementById('sidebar')?.classList.remove('mobile-open');
    document.getElementById('sidebar-overlay')?.classList.add('hidden');

    // Renderizar vista
    switch(view) {
      case 'dashboard': Views.renderDashboard(); break;
      case 'clients': Views.renderClients(); break;
      case 'plans': Views.renderPlans(); break;
      case 'subscriptions': Views.renderSubscriptions(); break;
      case 'payments': Views.renderPayments(); break;
      case 'settings': Views.renderSettings(); break;
    }
  },

  toggleSidebar() {
    document.getElementById('sidebar')?.classList.toggle('mobile-open');
    document.getElementById('sidebar-overlay')?.classList.toggle('hidden');
  },

  // ========================================
  // CRUD CLIENTES
  // ========================================
  showClientForm(clientId = null) {
    const client = clientId ? AppState.clients.find(c => c.id === clientId) : null;
    
    Modal.show(
      client ? 'Editar Cliente' : 'Nuevo Cliente',
      `
        <form id="client-form" class="space-y-4">
          <input type="hidden" name="id" value="${client?.id || ''}">
          <div>
            <label class="text-sm text-gray-600">Nombre *</label>
            <input type="text" name="name" required class="input-field" value="${client?.name || ''}" placeholder="Nombre completo">
          </div>
          <div>
            <label class="text-sm text-gray-600">Email</label>
            <input type="email" name="email" class="input-field" value="${client?.email || ''}" placeholder="correo@ejemplo.com">
          </div>
          <div>
            <label class="text-sm text-gray-600">Teléfono</label>
            <input type="tel" name="phone" class="input-field" value="${client?.phone || ''}" placeholder="+57 300 123 4567">
          </div>
          <div>
            <label class="text-sm text-gray-600">Documento de identidad</label>
            <input type="text" name="document" class="input-field" value="${client?.document || ''}" placeholder="CC 123456789">
          </div>
          <div>
            <label class="text-sm text-gray-600">Notas</label>
            <textarea name="notes" class="input-field" rows="2" placeholder="Notas adicionales...">${client?.notes || ''}</textarea>
          </div>
        </form>
      `,
      [
        { text: 'Cancelar', onclick: 'Modal.hide()', class: 'btn-secondary' },
        { text: 'Guardar', onclick: 'App.saveClient()', class: 'btn-primary', icon: 'save' }
      ]
    );
  },

  async saveClient() {
    const form = document.getElementById('client-form');
    const formData = new FormData(form);
    
    const client = {
      id: formData.get('id') || Utils.generateId(),
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      document: formData.get('document'),
      notes: formData.get('notes'),
      createdAt: formData.get('id') ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await API.update('clients', client.id, client);
      
      const index = AppState.clients.findIndex(c => c.id === client.id);
      if (index >= 0) {
        AppState.clients[index] = client;
      } else {
        AppState.clients.push(client);
      }

      Modal.hide();
      Notifications.show('Cliente guardado', 'success');
      Views.renderClients();
    } catch (error) {
      Notifications.show('Error guardando cliente', 'error');
    }
  },

  async deleteClient(clientId) {
    if (!confirm('¿Eliminar este cliente? Las suscripciones asociadas también se eliminarán.')) return;

    try {
      await API.delete('clients', clientId);
      AppState.clients = AppState.clients.filter(c => c.id !== clientId);
      AppState.subscriptions = AppState.subscriptions.filter(s => s.clientId !== clientId);
      
      Notifications.show('Cliente eliminado', 'success');
      Views.renderClients();
    } catch (error) {
      Notifications.show('Error eliminando cliente', 'error');
    }
  },

  // ========================================
  // CRUD PLANES
  // ========================================
  showPlanForm(planId = null) {
    const plan = planId ? AppState.plans.find(p => p.id === planId) : null;
    
    Modal.show(
      plan ? 'Editar Plan' : 'Nuevo Plan',
      `
        <form id="plan-form" class="space-y-4">
          <input type="hidden" name="id" value="${plan?.id || ''}">
          <div>
            <label class="text-sm text-gray-600">Nombre del plan *</label>
            <input type="text" name="name" required class="input-field" value="${plan?.name || ''}" placeholder="Ej: Plan Premium">
          </div>
          <div>
            <label class="text-sm text-gray-600">Precio *</label>
            <input type="number" name="price" required class="input-field" value="${plan?.price || ''}" placeholder="50000">
          </div>
          <div>
            <label class="text-sm text-gray-600">Ciclo de facturación</label>
            <select name="billingCycle" class="input-field">
              <option value="weekly" ${plan?.billingCycle === 'weekly' ? 'selected' : ''}>Semanal</option>
              <option value="monthly" ${plan?.billingCycle === 'monthly' || !plan ? 'selected' : ''}>Mensual</option>
              <option value="yearly" ${plan?.billingCycle === 'yearly' ? 'selected' : ''}>Anual</option>
            </select>
          </div>
          <div>
            <label class="text-sm text-gray-600">Descripción</label>
            <textarea name="description" class="input-field" rows="2" placeholder="Descripción del plan...">${plan?.description || ''}</textarea>
          </div>
          <div>
            <label class="text-sm text-gray-600">Características (una por línea)</label>
            <textarea name="features" class="input-field" rows="3" placeholder="Característica 1&#10;Característica 2">${(plan?.features || []).join('\n')}</textarea>
          </div>
          <label class="flex items-center gap-2">
            <input type="checkbox" name="featured" ${plan?.featured ? 'checked' : ''}>
            <span class="text-sm text-gray-600">Marcar como destacado</span>
          </label>
        </form>
      `,
      [
        { text: 'Cancelar', onclick: 'Modal.hide()', class: 'btn-secondary' },
        { text: 'Guardar', onclick: 'App.savePlan()', class: 'btn-primary', icon: 'save' }
      ]
    );
  },

  async savePlan() {
    const form = document.getElementById('plan-form');
    const formData = new FormData(form);
    
    const plan = {
      id: formData.get('id') || Utils.generateId(),
      name: formData.get('name'),
      price: parseInt(formData.get('price')),
      billingCycle: formData.get('billingCycle'),
      description: formData.get('description'),
      features: formData.get('features').split('\n').filter(f => f.trim()),
      featured: form.querySelector('[name="featured"]').checked,
      createdAt: formData.get('id') ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await API.update('plans', plan.id, plan);
      
      const index = AppState.plans.findIndex(p => p.id === plan.id);
      if (index >= 0) {
        AppState.plans[index] = plan;
      } else {
        AppState.plans.push(plan);
      }

      Modal.hide();
      Notifications.show('Plan guardado', 'success');
      Views.renderPlans();
    } catch (error) {
      Notifications.show('Error guardando plan', 'error');
    }
  },

  async deletePlan(planId) {
    const subsCount = AppState.subscriptions.filter(s => s.planId === planId).length;
    if (subsCount > 0) {
      alert(`No se puede eliminar. Hay ${subsCount} suscripción(es) usando este plan.`);
      return;
    }

    if (!confirm('¿Eliminar este plan?')) return;

    try {
      await API.delete('plans', planId);
      AppState.plans = AppState.plans.filter(p => p.id !== planId);
      
      Notifications.show('Plan eliminado', 'success');
      Views.renderPlans();
    } catch (error) {
      Notifications.show('Error eliminando plan', 'error');
    }
  },

  // ========================================
  // CRUD SUSCRIPCIONES
  // ========================================
  showSubscriptionForm(subId = null) {
    const sub = subId ? AppState.subscriptions.find(s => s.id === subId) : null;
    
    const clientOptions = AppState.clients.map(c => 
      `<option value="${c.id}" ${sub?.clientId === c.id ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    const planOptions = AppState.plans.map(p => 
      `<option value="${p.id}" ${sub?.planId === p.id ? 'selected' : ''}>${p.name} - ${Utils.formatCurrency(p.price)}</option>`
    ).join('');

    Modal.show(
      sub ? 'Editar Suscripción' : 'Nueva Suscripción',
      `
        <form id="subscription-form" class="space-y-4">
          <input type="hidden" name="id" value="${sub?.id || ''}">
          <div>
            <label class="text-sm text-gray-600">Cliente *</label>
            <select name="clientId" required class="input-field">
              <option value="">Seleccionar cliente...</option>
              ${clientOptions}
            </select>
          </div>
          <div>
            <label class="text-sm text-gray-600">Plan *</label>
            <select name="planId" required class="input-field" onchange="App.updateSubscriptionAmount(this.value)">
              <option value="">Seleccionar plan...</option>
              ${planOptions}
            </select>
          </div>
          <div>
            <label class="text-sm text-gray-600">Monto a cobrar</label>
            <input type="number" name="amount" class="input-field" value="${sub?.amount || ''}" placeholder="Se ajusta automáticamente">
          </div>
          <div>
            <label class="text-sm text-gray-600">Fecha de inicio</label>
            <input type="date" name="startDate" class="input-field" value="${sub?.startDate?.split('T')[0] || new Date().toISOString().split('T')[0]}">
          </div>
          <div>
            <label class="text-sm text-gray-600">Próximo pago</label>
            <input type="date" name="nextPaymentDate" class="input-field" value="${sub?.nextPaymentDate?.split('T')[0] || ''}">
          </div>
          <div>
            <label class="text-sm text-gray-600">Estado</label>
            <select name="status" class="input-field">
              <option value="active" ${sub?.status === 'active' || !sub ? 'selected' : ''}>Activa</option>
              <option value="pending" ${sub?.status === 'pending' ? 'selected' : ''}>Pendiente</option>
              <option value="cancelled" ${sub?.status === 'cancelled' ? 'selected' : ''}>Cancelada</option>
            </select>
          </div>
          <div>
            <label class="text-sm text-gray-600">Notas</label>
            <textarea name="notes" class="input-field" rows="2">${sub?.notes || ''}</textarea>
          </div>
        </form>
      `,
      [
        { text: 'Cancelar', onclick: 'Modal.hide()', class: 'btn-secondary' },
        { text: 'Guardar', onclick: 'App.saveSubscription()', class: 'btn-primary', icon: 'save' }
      ]
    );
  },

  updateSubscriptionAmount(planId) {
    const plan = AppState.plans.find(p => p.id === planId);
    if (plan) {
      document.querySelector('[name="amount"]').value = plan.price;
    }
  },

  async saveSubscription() {
    const form = document.getElementById('subscription-form');
    const formData = new FormData(form);
    
    const plan = AppState.plans.find(p => p.id === formData.get('planId'));
    
    const subscription = {
      id: formData.get('id') || Utils.generateId(),
      clientId: formData.get('clientId'),
      planId: formData.get('planId'),
      amount: parseInt(formData.get('amount')) || plan?.price || 0,
      billingCycle: plan?.billingCycle || 'monthly',
      startDate: formData.get('startDate'),
      nextPaymentDate: formData.get('nextPaymentDate') || formData.get('startDate'),
      status: formData.get('status'),
      notes: formData.get('notes'),
      createdAt: formData.get('id') ? undefined : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await API.update('subscriptions', subscription.id, subscription);
      
      const index = AppState.subscriptions.findIndex(s => s.id === subscription.id);
      if (index >= 0) {
        AppState.subscriptions[index] = subscription;
      } else {
        AppState.subscriptions.push(subscription);
      }

      Modal.hide();
      Notifications.show('Suscripción guardada', 'success');
      Views.renderSubscriptions();
    } catch (error) {
      Notifications.show('Error guardando suscripción', 'error');
    }
  },

  // ========================================
  // PAGOS CON WOMPI
  // ========================================
  async showPaymentModal(subscriptionId) {
    const sub = AppState.subscriptions.find(s => s.id === subscriptionId);
    const client = AppState.clients.find(c => c.id === sub?.clientId);
    const plan = AppState.plans.find(p => p.id === sub?.planId);
    
    if (!sub || !client) {
      Notifications.show('Suscripción no encontrada', 'error');
      return;
    }

    Modal.show(
      'Cobrar Pago',
      `
        <div class="space-y-4">
          <!-- Info del pago -->
          <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-white">
            <p class="text-sm opacity-80">Cobrar a</p>
            <p class="font-bold text-lg">${client.name}</p>
            <p class="text-3xl font-bold mt-2">${Utils.formatCurrency(sub.amount)}</p>
            <p class="text-sm opacity-80 mt-1">${plan?.name || 'Suscripción'} - ${sub.billingCycle === 'monthly' ? 'Mensual' : sub.billingCycle === 'yearly' ? 'Anual' : 'Semanal'}</p>
          </div>
          
          <!-- Enviar link de pago -->
          <div class="space-y-3">
            <p class="text-sm font-medium text-gray-700">Envía el link de pago al cliente:</p>
            
            <!-- WhatsApp (Principal) -->
            <button onclick="App.sendPaymentLinkWhatsApp('${subscriptionId}')" class="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl p-4 flex items-center gap-3 transition-all transform hover:scale-[1.02] shadow-lg">
              <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
              <div class="text-left flex-1">
                <p class="font-semibold">Enviar por WhatsApp</p>
                <p class="text-sm opacity-80">El cliente recibe link y paga con Wompi</p>
              </div>
              <span class="material-icons-round">send</span>
            </button>

            <!-- Copiar Link -->
            <button onclick="App.generatePaymentLink('${subscriptionId}')" class="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl p-4 flex items-center gap-3 transition-colors">
              <div class="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center">
                <span class="material-icons-round text-indigo-600">link</span>
              </div>
              <div class="text-left flex-1">
                <p class="font-semibold">Copiar Link de Pago</p>
                <p class="text-sm text-indigo-500">Para enviar por otro medio</p>
              </div>
              <span class="material-icons-round text-indigo-400">content_copy</span>
            </button>
          </div>

          <div class="border-t border-gray-200 pt-4 mt-4">
            <p class="text-xs text-gray-400 text-center mb-3">El cliente pagará con tarjeta, PSE o Nequi vía Wompi</p>
            
            <!-- Registrar pago manual -->
            <button onclick="App.showManualPaymentForm('${subscriptionId}')" class="w-full text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-2 py-2">
              <span class="material-icons-round text-lg">receipt_long</span>
              ¿Ya pagó? Registrar pago manual
            </button>
          </div>
        </div>
      `,
      [
        { text: 'Cerrar', onclick: 'Modal.hide()', class: 'btn-secondary' }
      ]
    );
  },

  // Generar datos para el link de pago
  generatePaymentData(subscriptionId) {
    const sub = AppState.subscriptions.find(s => s.id === subscriptionId);
    const client = AppState.clients.find(c => c.id === sub?.clientId);
    const plan = AppState.plans.find(p => p.id === sub?.planId);

    const data = {
      subscriptionId: sub.id,
      clientName: client.name,
      clientEmail: client.email || '',
      clientPhone: client.phone || '',
      clientDocument: client.document?.replace(/\D/g, '') || '',
      amount: sub.amount,
      planName: plan?.name || 'Suscripción',
      period: sub.billingCycle === 'monthly' ? 'Mensual' : sub.billingCycle === 'yearly' ? 'Anual' : 'Semanal',
      dueDate: sub.nextPaymentDate,
      reference: `SUB_${sub.id}_${Date.now()}`,
      businessName: 'Mi Negocio' // Cambiar por tu nombre de negocio
    };

    return btoa(JSON.stringify(data));
  },

  // Generar y mostrar link de pago
  generatePaymentLink(subscriptionId) {
    const sub = AppState.subscriptions.find(s => s.id === subscriptionId);
    const client = AppState.clients.find(c => c.id === sub?.clientId);
    const plan = AppState.plans.find(p => p.id === sub?.planId);

    const encodedData = this.generatePaymentData(subscriptionId);
    const baseUrl = window.location.href.replace(/\/[^\/]*$/, '/');
    const apiBase = API_URL.replace(/\/api$/, '');
    const paymentLink = `${baseUrl}pago.html?data=${encodedData}&api=${encodeURIComponent(apiBase)}`;

    Modal.show(
      'Link de Pago Generado',
      `
        <div class="space-y-4">
          <div class="text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span class="material-icons-round text-green-600 text-3xl">check_circle</span>
            </div>
            <p class="text-gray-600">Link generado para <strong>${client.name}</strong></p>
            <p class="text-2xl font-bold text-gray-800 mt-2">${Utils.formatCurrency(sub.amount)}</p>
          </div>

          <div class="bg-gray-50 rounded-xl p-4">
            <p class="text-xs text-gray-500 mb-2">Link de pago:</p>
            <div class="bg-white border border-gray-200 rounded-lg p-3 break-all text-sm font-mono text-gray-700" id="payment-link-text">
              ${paymentLink}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button onclick="App.copyPaymentLink('${paymentLink}')" class="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
              <span class="material-icons-round">content_copy</span>
              Copiar Link
            </button>
            <button onclick="App.sharePaymentLink('${subscriptionId}')" class="bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>
          </div>

          <button onclick="App.openPaymentLink('${paymentLink}')" class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <span class="material-icons-round">open_in_new</span>
            Ver página de pago
          </button>
        </div>
      `,
      [
        { text: 'Cerrar', onclick: 'Modal.hide()', class: 'btn-secondary' }
      ]
    );
  },

  // Copiar link de pago
  copyPaymentLink(link) {
    navigator.clipboard.writeText(link);
    Notifications.show('Link copiado al portapapeles', 'success');
  },

  // Abrir página de pago
  openPaymentLink(link) {
    window.open(link, '_blank');
  },

  // Compartir link por WhatsApp
  sharePaymentLink(subscriptionId) {
    const sub = AppState.subscriptions.find(s => s.id === subscriptionId);
    const client = AppState.clients.find(c => c.id === sub?.clientId);
    const plan = AppState.plans.find(p => p.id === sub?.planId);

    if (!client.phone) {
      Notifications.show('El cliente no tiene teléfono registrado', 'warning');
      return;
    }

    const encodedData = this.generatePaymentData(subscriptionId);
    const baseUrl = window.location.href.replace(/\/[^\/]*$/, '/');
    const apiBase = API_URL.replace(/\/api$/, '');
    const paymentLink = `${baseUrl}pago.html?data=${encodedData}&api=${encodeURIComponent(apiBase)}`;

    const message = `¡Hola ${client.name}! 👋

Te envío el link para pagar tu suscripción:

📦 *${plan?.name || 'Suscripción'}*
💰 *${Utils.formatCurrency(sub.amount)}*

👉 Paga aquí: ${paymentLink}

Puedes pagar con tarjeta, PSE o Nequi. ¡Gracias! 🙏`;

    const phone = client.phone.replace(/\D/g, '');
    const whatsappPhone = phone.startsWith('57') ? phone : '57' + phone;
    
    window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`, '_blank');
    Modal.hide();
    Notifications.show('Abriendo WhatsApp...', 'success');
  },

  // Enviar link de pago por WhatsApp (desde el botón principal)
  sendPaymentLinkWhatsApp(subscriptionId) {
    this.sharePaymentLink(subscriptionId);
  },

  // Formulario de pago manual mejorado
  showManualPaymentForm(subscriptionId) {
    const sub = AppState.subscriptions.find(s => s.id === subscriptionId);
    const client = AppState.clients.find(c => c.id === sub?.clientId);

    Modal.show(
      'Registrar Pago Manual',
      `
        <form id="manual-payment-form" class="space-y-4">
          <input type="hidden" name="subscriptionId" value="${subscriptionId}">
          
          <div class="bg-gray-50 rounded-xl p-4">
            <p class="text-sm text-gray-500">Cliente</p>
            <p class="font-semibold">${client.name}</p>
          </div>
          
          <div>
            <label class="text-sm text-gray-600">Monto recibido *</label>
            <input type="number" name="amount" required class="input-field" value="${sub.amount}" placeholder="0">
          </div>
          
          <div>
            <label class="text-sm text-gray-600">Método de pago</label>
            <select name="method" class="input-field">
              <option value="efectivo">💵 Efectivo</option>
              <option value="transferencia">🏦 Transferencia bancaria</option>
              <option value="nequi">📱 Nequi</option>
              <option value="daviplata">📱 Daviplata</option>
              <option value="otro">📝 Otro</option>
            </select>
          </div>
          
          <div>
            <label class="text-sm text-gray-600">Referencia / Comprobante</label>
            <input type="text" name="reference" class="input-field" placeholder="Número de transacción, etc.">
          </div>
          
          <div>
            <label class="text-sm text-gray-600">Notas</label>
            <textarea name="notes" class="input-field" rows="2" placeholder="Notas adicionales..."></textarea>
          </div>
        </form>
      `,
      [
        { text: 'Cancelar', onclick: 'Modal.hide()', class: 'btn-secondary' },
        { text: 'Registrar Pago', onclick: 'App.saveManualPayment()', class: 'btn-primary', icon: 'check' }
      ]
    );
  },

  async saveManualPayment() {
    const form = document.getElementById('manual-payment-form');
    const formData = new FormData(form);
    
    const subscriptionId = formData.get('subscriptionId');
    const sub = AppState.subscriptions.find(s => s.id === subscriptionId);
    const client = AppState.clients.find(c => c.id === sub?.clientId);
    const amount = parseInt(formData.get('amount'));

    try {
      // Registrar pago
      const payment = {
        id: Utils.generateId(),
        subscriptionId: subscriptionId,
        clientId: client.id,
        amount: amount,
        status: 'APPROVED',
        paymentMethod: formData.get('method'),
        reference: formData.get('reference'),
        notes: formData.get('notes'),
        createdAt: new Date().toISOString()
      };

      await API.update('payments', payment.id, payment);
      AppState.payments.push(payment);

      // Actualizar próxima fecha de pago
      const nextDate = new Date();
      if (sub.billingCycle === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (sub.billingCycle === 'yearly') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      } else if (sub.billingCycle === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
      }
      
      sub.nextPaymentDate = nextDate.toISOString();
      sub.lastPaymentDate = new Date().toISOString();
      await API.update('subscriptions', sub.id, sub);

      // Actualizar en AppState
      const subIndex = AppState.subscriptions.findIndex(s => s.id === sub.id);
      if (subIndex >= 0) AppState.subscriptions[subIndex] = sub;

      Modal.hide();
      Notifications.show('¡Pago registrado correctamente!', 'success');
      this.navigate(AppState.currentView);
    } catch (error) {
      Notifications.show('Error registrando pago', 'error');
    }
  },

  async createPaymentLink(subscriptionId) {
    const sub = AppState.subscriptions.find(s => s.id === subscriptionId);
    const client = AppState.clients.find(c => c.id === sub?.clientId);
    const plan = AppState.plans.find(p => p.id === sub?.planId);

    if (!AppState.serverAvailable) {
      Notifications.show('Link de pago requiere conexión al servidor', 'warning');
      return;
    }

    try {
      const result = await Wompi.createPaymentLink({
        name: `Pago ${plan?.name || 'Suscripción'} - ${client.name}`,
        description: `Pago de suscripción ${plan?.name || ''}`,
        amount_in_cents: sub.amount * 100,
        currency: 'COP',
        customer_email: client.email,
        redirect_url: window.location.origin + '/index.html?payment_status=success',
        single_use: true
      });

      if (result && result.data?.id) {
        // Guardar referencia del pago
        const payment = {
          id: Utils.generateId(),
          subscriptionId: subscriptionId,
          clientId: client.id,
          amount: sub.amount,
          status: 'PENDING',
          paymentMethod: 'payment_link',
          wompiLinkId: result.data.id,
          wompiLinkUrl: `https://checkout.wompi.co/l/${result.data.id}`,
          createdAt: new Date().toISOString()
        };

        await API.update('payments', payment.id, payment);
        AppState.payments.push(payment);

        Modal.show(
          'Link de Pago Creado',
          `
            <div class="text-center space-y-4">
              <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <span class="material-icons-round text-green-600 text-3xl">check_circle</span>
              </div>
              <p class="text-gray-600">Comparte este link con tu cliente:</p>
              <div class="bg-gray-100 p-3 rounded-lg">
                <a href="${payment.wompiLinkUrl}" target="_blank" class="text-indigo-600 break-all text-sm">
                  ${payment.wompiLinkUrl}
                </a>
              </div>
              <div class="flex gap-2">
                <button onclick="navigator.clipboard.writeText('${payment.wompiLinkUrl}'); Notifications.show('Link copiado', 'success')" class="btn-primary flex-1">
                  <span class="material-icons-round">content_copy</span>
                  Copiar
                </button>
                <button onclick="App.sharePaymentLink('${payment.wompiLinkUrl}', '${client.name}')" class="btn-secondary flex-1">
                  <span class="material-icons-round">share</span>
                  WhatsApp
                </button>
              </div>
            </div>
          `,
          [
            { text: 'Cerrar', onclick: 'Modal.hide()', class: 'btn-secondary' }
          ]
        );
      } else {
        Notifications.show('Error: No se pudo crear el link', 'error');
      }
    } catch (error) {
      Notifications.show('Error creando link de pago', 'error');
    }
  },

  async sharePaymentLink(url, clientName) {
    const text = `Hola ${clientName}, aquí está tu link de pago: ${url}`;
    
    if (navigator.share) {
      await navigator.share({ title: 'Link de pago', text, url });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  },

  // ========================================
  // RECORDATORIOS
  // ========================================
  async sendPaymentReminder(subscriptionId) {
    const sub = AppState.subscriptions.find(s => s.id === subscriptionId);
    const client = AppState.clients.find(c => c.id === sub?.clientId);
    const plan = AppState.plans.find(p => p.id === sub?.planId);

    if (!client.phone && !client.email) {
      Notifications.show('El cliente no tiene teléfono ni email', 'warning');
      return;
    }

    const message = `Hola ${client.name}, te recordamos que tu suscripción "${plan?.name || 'Plan'}" por ${Utils.formatCurrency(sub.amount)} vence el ${Utils.formatDate(sub.nextPaymentDate)}. ¡Gracias por tu preferencia!`;

    if (client.phone) {
      const phone = client.phone.replace(/\D/g, '');
      const whatsappPhone = phone.startsWith('57') ? phone : '57' + phone;
      window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else if (client.email) {
      window.open(`mailto:${client.email}?subject=Recordatorio de pago&body=${encodeURIComponent(message)}`, '_blank');
    }

    Notifications.show('Recordatorio enviado', 'success');
  },

  async checkReminders() {
    const now = new Date();
    const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const upcoming = AppState.subscriptions.filter(sub => {
      const nextPayment = new Date(sub.nextPaymentDate);
      return sub.status === 'active' && nextPayment >= now && nextPayment <= threeDays;
    });

    if (upcoming.length > 0) {
      Notifications.sendPush(
        'Pagos próximos',
        `Tienes ${upcoming.length} suscripción(es) que vencen en los próximos 3 días`,
        { view: 'subscriptions' }
      );
    }
  },

  async toggleNotifications() {
    const granted = await Notifications.requestPermission();
    const toggle = document.getElementById('notifications-toggle');
    
    if (granted) {
      toggle?.classList.add('active');
      Notifications.show('Notificaciones activadas', 'success');
    } else {
      toggle?.classList.remove('active');
      Notifications.show('Permisos de notificación denegados', 'warning');
    }
  }
};

// ========================================
// INICIALIZAR APP
// ========================================
document.addEventListener('DOMContentLoaded', () => App.init());
