# 📱 Control de Suscripciones PWA

Sistema PWA para gestión de suscripciones, cobros con Wompi y envío de recordatorios a clientes.

## 🚀 Características

- ✅ **Dashboard** - Vista general con estadísticas y alertas
- ✅ **Gestión de Clientes** - CRUD completo de clientes
- ✅ **Planes de Suscripción** - Crear planes con diferentes ciclos de facturación
- ✅ **Suscripciones** - Asignar planes a clientes con seguimiento de pagos
- ✅ **Integración Wompi** - Pagos con tarjeta, links de pago y cobros recurrentes
- ✅ **Recordatorios** - Envío de recordatorios por WhatsApp/Email
- ✅ **Notificaciones Push** - Alertas de pagos próximos
- ✅ **PWA** - Instalable como aplicación nativa

## 📦 Instalación

```bash
# Clonar o navegar al directorio
cd Suscripciones

# Instalar dependencias
npm install

# Iniciar servidor
npm start
```

El servidor estará disponible en `http://localhost:3000`

## ⚙️ Configuración de Wompi

### 1. Obtener credenciales

1. Regístrate en [Wompi](https://comercios.wompi.co)
2. En el panel de comercio, ve a **Desarrolladores > Llaves**
3. Copia tus llaves de **Sandbox** (pruebas) y **Producción**

### 2. Configurar en el servidor

Edita el archivo `server.js` y reemplaza las credenciales:

```javascript
const WOMPI_CONFIG = {
  // Sandbox (pruebas)
  sandbox: {
    publicKey: 'pub_stagtest_TU_LLAVE_PUBLICA',
    privateKey: 'prv_stagtest_TU_LLAVE_PRIVADA',
    eventsSecret: 'stagtest_events_TU_SECRET',
    baseUrl: 'https://sandbox.wompi.co/v1'
  },
  // Producción
  production: {
    publicKey: 'pub_prod_TU_LLAVE_PUBLICA',
    privateKey: 'prv_prod_TU_LLAVE_PRIVADA',
    eventsSecret: 'prod_events_TU_SECRET',
    baseUrl: 'https://production.wompi.co/v1'
  },
  // Cambiar a 'production' cuando esté listo
  environment: 'sandbox'
};
```

### 3. Configurar Webhook

Para recibir notificaciones de pagos:

1. En el panel de Wompi, ve a **Desarrolladores > Webhooks**
2. Agrega la URL: `https://TU-DOMINIO.com/api/wompi/webhook`
3. Selecciona el evento `transaction.updated`
4. Copia el **Secret** del webhook y pégalo en `eventsSecret`

## 🏗️ Estructura del Proyecto

```
Suscripciones/
├── index.html          # Aplicación principal
├── app.js              # Lógica del frontend
├── server.js           # Backend con API REST
├── service-worker.js   # PWA offline support
├── manifest.json       # Configuración PWA
├── package.json        # Dependencias
├── netlify.toml        # Config para Netlify
├── .gitignore
└── README.md
```

## 🔌 API Endpoints

### CRUD Genérico
- `GET /api/:table` - Obtener todos
- `GET /api/:table/:id` - Obtener uno
- `POST /api/:table` - Guardar lista
- `PUT /api/:table/:id` - Actualizar/Crear uno
- `DELETE /api/:table/:id` - Eliminar

### Wompi
- `GET /api/wompi/config` - Configuración pública
- `POST /api/wompi/payment-link` - Crear link de pago
- `GET /api/wompi/acceptance-token` - Token de aceptación
- `POST /api/wompi/transactions` - Crear transacción
- `GET /api/wompi/transactions/:id` - Consultar transacción
- `POST /api/wompi/tokens/cards` - Tokenizar tarjeta
- `POST /api/wompi/payment-sources` - Crear fuente de pago
- `POST /api/wompi/charge-source` - Cobrar a fuente guardada
- `POST /api/wompi/webhook` - Recibir eventos de Wompi

### Utilidades
- `GET /api/subscriptions/upcoming?days=7` - Suscripciones próximas a vencer
- `GET /api/subscriptions/overdue` - Suscripciones vencidas
- `GET /api/stats/dashboard` - Estadísticas del dashboard

## 💳 Flujos de Pago con Wompi

### 1. Link de Pago (Recomendado)
1. Crear link desde el modal de pago
2. Compartir link por WhatsApp/Email al cliente
3. Cliente paga en página de Wompi
4. Webhook actualiza el estado automáticamente

### 2. Pago con Tarjeta
1. Tokenizar tarjeta del cliente
2. Crear Payment Source para cobros recurrentes
3. Cobrar usando el Payment Source ID

### 3. Pago Manual
Para pagos en efectivo o transferencia:
1. Registrar pago manual
2. Se actualiza la fecha del próximo pago automáticamente

## 📲 Instalación como PWA

### En Móvil (Chrome/Safari)
1. Abre la app en el navegador
2. Toca el menú (⋮) > "Añadir a pantalla de inicio"
3. La app quedará instalada

### En Escritorio (Chrome/Edge)
1. Abre la app
2. Clic en el ícono de instalación en la barra de direcciones
3. Confirmar instalación

## 🌐 Despliegue

### Opción 1: Servidor propio
```bash
# Con PM2 para producción
npm install -g pm2
pm2 start server.js --name suscripciones

# Configurar Nginx como proxy reverso
```

### Opción 2: Railway/Render
1. Conecta tu repositorio
2. Configura las variables de entorno
3. Deploy automático

### Opción 3: Frontend en Netlify + Backend separado
1. Despliega el backend en Railway/Render
2. Actualiza `netlify.toml` con la URL del backend
3. Despliega el frontend en Netlify

## 🔧 Desarrollo

```bash
# Modo desarrollo con auto-reload
npm run dev
```

## 📊 Base de Datos

SQLite local (`suscripciones.db`) con las siguientes tablas:
- `clients` - Clientes
- `plans` - Planes de suscripción
- `subscriptions` - Suscripciones activas
- `payments` - Historial de pagos
- `reminders` - Recordatorios programados
- `config` - Configuración general
- `wompi_events` - Log de webhooks de Wompi

## 🎨 Tarjetas de Prueba (Sandbox)

| Tarjeta | Número | CVV | Fecha |
|---------|--------|-----|-------|
| Visa (Aprobada) | 4242 4242 4242 4242 | 123 | Cualquier futura |
| Visa (Rechazada) | 4111 1111 1111 1111 | 123 | Cualquier futura |
| Mastercard | 5425 2334 3010 9903 | 123 | Cualquier futura |

## 📝 Licencia

MIT

---

Desarrollado con ❤️ para gestionar tus suscripciones fácilmente.
