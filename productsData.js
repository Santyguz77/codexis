// Datos Centralizados de Productos CODEXIS
// Puedes agregar, quitar o modificar los productos y sus especificaciones en este archivo.
// Los cambios se verán reflejados automáticamente en la Propuesta, Catálogo y Especificaciones.

const INITIAL_PRODUCTS_DATA = [
    {
        id: "bullet-4k",
        name: "Codexis Bullet 4K Elite",
        category: "camaras", // Categorías: 'camaras', 'almacenamiento', 'infraestructura'
        series: "SERIE PRO",
        tag: "Perimetral Largo Alcance",
        description: "Monitoreo perimetral y largo alcance exterior con precisión quirúrgica.",
        price: 1400000,
        qtyRecommended: 8,
        qtyDesired: 10,
        quantity: 8, // para compatibilidad hacia atrás
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDHAnLyxvmxTRdod9qbTJSQpfcEfe6SarIfjUI8WCBIzwBVMdjZt9piAxBW4IB4w4KtD_nuWsqz_RjO6Fxu_UN4skvyJZQAM-YjLKorN7W8WzoSCiCPWSXwcflM3dZCtd4ud2EUFFlii--mUWmXyU0L53zJVXqxTS7ZdMY8IZNGAclbP71NkrrHmpziNZ6sJI0t6fTewHgIA9JJlPsvWQGO21uoqmRPedw-9_jK7t7tekKR-MVFSs7d3g",
        imageAlt: "Minimalist architectural photo of a sleek white security camera on a light grey concrete wall.",
        featured: true, // Si es true, aparecerá destacado en la propuesta principal (Montearroyo.html)
        optional: false,
        allowCustomQty: true,
        specsSummary: {
            "Resolución": "8MP (3840x2160)",
            "Alcance IR": "60 Metros"
        },
        specsDetailed: {
            "Resolución Máxima": "8 Megapíxeles (3840 x 2160 @ 30 FPS)",
            "Sensor de Imagen": "1/1.8\" Progressive Scan CMOS",
            "Lente / Óptica": "Motorizado 2.7 mm a 12 mm / Autofocus",
            "Visión Nocturna": "Smart IR hasta 60 Metros (Adaptativo)",
            "Ángulo de Visión": "Horizontal: 112.4° a 45.8°",
            "Analíticas de IA": "Cruce de línea, Intrusión, Rostros, Vehículos",
            "Compresión de Video": "H.265+ / H.265 / H.264+ / H.264",
            "Protección Ambiental": "IP67 hermética / IK10 antivándalo",
            "Alimentación / PoE": "PoE+ (802.3at, Class 4) / Máx 12.5 W"
        }
    },
    {
        id: "dome-night",
        name: "Codexis Dome Stealth Vision",
        category: "camaras",
        series: "MÁS VENDIDO",
        tag: "Interiores Estéticos",
        description: "Cúpula interior de alta estética y visión residual a color bajo iluminación mínima.",
        price: 1150000,
        qtyRecommended: 12,
        qtyDesired: 8,
        quantity: 12,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCcMod0oNIxO9qiw3LTdDSz4CgICy9eLzIZvuYyFdj8KhStdv7p6VZgPJkOIgtgY7KJFyNEFKzSKl981b8GVrO7AuJjBs1DPOy84LsEghl0gckjwY5DWoBBBbifsUVTBDoNOwLKOOon2Kjij5IRWloapsnwzuQQQJJRod1EMyus5prVFzU4bs6ZeQQ-nGF-4idb7OY-0o_svyKzd7IIi24P0R2JSkabdrZhXtt9ZAOFnEgPf08mxQdokg",
        imageAlt: "Architectural dome camera against a clean minimalist white ceiling with subtle shadows.",
        featured: true,
        optional: false,
        allowCustomQty: true,
        specsSummary: {
            "Sensor": "Starlight Ultra",
            "Protección": "IP67 / IK10"
        },
        specsDetailed: {
            "Resolución Máxima": "4 Megapíxeles (2560 x 1440 @ 30 FPS)",
            "Sensor de Imagen": "1/1.8\" Starlight CMOS sensible a luz residual",
            "Lente / Óptica": "Fijo 2.8 mm / Gran Apertura F1.0",
            "Visión Nocturna": "Color a tiempo completo 24/7 (0.0005 Lux)",
            "Ángulo de Visión": "Horizontal: 108.2°",
            "Analíticas de IA": "Cruce de línea, Intrusión perimetral, Audio bidireccional",
            "Compresión de Video": "H.265+ / H.265 / H.264+ / H.264",
            "Protección Ambiental": "IP67 hermética / IK10 antivándalo",
            "Alimentación / PoE": "PoE (802.3af, Class 3) / Máx 8.2 W"
        }
    },
    {
        id: "ptz-360",
        name: "Codexis PTZ 360 Vanguard",
        category: "camaras",
        series: "PREMIUM",
        tag: "Control de Áreas Extensas",
        description: "Domo robotizado de alta velocidad con seguimiento autónomo de objetivos.",
        price: 5200000,
        qtyRecommended: 2,
        qtyDesired: 3,
        quantity: 2,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4eSSw-fQOe8avs7RgfThm1UHv5UNVqn3K7OZNXJN1pkfaa7SzWKYeLifoiOoniIuurgehyJaetyqXeDbfaAv5cW8-1j7aeOzlIVm6gbA3dZ-f0LlU8JO20k_NgxiE0X9LE0sGnRx_urU1h6lq3wJdKrQhIcewHDXkrgE9ihPoJU-Uvt--9zs3T1tPEYC-4z573G07_UibuMivpSHCIJNMFi2pxAumKLxvpls4yYaTBJQYR60w0ZAo2A",
        imageAlt: "Professional PTZ camera mounted on a clean steel structure against a clear sky.",
        featured: true,
        optional: true,
        allowCustomQty: true,
        specsSummary: {
            "Zoom Óptico": "40x de Precisión",
            "Seguimiento": "IA Active Follow"
        },
        specsDetailed: {
            "Resolución Máxima": "8 Megapíxeles (4K UHD @ 60 FPS)",
            "Sensor de Imagen": "1/1.2\" Sony STARVIS retroiluminado",
            "Lente / Óptica": "Zoom Óptico 40x / Foco Laser Ultra-Rápido",
            "Visión Nocturna": "Láser IR de largo alcance hasta 200 Metros",
            "Ángulo de Visión": "Horizontal: 64.5° a 1.8° (Giro de 360° continuo)",
            "Analíticas de IA": "Auto-tracking de objetivos, Lectura de Matrículas (LPR), Clasificación inteligente",
            "Compresión de Video": "H.265+ / H.265 / MJPEG dual-stream",
            "Protección Ambiental": "IP68 impermeable / IK10 / Calefactor desempañador",
            "Alimentación / PoE": "High-PoE (802.3at/bt) / 24V AC / Máx 45 W"
        }
    },
    {
        id: "nvr-vault",
        name: "Codexis Vault Pro NVR (64Ch)",
        category: "almacenamiento",
        series: "INFRAESTRUCTURA",
        tag: "Unidad NVR",
        description: "Servidor de almacenamiento y grabación corporativo con soporte redundante RAID.",
        price: 9800000,
        qtyRecommended: 1,
        qtyDesired: 1,
        quantity: 1,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDr8mA_LBxdpgjOSf_wq95ycC2NkxA7ifIcD5TPtA1rJD4BB7qvf9WBt0rS_VIjonIm_ZFQ3O7VUclz16Dxk3-QPLt9eTq-kgzCPV8d_DKnnl4U7joyvr_NFsNH8nnU74lexdiYitkCdX-am46SvOzicVcVhxKtZWn8C3CPtrmyNNl45m3mXgCql8Vspsdl7QzyUCbNmG5h7hnFArqsO9_n6Bf8l7JBSbKkiZNpUv6hJVEXxVcM5otkIyfshH5jV89MzwmhaFGQJWhw",
        imageAlt: "Rack mounted NVR unit.",
        featured: false,
        optional: false,
        allowCustomQty: false,
        specsSummary: {
            "Canales": "64 Canales IP",
            "Respaldo": "RAID 0,1,5,6,10"
        },
        specsDetailed: {
            "Función Principal": "Procesamiento de Video e Inteligencia Centralizada",
            "Capacidad": "Hasta 64 cámaras de video en resolución 4K",
            "Redundancia / Respaldo": "Soporta arreglos RAID 0, 1, 5, 6, 10 / Hot-swap",
            "Ancho de Banda": "Grabación: 384 Mbps / Salida: 384 Mbps",
            "Bahías de Disco": "8 Bahías SATA de hasta 16TB c/u (128TB máximo)",
            "Seguridad Física": "Gabinete de montaje en Rack (2U) con llave de seguridad"
        }
    },
    {
        id: "hdd-10tb",
        name: "HDD Enterprise 10TB (Pack x8)",
        category: "almacenamiento",
        series: "ALMACENAMIENTO",
        tag: "Pack de Almacenamiento",
        description: "Arreglo de almacenamiento enterprise optimizado para flujo constante de CCTV 24/7.",
        price: 7400000,
        qtyRecommended: 1,
        qtyDesired: 1,
        quantity: 1,
        image: "",
        imageAlt: "HDD Enterprise disks pack.",
        featured: false,
        optional: false,
        allowCustomQty: false,
        specsSummary: {
            "Capacidad": "80TB Total (8x10TB)",
            "Uso": "Enterprise 24/7"
        },
        specsDetailed: {
            "Función Principal": "Almacenamiento Continuo de Alta Confiabilidad",
            "Capacidad": "10 TB por disco duro (Configuración 80TB total)",
            "Redundancia / Respaldo": "Tecnología contra vibraciones rotacionales (RV)",
            "Ancho de Banda": "Transferencia sostenida de hasta 250 MB/s",
            "Bahías de Disco": "Formato 3.5 pulgadas SATA III a 6 Gb/s",
            "Seguridad Física": "Garantía Enterprise MTBF de 2 millones de horas"
        }
    },
    {
        id: "instalacion",
        name: "Implementación Técnica y Red",
        category: "infraestructura",
        series: "SERVICIOS",
        tag: "Instalación",
        description: "Instalación certificada ISO 27001, cableado estructurado Cat6A blindado y switches administrables.",
        price: 4600000,
        qtyRecommended: 1,
        qtyDesired: 1,
        quantity: 1,
        image: "",
        imageAlt: "Network switch and rack wiring.",
        featured: false,
        optional: false,
        allowCustomQty: false,
        specsSummary: {
            "Cableado": "Cat6A F/UTP LSZH",
            "Switches": "PoE+ Capa 2+"
        },
        specsDetailed: {
            "Función Principal": "Transmisión Física de Datos y Energía Blindada",
            "Capacidad": "Switches Administrables Capa 2+ de 24 puertos PoE+",
            "Redundancia / Respaldo": "Enlaces uplink SPF+ 10Gbps a anillo principal",
            "Ancho de Banda": "Tasa de transferencia a 10/100/1000 Mbps por puerto",
            "Bahías de Disco": "No Aplica",
            "Seguridad Física": "Cableado Cat6A Blindado (F/UTP) de cobre puro"
        }
    }
];

// Cargar de localStorage si existe, de lo contrario inicializar con INITIAL_PRODUCTS_DATA
if (!localStorage.getItem('products_data')) {
    localStorage.setItem('products_data', JSON.stringify(INITIAL_PRODUCTS_DATA));
} else {
    // Autorecuperación / Migración de base de datos local
    try {
        const stored = JSON.parse(localStorage.getItem('products_data'));
        let modified = false;
        stored.forEach(p => {
            if (p.qtyRecommended === undefined || p.qtyDesired === undefined) {
                const initialMatch = INITIAL_PRODUCTS_DATA.find(init => init.id === p.id);
                p.qtyRecommended = initialMatch ? initialMatch.qtyRecommended : (p.quantity || 1);
                p.qtyDesired = initialMatch ? initialMatch.qtyDesired : (p.quantity || 1);
                p.quantity = p.qtyRecommended; // mantener sincronía para compatibilidad
                modified = true;
            }
            if (p.allowCustomQty === undefined) {
                const initialMatch = INITIAL_PRODUCTS_DATA.find(init => init.id === p.id);
                p.allowCustomQty = initialMatch ? !!initialMatch.allowCustomQty : (p.category === 'camaras');
                modified = true;
            }
        });
        if (modified) {
            localStorage.setItem('products_data', JSON.stringify(stored));
        }
    } catch(e) {
        console.error("Error al migrar localStorage de productos:", e);
    }
}
const PRODUCTS_DATA = JSON.parse(localStorage.getItem('products_data'));
