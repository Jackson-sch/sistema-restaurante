import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"

export default async function LoginPage() {
    const session = await auth()

    if (session) {
        redirect("/")
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <LoginForm />
        </div>
    )
}
