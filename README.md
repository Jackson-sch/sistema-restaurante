# 🍽️ Sistema de Gestión para Restaurantes

Sistema integral de punto de venta (POS) y gestión para restaurantes, desarrollado con tecnologías modernas y enfocado en el mercado peruano.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-7-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Módulos](#-módulos)
- [API y Acciones](#-api-y-acciones)
- [Base de Datos](#-base-de-datos)
- [Desarrollo](#-desarrollo)

---

## ✨ Características

### 🛒 Gestión de Pedidos
- Creación rápida de órdenes con interfaz intuitiva
- Soporte para tipos: **Mesa**, **Para llevar**, **Delivery**
- Modificadores y variantes de productos
- **Visualización de ingredientes**: El mesero puede ver qué contiene cada plato
- Notas especiales por ítem
- Estado de pedidos en tiempo real

### 👨‍🍳 Vista de Cocina
- Pantalla dedicada para personal de cocina
- Actualización en tiempo real vía **Server-Sent Events (SSE)**
- Priorización de pedidos
- Marcado de ítems como preparados

### 💰 Caja Registradora
- Control de turnos con apertura/cierre
- Registro de ingresos y egresos
- Cálculo automático de diferencias
- Historial de sesiones

### 🪑 Gestión de Mesas
- Mapa visual interactivo de mesas
- Organización por zonas
- Estados: Disponible, Ocupada, Reservada, Limpieza
- Acciones rápidas por mesa

### 📊 Reportes y Analíticas
- **Ventas**: Tendencias, métodos de pago, ticket promedio
- **Productos**: Top ventas, categorías
- **Personal**: Rendimiento de meseros y cajeros
- **Inventario**: Stock bajo, movimientos
- **Caja**: Sesiones, descuadres
- Exportación a **Excel** y **PDF**

### 📦 Inventario
- Control de ingredientes y stock
- Alertas de stock bajo
- Movimientos (entradas, salidas, ajustes)
- Recetas por producto

### 👥 Gestión de Personal
- Roles: **Admin**, **Gerente**, **Mesero**, **Cajero**, **Cocina**
- Sistema de permisos granular por ruta
- Activación/desactivación de usuarios
- Control de acceso basado en roles (RBAC)

### 🧾 Pagos y Comprobantes
- Múltiples métodos: Efectivo, Tarjeta, Yape, Plin
- Pagos divididos
- Comprobantes: Boleta, Factura, Nota de Venta
- Series configurables

### 🎨 Interfaz Moderna
- Diseño responsive (móvil, tablet, desktop)
- Modo oscuro/claro
- Animaciones fluidas
- Componentes accesibles

### 📱 Progressive Web App (PWA)
- Instalable en dispositivos móviles y desktop
- Funciona sin conexión (caché de recursos)
- Experiencia nativa en cualquier plataforma

---

## 🛠️ Tecnologías

| Categoría | Tecnología |
|-----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **UI** | React 19, Tailwind CSS 4 |
| **Componentes** | Radix UI, shadcn/ui |
| **Base de Datos** | PostgreSQL + Prisma 7 |
| **Autenticación** | Auth.js (NextAuth v5) |
| **Gráficos** | Recharts |
| **Formularios** | React Hook Form + Zod |
| **Tablas** | TanStack Table |
| **Animaciones** | Framer Motion |
| **Exportación** | xlsx, @react-pdf/renderer |
| **PWA** | @ducanh2912/next-pwa |

---

## 📋 Requisitos Previos

- **Node.js** 20+ o **Bun** 1.0+
- **PostgreSQL** 14+
- **Git**

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Jackson-sch/sistema-restaurante.git
cd sistema-restaurante
```

### 2. Instalar dependencias

```bash
# Con Bun (recomendado)
bun install

# O con npm
npm install
```

### 3. Configurar variables de entorno

```bash
cp env-template.txt .env.local
```

Editar `.env.local` con tus valores:

```env
# Base de datos
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/restaurante"

# Auth.js
AUTH_SECRET="tu-secret-seguro-aqui"

# Opcional: Proveedores OAuth
AUTH_GOOGLE_ID="..."
AUTH_GOOGLE_SECRET="..."
```

### 4. Configurar la base de datos

```bash
# Generar cliente de Prisma
bunx prisma generate

# Aplicar migraciones
bunx prisma db push

# Poblar datos de prueba (opcional)
bunx prisma db seed
```

### 5. Iniciar el servidor de desarrollo

```bash
bun run dev
```

Acceder a `http://localhost:3000`

---

## ⚙️ Configuración

### Usuario Administrador por Defecto

Después del seed, puedes acceder con:
- **Email**: `admin@mirestaurante.com`
- **Contraseña**: `admin123`

### Configuración del Restaurante

1. Ir a **Configuración** en el sidebar
2. Actualizar datos del restaurante (nombre, RUC, dirección)
3. Configurar series de comprobantes

---

## 📁 Estructura del Proyecto

```
sistema-restaurante/
├── prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   ├── seed.ts            # Datos de prueba
│   └── migrations/        # Migraciones
├── public/                # Assets estáticos
├── src/
│   ├── actions/           # Server Actions (22 archivos)
│   ├── app/
│   │   ├── (auth)/        # Páginas de autenticación
│   │   ├── api/           # API Routes (SSE kitchen)
│   │   └── dashboard/     # Páginas del dashboard
│   ├── components/
│   │   ├── ui/            # Componentes base (shadcn)
│   │   ├── analytics/     # Gráficos y estadísticas
│   │   ├── cash-register/ # Componentes de caja
│   │   ├── inventory/     # Gestión de inventario
│   │   ├── kitchen/       # Vista de cocina
│   │   ├── menu/          # Productos y categorías
│   │   ├── navbar/        # Navegación
│   │   ├── orders/        # Gestión de pedidos
│   │   ├── payments/      # Pagos y comprobantes
│   │   ├── reports/       # Reportes
│   │   ├── staff/         # Personal
│   │   └── tables/        # Mesas y zonas
│   ├── lib/
│   │   ├── prisma.ts      # Cliente Prisma
│   │   ├── utils.ts       # Utilidades
│   │   └── schemas/       # Esquemas Zod
│   └── auth.ts            # Configuración Auth.js
├── docs/                  # Documentación adicional
└── package.json
```

---

## 📦 Módulos

### Dashboard Principal
Página de inicio con estadísticas del día:
- Ventas totales
- Número de pedidos
- Ticket promedio
- Gráficos de tendencias

### Analíticas (`/dashboard/analytics`)
- Horas pico
- Ventas por categoría
- Comparativa semanal
- Rendimiento de meseros

### Menú (`/dashboard/menu`)
- Gestión de categorías
- CRUD de productos
- Variantes y modificadores
- Disponibilidad

### Pedidos (`/dashboard/orders`)
- Lista de pedidos activos
- Filtros por estado
- Detalles y edición
- Historial
- **Ver ingredientes** al agregar productos al carrito

### Cocina (`/dashboard/kitchen`)
- Vista en tiempo real
- Actualización automática
- Control de preparación

### Mesas (`/dashboard/tables`)
- Vista de lista
- Mapa visual por zonas
- Gestión de zonas

### Caja (`/dashboard/cash-register`)
- Dashboard de turno actual
- Movimientos
- Cierre de caja
- Historial

### Pagos (`/dashboard/payments`)
- Lista de pagos
- Procesamiento
- Comprobantes

### Inventario (`/dashboard/inventory`)
- Ingredientes
- Stock actual
- Alertas

### Reportes (`/dashboard/reports`)
- Ventas
- Productos
- Personal
- Inventario
- Caja

### Personal (`/dashboard/staff`)
- Lista de usuarios
- Roles y permisos
- Estados

### Configuración (`/dashboard/settings`)
- Datos del restaurante
- Series de comprobantes
- Preferencias

---

## 🔌 API y Acciones

El sistema utiliza **Server Actions** de Next.js para todas las operaciones:

| Archivo | Descripción |
|---------|-------------|
| `auth.ts` | Login, logout, registro |
| `orders.ts` | CRUD de pedidos |
| `payments.ts` | Procesamiento de pagos |
| `products.ts` | Gestión de productos |
| `categories.ts` | Categorías del menú |
| `tables.ts` | Mesas del restaurante |
| `zones.ts` | Zonas/áreas |
| `staff.ts` | Personal y usuarios |
| `inventory.ts` | Stock e ingredientes |
| `cash-register.ts` | Caja y turnos |
| `reports.ts` | Generación de reportes |
| `reports-export.ts` | Exportación Excel/PDF |
| `analytics.ts` | Datos para gráficos |
| `dashboard.ts` | Estadísticas dashboard |
| `settings.ts` | Configuración |

---

## 🗄️ Base de Datos

### Modelos Principales

```
Restaurant ─┬─ Users
            ├─ Categories ─── Products ─── Variants
            │                      └───── Modifiers
            ├─ Zones ──────── Tables
            ├─ Orders ─────── OrderItems ─── Payments
            ├─ CashRegisters ─ Transactions
            ├─ Ingredients ─── StockMovements
            └─ ReceiptSeries
```

### Arquitectura Multi-Tenant

Cada restaurante tiene su propio espacio aislado. Los usuarios solo pueden ver datos de su restaurante asignado.

---

## 👨‍💻 Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
bun run dev

# Build producción
bun run build

# Iniciar producción
bun run start

# Linting
bun run lint

# Prisma Studio
bunx prisma studio

# Resetear base de datos
bunx prisma db push --force-reset
bunx prisma db seed
```

### Convenciones de Código

- **TypeScript** estricto
- **ESLint** para linting
- **Prettier** para formato
- Componentes en **PascalCase**
- Acciones en **camelCase**
- Archivos en **kebab-case**

---

## 📄 Licencia

Este proyecto es privado y de uso comercial.

---

## 🤝 Contribución

Para contribuir al proyecto:

1. Crear rama desde `main`
2. Seguir convenciones de código
3. Probar cambios localmente
4. Crear Pull Request

---

## 📞 Soporte

Para soporte técnico o consultas, contactar al equipo de desarrollo.

---

**Desarrollado con ❤️ para el sector gastronómico peruano**
