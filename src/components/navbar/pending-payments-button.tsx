'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet } from 'lucide-react';
import { getPendingPaymentsCount } from '@/actions/pending-payments';
import { PendingPaymentsSheet } from './pending-payments-sheet';

export function PendingPaymentsButton() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    const result = await getPendingPaymentsCount();
    setCount(result);
  };

  // Initial fetch
  useEffect(() => {
    fetchCount();
  }, []);

  // Refresh count when sheet closes (payment might have been made)
  useEffect(() => {
    if (!sheetOpen) {
      fetchCount();
    }
  }, [sheetOpen]);

  // Periodic refresh every 3 seconds + visibility change + custom events
  useEffect(() => {
    const interval = setInterval(fetchCount, 3000);

    // Refresh when window becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCount();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Instant update when payment is made in same tab
    const handlePaymentUpdate = () => fetchCount();
    window.addEventListener('payment-updated', handlePaymentUpdate);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('payment-updated', handlePaymentUpdate);
    };
  }, []);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="relative gap-2"
        onClick={() => setSheetOpen(true)}
      >
        <Wallet className="h-4 w-4" />
        <span className="hidden sm:inline">Pagos</span>
        {count > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {count > 9 ? '9+' : count}
          </Badge>
        )}
      </Button>
      <PendingPaymentsSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
