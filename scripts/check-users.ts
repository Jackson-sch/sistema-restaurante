import { prisma } from "../src/lib/prisma";

async function checkUsers() {
    console.log('🔍 Checking users...\n');

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
            restaurantId: true,
        },
    });

    console.log(`Found ${users.length} users:\n`);

    users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'Sin nombre'}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.active}`);
        console.log(`   Restaurant ID: ${user.restaurantId || 'None'}`);
        console.log('');
    });

    await prisma.$disconnect();
}

checkUsers();
