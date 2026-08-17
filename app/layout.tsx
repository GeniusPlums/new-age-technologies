import type { Metadata } from 'next';
import { Fraunces, Outfit } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/lib/context/CartContext';
import { ComparisonProvider } from '@/lib/context/ComparisonContext';
import { OrderProvider } from '@/lib/context/OrderContext';
import { ShopUiProvider } from '@/lib/context/ShopUiContext';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK'],
});

export const metadata: Metadata = {
  title: 'Lumin — shopping, in conversation',
  description:
    'A warm shopping atelier for Indian D2C food and fashion. Describe what you want; Lumin finds it.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${fraunces.variable} font-sans`}>
        <ShopUiProvider>
          <CartProvider>
            <OrderProvider>
              <ComparisonProvider>{children}</ComparisonProvider>
            </OrderProvider>
          </CartProvider>
        </ShopUiProvider>
      </body>
    </html>
  );
}
