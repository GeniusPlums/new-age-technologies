import { ChatContainer } from '@/components/chat/ChatContainer';
import { CartSheet } from '@/components/cart/CartSheet';
import { CheckoutSheet } from '@/components/checkout/CheckoutSheet';
import { OrdersSheet } from '@/components/orders/OrdersSheet';
import { BrandMark } from '@/components/brand/BrandMark';

export default function Home() {
  return (
    <main className="relative h-screen flex flex-col overflow-hidden surface-grain">
      <header className="relative z-20 px-4 pt-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between rounded-full border border-border/70 bg-card/80 px-3 py-2 pl-3 pr-3 backdrop-blur-xl paper-shadow">
          <div className="flex items-center gap-3 min-w-0">
            <BrandMark size={36} />
            <div className="min-w-0 leading-tight">
              <p className="font-display text-[1.15rem] tracking-tight">Lumin</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground truncate">
                Shopping atelier
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OrdersSheet />
            <CartSheet />
          </div>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden">
        <ChatContainer />
      </div>
      <CheckoutSheet />
    </main>
  );
}
