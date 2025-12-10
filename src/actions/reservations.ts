'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface ReservationFilters {
  date?: Date;
  status?: string;
  tableId?: string;
}

export interface CreateReservationData {
  tableId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: Date;
  duration?: number;
  guests: number;
  notes?: string;
}

export interface UpdateReservationData extends Partial<CreateReservationData> {
  status?: string;
}

// Generate reservation number
async function generateReservationNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');

  const count = await prisma.reservation.count({
    where: {
      createdAt: {
        gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      },
    },
  });

  return `R${year}${month}${day}-${(count + 1).toString().padStart(3, '0')}`;
}

/**
 * Get all reservations with optional filters
 */
export async function getReservations(filters?: ReservationFilters) {
  try {
    const session = await auth();
    if (!session?.user?.restaurantId) {
      return { success: false, error: 'No autorizado' };
    }

    const where: any = {
      table: {
        restaurantId: session.user.restaurantId,
      },
    };

    if (filters?.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);

      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.tableId) {
      where.tableId = filters.tableId;
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        table: {
          include: {
            zone: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return { success: true, data: reservations };
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return { success: false, error: 'Error al obtener reservaciones' };
  }
}

/**
 * Get reservations for a date range (calendar view)
 */
export async function getReservationsForRange(startDate: Date, endDate: Date) {
  try {
    const session = await auth();
    if (!session?.user?.restaurantId) {
      return { success: false, error: 'No autorizado' };
    }

    const reservations = await prisma.reservation.findMany({
      where: {
        table: {
          restaurantId: session.user.restaurantId,
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          notIn: ['CANCELLED'],
        },
      },
      include: {
        table: {
          include: {
            zone: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return { success: true, data: reservations };
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return { success: false, error: 'Error al obtener reservaciones' };
  }
}

/**
 * Get single reservation
 */
export async function getReservation(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.restaurantId) {
      return { success: false, error: 'No autorizado' };
    }

    const reservation = await prisma.reservation.findFirst({
      where: {
        id,
        table: {
          restaurantId: session.user.restaurantId,
        },
      },
      include: {
        table: {
          include: {
            zone: true,
          },
        },
      },
    });

    if (!reservation) {
      return { success: false, error: 'Reservación no encontrada' };
    }

    return { success: true, data: reservation };
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return { success: false, error: 'Error al obtener reservación' };
  }
}

/**
 * Check table availability for a time slot
 */
export async function checkTableAvailability(
  tableId: string,
  date: Date,
  duration: number = 120,
  excludeReservationId?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.restaurantId) {
      return { available: false, error: 'No autorizado' };
    }

    const startTime = new Date(date);
    const endTime = new Date(date.getTime() + duration * 60 * 1000);

    // Check for conflicting reservations
    const conflict = await prisma.reservation.findFirst({
      where: {
        tableId,
        id: excludeReservationId ? { not: excludeReservationId } : undefined,
        status: {
          notIn: ['CANCELLED', 'COMPLETED', 'NO_SHOW'],
        },
        OR: [
          // New reservation starts during existing
          {
            date: { lte: startTime },
            AND: {
              date: {
                gte: new Date(startTime.getTime() - 24 * 60 * 60 * 1000), // Within 24h
              },
            },
          },
          // New reservation ends during existing
          {
            date: {
              gte: startTime,
              lt: endTime,
            },
          },
        ],
      },
    });

    // More precise check with duration
    if (conflict) {
      const conflictEnd = new Date(conflict.date.getTime() + conflict.duration * 60 * 1000);
      const hasOverlap = startTime < conflictEnd && endTime > conflict.date;

      if (hasOverlap) {
        return { available: false, conflictWith: conflict };
      }
    }

    return { available: true };
  } catch (error) {
    console.error('Error checking availability:', error);
    return { available: false, error: 'Error al verificar disponibilidad' };
  }
}

/**
 * Create reservation
 */
export async function createReservation(data: CreateReservationData) {
  try {
    const session = await auth();
    if (!session?.user?.restaurantId) {
      return { success: false, error: 'No autorizado' };
    }

    // Check table exists and belongs to restaurant
    const table = await prisma.table.findFirst({
      where: {
        id: data.tableId,
        restaurantId: session.user.restaurantId,
      },
    });

    if (!table) {
      return { success: false, error: 'Mesa no encontrada' };
    }

    // Check availability
    const availability = await checkTableAvailability(
      data.tableId,
      data.date,
      data.duration || 120
    );

    if (!availability.available) {
      return { success: false, error: 'Mesa no disponible para ese horario' };
    }

    // Check capacity
    if (data.guests > table.capacity) {
      return {
        success: false,
        error: `La mesa tiene capacidad para ${table.capacity} personas`
      };
    }

    const reservationNumber = await generateReservationNumber();

    const reservation = await prisma.reservation.create({
      data: {
        reservationNumber,
        tableId: data.tableId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        date: data.date,
        duration: data.duration || 120,
        guests: data.guests,
        notes: data.notes,
        status: 'PENDING',
      },
      include: {
        table: {
          include: {
            zone: true,
          },
        },
      },
    });

    revalidatePath('/dashboard/reservations');
    revalidatePath('/dashboard/tables');

    return { success: true, data: reservation };
  } catch (error) {
    console.error('Error creating reservation:', error);
    return { success: false, error: 'Error al crear reservación' };
  }
}

/**
 * Update reservation
 */
export async function updateReservation(id: string, data: UpdateReservationData) {
  try {
    const session = await auth();
    if (!session?.user?.restaurantId) {
      return { success: false, error: 'No autorizado' };
    }

    // Check reservation exists
    const existing = await prisma.reservation.findFirst({
      where: {
        id,
        table: {
          restaurantId: session.user.restaurantId,
        },
      },
    });

    if (!existing) {
      return { success: false, error: 'Reservación no encontrada' };
    }

    // If changing date/table, check availability
    if (data.date || data.tableId) {
      const availability = await checkTableAvailability(
        data.tableId || existing.tableId,
        data.date || existing.date,
        data.duration || existing.duration,
        id
      );

      if (!availability.available) {
        return { success: false, error: 'Mesa no disponible para ese horario' };
      }
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        tableId: data.tableId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        date: data.date,
        duration: data.duration,
        guests: data.guests,
        notes: data.notes,
        status: data.status,
      },
      include: {
        table: {
          include: {
            zone: true,
          },
        },
      },
    });

    // Handle table status changes based on reservation status
    if (data.status) {
      if (data.status === 'CONFIRMED') {
        const isToday = new Date(reservation.date).toDateString() === new Date().toDateString();
        if (isToday) {
          await prisma.table.update({
            where: { id: reservation.tableId },
            data: { status: 'RESERVED' },
          });
        }
      } else if (['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(data.status)) {
        const table = await prisma.table.findUnique({
          where: { id: reservation.tableId },
          select: { status: true }
        });

        if (table?.status === 'RESERVED') {
          await prisma.table.update({
            where: { id: reservation.tableId },
            data: { status: 'AVAILABLE' },
          });
        }
      }
    }

    revalidatePath('/dashboard/reservations');
    revalidatePath('/dashboard/tables');

    return { success: true, data: reservation };
  } catch (error) {
    console.error('Error updating reservation:', error);
    return { success: false, error: 'Error al actualizar reservación' };
  }
}

/**
 * Update reservation status quickly
 */
export async function updateReservationStatus(id: string, status: string) {
  try {
    const session = await auth();
    if (!session?.user?.restaurantId) {
      return { success: false, error: 'No autorizado' };
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status },
    });

    // If confirmed, optionally update table status to reserved
    if (status === 'CONFIRMED') {
      const isToday = new Date(reservation.date).toDateString() === new Date().toDateString();
      if (isToday) {
        await prisma.table.update({
          where: { id: reservation.tableId },
          data: { status: 'RESERVED' },
        });
      }
    } else if (['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(status)) {
      // If cancelled/completed, free the table ONLY if it is currently RESERVED
      // We don't want to free an OCCUPIED table (e.g. if they arrived and sat down)
      const table = await prisma.table.findUnique({
        where: { id: reservation.tableId },
        select: { status: true }
      });

      if (table?.status === 'RESERVED') {
        await prisma.table.update({
          where: { id: reservation.tableId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    revalidatePath('/dashboard/reservations');
    revalidatePath('/dashboard/tables');

    return { success: true, data: reservation };
  } catch (error) {
    console.error('Error updating reservation status:', error);
    return { success: false, error: 'Error al actualizar estado' };
  }
}

/**
 * Delete reservation
 */
export async function deleteReservation(id: string) {
  try {
    const session = await auth();
    if (!session?.user?.restaurantId) {
      return { success: false, error: 'No autorizado' };
    }

    // Check reservation exists
    const existing = await prisma.reservation.findFirst({
      where: {
        id,
        table: {
          restaurantId: session.user.restaurantId,
        },
      },
    });

    if (!existing) {
      return { success: false, error: 'Reservación no encontrada' };
    }

    await prisma.reservation.delete({
      where: { id },
    });

    revalidatePath('/dashboard/reservations');
    revalidatePath('/dashboard/tables');

    return { success: true };
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return { success: false, error: 'Error al eliminar reservación' };
  }
}

/**
 * Get today's reservations count for dashboard
 */
export async function getTodayReservationsCount() {
  try {
    const session = await auth();
    if (!session?.user?.restaurantId) {
      return 0;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await prisma.reservation.count({
      where: {
        table: {
          restaurantId: session.user.restaurantId,
        },
        date: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          notIn: ['CANCELLED', 'COMPLETED', 'NO_SHOW'],
        },
      },
    });

    return count;
  } catch (error) {
    console.error('Error counting reservations:', error);
    return 0;
  }
}
