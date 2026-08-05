import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ===== Groq AI Configuration =====
const GROQ_API_KEY = "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";
const GROQ_MODEL = "llama-3.1-8b-instant"; // Modelo más rápido y ligero
const GROQ_SYSTEM_PROMPT_BASE = `Eres el asistente de IA de Codexis, un taller de reparación de computadores y electronica en general.
Tu nombre es "Codexis Asistente".
Ayudas con:
- Diagnóstico de fallas en computadores (hardware y software)
- Recomendaciones de repuestos y componentes
- Consejos sobre mantenimiento preventivo
- Información sobre procesos del taller
- Presupuestos estimados de reparación
- Soporte técnico general
- Consultas sobre el estado del negocio (órdenes, clientes, finanzas, inventario)

Responde siempre en español, de forma profesional pero amigable.
Si no estás seguro de algo, dilo honestamente.
Mantén las respuestas concisas pero completas.
Cuando respondas preguntas sobre datos del negocio, basa tus respuestas EXCLUSIVAMENTE en los datos reales proporcionados en el contexto.

FORMATO DE COTIZACIONES:
Si el usuario te pide generar una cotización:
1.  **Verifica precios:** Busca en el contexto del INVENTARIO si los productos existen y tienen precio.
2.  **Si NO sabes el precio:** NO lo inventes ni estimes. PREGUNTA al usuario: "¿Qué precio le pongo a [Producto]?" antes de generar la cotización.
3.  **Solo si tienes todos los precios:** Genera el bloque de código JSON con la siguiente estructura exacta:
\`\`\`json
{
  "type": "quotation",
  "client": "Nombre del Cliente (o 'Cliente General')",
  "date": "YYYY-MM-DD",
  "items": [
    { "description": "Descripción del producto o servicio", "quantity": 1, "price": 100000, "total": 100000 }
  ],
  "total": 100000,
  "notes": "Validez de la oferta: 15 días. Precios sujetos a cambios."
}
\`\`\`
Asegúrate de calcular bien los totales. No añadidas texto antes ni después del bloque JSON.

ENLACE WHATSAPP (ESTADO DE ORDEN):
Si el usuario pregunta por el estado de una orden específica y quieres facilitar el contacto.
Usa SIEMPRE el número 573174190562 para el campo 'phone'.
Genera un JSON adicional con este formato (puede ir acompañado de texto explicativo):
\`\`\`json
{
  "type": "whatsapp_contact",
  "phone": "573174190562",
  "message": "Hola, quisiera saber el estado de la orden #[NumeroOrden] ([Marca] [Modelo])...",
  "label": "Consultar al Técnico por WhatsApp"
}
\`\`\``;

const app = express();
app.use(cors());
// Aumentar el límite de tamaño del body para permitir imágenes (50MB)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// NUEVO: Servir archivos estáticos para PWA
app.use(express.static(__dirname));

// NUEVO: Servir manifest.json con tipo MIME correcto
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(join(__dirname, 'manifest.json'));
});

// NUEVO: Servir service worker
app.get('/service-worker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(join(__dirname, 'service-worker.js'));
});

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("Servidor funcionando correctamente");
});

// --- Conexión con la base de datos SQLite ---
const db = await open({
  filename: "./codexis.db",
  driver: sqlite3.Database
});

// Crear tablas si no existen
await db.exec(`
CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, data TEXT);
CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, data TEXT);
CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, data TEXT);
CREATE TABLE IF NOT EXISTS equipments (id TEXT PRIMARY KEY, data TEXT);
CREATE TABLE IF NOT EXISTS inventory (id TEXT PRIMARY KEY, data TEXT);
CREATE TABLE IF NOT EXISTS inventory_movements (id TEXT PRIMARY KEY, data TEXT);
CREATE TABLE IF NOT EXISTS invoices (id TEXT PRIMARY KEY, data TEXT);
CREATE TABLE IF NOT EXISTS catalog_items (id TEXT PRIMARY KEY, data TEXT);
CREATE TABLE IF NOT EXISTS debts (id TEXT PRIMARY KEY, data TEXT);
`);

// ===== Función para obtener resumen contextual de la BD =====
async function getDBContext() {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Consultar todas las tablas
    const [ordersRows, clientsRows, txRows, inventoryRows, invoicesRows] = await Promise.all([
      db.all("SELECT data FROM orders"),
      db.all("SELECT data FROM clients"),
      db.all("SELECT data FROM transactions"),
      db.all("SELECT data FROM inventory"),
      db.all("SELECT data FROM invoices"),
      db.all("SELECT data FROM debts")
    ]);

    const orders = ordersRows.map(r => JSON.parse(r.data));
    const clients = clientsRows.map(r => JSON.parse(r.data));
    const transactions = txRows.map(r => JSON.parse(r.data));
    const inventory = inventoryRows.map(r => JSON.parse(r.data));
    const invoices = invoicesRows.map(r => JSON.parse(r.data));
    const debts = debtsRows.map(r => JSON.parse(r.data));

    // --- Resumen de Órdenes ---

    // --- Resumen de Órdenes ---
    const totalOrders = orders.length;
    const activeOrdersList = orders.filter(o => (o.status || 'ingresado') !== 'entregado');
    const deliveredOrdersList = orders.filter(o => o.status === 'entregado');

    const ingresadas = orders.filter(o => (o.status || 'ingresado') === 'ingresado').length;
    const enReparacion = orders.filter(o => o.status === 'en_reparacion').length;
    const enEspera = orders.filter(o => o.status === 'espera_entrega').length;
    const entregadas = deliveredOrdersList.length;

    // Helper compacto para orden (Ahorro de tokens)
    const formatOrder = (o) => {
      const client = clients.find(c => c.id === o.clientId) || {};
      const parts = [`${client.name || 'SinNombre'}`];
      if (client.phone) parts.push(`Tel:${client.phone}`);
      if (o.brand) parts.push(`${o.brand} ${o.model || ''}`);
      if (o.issue) parts.push(`Falla:${o.issue}`);
      if (o.technician) parts.push(`Tec:${o.technician}`);
      parts.push(`Est:${o.status || 'ingresado'}`);
      if (o.cost) parts.push(`$${Number(o.cost).toLocaleString('es-CO')}`);
      return `- ${parts.join('|')}`;
    };

    // 1. LISTA DE ÓRDENES ACTIVAS (Todas)
    const activeOrdersDetail = activeOrdersList
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .map(formatOrder)
      .join('\n');

    // 2. HISTORIAL RECIENTE (Solo últimas 10 para ahorrar tokens)
    const historyOrdersDetail = deliveredOrdersList
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 10)
      .map(formatOrder)
      .join('\n');

    // --- Resumen de Clientes ---
    const totalClients = clients.length;
    const clientNames = clients.map(c => c.name).join(', '); // Lista simple de nombres para busqueda rapida
    // Detalles completos de clientes
    // 3. CLIENTES (Top 50 para ahorrar tokens)
    const allClientsDetail = clients
      .slice(0, 50)
      .map(c => `- ${c.name} | Tel:${c.phone || ''}`)
      .join('\n');

    // --- Resumen de Finanzas ---
    const monthTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const monthIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
    const monthExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
    const monthProfit = monthIncome - monthExpense;

    // --- Resumen de Inventario ---
    const totalItems = inventory.length;
    const totalStock = inventory.reduce((s, i) => s + Number(i.stock || 0), 0);
    const inventoryValue = inventory.reduce((s, i) => s + (Number(i.stock || 0) * Number(i.unitCost || 0)), 0);
    const lowStock = inventory.filter(i => Number(i.stock || 0) <= 5 && Number(i.stock || 0) > 0);
    const outOfStock = inventory.filter(i => Number(i.stock || 0) === 0);
    const lowStockList = lowStock.slice(0, 10).map(i => `- ${i.name}: ${i.stock} unidades`).join('\n');

    // 4. INVENTARIO COMPACTO (Límite 60 items para tasa)
    const inventoryDetail = inventory
      .filter(i => Number(i.stock) > 0)
      .slice(0, 60)
      .map(i => `- ${i.name.substring(0, 30)} (${i.stock}) $${Number(i.salePrice || i.price || 0).toLocaleString('es-CO')}`)
      .join('\n');

    // --- Resumen de Facturas ---
    const totalInvoices = invoices.length;
    const unpaidInvoices = invoices.filter(i => i.paymentStatus === 'unpaid' || i.paymentStatus === 'partial');
    const unpaidTotal = unpaidInvoices.reduce((s, i) => s + Number(i.total || 0), 0);

    return `
--- DATOS REALES DEL NEGOCIO (${now.toLocaleDateString('es-CO')}) ---

ORDENES ACTIVAS (${activeOrdersList.length} | Ingresadas: ${ingresadas} | En reparación: ${enReparacion} | Espera: ${enEspera}):
${activeOrdersDetail || '(Ninguna orden activa)'}

HISTORIAL RECIENTE (Últimas 15 entregadas de ${entregadas} total):
${historyOrdersDetail || '(Sin historial reciente)'}

CLIENTES REGISTRADOS (${clients.length}):
${allClientsDetail || '(Sin clientes)'}

FINANZAS DEL MES (${now.toLocaleString('es-CO', { month: 'long', year: 'numeric' })}):
- Ingresos: $${monthIncome.toLocaleString('es-CO')}
- Gastos: $${monthExpense.toLocaleString('es-CO')}
- Ganancia: $${monthProfit.toLocaleString('es-CO')}

INVENTARIO (${totalItems} ítems | ${totalStock} unidades | Valor: $${inventoryValue.toLocaleString('es-CO')}):
${inventoryDetail || '(Sin inventario)'}
- Sin stock: ${outOfStock.length} ítems
- Stock bajo (<=5):
${lowStockList || '(Ninguno)'}

FACTURAS:
- Total: ${totalInvoices}
- Pendientes de pago: ${unpaidInvoices.length} por $${unpaidTotal.toLocaleString('es-CO')}

DEUDAS Y CUENTAS POR COBRAR:
- Me deben (Receivable): $${debts.filter(d => d.type === 'receivable' && d.status !== 'paid').reduce((s,d) => s + (Number(d.remainingAmount || 0)), 0).toLocaleString('es-CO')}
- Yo debo (Payable): $${debts.filter(d => d.type === 'payable' && d.status !== 'paid').reduce((s,d) => s + (Number(d.remainingAmount || 0)), 0).toLocaleString('es-CO')}
- Deudas recientes: ${debts.slice(-5).map(d => `${d.contactName} (${d.type === 'receivable' ? 'Me debe' : 'Le debo'}): $${Number(d.remainingAmount).toLocaleString('es-CO')}`).join(', ')}
--- FIN DATOS ---`;
  } catch (err) {
    console.error("Error obteniendo contexto DB:", err.message);
    return "\n(No se pudieron obtener datos de la base de datos)\n";
  }
}

// ===== Endpoint de Chat IA con Groq (DEBE ir ANTES de /api/:table) =====
app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Se requiere un array de mensajes" });
  }

  try {
    // Obtener contexto actual de la base de datos
    const dbContext = await getDBContext();
    const fullSystemPrompt = GROQ_SYSTEM_PROMPT_BASE + "\n" + dbContext;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.text();
      console.error("Error de Groq:", errorData);
      return res.status(groqResponse.status).json({ error: "Error al comunicarse con Groq", details: errorData });
    }

    const data = await groqResponse.json();
    const reply = data.choices?.[0]?.message?.content || "No se pudo obtener una respuesta.";
    res.json({ reply, usage: data.usage });
  } catch (err) {
    console.error("Error en /api/chat:", err.message);
    res.status(500).json({ error: "Error interno del servidor", message: err.message });
  }
});

// --- Endpoints genéricos ---
/* allowlist para evitar inyección en nombre de tabla */
const ALLOWED_TABLES = new Set([
  "orders",
  "clients",
  "transactions",
  "equipments",
  "inventory",
  "inventory_movements",
  "invoices",
  "catalog_items",
  "debts"
]);

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

// Guardar lista completa (reemplaza todo)
app.post("/api/:table", async (req, res) => {
  const { table } = req.params;
  const items = req.body;
  if (!ALLOWED_TABLES.has(table)) return res.status(400).json({ error: "Tabla no permitida" });
  if (!Array.isArray(items)) return res.status(400).json({ error: "Formato inválido" });

  // PROTECCIÓN: No permitir guardar array vacío en tablas críticas
  const CRITICAL_TABLES = ['clients', 'orders', 'invoices'];
  if (CRITICAL_TABLES.includes(table) && items.length === 0) {
    const existingRows = await db.all(`SELECT COUNT(*) as count FROM ${table}`);
    if (existingRows[0].count > 0) {
      console.warn(`BLOQUEADO: Intento de borrar todos los registros de ${table}`);
      return res.status(400).json({
        error: "No se permite borrar todos los registros de tablas críticas",
        tip: "Si realmente deseas vaciar la tabla, usa el endpoint de backup primero"
      });
    }
  }

  try {
    // BACKUP AUTOMÁTICO: Crear respaldo antes de operación masiva
    if (items.length > 0) {
      const backupRows = await db.all(`SELECT * FROM ${table}`);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '_').replace(/[-]/g, '_');
      const backupTable = `${table}_backup_${timestamp}`;

      await db.exec(`CREATE TABLE IF NOT EXISTS ${backupTable} (id TEXT PRIMARY KEY, data TEXT, backup_date TEXT DEFAULT CURRENT_TIMESTAMP)`);
      const backupStmt = await db.prepare(`INSERT OR REPLACE INTO ${backupTable} (id, data) VALUES (?, ?)`);
      for (const row of backupRows) {
        await backupStmt.run(row.id, row.data);
      }
      await backupStmt.finalize();
      console.log(`Backup creado: ${backupTable} (${backupRows.length} registros)`);
    }

    /* TRANSACCIÓN */
    await db.exec("BEGIN");
    await db.run(`DELETE FROM ${table}`);

    const stmt = await db.prepare(`INSERT INTO ${table} (id, data) VALUES (?, ?)`);
    for (const item of items) {
      await stmt.run(item.id, JSON.stringify(item));
    }
    await stmt.finalize();
    await db.exec("COMMIT");

    console.log(`${table} actualizado: ${items.length} registros guardados`);
    res.json({ success: true, count: items.length });
  } catch (err) {
    try { await db.exec("ROLLBACK"); } catch { }
    console.error(`Error guardando ${table}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para actualizar/crear UN SOLO registro
app.put("/api/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  const item = req.body;
  if (!ALLOWED_TABLES.has(table)) return res.status(400).json({ error: "Tabla no permitida" });
  if (!item || !item.id) return res.status(400).json({ error: "Item inválido" });
  try {
    await db.run(
      `INSERT OR REPLACE INTO ${table} (id, data) VALUES (?, ?)`,
      id,
      JSON.stringify(item)
    );
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para eliminar UN SOLO registro
app.delete("/api/:table/:id", async (req, res) => {
  const { table, id } = req.params;
  if (!ALLOWED_TABLES.has(table)) return res.status(400).json({ error: "Tabla no permitida" });
  try {
    await db.run(`DELETE FROM ${table} WHERE id = ?`, id);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar backups disponibles
app.get("/api/backups/:table", async (req, res) => {
  const { table } = req.params;
  if (!ALLOWED_TABLES.has(table)) return res.status(400).json({ error: "Tabla no permitida" });
  try {
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE ?",
      `${table}_backup_%`
    );
    const backups = tables.map(t => ({
      name: t.name,
      timestamp: t.name.replace(`${table}_backup_`, '').replace(/-/g, ':')
    }));
    res.json(backups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restaurar desde backup
app.post("/api/restore/:backupTable/:targetTable", async (req, res) => {
  const { backupTable, targetTable } = req.params;
  if (!ALLOWED_TABLES.has(targetTable)) return res.status(400).json({ error: "Tabla no permitida" });
  try {
    const backupExists = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
      backupTable
    );
    if (!backupExists) return res.status(404).json({ error: "Backup no encontrado" });

    const currentRows = await db.all(`SELECT * FROM ${targetTable}`);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '_').replace(/[-]/g, '_');
    const preRestoreBackup = `${targetTable}_pre_restore_${timestamp}`;
    await db.exec(`CREATE TABLE IF NOT EXISTS ${preRestoreBackup} (id TEXT PRIMARY KEY, data TEXT)`);
    const stmt1 = await db.prepare(`INSERT INTO ${preRestoreBackup} (id, data) VALUES (?, ?)`);
    for (const row of currentRows) {
      await stmt1.run(row.id, row.data);
    }
    await stmt1.finalize();

    await db.exec("BEGIN");
    await db.run(`DELETE FROM ${targetTable}`);
    const backupRows = await db.all(`SELECT * FROM ${backupTable}`);
    const stmt2 = await db.prepare(`INSERT INTO ${targetTable} (id, data) VALUES (?, ?)`);
    for (const row of backupRows) {
      await stmt2.run(row.id, row.data);
    }
    await stmt2.finalize();
    await db.exec("COMMIT");

    console.log(`Restaurado ${targetTable} desde ${backupTable} (${backupRows.length} registros)`);
    res.json({ success: true, restored: backupRows.length, preRestoreBackup });
  } catch (err) {
    try { await db.exec("ROLLBACK"); } catch { }
    console.error(`Error restaurando:`, err.message);
    res.status(500).json({ error: err.message });
  }
});


app.listen(3010, () => console.log("API corriendo en puerto 3010 v4.0 (IA con BD)"));
