"use client"

import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"
import { DENOMINATIONS, type DenominationInput } from "@/lib/schemas/cash-register"

// Register a font (optional, for better typography)
Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc9.ttf", fontWeight: 700 },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Roboto",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    backgroundColor: "#f3f4f6",
    padding: 5,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  rowLabel: {
    flex: 1,
  },
  rowValue: {
    fontWeight: "bold",
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#000",
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 11,
    fontWeight: "bold",
  },
  differencePositive: {
    color: "#22c55e",
  },
  differenceNegative: {
    color: "#ef4444",
  },
  denominationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  denominationItem: {
    width: "30%",
    padding: 5,
    backgroundColor: "#f9fafb",
    borderRadius: 3,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#666",
  },
  transactionRow: {
    flexDirection: "row",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e7eb",
  },
  transactionTime: {
    width: "20%",
    fontSize: 9,
  },
  transactionConcept: {
    flex: 1,
  },
  transactionAmount: {
    width: "25%",
    textAlign: "right",
    fontWeight: "bold",
  },
})

interface ShiftData {
  id: string
  turn: string | null
  openingCash: number
  closingCash: number | null
  expectedCash: number | null
  difference: number | null
  openedAt: Date
  closedAt: Date | null
  denominationBreakdown: DenominationInput | null
  user: { name: string | null }
  summary: {
    totalSales: number
    cashSales: number
    cardSales: number
    otherSales: number
    totalIncome: number
    totalExpenses: number
  }
  transactions: Array<{
    id: string
    type: string
    amount: number
    concept: string
    createdAt: Date
  }>
}

interface RestaurantData {
  name: string
  address?: string | null
  phone?: string | null
  ruc?: string | null
}

interface ShiftCloseReceiptPDFProps {
  shift: ShiftData
  restaurant: RestaurantData
}

const formatCurrency = (value: number) => `S/ ${value.toFixed(2)}`
const formatDate = (date: Date) => {
  const d = new Date(date)
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" })
}
const formatTime = (date: Date) => {
  const d = new Date(date)
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
}

export function ShiftCloseReceiptPDF({ shift, restaurant }: ShiftCloseReceiptPDFProps) {
  const difference = shift.difference ?? 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{restaurant.name}</Text>
          {restaurant.address && <Text style={styles.subtitle}>{restaurant.address}</Text>}
          {restaurant.ruc && <Text style={styles.subtitle}>RUC: {restaurant.ruc}</Text>}
          <Text style={{ ...styles.title, marginTop: 15 }}>CIERRE DE CAJA</Text>
          <Text style={styles.subtitle}>
            {shift.turn && `Turno: ${shift.turn} | `}
            {formatDate(shift.openedAt)}
          </Text>
        </View>

        {/* Shift Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del Turno</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Usuario:</Text>
            <Text style={styles.rowValue}>{shift.user.name || "N/A"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Apertura:</Text>
            <Text style={styles.rowValue}>{formatTime(shift.openedAt)}</Text>
          </View>
          {shift.closedAt && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Cierre:</Text>
              <Text style={styles.rowValue}>{formatTime(shift.closedAt)}</Text>
            </View>
          )}
        </View>

        {/* Sales Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de Ventas</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Total Ventas:</Text>
            <Text style={styles.rowValue}>{formatCurrency(shift.summary.totalSales)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>  • Efectivo:</Text>
            <Text style={styles.rowValue}>{formatCurrency(shift.summary.cashSales)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>  • Tarjeta:</Text>
            <Text style={styles.rowValue}>{formatCurrency(shift.summary.cardSales)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>  • Otros (Yape/Plin):</Text>
            <Text style={styles.rowValue}>{formatCurrency(shift.summary.otherSales)}</Text>
          </View>
        </View>

        {/* Cash Flow */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Flujo de Efectivo</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Efectivo Inicial:</Text>
            <Text style={styles.rowValue}>{formatCurrency(shift.openingCash)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>+ Ventas en Efectivo:</Text>
            <Text style={styles.rowValue}>{formatCurrency(shift.summary.cashSales)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>+ Ingresos Manuales:</Text>
            <Text style={styles.rowValue}>{formatCurrency(shift.summary.totalIncome)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>- Egresos/Retiros:</Text>
            <Text style={styles.rowValue}>{formatCurrency(shift.summary.totalExpenses)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Efectivo Esperado:</Text>
            <Text style={styles.totalValue}>{formatCurrency(shift.expectedCash ?? 0)}</Text>
          </View>
        </View>

        {/* Cash Count */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Arqueo de Caja</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Efectivo Contado:</Text>
            <Text style={styles.rowValue}>{formatCurrency(shift.closingCash ?? 0)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Efectivo Esperado:</Text>
            <Text style={styles.rowValue}>{formatCurrency(shift.expectedCash ?? 0)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Diferencia:</Text>
            <Text style={{
              ...styles.totalValue,
              ...(difference >= 0 ? styles.differencePositive : styles.differenceNegative)
            }}>
              {difference >= 0 ? "+" : ""}{formatCurrency(difference)}
            </Text>
          </View>
        </View>

        {/* Denomination Breakdown */}
        {shift.denominationBreakdown && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Desglose por Denominaciones</Text>
            <View style={styles.denominationGrid}>
              {DENOMINATIONS.filter(d => {
                const count = (shift.denominationBreakdown as DenominationInput)?.[d.key] || 0
                return count > 0
              }).map(d => {
                const count = (shift.denominationBreakdown as DenominationInput)?.[d.key] || 0
                return (
                  <View key={d.key} style={styles.denominationItem}>
                    <Text style={{ fontSize: 8, color: "#666" }}>{d.label}</Text>
                    <Text style={{ fontWeight: "bold" }}>{count} x {formatCurrency(d.value)}</Text>
                    <Text style={{ fontSize: 9 }}>{formatCurrency(count * d.value)}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* Transactions */}
        {shift.transactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Movimientos del Turno</Text>
            {shift.transactions.map(tx => (
              <View key={tx.id} style={styles.transactionRow}>
                <Text style={styles.transactionTime}>{formatTime(tx.createdAt)}</Text>
                <Text style={styles.transactionConcept}>{tx.concept}</Text>
                <Text style={{
                  ...styles.transactionAmount,
                  color: tx.type === "INCOME" ? "#22c55e" : "#ef4444"
                }}>
                  {tx.type === "INCOME" ? "+" : "-"}{formatCurrency(tx.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Documento generado el {formatDate(new Date())} a las {formatTime(new Date())}</Text>
          <Text>Sistema de Restaurante</Text>
        </View>
      </Page>
    </Document>
  )
}
