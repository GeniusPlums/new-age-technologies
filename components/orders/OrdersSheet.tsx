'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { useOrders } from '@/lib/context/OrderContext';
import { useShopUi } from '@/lib/context/ShopUiContext';
import { formatPrice } from '@/lib/utils';

function statusLabel(status: string) {
  if (status === 'paid') return 'Paid';
  if (status === 'pending') return 'COD pending';
  return 'Failed';
}

export function OrdersSheet() {
  const { orders } = useOrders();
  const { ordersOpen, openOrders, closeOrders } = useShopUi();

  return (
    <Sheet open={ordersOpen} onOpenChange={(open) => (open ? openOrders() : closeOrders())}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full h-11 w-11 border-border/80" data-testid="orders-trigger" aria-label="Orders">
          <Package className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col h-full sm:max-w-md w-full rounded-l-3xl border-l-border/70 bg-card">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Orders ({orders.length})</SheetTitle>
          <SheetDescription>Mock checkout history stored on this device.</SheetDescription>
        </SheetHeader>

        {orders.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders yet</p>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 py-4" data-testid="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="rounded-2xl border border-border p-4 space-y-2" data-testid="order-card">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-sm">{order.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                      {statusLabel(order.paymentStatus)}
                    </Badge>
                  </div>
                  <Separator />
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="truncate mr-2">
                        {item.name} × {item.quantity}
                      </span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(order.totals.total)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {order.shipping.fullName} · {order.shipping.city} {order.shipping.pincode}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
