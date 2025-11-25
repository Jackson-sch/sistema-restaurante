'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentCodeDisplayProps {
    paymentCode: string;
    orderNumber: string;
    total: number;
}

export function PaymentCodeDisplay({
    paymentCode,
    orderNumber,
    total,
}: PaymentCodeDisplayProps) {
    const copyToClipboard = () => {
        navigator.clipboard.writeText(paymentCode);
        toast.success('Código copiado al portapapeles');
    };

    return (
        <Card className="border-2 border-primary">
            <CardHeader>
                <CardTitle className="text-center">Código de Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">
                        Orden: {orderNumber}
                    </div>
                    <div className="text-5xl font-bold tracking-wider text-primary mb-2">
                        {paymentCode}
                    </div>
                    <div className="text-2xl font-semibold">
                        Total: S/ {total.toFixed(2)}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        className="flex-1"
                        size="lg"
                    >
                        <Copy className="mr-2 h-4 w-4" />
                        Copiar Código
                    </Button>
                    <Button variant="outline" size="lg">
                        <QrCode className="mr-2 h-4 w-4" />
                        Ver QR
                    </Button>
                </div>

                <div className="text-xs text-center text-muted-foreground">
                    Proporcione este código al cliente para realizar el pago en caja
                </div>
            </CardContent>
        </Card>
    );
}
