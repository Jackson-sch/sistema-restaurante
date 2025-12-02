import { KitchenView } from "@/components/kitchen/kitchen-view"

export const dynamic = "force-dynamic"
export const revalidate = 15 // Revalidate every 15 seconds for real-time updates

export default function KitchenPage() {
    return <KitchenView />
}
