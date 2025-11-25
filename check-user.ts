
import { prisma } from "./src/lib/prisma"

async function checkUser() {
    const userId = "cmi65a0mo0000tjh46koiujdg"
    console.log(`Checking user with ID: ${userId}`)

    const user = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (user) {
        console.log("User found:", user)
    } else {
        console.log("User NOT found")

        // List all users to see what we have
        const allUsers = await prisma.user.findMany()
        console.log("All users:", allUsers)
    }
}

checkUser()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
