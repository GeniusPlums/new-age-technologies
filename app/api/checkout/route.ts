import productsData from '@/data/products.json';
import { processCheckout, type CheckoutRequest } from '@/lib/payments/checkout';
import type { CheckoutItem, Product } from '@/lib/types';

export const maxDuration = 15;

function repriceFromCatalog(items: CheckoutItem[], catalog: Product[]): CheckoutItem[] | null {
  const repriced: CheckoutItem[] = [];

  for (const item of items) {
    const product = catalog.find((p) => p.id === item.id);
    if (!product || !product.inStock) {
      return null;
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      return null;
    }
    repriced.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      imageUrl: product.imageUrl,
      brand: product.brand,
    });
  }

  return repriced;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutRequest;
    const catalog = productsData.products as Product[];
    const items = repriceFromCatalog(body.items || [], catalog);

    if (!items) {
      return Response.json(
        { error: 'One or more items are unavailable' },
        { status: 400 }
      );
    }

    const result = processCheckout({
      items,
      shipping: body.shipping,
      payment: body.payment,
    });

    if (!result.ok) {
      return Response.json(
        { error: result.error, fieldErrors: result.fieldErrors },
        { status: 400 }
      );
    }

    return Response.json({ order: result.order });
  } catch (error) {
    console.error('Checkout API error:', error);
    return Response.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}
