import * as XLSX from 'xlsx'

interface SalesData {
  date: string
  sales: number
  orders: number
  avgTicket: number
}

interface ProductData {
  name: string
  category: string
  quantity: number
  revenue: number
}

interface CategoryData {
  name: string
  sales: number
  percentage: number
}

export function createSalesWorkbook(data: {
  summary: {
    totalSales: number
    totalOrders: number
    avgTicket: number
    period: string
  }
  dailySales: SalesData[]
  products: ProductData[]
  categories: CategoryData[]
  paymentMethods: Array<{ method: string; amount: number; percentage: number }>
}) {
  const workbook = XLSX.utils.book_new()

  // Sheet 1: Summary
  const summaryData = [
    ['REPORTE DE VENTAS'],
    ['Período', data.summary.period],
    [''],
    ['RESUMEN EJECUTIVO'],
    ['Total de Ventas', formatCurrency(data.summary.totalSales)],
    ['Total de Pedidos', data.summary.totalOrders],
    ['Ticket Promedio', formatCurrency(data.summary.avgTicket)],
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)

  // Style summary sheet
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 20 }]

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')

  // Sheet 2: Daily Sales
  const dailyData = [
    ['Fecha', 'Ventas', 'Pedidos', 'Ticket Promedio'],
    ...data.dailySales.map(d => [
      d.date,
      d.sales,
      d.orders,
      d.avgTicket
    ]),
    [''],
    ['TOTAL',
      { f: `SUM(B2:B${data.dailySales.length + 1})` },
      { f: `SUM(C2:C${data.dailySales.length + 1})` },
      { f: `AVERAGE(D2:D${data.dailySales.length + 1})` }
    ]
  ]
  const dailySheet = XLSX.utils.aoa_to_sheet(dailyData)

  // Format columns
  dailySheet['!cols'] = [
    { wch: 12 },
    { wch: 15 },
    { wch: 12 },
    { wch: 18 }
  ]

  XLSX.utils.book_append_sheet(workbook, dailySheet, 'Ventas Diarias')

  // Sheet 3: Products
  const productData = [
    ['Producto', 'Categoría', 'Cantidad Vendida', 'Ingresos'],
    ...data.products.map(p => [
      p.name,
      p.category,
      p.quantity,
      p.revenue
    ]),
    [''],
    ['TOTAL', '',
      { f: `SUM(C2:C${data.products.length + 1})` },
      { f: `SUM(D2:D${data.products.length + 1})` }
    ]
  ]
  const productSheet = XLSX.utils.aoa_to_sheet(productData)

  productSheet['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 18 },
    { wch: 15 }
  ]

  XLSX.utils.book_append_sheet(workbook, productSheet, 'Productos')

  // Sheet 4: Categories
  const categoryData = [
    ['Categoría', 'Ventas', 'Porcentaje'],
    ...data.categories.map(c => [
      c.name,
      c.sales,
      `${c.percentage.toFixed(2)}%`
    ])
  ]
  const categorySheet = XLSX.utils.aoa_to_sheet(categoryData)

  categorySheet['!cols'] = [
    { wch: 25 },
    { wch: 15 },
    { wch: 12 }
  ]

  XLSX.utils.book_append_sheet(workbook, categorySheet, 'Categorías')

  // Sheet 5: Payment Methods
  const paymentData = [
    ['Método de Pago', 'Monto', 'Porcentaje'],
    ...data.paymentMethods.map(p => [
      p.method,
      p.amount,
      `${p.percentage.toFixed(2)}%`
    ])
  ]
  const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData)

  paymentSheet['!cols'] = [
    { wch: 20 },
    { wch: 15 },
    { wch: 12 }
  ]

  XLSX.utils.book_append_sheet(workbook, paymentSheet, 'Métodos de Pago')

  return workbook
}

export function createInventoryWorkbook(data: {
  items: Array<{
    name: string
    category: string
    currentStock: number
    minStock: number
    unit: string
    cost: number
    value: number
  }>
  lowStock: Array<{
    name: string
    currentStock: number
    minStock: number
    needed: number
  }>
}) {
  const workbook = XLSX.utils.book_new()

  // Sheet 1: All Items
  const itemsData = [
    ['Producto', 'Categoría', 'Stock Actual', 'Stock Mínimo', 'Unidad', 'Costo Unitario', 'Valor Total'],
    ...data.items.map(item => [
      item.name,
      item.category,
      item.currentStock,
      item.minStock,
      item.unit,
      item.cost,
      item.value
    ]),
    [''],
    ['TOTAL', '', '', '', '', '',
      { f: `SUM(G2:G${data.items.length + 1})` }
    ]
  ]
  const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData)

  itemsSheet['!cols'] = [
    { wch: 30 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 10 },
    { wch: 18 },
    { wch: 15 }
  ]

  XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Inventario Completo')

  // Sheet 2: Low Stock
  const lowStockData = [
    ['Producto', 'Stock Actual', 'Stock Mínimo', 'Cantidad Necesaria'],
    ...data.lowStock.map(item => [
      item.name,
      item.currentStock,
      item.minStock,
      item.needed
    ])
  ]
  const lowStockSheet = XLSX.utils.aoa_to_sheet(lowStockData)

  lowStockSheet['!cols'] = [
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 }
  ]

  XLSX.utils.book_append_sheet(workbook, lowStockSheet, 'Stock Bajo')

  return workbook
}

export function workbookToBuffer(workbook: XLSX.WorkBook): Buffer {
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
  return Buffer.from(excelBuffer)
}

export function downloadWorkbook(workbook: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(workbook, filename)
}

function formatCurrency(value: number): string {
  return `S/ ${value.toFixed(2)}`
}
