'use client';

import { PaymentForm } from '@/components/payments/payment-form';
import { PaymentHistory } from '@/components/payments/payment-history';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQueryState, parseAsString } from 'nuqs';

export default function PaymentsPage() {
    const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('register'));

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Pagos</h1>
                <p className="text-muted-foreground">
                    Registra pagos de órdenes y consulta el historial
                </p>
            </div>

            <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="register">Registrar Pago</TabsTrigger>
                    <TabsTrigger value="history">Historial</TabsTrigger>
                </TabsList>

                <TabsContent value="register" className="mt-6">
                    <PaymentForm />
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <PaymentHistory />
                </TabsContent>
            </Tabs>
        </div>
    );
}
