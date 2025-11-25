// Payment-related types

export enum PaymentMethod {
    CASH = 'CASH',
    CARD = 'CARD',
    YAPE = 'YAPE',
    PLIN = 'PLIN',
    TRANSFER = 'TRANSFER',
    MIXED = 'MIXED',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PARTIAL = 'PARTIAL',
    PAID = 'PAID',
    REFUNDED = 'REFUNDED',
}

export interface PaymentInput {
    orderId: string;
    method: PaymentMethod;
    amount: number;
    reference?: string;
    receiptType?: 'BOLETA' | 'FACTURA' | 'NOTA';
    receiptNumber?: string;
    customerDoc?: string;
    customerName?: string;
    customerAddress?: string;
    notes?: string;
}

export interface OrderPaymentInfo {
    id: string;
    orderNumber: string;
    paymentCode: string;
    total: number;
    subtotal: number;
    tax: number;
    discount: number;
    tip: number;
    amountPaid: number;
    amountDue: number;
    paymentStatus: string;
    table?: {
        number: string;
        zone?: {
            name: string;
        };
    };
    items: Array<{
        id: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
        product: {
            name: string;
        };
    }>;
    payments: Array<{
        id: string;
        method: string;
        amount: number;
        reference?: string;
        createdAt: Date;
        cashier?: {
            name: string;
        };
    }>;
}
