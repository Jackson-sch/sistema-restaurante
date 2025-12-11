import { getOrders } from '@/actions/orders';
import { columns } from '@/components/orders/columns';
import { OrdersDataTable } from '@/components/orders/orders-data-table';
import { NewOrderDialog } from '@/components/orders/new-order-dialog';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export default async function OrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth();
    const resolvedSearchParams = await searchParams;
    const page = Number(resolvedSearchParams.page) || 1;
    const pageSize = Number(resolvedSearchParams.pageSize) || 10;
    const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : undefined;
    const status = typeof resolvedSearchParams.status === 'string' ? resolvedSearchParams.status : undefined;
    const type = typeof resolvedSearchParams.type === 'string' ? resolvedSearchParams.type : undefined;
    const sortBy = typeof resolvedSearchParams.sortBy === 'string' ? resolvedSearchParams.sortBy : 'createdAt';
    const sortOrder = (resolvedSearchParams.sortOrder === 'asc' || resolvedSearchParams.sortOrder === 'desc')
        ? resolvedSearchParams.sortOrder
        : 'desc';

    const { data: rawData, meta } = await getOrders({
        page,
        limit: pageSize,
        search,
        status,
        type,
        sortBy,
        sortOrder,
    });

    // Transform Decimal fields to numbers for client component serialization
    const data = rawData.map(order => ({
        ...order,
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        discount: Number(order.discount || 0),
        tip: Number(order.tip || 0),
        total: Number(order.total),
        // Transform items with products
        items: order.items.map(item => ({
            ...item,
            unitPrice: Number(item.unitPrice),
            subtotal: Number(item.subtotal),
            product: {
                ...item.product,
                price: Number(item.product.price),
                cost: Number(item.product.cost),
            }
        }))
    }));

    // Fetch data for NewOrderDialog
    let categories: any[] = [];
    let products: any[] = [];

    if (session?.user?.restaurantId) {
        categories = await prisma.category.findMany({
            where: { restaurantId: session.user.restaurantId, active: true },
            orderBy: { order: 'asc' },
        });

        const rawProducts = await prisma.product.findMany({
            where: {
                category: { restaurantId: session.user.restaurantId },
                available: true
            },
            include: {
                category: true,
                variants: true,
                modifierGroups: {
                    include: {
                        modifierGroup: {
                            include: {
                                modifiers: true
                            }
                        }
                    }
                },
                ingredients: {
                    include: {
                        ingredient: true
                    }
                }
            },
            orderBy: { name: 'asc' },
        });

        products = rawProducts.map(product => ({
            ...product,
            price: Number(product.price),
            cost: Number(product.cost),
            variants: product.variants.map(v => ({
                ...v,
                price: Number(v.price)
            })),
            modifierGroups: product.modifierGroups.map(pmg => ({
                ...pmg,
                modifierGroup: {
                    ...pmg.modifierGroup,
                    modifiers: pmg.modifierGroup.modifiers.map(m => ({
                        ...m,
                        price: Number(m.price)
                    }))
                }
            })),
            recipe: product.ingredients.map(r => ({
                quantity: Number(r.quantity),
                variantId: r.variantId,
                ingredient: {
                    id: r.ingredient.id,
                    name: r.ingredient.name,
                    unit: r.ingredient.unit
                }
            }))
        }));
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
                    <p className="text-muted-foreground">
                        Gestiona los pedidos del restaurante
                    </p>
                </div>
                <NewOrderDialog categories={categories} products={products} />
            </div>

            <OrdersDataTable
                columns={columns}
                data={data}
                pageCount={meta.totalPages}
                currentPage={meta.page}
            />
        </div>
    );
}
