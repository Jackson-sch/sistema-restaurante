'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// Tipos para la creación y actualización
export interface CreateComboData {
  name: string;
  description?: string;
  price: number;
  image?: string;
  products: {
    productId: string;
    quantity: number;
  }[];
}

export interface UpdateComboData extends Partial<CreateComboData> {
  active?: boolean;
}

export async function getCombos() {
  const session = await auth();

  if (!session?.user?.restaurantId) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    const combos = await prisma.combo.findMany({
      where: {
        // En el esquema actual Combo no tiene restaurantId directo, 
        // pero debería estar asociado. 
        // ALERTA: El esquema en `schema.prisma` para `Combo` NO tiene `restaurantId`.
        // Esto es un problema potencial para multi-tenancy. 
        // Voy a verificar si puedo filtrar por productos del restaurante o si necesito agregar restaurantId.
        // Por ahora, asumiré que necesito filtrar combos que contengan productos de este restaurante.
        products: {
          some: {
            product: {
              category: {
                restaurantId: session.user.restaurantId
              }
            }
          }
        }
      },
      include: {
        products: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Serializar Decimales
    const serializedCombos = combos.map(combo => ({
      ...combo,
      price: Number(combo.price),
      products: combo.products.map(cp => ({
        ...cp,
        product: {
          ...cp.product,
          price: Number(cp.product.price),
          cost: Number(cp.product.cost || 0)
        }
      }))
    }));

    return { success: true, data: serializedCombos };
  } catch (error) {
    console.error('Error fetching combos:', error);
    return { success: false, error: 'Error al obtener combos' };
  }
}

export async function createCombo(data: CreateComboData) {
  const session = await auth();

  if (!session?.user?.restaurantId) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    // Validar que los productos pertenezcan al restaurante
    const productIds = data.products.map(p => p.productId);
    const validProducts = await prisma.product.count({
      where: {
        id: { in: productIds },
        category: {
          restaurantId: session.user.restaurantId
        }
      }
    });

    if (validProducts !== productIds.length) {
      return { success: false, error: 'Uno o más productos no son válidos' };
    }

    const combo = await prisma.combo.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        image: data.image,
        products: {
          create: data.products.map(p => ({
            productId: p.productId,
            quantity: p.quantity
          }))
        }
      }
    });

    revalidatePath('/dashboard/combos');
    return { success: true, data: combo };
  } catch (error) {
    console.error('Error creating combo:', error);
    return { success: false, error: 'Error al crear el combo' };
  }
}

export async function updateCombo(id: string, data: UpdateComboData) {
  const session = await auth();

  if (!session?.user?.restaurantId) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    // Primero, eliminar relaciones existentes si se actualizan productos
    if (data.products) {
      await prisma.comboProduct.deleteMany({
        where: { comboId: id }
      });
    }

    const combo = await prisma.combo.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        image: data.image,
        active: data.active,
        ...(data.products && {
          products: {
            create: data.products.map(p => ({
              productId: p.productId,
              quantity: p.quantity
            }))
          }
        })
      }
    });

    revalidatePath('/dashboard/combos');
    return { success: true, data: combo };
  } catch (error) {
    console.error('Error updating combo:', error);
    return { success: false, error: 'Error al actualizar el combo' };
  }
}

export async function deleteCombo(id: string) {
  const session = await auth();

  if (!session?.user?.restaurantId) {
    return { success: false, error: 'No autorizado' };
  }

  try {
    await prisma.combo.delete({
      where: { id }
    });

    revalidatePath('/dashboard/combos');
    return { success: true };
  } catch (error) {
    console.error('Error deleting combo:', error);
    return { success: false, error: 'Error al eliminar el combo' };
  }
}

export async function toggleComboActive(id: string, active: boolean) {
  return updateCombo(id, { active });
}
