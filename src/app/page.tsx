import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  // Si hay sesión, redirigir al dashboard
  redirect("/dashboard")
}
