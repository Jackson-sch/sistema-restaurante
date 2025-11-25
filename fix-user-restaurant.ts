import { prisma } from "./src/lib/prisma";

async function main() {
    const email = "darwinjackson.12@gmail.com";

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.log("User not found");
        return;
    }

    console.log("User found:", user.name, "RestaurantID:", user.restaurantId);

    // Check for restaurants
    let restaurant = await prisma.restaurant.findFirst();

    if (!restaurant) {
        console.log("No restaurant found. Creating one...");
        restaurant = await prisma.restaurant.create({
            data: {
                name: "Restaurante Principal",
                address: "Av. Principal 123",
                phone: "555-0101"
            }
        });
        console.log("Created restaurant:", restaurant);
    } else {
        console.log("Found restaurant:", restaurant.name);
    }

    // Update user
    if (user.restaurantId !== restaurant.id) {
        await prisma.user.update({
            where: { id: user.id },
            data: { restaurantId: restaurant.id }
        });
        console.log("Updated user with restaurant ID:", restaurant.id);
    } else {
        console.log("User already associated with this restaurant.");
    }

    // Check products for this restaurant
    const productsCount = await prisma.product.count({
        where: { category: { restaurantId: restaurant.id } }
    });
    console.log(`Found ${productsCount} products for this restaurant.`);

    if (productsCount === 0) {
        console.log("Creating sample category and product...");
        const category = await prisma.category.create({
            data: {
                name: "Entradas",
                restaurantId: restaurant.id,
                order: 1
            }
        });

        await prisma.product.create({
            data: {
                name: "Ceviche Clásico",
                description: "Pescado fresco marinado en limón",
                price: 35.00,
                cost: 15.00,
                categoryId: category.id,
                available: true
            }
        });
        console.log("Sample product created.");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
