# CODEXIS - Sistema de Gestión de Suscripciones

PWA (Progressive Web App) para gestionar suscripciones de software desarrollado para Codexis.

## Características

### ✨ Funcionalidades Principales

- **Dashboard**: Vista general con estadísticas en tiempo real
  - Suscripciones activas
  - Próximas a vencer
  - Ingresos mensuales
  - Total de clientes

- **Gestión de Suscripciones**
  - Crear, editar y eliminar suscripciones
  - Información del cliente (nombre, email, teléfono)
  - Detalles del programa/software
  - Cuota mensual configurable
  - Fecha de inicio y día de corte personalizado
  - Sistema de recordatorios automáticos

- **Generación de Facturas**
  - Crear facturas desde suscripciones existentes
  - Vista previa antes de generar
  - Historial de facturas
  - Filtrado por mes

- **Sistema de Recordatorios**
  - Alertas automáticas según días configurados
  - Identificación visual de urgencias
  - Recordatorios en el dashboard

### 🎨 Diseño

- **Color principal**: Negro (#000000)
- **Color secundario**: Blanco (#FFFFFF)
- Diseño responsive (mobile-first)
- Interfaz moderna y minimalista
- Estados visuales claros (activo, por vencer, vencido)

### 💾 Almacenamiento

- Datos guardados en LocalStorage del navegador
- Persistencia automática
- Sin necesidad de servidor

## Instalación

1. Abre el archivo `index.html` en tu navegador
2. Para instalar como PWA:
   - **Chrome/Edge**: Clic en el icono de instalación en la barra de direcciones
   - **iOS Safari**: Menú → "Añadir a pantalla de inicio"
   - **Android**: Menú → "Instalar app"

## Uso

### Agregar una Suscripción

1. Ve a la pestaña "Suscripciones"
2. Clic en "+ Nueva Suscripción"
3. Completa los datos:
   - Información del cliente
   - Nombre del programa/software
   - Cuota mensual
   - Día de corte (día del mes en que vence)
   - Días de anticipación para recordatorios
4. Guarda

### Generar una Factura

1. Ve a la pestaña "Facturas"
2. Clic en "Generar Factura"
3. Selecciona la suscripción
4. Elige la fecha y período
5. Usa "Vista Previa" para revisar
6. Genera la factura

### Ver Recordatorios

- Los recordatorios aparecen automáticamente en:
  - Dashboard (alertas de vencimiento)
  - Pestaña "Recordatorios"
- Se activan según los días configurados antes del corte

## Estados de Suscripción

- 🟢 **Activo**: Más días del período de recordatorio
- 🟡 **Por Vencer**: Dentro del período de recordatorio
- 🔴 **Vencido**: Pasó el día de corte

## Filtros y Búsqueda

- Buscar por nombre de cliente o programa
- Filtrar por estado (activo, por vencer, vencido)
- Filtrar facturas por mes

## Requisitos Técnicos

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- JavaScript habilitado
- LocalStorage disponible

## Notas

- La funcionalidad de descarga de PDF está preparada para implementación futura
- Los datos se almacenan localmente en el dispositivo
- Para compartir datos entre dispositivos, considera implementar sincronización en la nube

## Soporte

Para soporte o preguntas sobre el sistema, contacta con el equipo de Codexis.

---

**Codexis** - Desarrollo de Software
