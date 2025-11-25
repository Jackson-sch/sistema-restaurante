import { prisma } from "@/lib/prisma"

export async function getRestaurantId() {
    // TODO: Get from user session properly
    // For now, return the first restaurant or create a default one
    const restaurant = await prisma.restaurant.findFirst()

    if (restaurant) {
        return restaurant.id
    }

    const newRestaurant = await prisma.restaurant.create({
        data: {
            name: "Mi Restaurante",
            slug: "mi-restaurante",
            businessType: "RESTAURANT",
        }
    })

    return newRestaurant.id
}
