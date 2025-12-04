# 💼 CODEXIS - Sistema de Gestión de Suscripciones

Sistema PWA (Progressive Web App) para gestión de suscripciones, facturación y pagos con integración de Wompi.

## 🚀 Características

✅ Gestión completa de suscripciones con fechas de corte  
✅ Generación automática de facturas en PDF  
✅ Sistema de recordatorios automáticos  
✅ Integración con Wompi para pagos (PSE y tarjetas)  
✅ Envío de facturas por Email y WhatsApp  
✅ Dashboard con estadísticas en tiempo real  
✅ Modo offline (funciona sin internet)  
✅ Sincronización con backend en la nube (opcional)  
✅ Diseño profesional responsive  

---

## 📱 MODO LOCAL (Sin Backend)

### Instalación Simple

1. Abre `index.html` en tu navegador
2. ¡Listo! La aplicación funciona 100% en el navegador
3. Los datos se guardan en LocalStorage de tu navegador

### Características en Modo Local

- ✅ Funciona completamente offline
- ✅ No requiere instalación de nada
- ⚠️ Los datos solo están en tu navegador
- ⚠️ Si borras el caché, pierdes los datos
- ⚠️ No se puede acceder desde otros dispositivos

---

## ☁️ MODO CON BACKEND (Recomendado)

### Ventajas del Backend

✅ Sincronización entre múltiples dispositivos  
✅ Backup automático en la nube  
✅ Acceso desde cualquier lugar  
✅ Los datos persisten aunque borres el caché  
✅ Múltiples usuarios pueden colaborar  

### Requisitos del VPS

- Ubuntu/Debian/Kali Linux
- Node.js v18 o superior
- PM2 (gestor de procesos)
- Cloudflare Tunnel (para exponer el servidor)

### Instalación del Backend

#### 1️⃣ Preparar archivos en tu PC

```powershell
cd C:\Users\User\Desktop\Codexis
```

#### 2️⃣ Instalar dependencias localmente (prueba)

```powershell
npm install
node server.js
```

Deberías ver: `✅ API de CODEXIS corriendo en puerto 3003`

#### 3️⃣ Conectarse al VPS

```bash
ssh root@TU_IP_VPS
```

#### 4️⃣ Crear directorio en el VPS

```bash
mkdir -p ~/codexis_api
cd ~/codexis_api
```

#### 5️⃣ Copiar archivos desde tu PC al VPS

```powershell
# Ejecuta esto en PowerShell de tu PC
scp C:\Users\User\Desktop\Codexis\server.js root@TU_IP_VPS:/root/codexis_api/
scp C:\Users\User\Desktop\Codexis\package.json root@TU_IP_VPS:/root/codexis_api/
scp C:\Users\User\Desktop\Codexis\index.html root@TU_IP_VPS:/root/codexis_api/
scp C:\Users\User\Desktop\Codexis\manifest.json root@TU_IP_VPS:/root/codexis_api/
scp C:\Users\User\Desktop\Codexis\sw.js root@TU_IP_VPS:/root/codexis_api/
scp C:\Users\User\Desktop\Codexis\*.png root@TU_IP_VPS:/root/codexis_api/
```

#### 6️⃣ Instalar dependencias en el VPS

```bash
cd ~/codexis_api
npm install
```

#### 7️⃣ Iniciar con PM2

```bash
pm2 start server.js --name codexis-api
pm2 save
pm2 startup
```

#### 8️⃣ Configurar Cloudflare Tunnel

```bash
# Instalar Cloudflare Tunnel (si no lo tienes)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared-linux-amd64.deb

# Iniciar tunnel
pm2 start cloudflared --name cloudflare-tunnel-codexis -- tunnel --url http://localhost:3003
pm2 save
```

#### 9️⃣ Copiar la URL de Cloudflare

Ejecuta: `pm2 logs cloudflare-tunnel-codexis`

Verás algo como:
```
https://abc-xyz-123.trycloudflare.com
```

**¡COPIA ESA URL!**

#### 🔟 Conectar la PWA con el backend

Edita `index.html` y busca esta línea (alrededor de línea 1055):

```javascript
const API_URL = '';  // Dejar vacío para usar LocalStorage
```

Cámbiala por tu URL de Cloudflare:

```javascript
const API_URL = 'https://abc-xyz-123.trycloudflare.com';
```

¡Listo! Ahora tu PWA sincroniza con el backend en la nube.

---

## 📊 Migrar Datos Existentes al Backend

Si ya tienes datos en LocalStorage y quieres subirlos al servidor:

1. Abre la consola del navegador (F12)
2. Ejecuta:

```javascript
async function migrateToBackend() {
    const API_URL = 'https://TU-URL-CLOUDFLARE.trycloudflare.com';
    
    const subscriptions = JSON.parse(localStorage.getItem('subscriptions') || '[]');
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const payments = JSON.parse(localStorage.getItem('payments') || '[]');
    
    const response = await fetch(`${API_URL}/api/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptions, invoices, payments })
    });
    
    const result = await response.json();
    console.log('✅ Migración completada:', result);
}

migrateToBackend();
```

---

## 🔧 Comandos Útiles del VPS

### Ver logs del servidor
```bash
pm2 logs codexis-api
```

### Reiniciar el servidor
```bash
pm2 restart codexis-api
```

### Ver estado
```bash
pm2 status
```

### Actualizar código
```powershell
# En tu PC
scp C:\Users\User\Desktop\Codexis\server.js root@TU_IP_VPS:/root/codexis_api/
```

```bash
# En el VPS
pm2 restart codexis-api
```

---

## 🌐 API Endpoints

### Verificación
- `GET /` - Verificar que el servidor funciona

### Suscripciones
- `GET /api/subscriptions` - Obtener todas
- `POST /api/subscriptions` - Guardar lista completa
- `PUT /api/subscriptions/:id` - Actualizar/crear una
- `DELETE /api/subscriptions/:id` - Eliminar una

### Facturas
- `GET /api/invoices` - Obtener todas
- `POST /api/invoices` - Guardar lista completa
- `PUT /api/invoices/:id` - Actualizar/crear una
- `DELETE /api/invoices/:id` - Eliminar una

### Pagos
- `GET /api/payments` - Obtener todos
- `POST /api/payments` - Guardar lista completa
- `PUT /api/payments/:id` - Actualizar/crear uno
- `DELETE /api/payments/:id` - Eliminar uno

### Sincronización
- `GET /api/sync` - Obtener todos los datos
- `POST /api/sync` - Sincronizar todos los datos

---

## 💳 Configuración de Wompi

### Modo Pruebas (Actual)

Las credenciales están en el código:
```javascript
publicKey: 'pub_test_RAqnhtzXL2RelRoyT4fOzeo10sW4r2TC'
integritySecret: 'test_integrity_iZ6LG18NV43VYaU9em514MU0oIvwECno'
```

### Modo Producción

Para pagos reales, cambia las llaves en `index.html`:

```javascript
this.publicKey = 'pub_prod_TU_LLAVE_PRODUCCION';
this.integritySecret = 'prod_integrity_TU_SECRET_PRODUCCION';
```

Obtén tus llaves en: https://comercios.wompi.co/

---

## 🔐 Seguridad

### Contraseña de Acceso

La aplicación está protegida con contraseña: `Colombia77.`

Para cambiarla, busca en `index.html`:

```javascript
const CORRECT_PASSWORD = 'Colombia77.';
```

---

## 📱 Instalación como PWA

1. Abre la aplicación en Chrome/Edge
2. Haz clic en el ícono de "Instalar" en la barra de direcciones
3. La app se instalará como aplicación nativa

---

## 🆘 Solución de Problemas

### El servidor no inicia (puerto ocupado)
```bash
fuser -k 3003/tcp
pm2 restart codexis-api
```

### Cloudflare Tunnel se cae
```bash
pm2 restart cloudflare-tunnel-codexis
```

### No sincroniza con el backend
1. Verifica que `API_URL` esté configurada
2. Abre la consola del navegador (F12)
3. Busca errores en rojo
4. Verifica que el servidor esté corriendo: `pm2 status`

### Base de datos corrupta
```bash
rm ~/codexis_api/codexis_subscriptions.db
pm2 restart codexis-api
```

---

## 📁 Estructura del Proyecto

```
Codexis/
├── index.html              # Aplicación principal
├── manifest.json           # Configuración PWA
├── sw.js                   # Service Worker (offline)
├── server.js              # Backend Node.js + Express
├── package.json           # Dependencias
├── logo.png               # Logo de Codexis
├── image.png              # Icono 512x512
├── favicon-32x32.png      # Favicon
├── INSTRUCCIONES_VPS.txt  # Guía detallada VPS
├── MIGRACION_BACKEND.txt  # Guía de migración
└── README.md              # Este archivo
```

---

## 👨‍💻 Soporte

**CODEXIS - Desarrollo de Software**

Para soporte técnico o consultas, contacta al equipo de desarrollo.

---

## 📄 Licencia

MIT License - Uso interno de CODEXIS

---

**¡Gracias por usar el Sistema de Gestión de Suscripciones CODEXIS!** 💼
