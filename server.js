import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Servir archivos estáticos
app.use(express.static(__dirname));

// Servir manifest.json
app.get('/manifest.json', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(join(__dirname, 'manifest.json'));
});

// Servir service worker
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(join(__dirname, 'sw.js'));
});

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("💼 Servidor de CODEXIS - Sistema de Suscripciones funcionando correctamente");
});

// Conexión con la base de datos SQLite
const db = await open({
  filename: "./codexis_subscriptions.db",
  driver: sqlite3.Database
});

// Crear tablas si no existen
await db.exec(`
  CREATE TABLE IF NOT EXISTS subscriptions (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS invoices (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS config (id TEXT PRIMARY KEY, data TEXT);
`);

// Tablas permitidas
const ALLOWED_TABLES = new Set([
  "subscriptions",
  "invoices",
  "payments",
  "config"
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

// Eliminar UN SOLO registro
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

// Endpoint específico para sincronización completa
app.post("/api/sync", async (req, res) => {
  const { subscriptions, invoices, payments } = req.body;
  try {
    await db.exec("BEGIN");
    
    // Sincronizar suscripciones
    if (Array.isArray(subscriptions)) {
      await db.run(`DELETE FROM subscriptions`);
      const stmt1 = await db.prepare(`INSERT INTO subscriptions (id, data) VALUES (?, ?)`);
      for (const item of subscriptions) {
        await stmt1.run(item.id, JSON.stringify(item));
      }
      await stmt1.finalize();
    }
    
    // Sincronizar facturas
    if (Array.isArray(invoices)) {
      await db.run(`DELETE FROM invoices`);
      const stmt2 = await db.prepare(`INSERT INTO invoices (id, data) VALUES (?, ?)`);
      for (const item of invoices) {
        await stmt2.run(item.id, JSON.stringify(item));
      }
      await stmt2.finalize();
    }
    
    // Sincronizar pagos
    if (Array.isArray(payments)) {
      await db.run(`DELETE FROM payments`);
      const stmt3 = await db.prepare(`INSERT INTO payments (id, data) VALUES (?, ?)`);
      for (const item of payments) {
        await stmt3.run(item.id, JSON.stringify(item));
      }
      await stmt3.finalize();
    }
    
    await db.exec("COMMIT");
    res.json({ success: true, message: "Sincronización completa exitosa" });
  } catch (err) {
    try { await db.exec("ROLLBACK"); } catch {}
    res.status(500).json({ error: err.message });
  }
});

// Endpoint para obtener todos los datos
app.get("/api/sync", async (req, res) => {
  try {
    const subscriptions = await db.all(`SELECT * FROM subscriptions`);
    const invoices = await db.all(`SELECT * FROM invoices`);
    const payments = await db.all(`SELECT * FROM payments`);
    
    res.json({
      subscriptions: subscriptions.map(r => JSON.parse(r.data)),
      invoices: invoices.map(r => JSON.parse(r.data)),
      payments: payments.map(r => JSON.parse(r.data))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`✅ API de CODEXIS corriendo en puerto ${PORT}`));
