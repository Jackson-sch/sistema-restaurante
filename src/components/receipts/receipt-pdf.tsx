import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { ReceiptData, ReceiptType } from '@/types/receipt';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Register a font that supports special characters if needed
// For now we'll use standard fonts, but in production you might want to register a custom font
// Font.register({ family: 'Courier', src: 'path/to/font.ttf' });

const styles = StyleSheet.create({
    page: {
        fontFamily: 'Courier',
        fontSize: 10,
        padding: 20,
        width: '80mm', // Thermal printer width
    },
    header: {
        textAlign: 'center',
        marginBottom: 10,
        borderBottom: '1px solid #000',
        paddingBottom: 5,
    },
    restaurantName: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    text: {
        fontSize: 9,
        marginBottom: 2,
    },
    bold: {
        fontWeight: 'bold', // Note: standard Courier doesn't support bold weight well in all viewers without custom font
        // We can simulate or just rely on size/uppercase
    },
    section: {
        marginBottom: 10,
        paddingBottom: 5,
        borderBottom: '1px dashed #666',
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    itemSub: {
        fontSize: 8,
        color: '#555',
        marginLeft: 10,
        marginBottom: 4,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
        paddingTop: 5,
        borderTop: '1px solid #000',
    },
    totalText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    footer: {
        textAlign: 'center',
        marginTop: 10,
    },
});

interface ReceiptPDFProps {
    data: ReceiptData;
}

export const ReceiptPDF = ({ data }: ReceiptPDFProps) => {
    const getReceiptTitle = () => {
        switch (data.type) {
            case ReceiptType.BOLETA: return 'BOLETA DE VENTA';
            case ReceiptType.FACTURA: return 'FACTURA';
            case ReceiptType.NOTA_VENTA: return 'NOTA DE VENTA';
            default: return 'COMPROBANTE';
        }
    };

    const getPaymentMethodLabel = (method: string) => {
        const labels: Record<string, string> = {
            CASH: 'Efectivo',
            CARD: 'Tarjeta',
            YAPE: 'Yape',
            PLIN: 'Plin',
            TRANSFER: 'Transferencia',
            MIXED: 'Mixto',
        };
        return labels[method] || method;
    };

    return (
        <Document>
            <Page size={[226, 1200]} style={styles.page}> {/* 226pt is approx 80mm, 1200pt height for long receipts */}

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.restaurantName}>{data.restaurant.name}</Text>
                    <Text style={styles.text}>{data.restaurant.address}</Text>
                    <Text style={styles.text}>RUC: {data.restaurant.ruc}</Text>
                    <Text style={styles.text}>Tel: {data.restaurant.phone}</Text>
                </View>

                {/* Receipt Type */}
                <View style={styles.header}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 2 }}>{getReceiptTitle()}</Text>
                    {data.type !== ReceiptType.NOTA_VENTA && (
                        <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{data.number}</Text>
                    )}
                </View>

                {/* Info */}
                <View style={styles.section}>
                    <View style={styles.row}>
                        <Text style={styles.text}>Fecha:</Text>
                        <Text style={styles.text}>{format(data.date, "dd/MM/yyyy", { locale: es })}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.text}>Hora:</Text>
                        <Text style={styles.text}>{format(data.date, "HH:mm", { locale: es })}</Text>
                    </View>
                    {data.order.table && (
                        <View style={styles.row}>
                            <Text style={styles.text}>Mesa:</Text>
                            <Text style={styles.text}>{data.order.table}</Text>
                        </View>
                    )}
                    <View style={styles.row}>
                        <Text style={styles.text}>Orden:</Text>
                        <Text style={styles.text}>{data.order.orderNumber}</Text>
                    </View>
                </View>

                {/* Items */}
                <View style={{ marginBottom: 10, paddingBottom: 5, borderBottom: '1px solid #000' }}>
                    <Text style={styles.sectionTitle}>DETALLE DE CONSUMO</Text>
                    {data.order.items.map((item, index) => (
                        <View key={index}>
                            <View style={styles.itemRow}>
                                <Text style={[styles.text, { maxWidth: '70%' }]}>{item.quantity}x {item.name}</Text>
                                <Text style={styles.text}>S/ {item.total.toFixed(2)}</Text>
                            </View>
                            <Text style={styles.itemSub}>@ S/ {item.unitPrice.toFixed(2)} c/u</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={{ marginBottom: 10, paddingBottom: 5, borderBottom: '1px solid #000' }}>
                    <View style={styles.row}>
                        <Text style={styles.text}>Subtotal:</Text>
                        <Text style={styles.text}>S/ {data.subtotal.toFixed(2)}</Text>
                    </View>
                    {data.tax > 0 && (
                        <View style={styles.row}>
                            <Text style={styles.text}>IGV (18%):</Text>
                            <Text style={styles.text}>S/ {data.tax.toFixed(2)}</Text>
                        </View>
                    )}
                    {data.discount > 0 && (
                        <View style={styles.row}>
                            <Text style={styles.text}>Descuento:</Text>
                            <Text style={styles.text}>-S/ {data.discount.toFixed(2)}</Text>
                        </View>
                    )}
                    <View style={styles.totalRow}>
                        <Text style={styles.totalText}>TOTAL:</Text>
                        <Text style={styles.totalText}>S/ {data.total.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Payment */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>INFORMACIÓN DE PAGO</Text>
                    <View style={styles.row}>
                        <Text style={styles.text}>Método:</Text>
                        <Text style={styles.text}>{getPaymentMethodLabel(data.payment.method)}</Text>
                    </View>
                    {data.payment.received && (
                        <>
                            <View style={styles.row}>
                                <Text style={styles.text}>Recibido:</Text>
                                <Text style={styles.text}>S/ {data.payment.received.toFixed(2)}</Text>
                            </View>
                            {data.payment.change && data.payment.change > 0 && (
                                <View style={styles.row}>
                                    <Text style={styles.text}>Cambio:</Text>
                                    <Text style={styles.text}>S/ {data.payment.change.toFixed(2)}</Text>
                                </View>
                            )}
                        </>
                    )}
                </View>

                {/* Customer */}
                {data.customer && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>DATOS DEL CLIENTE</Text>
                        <View style={styles.row}>
                            <Text style={styles.text}>{data.type === ReceiptType.FACTURA ? 'RUC:' : 'DNI:'}</Text>
                            <Text style={styles.text}>{data.customer.doc}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.text}>Nombre:</Text>
                            <Text style={[styles.text, { maxWidth: '60%', textAlign: 'right' }]}>{data.customer.name}</Text>
                        </View>
                        {data.customer.address && (
                            <View style={{ marginTop: 2 }}>
                                <Text style={styles.text}>Dirección:</Text>
                                <Text style={[styles.text, { fontSize: 8 }]}>{data.customer.address}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.text}>Atendido por: {data.cashier.name}</Text>
                    <Text style={[styles.text, { marginTop: 5, fontWeight: 'bold' }]}>¡GRACIAS POR SU PREFERENCIA!</Text>
                    <Text style={styles.text}>Vuelva pronto</Text>
                </View>
            </Page>
        </Document>
    );
};
