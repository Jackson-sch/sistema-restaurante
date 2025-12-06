"use client"

import { type ReceiptData, ReceiptType } from "@/types/receipt"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ReceiptTemplateProps {
  data: ReceiptData
}

export function ReceiptTemplate({ data }: ReceiptTemplateProps) {
  const getReceiptTitle = () => {
    switch (data.type) {
      case ReceiptType.BOLETA:
        return "BOLETA DE VENTA"
      case ReceiptType.FACTURA:
        return "FACTURA"
      case ReceiptType.NOTA_VENTA:
        return "NOTA DE VENTA"
      default:
        return "COMPROBANTE"
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      CASH: "Efectivo",
      CARD: "Tarjeta",
      YAPE: "Yape",
      PLIN: "Plin",
      TRANSFER: "Transferencia",
      MIXED: "Mixto",
    }
    return labels[method] || method
  }

  return (
    <div
      className="receipt-template"
      style={{
        fontFamily: "Courier New, monospace",
        fontSize: "11px",
        lineHeight: "1.3",
        padding: "12px",
        width: "100%",
        maxWidth: "80mm",
        color: "#000",
        backgroundColor: "#fff",
      }}
    >
      {/* Header - Restaurant Info */}
      <div style={{ textAlign: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "2px solid #000" }}>
        {data.restaurant.logo && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.restaurant.logo}
              alt="Logo"
              style={{
                maxWidth: "60%",
                maxHeight: "60px",
                objectFit: "contain"
              }}
            />
          </div>
        )}
        <h1 style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 8px 0", letterSpacing: "0.5px" }}>
          {data.restaurant.name.toUpperCase()}
        </h1>
        <div style={{ fontSize: "10px", lineHeight: "1.4" }}>
          <div>{data.restaurant.address}</div>
          <div>RUC: {data.restaurant.ruc}</div>
          <div>Tel: {data.restaurant.phone}</div>
        </div>
      </div>

      {/* Receipt Type and Number */}
      <div style={{ textAlign: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "2px solid #000" }}>
        <h2 style={{ fontSize: "13px", fontWeight: "bold", margin: "0 0 6px 0", letterSpacing: "1px" }}>
          {getReceiptTitle()}
        </h2>
        {data.type !== ReceiptType.NOTA_VENTA && (
          <div style={{ fontSize: "12px", fontWeight: "bold", letterSpacing: "0.5px" }}>{data.number}</div>
        )}
      </div>

      {/* Date and Order Info */}
      <div style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px dashed #666", fontSize: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
          <span>Fecha:</span>
          <span style={{ fontWeight: "bold" }}>{format(data.date, "dd/MM/yyyy", { locale: es })}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
          <span>Hora:</span>
          <span style={{ fontWeight: "bold" }}>{format(data.date, "HH:mm", { locale: es })}</span>
        </div>
        {data.order.table && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span>Mesa:</span>
            <span style={{ fontWeight: "bold" }}>{data.order.table}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Orden:</span>
          <span style={{ fontWeight: "bold" }}>{data.order.orderNumber}</span>
        </div>
      </div>

      {/* Items */}
      <div style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "2px solid #000" }}>
        <div style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "11px", letterSpacing: "0.5px" }}>
          DETALLE DE CONSUMO
        </div>
        {data.order.items.map((item, index) => (
          <div key={index} style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontWeight: "bold" }}>
              <span>
                {item.quantity}x {item.name}
              </span>
              <span>S/ {item.total.toFixed(2)}</span>
            </div>
            <div style={{ fontSize: "9px", color: "#555", marginLeft: "12px" }}>
              @ S/ {item.unitPrice.toFixed(2)} c/u
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "2px solid #000", fontSize: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span>Subtotal:</span>
          <span>S/ {data.subtotal.toFixed(2)}</span>
        </div>
        {data.tax > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span>IGV (18%):</span>
            <span>S/ {data.tax.toFixed(2)}</span>
          </div>
        )}
        {data.discount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span>Descuento:</span>
            <span>-S/ {data.discount.toFixed(2)}</span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontWeight: "bold",
            fontSize: "13px",
            marginTop: "8px",
            paddingTop: "8px",
            borderTop: "1px solid #000",
          }}
        >
          <span>TOTAL:</span>
          <span>S/ {data.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px dashed #666", fontSize: "10px" }}>
        <div style={{ fontWeight: "bold", marginBottom: "6px", fontSize: "11px" }}>INFORMACIÓN DE PAGO</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
          <span>Método:</span>
          <span style={{ fontWeight: "bold" }}>{getPaymentMethodLabel(data.payment.method)}</span>
        </div>
        {data.payment.reference && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span>Referencia:</span>
            <span>{data.payment.reference}</span>
          </div>
        )}
        {data.payment.received && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
              <span>Recibido:</span>
              <span>S/ {data.payment.received.toFixed(2)}</span>
            </div>
            {data.payment.change && data.payment.change > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "11px" }}>
                <span>Cambio:</span>
                <span>S/ {data.payment.change.toFixed(2)}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Info (if applicable) */}
      {data.customer && (
        <div style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px dashed #666", fontSize: "10px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "6px", fontSize: "11px" }}>DATOS DEL CLIENTE</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span>{data.type === ReceiptType.FACTURA ? "RUC:" : "DNI:"}</span>
            <span style={{ fontWeight: "bold" }}>{data.customer.doc}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
            <span>Nombre:</span>
            <span style={{ fontWeight: "bold", textAlign: "right", maxWidth: "60%" }}>{data.customer.name}</span>
          </div>
          {data.customer.address && (
            <div style={{ marginTop: "4px" }}>
              <div style={{ marginBottom: "2px" }}>Dirección:</div>
              <div style={{ fontSize: "9px", wordWrap: "break-word" }}>{data.customer.address}</div>
            </div>
          )}
        </div>
      )}

      {/* Cashier */}
      <div style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px dashed #666", fontSize: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Atendido por:</span>
          <span style={{ fontWeight: "bold" }}>{data.cashier.name}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", fontSize: "11px", marginTop: "16px" }}>
        <div style={{ fontWeight: "bold", marginBottom: "6px", fontSize: "12px", letterSpacing: "0.5px" }}>
          ¡GRACIAS POR SU PREFERENCIA!
        </div>
        <div style={{ fontSize: "10px" }}>Esperamos verle pronto</div>
      </div>
    </div>
  )
}
