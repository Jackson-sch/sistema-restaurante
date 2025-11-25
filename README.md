# Sistema de Restaurante - Perú

Sistema de gestión para restaurantes desarrollado con Next.js, Prisma, Auth.js y shadcn/ui.

## 🚀 Tecnologías

- **Next.js 16** - Framework de React con App Router
- **TypeScript** - Tipado estático
- **Prisma** - ORM para base de datos
- **Auth.js (NextAuth.js v5)** - Autenticación
- **shadcn/ui** - Componentes UI
- **Tailwind CSS** - Estilos
- **react-hook-form** - Manejo de formularios
- **zod** - Validación de esquemas

## 📦 Instalación

1. Clona el repositorio
2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   - Copia el contenido de `env-template.txt` a un nuevo archivo `.env`
   - Actualiza las variables con tus valores reales

4. Configura la base de datos:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 📁 Estructura del Proyecto

```
sistema-restaurante/
├── src/
│   ├── app/              # App Router de Next.js
│   │   └── api/auth/     # Rutas de autenticación
│   ├── components/       # Componentes React
│   │   └── ui/          # Componentes de shadcn/ui
│   ├── lib/             # Utilidades y configuraciones
│   ├── types/           # Definiciones de tipos TypeScript
│   └── auth.ts          # Configuración de Auth.js
├── prisma/
│   └── schema.prisma    # Esquema de base de datos
└── public/              # Archivos estáticos
```

## 🔐 Autenticación

El sistema utiliza Auth.js (NextAuth.js v5) con Prisma Adapter. Para agregar providers de autenticación, edita `src/auth.ts`.

## 🗄️ Base de Datos

El proyecto está configurado para usar PostgreSQL. Asegúrate de tener PostgreSQL instalado y corriendo, o actualiza la configuración en `prisma/schema.prisma` para usar otra base de datos compatible.

## 📝 Próximos Pasos

- [ ] Definir modelos de base de datos en `prisma/schema.prisma`
- [ ] Configurar providers de autenticación
- [ ] Crear componentes UI base
- [ ] Implementar funcionalidades del restaurante

## 🛠️ Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter

## 📄 Licencia

Este proyecto es privado y está protegido por derechos de autor.
