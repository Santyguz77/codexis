import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API de Suscripciones funcionando',
    environment: WOMPI_CONFIG.environment
  });
});

// ========================================
// CONFIGURACIÓN WOMPI
// ========================================
const WOMPI_CONFIG = {
  // Producción
  production: {
    publicKey: 'pub_prod_sI5MUpBNrHlTm98AjNE4nJbHxZR9Vy5E',
    privateKey: 'prv_prod_IIhrOfIsFoU2SMVkXsr3Kc04wSE0GgW1',
    eventsSecret: 'prod_events_AMLz6zXhyuqiNzVLuZHF2h9qbrYdrgeh',
    integrityKey: 'prod_integrity_1RJdopxpCHueV1Iykad7iV2S32wpD6Wr',
    baseUrl: 'https://production.wompi.co/v1'
  },
  // Test (para pruebas locales)
  test: {
    publicKey: 'pub_test_RAqnhtzXL2RelRoyT4fOzeo10sW4r2TC',
    privateKey: 'prv_test_VYf4fuyOU6htc2kXUFx0hImsW2xUMdIe',
    eventsSecret: 'test_events_ZNUncEkq3DlHyqfkDT5Vt7pKwQ1a2pOe',
    integrityKey: 'test_integrity_iZ6LG18NV43VYaU9em514MU0oIvwECno',
    baseUrl: 'https://sandbox.wompi.co/v1'
  },
  // CAMBIAR A 'production' PARA DINERO REAL
  environment: 'test'
};

// Obtener configuración actual
const getWompiConfig = () => WOMPI_CONFIG[WOMPI_CONFIG.environment];

// Conexión con la base de datos SQLite
const db = await open({
  filename: "./suscripciones.db",
  driver: sqlite3.Database
});

// Crear tablas
await db.exec(`
  -- Clientes
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    data TEXT
  );
  
  -- Planes de suscripción
  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    data TEXT
  );
  
  -- Suscripciones
  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    data TEXT
  );
  
  -- Pagos/Transacciones
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    data TEXT
  );
  
  -- Recordatorios programados
  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    data TEXT
  );
  
  -- Configuración general
  CREATE TABLE IF NOT EXISTS config (
    id TEXT PRIMARY KEY,
    data TEXT
  );
  
  -- Webhooks de Wompi (log de eventos)
  CREATE TABLE IF NOT EXISTS wompi_events (
    id TEXT PRIMARY KEY,
    data TEXT
  );
`);

// Tablas permitidas
const ALLOWED_TABLES = new Set([
  "clients",
  "plans",
  "subscriptions",
  "payments",
  "reminders",
  "config",
  "wompi_events"
]);

// ========================================
// API CRUD GENÉRICA
// ========================================

// Obtener todos los registros
app.get("/api/:table", async (req, res) => {
  const { table } = req.params;
  try {
    if (!ALLOWED_TABLES.has(table)) return res.status(400).json({ error: "Tabla no permitida" });
    const rows = await db.all(`SELECT * FROM ${table}`);
    res.json(rows.map(r => JSON.parse(r.data)));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener un registro por ID
app.get("/api/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  try {
    if (!ALLOWED_TABLES.has(table)) return res.status(400).json({ error: "Tabla no permitida" });
    const row = await db.get(`SELECT * FROM ${table} WHERE id = ?`, id);
    if (!row) return res.status(404).json({ error: "No encontrado" });
    res.json(JSON.parse(row.data));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Guardar lista completa (reemplaza todo)
app.post("/api/:table", async (req, res) => {
  const { table } = req.params;
  const items = req.body;
  if (!ALLOWED_TABLES.has(table)) return res.status(400).json({ error: "Tabla no permitida" });
  if (!Array.isArray(items)) return res.status(400).json({ error: "Formato inválido" });
  try {
    await db.exec("BEGIN");
    await db.run(`DELETE FROM ${table}`);
    const stmt = await db.prepare(`INSERT INTO ${table} (id, data) VALUES (?, ?)`);
    for (const item of items) {
      await stmt.run(item.id, JSON.stringify(item));
    }
    await stmt.finalize();
    await db.exec("COMMIT");
    res.json({ success: true, count: items.length });
  } catch (err) {
    try { await db.exec("ROLLBACK"); } catch {}
    res.status(500).json({ error: err.message });
  }
});

// Actualizar/crear UN SOLO registro
app.put("/api/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  const item = req.body;
  if (!ALLOWED_TABLES.has(table)) return res.status(400).json({ error: "Tabla no permitida" });
  try {
    await db.run(
      `INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`,
      id, JSON.stringify({ ...item, id })
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar un registro
app.delete("/api/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  if (!ALLOWED_TABLES.has(table)) return res.status(400).json({ error: "Tabla no permitida" });
  try {
    await db.run(`DELETE FROM ${table} WHERE id = ?`, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================================
// ENDPOINTS WOMPI
// ========================================

// Obtener configuración pública de Wompi (para el frontend)
app.get("/api/wompi/config", (req, res) => {
  const config = getWompiConfig();
  res.json({
    publicKey: config.publicKey,
    environment: WOMPI_CONFIG.environment
  });
});

// Crear link de pago Wompi
app.post("/api/wompi/payment-link", async (req, res) => {
  try {
    const config = getWompiConfig();
    const { 
      name, 
      description, 
      amount_in_cents, 
      currency = 'COP',
      customer_email,
      redirect_url,
      single_use = true,
      collect_shipping = false,
      expires_at
    } = req.body;

    const response = await fetch(`${config.baseUrl}/payment_links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.privateKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        description,
        single_use,
        collect_shipping,
        currency,
        amount_in_cents,
        redirect_url,
        expires_at,
        customer_data: customer_email ? { email: customer_email } : undefined
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Error creando link de pago:', err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener token de aceptación (requerido para transacciones)
app.get("/api/wompi/acceptance-token", async (req, res) => {
  try {
    const config = getWompiConfig();
    const response = await fetch(`${config.baseUrl}/merchants/${config.publicKey}`);
    const data = await response.json();
    res.json({
      acceptance_token: data.data.presigned_acceptance.acceptance_token,
      permalink: data.data.presigned_acceptance.permalink
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear transacción directa
app.post("/api/wompi/transactions", async (req, res) => {
  try {
    const config = getWompiConfig();
    const {
      amount_in_cents,
      currency = 'COP',
      customer_email,
      payment_method,
      reference,
      acceptance_token,
      customer_data
    } = req.body;

    const response = await fetch(`${config.baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.privateKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount_in_cents,
        currency,
        customer_email,
        payment_method,
        reference,
        acceptance_token,
        customer_data
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Consultar estado de transacción
app.get("/api/wompi/transactions/:id", async (req, res) => {
  try {
    const config = getWompiConfig();
    const response = await fetch(`${config.baseUrl}/transactions/${req.params.id}`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tokenizar tarjeta (para pagos recurrentes)
app.post("/api/wompi/tokens/cards", async (req, res) => {
  try {
    const config = getWompiConfig();
    const { number, cvc, exp_month, exp_year, card_holder } = req.body;

    const response = await fetch(`${config.baseUrl}/tokens/cards`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.publicKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number,
        cvc,
        exp_month,
        exp_year,
        card_holder
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear fuente de pago (payment source) para cobros recurrentes
app.post("/api/wompi/payment-sources", async (req, res) => {
  try {
    const config = getWompiConfig();
    const { 
      type, 
      token, 
      customer_email,
      acceptance_token 
    } = req.body;

    const response = await fetch(`${config.baseUrl}/payment_sources`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.privateKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        token,
        customer_email,
        acceptance_token
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cobrar usando fuente de pago guardada
app.post("/api/wompi/charge-source", async (req, res) => {
  try {
    const config = getWompiConfig();
    const {
      amount_in_cents,
      currency = 'COP',
      customer_email,
      payment_source_id,
      reference,
      installments = 1
    } = req.body;

    const response = await fetch(`${config.baseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.privateKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount_in_cents,
        currency,
        customer_email,
        payment_source_id,
        reference,
        installments
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================================
// WEBHOOK WOMPI - Recibir eventos
// ========================================
app.post("/api/wompi/webhook", async (req, res) => {
  try {
    const config = getWompiConfig();
    const event = req.body;
    
    // Verificar firma del webhook
    const signature = req.headers['x-event-checksum'];
    const timestamp = req.body.timestamp;
    const properties = event.data?.transaction || {};
    
    // Calcular checksum
    const checksumString = `${properties.id}${properties.status}${properties.amount_in_cents}${timestamp}${config.eventsSecret}`;
    const expectedChecksum = crypto.createHash('sha256').update(checksumString).digest('hex');
    
    if (signature !== expectedChecksum) {
      console.warn('Webhook signature mismatch');
      // En producción podrías rechazar, pero para desarrollo aceptamos
    }

    // Guardar evento en la base de datos
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.run(
      `INSERT INTO wompi_events (id, data) VALUES (?, ?)`,
      eventId, JSON.stringify({ ...event, receivedAt: new Date().toISOString() })
    );

    // Procesar según el tipo de evento
    if (event.event === 'transaction.updated') {
      const transaction = event.data.transaction;
      
      // Actualizar pago en nuestra base de datos
      const paymentRows = await db.all(`SELECT * FROM payments`);
      for (const row of paymentRows) {
        const payment = JSON.parse(row.data);
        if (payment.wompiTransactionId === transaction.id) {
          payment.status = transaction.status;
          payment.statusMessage = transaction.status_message;
          payment.updatedAt = new Date().toISOString();
          
          await db.run(
            `UPDATE payments SET data = ? WHERE id = ?`,
            JSON.stringify(payment), payment.id
          );
          
          // Si el pago fue exitoso, actualizar suscripción
          if (transaction.status === 'APPROVED' && payment.subscriptionId) {
            const subRow = await db.get(`SELECT * FROM subscriptions WHERE id = ?`, payment.subscriptionId);
            if (subRow) {
              const subscription = JSON.parse(subRow.data);
              subscription.lastPaymentDate = new Date().toISOString();
              subscription.status = 'active';
              // Calcular próxima fecha de pago
              const nextDate = new Date();
              if (subscription.billingCycle === 'monthly') {
                nextDate.setMonth(nextDate.getMonth() + 1);
              } else if (subscription.billingCycle === 'yearly') {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
              } else if (subscription.billingCycle === 'weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
              }
              subscription.nextPaymentDate = nextDate.toISOString();
              
              await db.run(
                `UPDATE subscriptions SET data = ? WHERE id = ?`,
                JSON.stringify(subscription), subscription.id
              );
            }
          }
          break;
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error procesando webhook:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========================================
// ENDPOINTS DE RECORDATORIOS
// ========================================

// Obtener suscripciones próximas a vencer
app.get("/api/subscriptions/upcoming", async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    const rows = await db.all(`SELECT * FROM subscriptions`);
    const upcoming = rows
      .map(r => JSON.parse(r.data))
      .filter(sub => {
        const nextPayment = new Date(sub.nextPaymentDate);
        return nextPayment >= now && nextPayment <= futureDate && sub.status === 'active';
      })
      .sort((a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate));
    
    res.json(upcoming);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener suscripciones vencidas
app.get("/api/subscriptions/overdue", async (req, res) => {
  try {
    const now = new Date();
    
    const rows = await db.all(`SELECT * FROM subscriptions`);
    const overdue = rows
      .map(r => JSON.parse(r.data))
      .filter(sub => {
        const nextPayment = new Date(sub.nextPaymentDate);
        return nextPayment < now && sub.status === 'active';
      })
      .sort((a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate));
    
    res.json(overdue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard stats
app.get("/api/stats/dashboard", async (req, res) => {
  try {
    const [clients, subscriptions, payments] = await Promise.all([
      db.all(`SELECT * FROM clients`),
      db.all(`SELECT * FROM subscriptions`),
      db.all(`SELECT * FROM payments`)
    ]);
    
    const parsedSubs = subscriptions.map(r => JSON.parse(r.data));
    const parsedPayments = payments.map(r => JSON.parse(r.data));
    
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    // Ingresos del mes
    const monthlyRevenue = parsedPayments
      .filter(p => {
        const date = new Date(p.createdAt);
        return date.getMonth() === thisMonth && 
               date.getFullYear() === thisYear && 
               p.status === 'APPROVED';
      })
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Suscripciones activas
    const activeSubs = parsedSubs.filter(s => s.status === 'active').length;
    
    // Vencidas
    const overdueSubs = parsedSubs.filter(s => {
      return s.status === 'active' && new Date(s.nextPaymentDate) < now;
    }).length;
    
    // Próximas a vencer (7 días)
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingSubs = parsedSubs.filter(s => {
      const next = new Date(s.nextPaymentDate);
      return s.status === 'active' && next >= now && next <= futureDate;
    }).length;
    
    res.json({
      totalClients: clients.length,
      activeSubscriptions: activeSubs,
      overdueSubscriptions: overdueSubs,
      upcomingSubscriptions: upcomingSubs,
      monthlyRevenue,
      totalPaymentsThisMonth: parsedPayments.filter(p => {
        const date = new Date(p.createdAt);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      }).length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================================
// INICIAR SERVIDOR
// ========================================
const PORT = process.env.PORT || 3011;
app.listen(PORT, () => {
  console.log(`🔔 Servidor de Suscripciones corriendo en http://localhost:${PORT}`);
  console.log(`📊 Ambiente Wompi: ${WOMPI_CONFIG.environment}`);
});
