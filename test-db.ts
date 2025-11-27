import { PrismaClient } from './prisma/generated/client';

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing database connection...');

    const restaurant = await prisma.restaurant.findFirst();
    console.log('Restaurant:', restaurant);

    const count = await prisma.restaurant.count();
    console.log('Restaurant count:', count);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
