// Receipt-related types

export enum ReceiptType {
    NOTA_VENTA = 'NOTA_VENTA',
    BOLETA = 'BOLETA',
    FACTURA = 'FACTURA',
}

export interface ReceiptData {
    // Comprobante
    type: ReceiptType;
    number: string;
    date: Date;

    // Restaurante
    restaurant: {
        name: string;
        ruc: string;
        address: string;
        phone: string;
        logo?: string | null;
    };

    // Orden
    order: {
        orderNumber: string;
        table?: string;
        items: Array<{
            quantity: number;
            name: string;
            unitPrice: number;
            total: number;
        }>;
    };

    // Totales
    subtotal: number;
    tax: number;
    discount: number;
    total: number;

    // Pago
    payment: {
        method: string;
        amount: number;
        received?: number;
        change?: number;
        reference?: string;
    };

    // Cliente (opcional)
    customer?: {
        name: string;
        doc: string; // DNI o RUC
        address?: string;
    };

    // Cajera
    cashier: {
        name: string;
    };
}
