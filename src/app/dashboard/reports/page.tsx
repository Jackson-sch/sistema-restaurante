"use client"

import { SalesReport } from "@/components/reports/sales-report"
import { ProductPerformanceReport } from "@/components/reports/product-performance-report"
import { StaffPerformanceReport } from "@/components/reports/staff-performance-report"
import { InventoryReport } from "@/components/reports/inventory-report"
import { CashRegisterReport } from "@/components/reports/cash-register-report"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQueryState, parseAsString } from "nuqs"

export default function ReportsPage() {
    const [tab, setTab] = useQueryState("tab", parseAsString.withDefault("sales"))

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Reportes</h2>
            </div>
            <Tabs value={tab} onValueChange={setTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="sales">Ventas</TabsTrigger>
                    <TabsTrigger value="products">Productos</TabsTrigger>
                    <TabsTrigger value="staff">Personal</TabsTrigger>
                    <TabsTrigger value="inventory">Inventario</TabsTrigger>
                    <TabsTrigger value="cash-register">Caja</TabsTrigger>
                </TabsList>
                <TabsContent value="sales" className="space-y-4">
                    <SalesReport />
                </TabsContent>
                <TabsContent value="products" className="space-y-4">
                    <ProductPerformanceReport />
                </TabsContent>
                <TabsContent value="staff" className="space-y-4">
                    <StaffPerformanceReport />
                </TabsContent>
                <TabsContent value="inventory" className="space-y-4">
                    <InventoryReport />
                </TabsContent>
                <TabsContent value="cash-register" className="space-y-4">
                    <CashRegisterReport />
                </TabsContent>
            </Tabs>
        </div>
    )
}
