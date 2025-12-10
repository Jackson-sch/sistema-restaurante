import { getRestaurantSettings, getCashSettings } from "@/actions/settings"
import { getReceiptSeries } from "@/actions/receipt-series"
import { RestaurantForm } from "@/components/settings/restaurant-form"
import { ReceiptSeriesList } from "@/components/settings/receipt-series-list"
import { CashSettingsForm } from "@/components/settings/cash-settings-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function SettingsPage() {
    const [restaurantData, seriesData, cashSettingsData] = await Promise.all([
        getRestaurantSettings(),
        getReceiptSeries(),
        getCashSettings()
    ])

    if (!restaurantData.data) {
        return <div>Error al cargar configuración</div>
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
                <p className="text-muted-foreground">
                    Administra los datos de tu restaurante y comprobantes.
                </p>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="receipts">Comprobantes</TabsTrigger>
                    <TabsTrigger value="cash">Caja</TabsTrigger>
                </TabsList>
                <TabsContent value="general">
                    <RestaurantForm initialData={restaurantData.data} />
                </TabsContent>
                <TabsContent value="receipts">
                    <ReceiptSeriesList series={seriesData.data || []} />
                </TabsContent>
                <TabsContent value="cash">
                    <CashSettingsForm initialSettings={cashSettingsData.data} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
