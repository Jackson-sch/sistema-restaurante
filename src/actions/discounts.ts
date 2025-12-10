'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface DiscountFilters {
  active?: boolean;
  type?: string;
}

export interface CreateDiscountData {
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_ITEM';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  validFrom: Date;
  validUntil: Date;
  active?: boolean;
  applicableTo?: string[];
}

export interface UpdateDiscountData extends Partial<CreateDiscountData> { }

/**
 * Get all discounts with optional filters
 */
export async function getDiscounts(filters?: DiscountFilters) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'No autorizado' };
    }

    const where: any = {};

    if (filters?.active !== undefined) {
      where.active = filters.active;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    const discounts = await prisma.discount.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convert Decimal to number for serialization
    const serialized = discounts.map(d => ({
      ...d,
      value: Number(d.value),
      minOrderAmount: d.minOrderAmount ? Number(d.minOrderAmount) : null,
      maxDiscount: d.maxDiscount ? Number(d.maxDiscount) : null,
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error('Error fetching discounts:', error);
    return { success: false, error: 'Error al obtener descuentos' };
  }
}

/**
 * Get single discount
 */
export async function getDiscount(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'No autorizado' };
    }

    const discount = await prisma.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      return { success: false, error: 'Descuento no encontrado' };
    }

    return {
      success: true,
      data: {
        ...discount,
        value: Number(discount.value),
        minOrderAmount: discount.minOrderAmount ? Number(discount.minOrderAmount) : null,
        maxDiscount: discount.maxDiscount ? Number(discount.maxDiscount) : null,
      }
    };
  } catch (error) {
    console.error('Error fetching discount:', error);
    return { success: false, error: 'Error al obtener descuento' };
  }
}

/**
 * Create discount
 */
export async function createDiscount(data: CreateDiscountData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'No autorizado' };
    }

    // Check code uniqueness
    const existing = await prisma.discount.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existing) {
      return { success: false, error: 'Ya existe un descuento con ese código' };
    }

    // Validate dates
    if (data.validUntil <= data.validFrom) {
      return { success: false, error: 'La fecha de fin debe ser posterior a la de inicio' };
    }

    const discount = await prisma.discount.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        type: data.type,
        value: data.value,
        minOrderAmount: data.minOrderAmount || null,
        maxDiscount: data.maxDiscount || null,
        usageLimit: data.usageLimit || null,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        active: data.active ?? true,
        applicableTo: data.applicableTo || ['ALL'],
      },
    });

    // Serialize return data
    const serialized = JSON.parse(JSON.stringify(discount));
    return { success: true, data: serialized };
  } catch (error) {
    console.error('Error creating discount:', error);
    return { success: false, error: 'Error al crear descuento' };
  }
}

/**
 * Update discount
 */
export async function updateDiscount(id: string, data: UpdateDiscountData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'No autorizado' };
    }

    // Check exists
    const existing = await prisma.discount.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: 'Descuento no encontrado' };
    }

    // Check code uniqueness if changing
    if (data.code && data.code.toUpperCase() !== existing.code) {
      const codeExists = await prisma.discount.findUnique({
        where: { code: data.code.toUpperCase() },
      });
      if (codeExists) {
        return { success: false, error: 'Ya existe un descuento con ese código' };
      }
    }

    const discount = await prisma.discount.update({
      where: { id },
      data: {
        code: data.code?.toUpperCase(),
        name: data.name,
        type: data.type,
        value: data.value,
        minOrderAmount: data.minOrderAmount,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        active: data.active,
        applicableTo: data.applicableTo,
      },
    });

    revalidatePath('/dashboard/discounts');

    // Serialize return data
    const serialized = JSON.parse(JSON.stringify(discount));
    return { success: true, data: serialized };
  } catch (error) {
    console.error('Error updating discount:', error);
    return { success: false, error: 'Error al actualizar descuento' };
  }
}

/**
 * Toggle discount active status
 */
export async function toggleDiscountActive(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'No autorizado' };
    }

    const existing = await prisma.discount.findUnique({
      where: { id },
    });

    if (!existing) {
      return { success: false, error: 'Descuento no encontrado' };
    }

    const discount = await prisma.discount.update({
      where: { id },
      data: { active: !existing.active },
    });

    revalidatePath('/dashboard/discounts');

    // Serialize return data
    const serialized = JSON.parse(JSON.stringify(discount));
    return { success: true, data: serialized };
  } catch (error) {
    console.error('Error toggling discount:', error);
    return { success: false, error: 'Error al cambiar estado' };
  }
}

/**
 * Delete discount
 */
export async function deleteDiscount(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'No autorizado' };
    }

    await prisma.discount.delete({
      where: { id },
    });

    revalidatePath('/dashboard/discounts');

    return { success: true };
  } catch (error) {
    console.error('Error deleting discount:', error);
    return { success: false, error: 'Error al eliminar descuento' };
  }
}

/**
 * Validate a discount code and calculate the discount amount
 */
export async function validateDiscountCode(code: string, orderTotal: number) {
  try {
    const discount = await prisma.discount.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!discount) {
      return { valid: false, error: 'Código no encontrado' };
    }

    // Check if active
    if (!discount.active) {
      return { valid: false, error: 'Este código ya no está activo' };
    }

    // Check dates
    const now = new Date();
    if (now < discount.validFrom) {
      return { valid: false, error: 'Este código aún no está disponible' };
    }
    if (now > discount.validUntil) {
      return { valid: false, error: 'Este código ha expirado' };
    }

    // Check usage limit
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      return { valid: false, error: 'Este código ha alcanzado su límite de uso' };
    }

    // Check minimum order amount
    const minAmount = discount.minOrderAmount ? Number(discount.minOrderAmount) : 0;
    if (orderTotal < minAmount) {
      return {
        valid: false,
        error: `El pedido mínimo para este código es S/ ${minAmount.toFixed(2)}`
      };
    }

    // Calculate discount amount
    let discountAmount = 0;
    const value = Number(discount.value);

    if (discount.type === 'PERCENTAGE') {
      discountAmount = (orderTotal * value) / 100;
    } else if (discount.type === 'FIXED_AMOUNT') {
      discountAmount = value;
    }

    // Apply max discount cap
    const maxDiscount = discount.maxDiscount ? Number(discount.maxDiscount) : null;
    if (maxDiscount && discountAmount > maxDiscount) {
      discountAmount = maxDiscount;
    }

    // Don't exceed order total
    if (discountAmount > orderTotal) {
      discountAmount = orderTotal;
    }

    return {
      valid: true,
      discount: {
        id: discount.id,
        code: discount.code,
        name: discount.name,
        type: discount.type,
        discountAmount,
      }
    };
  } catch (error) {
    console.error('Error validating discount:', error);
    return { valid: false, error: 'Error al validar código' };
  }
}

/**
 * Increment usage count when discount is applied
 */
export async function incrementDiscountUsage(id: string) {
  try {
    await prisma.discount.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
      },
    });
    return { success: true };
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return { success: false };
  }
}

/**
 * Apply a discount to an order
 */
export async function applyDiscountToOrder(orderId: string, code: string) {
  try {
    const session = await auth();
    if (!session?.user?.restaurantId) {
      return { success: false, error: 'No autorizado' };
    }

    // 1. Get the order
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        restaurantId: session.user.restaurantId
      }
    });

    if (!order) {
      return { success: false, error: 'Orden no encontrada' };
    }

    // 2. Validate discount
    const orderSubtotal = Number(order.subtotal); // Discounts usually apply to subtotal, but requirements say Total.
    // Let's stick to Total for now as per validateDiscountCode
    // Actually, calculate total before discount to base percentage on that?
    // Usually discount is on subtotal.
    // Let's use current subtotal + tax + tip (which is total + currentDiscount) to get the gross amount
    const grossTotal = Number(order.subtotal) + Number(order.tax) + Number(order.tip);

    const validation = await validateDiscountCode(code, grossTotal);

    if (!validation.valid || !validation.discount) {
      return { success: false, error: validation.error || 'Cupón inválido' };
    }

    const { discountAmount, id: discountId } = validation.discount;

    // 3. Update Order
    // New Total = Gross Total - New Discount
    const newTotal = grossTotal - discountAmount;

    // Check if order already has this discount applied (prevent double application of same code if needed)
    // For now, we overwrite any existing discount.

    // Append note
    const discountNote = `Descuento: ${code} (-${discountAmount.toFixed(2)})`;
    const currentNotes = order.notes || '';
    const newNotes = currentNotes.includes(code) ? currentNotes : (currentNotes ? `${currentNotes}\n${discountNote}` : discountNote);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        discount: discountAmount,
        total: newTotal,
        notes: newNotes,
        // Optionally store discountId somewhere if schema allowed
      }
    });

    // 4. Increment Usage
    await incrementDiscountUsage(discountId);

    revalidatePath(`/dashboard/orders/${orderId}`);
    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard/tables');

    return {
      success: true,
      data: {
        discountAmount,
        newTotal
      }
    };

  } catch (error) {
    console.error('Error applying discount:', error);
    return { success: false, error: 'Error al aplicar descuento' };
  }
}
