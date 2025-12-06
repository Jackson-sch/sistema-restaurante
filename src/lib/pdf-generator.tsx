"use client"

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

// Styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottom: "2px solid #333",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottom: "1px solid #ddd",
  },
  summaryBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  summaryItem: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f5f5f5",
    marginHorizontal: 5,
    borderRadius: 4,
  },
  summaryLabel: {
    fontSize: 9,
    color: "#666",
    marginBottom: 3,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  table: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#333",
    padding: 8,
    color: "#fff",
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 9,
    fontWeight: "bold",
    color: "#fff",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #eee",
    padding: 8,
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottom: "1px solid #eee",
    padding: 8,
    backgroundColor: "#f9f9f9",
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
  },
})

// Helper function
function formatCurrency(value: number): string {
  return `S/ ${value.toFixed(2)}`
}

// Types for PDF data
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
}

interface CategoryData {
  name: string
  value: number
  count: number
}

interface WaiterData {
  name: string
  orders: number
  sales: number
  avgTicket: number
}

interface AnalyticsPDFData {
  summary: {
    period: string
    totalSales: number
    totalOrders: number
    avgTicket: number
  }
  orderTypes: OrderTypeData[]
  topProducts: TopProductData[]
  categories: CategoryData[]
  waiters: WaiterData[]
}

export function AnalyticsPDFDocument({ data }: { data: AnalyticsPDFData }) {
  const totalCategorySales = data.categories.reduce((sum, c) => sum + c.value, 0)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Reporte de Analytics</Text>
          <Text style={styles.subtitle}>Período: {data.summary.period}</Text>
        </View>

        {/* Summary Boxes */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>VENTAS TOTALES</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.summary.totalSales)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>TOTAL ÓRDENES</Text>
            <Text style={styles.summaryValue}>{data.summary.totalOrders}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>TICKET PROMEDIO</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.summary.avgTicket)}</Text>
          </View>
        </View>

        {/* Order Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ventas por Tipo de Orden</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Tipo</Text>
              <Text style={styles.tableHeaderCell}>Ventas</Text>
              <Text style={styles.tableHeaderCell}>Órdenes</Text>
              <Text style={styles.tableHeaderCell}>Promedio</Text>
              <Text style={styles.tableHeaderCell}>%</Text>
            </View>
            {data.orderTypes.map((item, index) => (
              <View key={item.type} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.label}</Text>
                <Text style={styles.tableCell}>{formatCurrency(item.totalSales)}</Text>
                <Text style={styles.tableCell}>{item.orderCount}</Text>
                <Text style={styles.tableCell}>{formatCurrency(item.averageTicket)}</Text>
                <Text style={styles.tableCell}>{item.percentage.toFixed(1)}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Top Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 10 Productos Más Vendidos</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>#</Text>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Producto</Text>
              <Text style={styles.tableHeaderCell}>Cantidad</Text>
              <Text style={styles.tableHeaderCell}>Ingresos</Text>
            </View>
            {data.topProducts.slice(0, 10).map((item, index) => (
              <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tableCell, { flex: 0.5 }]}>{index + 1}</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>{item.name}</Text>
                <Text style={styles.tableCell}>{item.quantity}</Text>
                <Text style={styles.tableCell}>{formatCurrency(item.revenue)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ventas por Categoría</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Categoría</Text>
              <Text style={styles.tableHeaderCell}>Ventas</Text>
              <Text style={styles.tableHeaderCell}>Órdenes</Text>
              <Text style={styles.tableHeaderCell}>%</Text>
            </View>
            {data.categories.map((item, index) => (
              <View key={item.name} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.name}</Text>
                <Text style={styles.tableCell}>{formatCurrency(item.value)}</Text>
                <Text style={styles.tableCell}>{item.count}</Text>
                <Text style={styles.tableCell}>
                  {totalCategorySales > 0 ? ((item.value / totalCategorySales) * 100).toFixed(1) : 0}%
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Waiters */}
        {data.waiters.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rendimiento del Personal</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { flex: 0.5 }]}>#</Text>
                <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Nombre</Text>
                <Text style={styles.tableHeaderCell}>Órdenes</Text>
                <Text style={styles.tableHeaderCell}>Ventas</Text>
                <Text style={styles.tableHeaderCell}>Promedio</Text>
              </View>
              {data.waiters.map((item, index) => (
                <View key={index} style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCell, { flex: 0.5 }]}>{index + 1}</Text>
                  <Text style={[styles.tableCell, { flex: 2 }]}>{item.name}</Text>
                  <Text style={styles.tableCell}>{item.orders}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(item.sales)}</Text>
                  <Text style={styles.tableCell}>{formatCurrency(item.avgTicket)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generado automáticamente • Sistema de Restaurante
        </Text>
      </Page>
    </Document>
  )
}
