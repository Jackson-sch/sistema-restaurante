import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();

const permissions = [
    // Orders Module
    { name: 'orders.create', description: 'Crear nuevas órdenes', module: 'orders' },
    { name: 'orders.view', description: 'Ver órdenes', module: 'orders' },
    { name: 'orders.update', description: 'Actualizar estado de órdenes', module: 'orders' },
    { name: 'orders.cancel', description: 'Cancelar órdenes', module: 'orders' },
    { name: 'orders.delete', description: 'Eliminar órdenes', module: 'orders' },

    // Products Module
    { name: 'products.create', description: 'Crear productos', module: 'products' },
    { name: 'products.view', description: 'Ver productos', module: 'products' },
    { name: 'products.update', description: 'Actualizar productos', module: 'products' },
    { name: 'products.delete', description: 'Eliminar productos', module: 'products' },

    // Categories Module
    { name: 'categories.create', description: 'Crear categorías', module: 'categories' },
    { name: 'categories.view', description: 'Ver categorías', module: 'categories' },
    { name: 'categories.update', description: 'Actualizar categorías', module: 'categories' },
    { name: 'categories.delete', description: 'Eliminar categorías', module: 'categories' },

    // Tables Module
    { name: 'tables.create', description: 'Crear mesas', module: 'tables' },
    { name: 'tables.view', description: 'Ver mesas', module: 'tables' },
    { name: 'tables.update', description: 'Actualizar mesas', module: 'tables' },
    { name: 'tables.delete', description: 'Eliminar mesas', module: 'tables' },

    // Zones Module
    { name: 'zones.create', description: 'Crear zonas', module: 'zones' },
    { name: 'zones.view', description: 'Ver zonas', module: 'zones' },
    { name: 'zones.update', description: 'Actualizar zonas', module: 'zones' },
    { name: 'zones.delete', description: 'Eliminar zonas', module: 'zones' },

    // Payments Module
    { name: 'payments.create', description: 'Registrar pagos', module: 'payments' },
    { name: 'payments.view', description: 'Ver historial de pagos', module: 'payments' },
    { name: 'payments.refund', description: 'Procesar reembolsos', module: 'payments' },

    // Cash Register Module
    { name: 'cash_register.open', description: 'Abrir caja', module: 'cash_register' },
    { name: 'cash_register.close', description: 'Cerrar caja', module: 'cash_register' },
    { name: 'cash_register.view', description: 'Ver datos de caja', module: 'cash_register' },
    { name: 'cash_register.manage', description: 'Gestionar transacciones de caja', module: 'cash_register' },

    // Staff Module
    { name: 'staff.create', description: 'Crear personal', module: 'staff' },
    { name: 'staff.view', description: 'Ver personal', module: 'staff' },
    { name: 'staff.update', description: 'Actualizar personal', module: 'staff' },
    { name: 'staff.delete', description: 'Eliminar personal', module: 'staff' },

    // Reports Module
    { name: 'reports.sales', description: 'Ver reportes de ventas', module: 'reports' },
    { name: 'reports.inventory', description: 'Ver reportes de inventario', module: 'reports' },
    { name: 'reports.staff', description: 'Ver reportes de personal', module: 'reports' },

    // Inventory Module
    { name: 'inventory.view', description: 'Ver inventario', module: 'inventory' },
    { name: 'inventory.create', description: 'Crear ingredientes', module: 'inventory' },
    { name: 'inventory.update', description: 'Actualizar ingredientes', module: 'inventory' },
    { name: 'inventory.delete', description: 'Eliminar ingredientes', module: 'inventory' },
    { name: 'inventory.adjust', description: 'Ajustar stock', module: 'inventory' },

    // Settings Module
    { name: 'settings.view', description: 'Ver configuración', module: 'settings' },
    { name: 'settings.update', description: 'Actualizar configuración', module: 'settings' },
];

async function main() {
    console.log('🌱 Starting database seed...\n');

    // 1. Create default restaurant
    console.log('📍 Creating default restaurant...');
    try {
        let restaurant = await prisma.restaurant.findFirst({
            where: { slug: 'mi-restaurante' }
        });

        if (!restaurant) {
            restaurant = await prisma.restaurant.create({
                data: {
                    name: 'Mi Restaurante',
                    slug: 'mi-restaurante',
                    address: 'Av. Principal 123',
                    phone: '999-999-999',
                    email: 'contacto@mirestaurante.com',
                    ruc: '20123456789',
                    businessType: 'RESTAURANTE',
                    timezone: 'America/Lima',
                    currency: 'PEN',
                    active: true,
                }
            });
        }
        console.log(`✅ Restaurant created: ${restaurant.name}\n`);

        // 2. Create permissions
        console.log('🔐 Creating permissions...');
        await prisma.permission.deleteMany({});
        for (const permission of permissions) {
            await prisma.permission.create({ data: permission });
        }
        console.log(`✅ Created ${permissions.length} permissions\n`);

        // 3. Create test users for each role
        console.log('👤 Creating test users for each role...');

        const usersToCreate = [
            { name: 'Administrador', email: 'admin@mirestaurante.com', role: 'ADMIN', password: 'admin123' },
            { name: 'Manager User', email: 'manager@test.com', role: 'MANAGER', password: 'password123' },
            { name: 'Waiter User', email: 'waiter@test.com', role: 'WAITER', password: 'password123' },
            { name: 'Cashier User', email: 'cashier@test.com', role: 'CASHIER', password: 'password123' },
            { name: 'Kitchen User', email: 'kitchen@test.com', role: 'KITCHEN', password: 'password123' },
        ];

        for (const userData of usersToCreate) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            await prisma.user.upsert({
                where: { email: userData.email },
                update: {
                    role: userData.role,
                },
                create: {
                    name: userData.name,
                    email: userData.email,
                    password: hashedPassword,
                    role: userData.role,
                    restaurantId: restaurant.id,
                    active: true,
                },
            });
            console.log(`   ✓ ${userData.role}: ${userData.email} (pass: ${userData.password})`);
        }
        console.log(`✅ Created ${usersToCreate.length} test users\n`);

        // 4. Create default categories
        console.log('📂 Creating default categories...');
        const categories = [
            { name: 'Entradas', slug: 'entradas', image: null },
            { name: 'Platos Principales', slug: 'platos-principales', image: null },
            { name: 'Bebidas', slug: 'bebidas', image: null },
            { name: 'Postres', slug: 'postres', image: null },
            { name: 'Extras', slug: 'extras', image: null },
        ];

        for (const category of categories) {
            await prisma.category.upsert({
                where: {
                    restaurantId_slug: {
                        restaurantId: restaurant.id,
                        slug: category.slug,
                    },
                },
                update: {},
                create: {
                    ...category,
                    restaurantId: restaurant.id,
                },
            });
        }
        console.log(`✅ Created ${categories.length} categories\n`);

        // 5. Create default zones
        console.log('🏢 Creating default zones...');
        const zones = [
            { name: 'Salón Principal', description: 'Área principal del restaurante' },
            { name: 'Terraza', description: 'Área exterior' },
            { name: 'VIP', description: 'Área VIP' },
        ];

        const createdZones = [];
        for (const zone of zones) {
            // We use create here because upsert with non-unique fields is tricky in seed without custom logic
            // For simplicity in this seed, we'll check if exists first or just create if we assume clean slate or unique names
            // But to be safe and avoid duplicates on re-run, let's find first
            const existingZone = await prisma.zone.findFirst({
                where: { restaurantId: restaurant.id, name: zone.name }
            });

            if (existingZone) {
                createdZones.push(existingZone);
            } else {
                const newZone = await prisma.zone.create({
                    data: {
                        name: zone.name,
                        restaurantId: restaurant.id,
                    },
                });
                createdZones.push(newZone);
            }
        }
        console.log(`✅ Processed ${zones.length} zones\n`);

        // 6. Create default tables
        console.log('🪑 Creating default tables...');
        const tables = [
            // Salón Principal
            { number: '1', capacity: 4, zoneIndex: 0 },
            { number: '2', capacity: 4, zoneIndex: 0 },
            { number: '3', capacity: 6, zoneIndex: 0 },
            { number: '4', capacity: 2, zoneIndex: 0 },
            { number: '5', capacity: 4, zoneIndex: 0 },
            // Terraza
            { number: '6', capacity: 4, zoneIndex: 1 },
            { number: '7', capacity: 6, zoneIndex: 1 },
            { number: '8', capacity: 2, zoneIndex: 1 },
            // VIP
            { number: '9', capacity: 8, zoneIndex: 2 },
            { number: '10', capacity: 6, zoneIndex: 2 },
        ];

        for (const table of tables) {
            if (createdZones[table.zoneIndex]) {
                await prisma.table.upsert({
                    where: {
                        restaurantId_number: {
                            restaurantId: restaurant.id,
                            number: table.number,
                        },
                    },
                    update: {},
                    create: {
                        number: table.number,
                        capacity: table.capacity,
                        zoneId: createdZones[table.zoneIndex].id,
                        restaurantId: restaurant.id,
                        status: 'AVAILABLE',
                    },
                });
            }
        }
        console.log(`✅ Created ${tables.length} tables\n`);

        // 7. Create receipt series
        console.log('🧾 Creating receipt series...');
        const receiptSeries = [
            { type: 'BOLETA', series: 'B001', currentNumber: 0 },
            { type: 'FACTURA', series: 'F001', currentNumber: 0 },
            { type: 'NOTA_VENTA', series: 'NV001', currentNumber: 0 },
        ];

        for (const series of receiptSeries) {
            await prisma.receiptSeries.upsert({
                where: {
                    restaurantId_type_series: {
                        restaurantId: restaurant.id,
                        type: series.type,
                        series: series.series,
                    },
                },
                update: {},
                create: {
                    ...series,
                    restaurantId: restaurant.id,
                    active: true,
                },
            });
        }
        console.log(`✅ Created ${receiptSeries.length} receipt series\n`);

        // 8. Create default ingredients
        console.log('🥕 Creating default ingredients...');
        const ingredients = [
            // Lomo Saltado Ingredients
            { name: 'Lomo Fino', unit: 'kg', minStock: 5, cost: 45.00, currentStock: 20 },
            { name: 'Cebolla Roja', unit: 'kg', minStock: 10, cost: 3.50, currentStock: 50 },
            { name: 'Tomate', unit: 'kg', minStock: 10, cost: 4.00, currentStock: 40 },
            { name: 'Papa Amarilla', unit: 'kg', minStock: 20, cost: 5.50, currentStock: 100 },
            { name: 'Sillao', unit: 'lt', minStock: 5, cost: 12.00, currentStock: 20 },
            { name: 'Vinagre Tinto', unit: 'lt', minStock: 5, cost: 8.00, currentStock: 15 },
            { name: 'Ají Amarillo', unit: 'kg', minStock: 2, cost: 10.00, currentStock: 10 },
            { name: 'Culantro', unit: 'atado', minStock: 5, cost: 2.50, currentStock: 20 },
            { name: 'Arroz', unit: 'kg', minStock: 50, cost: 4.20, currentStock: 200 },

            // Parrilla Ingredients
            { name: 'Bife de Chorizo', unit: 'kg', minStock: 10, cost: 55.00, currentStock: 30 },
            { name: 'Picanha', unit: 'kg', minStock: 10, cost: 60.00, currentStock: 25 },
            { name: 'Chuleta de Cerdo', unit: 'kg', minStock: 10, cost: 22.00, currentStock: 40 },
            { name: 'Chorizo Parrillero', unit: 'unid', minStock: 50, cost: 3.50, currentStock: 100 },
            { name: 'Morcilla', unit: 'unid', minStock: 20, cost: 4.00, currentStock: 50 },
            { name: 'Papas Nativas', unit: 'kg', minStock: 15, cost: 6.00, currentStock: 60 },
            { name: 'Mix de Lechugas', unit: 'kg', minStock: 5, cost: 15.00, currentStock: 15 },
            { name: 'Carbón', unit: 'saco', minStock: 10, cost: 25.00, currentStock: 50 },
        ];

        for (const ingredient of ingredients) {
            const existingIngredient = await prisma.ingredient.findFirst({
                where: {
                    restaurantId: restaurant.id,
                    name: ingredient.name,
                }
            });

            let createdIngredient;

            if (existingIngredient) {
                createdIngredient = await prisma.ingredient.update({
                    where: { id: existingIngredient.id },
                    data: {
                        unit: ingredient.unit,
                        minStock: ingredient.minStock,
                        cost: ingredient.cost,
                        // Don't update currentStock if it exists to preserve inventory
                    }
                });
            } else {
                createdIngredient = await prisma.ingredient.create({
                    data: {
                        restaurantId: restaurant.id,
                        name: ingredient.name,
                        unit: ingredient.unit,
                        minStock: ingredient.minStock,
                        cost: ingredient.cost,
                        currentStock: ingredient.currentStock,
                    }
                });

                // Create initial stock movement only for new ingredients
                await prisma.stockMovement.create({
                    data: {
                        ingredientId: createdIngredient.id,
                        type: 'IN',
                        quantity: ingredient.currentStock,
                        reason: 'Inventario Inicial Seed',
                    }
                });
            }
        }
        console.log(`✅ Created ${ingredients.length} ingredients\n`);

        // 9. Create sample products with variants and recipes
        console.log('🍽️ Creating sample products...');

        // Get category IDs
        const platosFondoCategory = await prisma.category.findFirst({
            where: { restaurantId: restaurant.id, slug: 'platos-principales' }
        });
        const bebidasCategory = await prisma.category.findFirst({
            where: { restaurantId: restaurant.id, slug: 'bebidas' }
        });

        if (!platosFondoCategory) {
            throw new Error('Category "Platos de Fondo" not found');
        }

        // Get ingredient IDs for recipes
        const getIngredientId = async (name: string) => {
            const ing = await prisma.ingredient.findFirst({
                where: { restaurantId: restaurant.id, name }
            });
            return ing?.id;
        };

        // Product 1: Lomo Saltado
        const lomoSaltado = await prisma.product.create({
            data: {
                name: 'Lomo Saltado',
                description: 'Clásico plato peruano con lomo fino, cebolla, tomate y papas fritas',
                price: 28.00,
                cost: 12.50,
                categoryId: platosFondoCategory.id,
                available: true,
                featured: true,
                preparationTime: 15,
                tags: ['popular', 'tradicional'],
            }
        });

        // Recipe for Lomo Saltado (Base)
        const lomoFinoId = await getIngredientId('Lomo Fino');
        const cebollaId = await getIngredientId('Cebolla Roja');
        const tomateId = await getIngredientId('Tomate');
        const papaId = await getIngredientId('Papa Amarilla');
        const sillaoId = await getIngredientId('Sillao');
        const vinagreId = await getIngredientId('Vinagre Tinto');
        const ajiId = await getIngredientId('Ají Amarillo');
        const culantroId = await getIngredientId('Culantro');
        const arrozId = await getIngredientId('Arroz');

        if (lomoFinoId && cebollaId && tomateId && papaId && sillaoId && arrozId) {
            await prisma.productIngredient.createMany({
                data: [
                    { productId: lomoSaltado.id, ingredientId: lomoFinoId, quantity: 0.25, variantId: null },
                    { productId: lomoSaltado.id, ingredientId: cebollaId, quantity: 0.1, variantId: null },
                    { productId: lomoSaltado.id, ingredientId: tomateId, quantity: 0.1, variantId: null },
                    { productId: lomoSaltado.id, ingredientId: papaId, quantity: 0.2, variantId: null },
                    { productId: lomoSaltado.id, ingredientId: sillaoId, quantity: 0.02, variantId: null },
                    { productId: lomoSaltado.id, ingredientId: arrozId, quantity: 0.15, variantId: null },
                ]
            });
        }

        // Product 2: Parrilla with variants
        const parrilla = await prisma.product.create({
            data: {
                name: 'Parrilla',
                description: 'Deliciosa parrilla con guarniciones',
                price: 45.00,
                cost: 20.00,
                categoryId: platosFondoCategory.id,
                available: true,
                featured: true,
                preparationTime: 25,
                tags: ['parrilla', 'carnes'],
            }
        });

        // Create variants for Parrilla
        const variantRes = await prisma.productVariant.create({
            data: {
                productId: parrilla.id,
                name: 'Res',
                description: 'Parrilla de res con bife de chorizo',
                price: 45.00,
                available: true,
                order: 1,
            }
        });

        const variantCerdo = await prisma.productVariant.create({
            data: {
                productId: parrilla.id,
                name: 'Cerdo',
                description: 'Parrilla de cerdo con chuleta',
                price: 38.00,
                available: true,
                order: 2,
            }
        });

        const variantMixta = await prisma.productVariant.create({
            data: {
                productId: parrilla.id,
                name: 'Mixta',
                description: 'Parrilla mixta con res, cerdo y chorizo',
                price: 50.00,
                available: true,
                order: 3,
            }
        });

        // Base ingredients for all parrilla variants
        const papasNativasId = await getIngredientId('Papas Nativas');
        const lechugasId = await getIngredientId('Mix de Lechugas');
        const carbonId = await getIngredientId('Carbón');

        // Variant-specific ingredients
        const bifeId = await getIngredientId('Bife de Chorizo');
        const chuletaId = await getIngredientId('Chuleta de Cerdo');
        const chorizoId = await getIngredientId('Chorizo Parrillero');

        if (papasNativasId && lechugasId) {
            // Base recipe (applies to all variants)
            await prisma.productIngredient.createMany({
                data: [
                    { productId: parrilla.id, ingredientId: papasNativasId, quantity: 0.3, variantId: null },
                    { productId: parrilla.id, ingredientId: lechugasId, quantity: 0.1, variantId: null },
                ]
            });

            // Variant-specific ingredients
            if (bifeId) {
                await prisma.productIngredient.create({
                    data: {
                        productId: parrilla.id,
                        ingredientId: bifeId,
                        quantity: 0.35,
                        variantId: variantRes.id,
                    }
                });
            }

            if (chuletaId) {
                await prisma.productIngredient.create({
                    data: {
                        productId: parrilla.id,
                        ingredientId: chuletaId,
                        quantity: 0.4,
                        variantId: variantCerdo.id,
                    }
                });
            }

            if (bifeId && chuletaId && chorizoId) {
                await prisma.productIngredient.createMany({
                    data: [
                        { productId: parrilla.id, ingredientId: bifeId, quantity: 0.2, variantId: variantMixta.id },
                        { productId: parrilla.id, ingredientId: chuletaId, quantity: 0.2, variantId: variantMixta.id },
                        { productId: parrilla.id, ingredientId: chorizoId, quantity: 2, variantId: variantMixta.id },
                    ]
                });
            }
        }

        // Product 3: Ceviche
        const ceviche = await prisma.product.create({
            data: {
                name: 'Ceviche',
                description: 'Fresco ceviche de pescado con limón, cebolla y camote',
                price: 32.00,
                cost: 14.00,
                categoryId: platosFondoCategory.id,
                available: true,
                featured: true,
                preparationTime: 10,
                tags: ['marino', 'fresco', 'popular'],
            }
        });

        // Product 4: Arroz con Pollo
        const arrozConPollo = await prisma.product.create({
            data: {
                name: 'Arroz con Pollo',
                description: 'Arroz verde con pollo y papas a la huancaína',
                price: 22.00,
                cost: 9.50,
                categoryId: platosFondoCategory.id,
                available: true,
                preparationTime: 20,
                tags: ['tradicional', 'casero'],
            }
        });

        console.log(`✅ Created 4 products with variants and recipes\n`);

        console.log('🎉 Database seed completed successfully!\n');
        console.log('📋 Summary:');
        console.log(`   - Restaurant: ${restaurant.name}`);
        console.log(`   - Users created:`);
        usersToCreate.forEach(u => console.log(`     • ${u.role}: ${u.email}`));
        console.log(`   - Permissions: ${permissions.length}`);
        console.log(`   - Categories: ${categories.length}`);
        console.log(`   - Zones: ${zones.length}`);
        console.log(`   - Tables: ${tables.length}`);
        console.log('\n⚠️  IMPORTANT: Change passwords after testing!\n');
    } catch (error) {
        console.error('Error in seed:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:');
        console.error(e);
        if (e.meta) console.error('Meta:', e.meta);
        if (e.message) console.error('Message:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
