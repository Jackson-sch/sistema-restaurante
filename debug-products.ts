import { prisma } from "./src/lib/prisma";

async function main() {
    const restaurantId = "cmib7fpvh0000tjsw4px7f1h8"; // From previous script

    console.log("Checking products for restaurant:", restaurantId);

    const products = await prisma.product.findMany({
        where: {
            category: { restaurantId: restaurantId },
            available: true
        },
        include: {
            category: true,
            variants: true,
            modifierGroups: {
                include: {
                    modifierGroup: {
                        include: {
                            modifiers: true
                        }
                    }
                }
            }
        },
        orderBy: { name: 'asc' },
    });

    console.log(`Found ${products.length} products:`);
    products.forEach(p => {
        console.log(`  - ${p.name} (Category: ${p.category.name}, Price: ${p.price})`);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
