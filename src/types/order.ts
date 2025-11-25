// Shared types for order-related components

export interface CartItem {
    tempId: string
    product: {
        id: string
        name: string
        price: number
    }
    variant?: {
        id: string
        name: string
        price: number
    }
    modifiers: Array<{
        id: string
        name: string
        price: number
    }>
    quantity: number
    notes?: string
}
