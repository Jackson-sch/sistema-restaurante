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

// Analytics Workbook Types
interface OrderTypeData {
  type: string
  label: string
  totalSales: number
  orderCount: number
  averageTicket: number
  percentage: number
}

interface TopProductData {
  name: string
  quantity: number
  revenue: number
  type?: string
}

interface WaiterData {
  name: string
  orders: number
  sales: number
  avgTicket: number
}

export function createAnalyticsWorkbook(data: {
  summary: {
    period: string
    totalSales: number
    totalOrders: number
    avgTicket: number
  }
  orderTypes: OrderTypeData[]
  topProducts: TopProductData[]
  categories: Array<{ name: string; value: number; count: number }>
  peakHours: number[][]
  waiters: WaiterData[]
}) {
  const workbook = XLSX.utils.book_new()

  // Sheet 1: Resumen Ejecutivo
  const summaryData = [
    ['REPORTE DE ANALYTICS'],
    [''],
    ['Período', data.summary.period],
    [''],
    ['RESUMEN EJECUTIVO'],
    ['Total de Ventas', formatCurrency(data.summary.totalSales)],
    ['Total de Órdenes', data.summary.totalOrders],
    ['Ticket Promedio', formatCurrency(data.summary.avgTicket)],
    [''],
    ['DISTRIBUCIÓN POR TIPO DE ORDEN'],
    ...data.orderTypes.map(t => [
      t.label,
      formatCurrency(t.totalSales),
      `${t.orderCount} órdenes`,
      `${t.percentage.toFixed(1)}%`
    ])
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')

  // Sheet 2: Ventas por Tipo de Orden
  const orderTypesData = [
    ['VENTAS POR TIPO DE ORDEN'],
    [''],
    ['Tipo', 'Ventas', 'Órdenes', 'Ticket Promedio', 'Porcentaje'],
    ...data.orderTypes.map(t => [
      t.label,
      t.totalSales,
      t.orderCount,
      t.averageTicket,
      `${t.percentage.toFixed(1)}%`
    ]),
    [''],
    ['TOTAL',
      { f: `SUM(B4:B${3 + data.orderTypes.length})` },
      { f: `SUM(C4:C${3 + data.orderTypes.length})` },
      { f: `AVERAGE(D4:D${3 + data.orderTypes.length})` },
      '100%'
    ]
  ]
  const orderTypesSheet = XLSX.utils.aoa_to_sheet(orderTypesData)
  orderTypesSheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(workbook, orderTypesSheet, 'Tipos de Orden')

  // Sheet 3: Productos Top
  const productsData = [
    ['TOP PRODUCTOS MÁS VENDIDOS'],
    [''],
    ['#', 'Producto', 'Cantidad', 'Ingresos'],
    ...data.topProducts.slice(0, 20).map((p, i) => [
      i + 1,
      p.name,
      p.quantity,
      p.revenue
    ]),
    [''],
    ['TOTAL', '',
      { f: `SUM(C4:C${3 + Math.min(data.topProducts.length, 20)})` },
      { f: `SUM(D4:D${3 + Math.min(data.topProducts.length, 20)})` }
    ]
  ]
  const productsSheet = XLSX.utils.aoa_to_sheet(productsData)
  productsSheet['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 12 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(workbook, productsSheet, 'Top Productos')

  // Sheet 4: Categorías
  const totalCategorySales = data.categories.reduce((sum, c) => sum + c.value, 0)
  const categoriesData = [
    ['VENTAS POR CATEGORÍA'],
    [''],
    ['Categoría', 'Ventas', 'Órdenes', 'Porcentaje'],
    ...data.categories.map(c => [
      c.name,
      c.value,
      c.count,
      `${totalCategorySales > 0 ? ((c.value / totalCategorySales) * 100).toFixed(1) : 0}%`
    ]),
    [''],
    ['TOTAL',
      { f: `SUM(B4:B${3 + data.categories.length})` },
      { f: `SUM(C4:C${3 + data.categories.length})` },
      '100%'
    ]
  ]
  const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesData)
  categoriesSheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categorías')

  // Sheet 5: Horas Pico (Heatmap data)
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)

  const peakHoursData = [
    ['MAPA DE CALOR - ÓRDENES POR HORA'],
    [''],
    ['Día / Hora', ...hours],
    ...data.peakHours.map((dayData, dayIndex) => [
      days[dayIndex],
      ...dayData
    ])
  ]
  const peakHoursSheet = XLSX.utils.aoa_to_sheet(peakHoursData)
  peakHoursSheet['!cols'] = [{ wch: 12 }, ...hours.map(() => ({ wch: 6 }))]
  XLSX.utils.book_append_sheet(workbook, peakHoursSheet, 'Horas Pico')

  // Sheet 6: Rendimiento del Personal
  const waitersData = [
    ['RENDIMIENTO DEL PERSONAL'],
    [''],
    ['#', 'Mesero', 'Órdenes', 'Ventas Totales', 'Ticket Promedio'],
    ...data.waiters.map((w, i) => [
      i + 1,
      w.name,
      w.orders,
      w.sales,
      w.avgTicket
    ]),
    [''],
    ['TOTAL', '',
      { f: `SUM(C4:C${3 + data.waiters.length})` },
      { f: `SUM(D4:D${3 + data.waiters.length})` },
      { f: `AVERAGE(E4:E${3 + data.waiters.length})` }
    ]
  ]
  const waitersSheet = XLSX.utils.aoa_to_sheet(waitersData)
  waitersSheet['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 12 }, { wch: 18 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(workbook, waitersSheet, 'Personal')

  return workbook
}

function formatCurrency(value: number): string {
  return `S/ ${value.toFixed(2)}`
}

