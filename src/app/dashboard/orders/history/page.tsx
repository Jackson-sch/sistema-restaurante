import { getOrderHistory } from "@/actions/orders"
import { OrdersDataTable } from "@/components/orders/orders-data-table"
import { columns } from "@/components/orders/columns"

export default async function OrderHistoryPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedSearchParams = await searchParams
    const page = Number(resolvedSearchParams.page) || 1
    const search = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : undefined

    // We don't need status filter here as it's fixed to history statuses in the action
    const { data: rawData, meta } = await getOrderHistory({
        page,
        limit: 10,
        search
    })

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
    }))

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Historial de Pedidos</h1>
                <p className="text-muted-foreground">
                    Consulta los pedidos completados y cancelados.
                </p>
            </div>

            <OrdersDataTable
                columns={columns}
                data={data}
                pageCount={meta.totalPages}
                currentPage={page}
            />
        </div>
    )
}
