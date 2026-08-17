'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, CreditCard, Smartphone, Truck } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import { useOrders } from '@/lib/context/OrderContext';
import { useShopUi } from '@/lib/context/ShopUiContext';
import { usePreferences } from '@/hooks/usePreferences';
import { formatPrice } from '@/lib/utils';
import {
  calculateOrderTotals,
  FREE_SHIPPING_THRESHOLD,
} from '@/lib/payments/checkout';
import type { Order, PaymentMethod, ShippingAddress } from '@/lib/types';

const EMPTY_SHIPPING: ShippingAddress = {
  fullName: '',
  phone: '',
  email: '',
  addressLine: '',
  city: '',
  state: '',
  pincode: '',
};

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" data-testid={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function CheckoutSheet() {
  const { checkoutOpen, closeCheckout, openOrders } = useShopUi();
  const { state, clearCart } = useCart();
  const { addOrder } = useOrders();
  const { preferences, updatePreferences } = usePreferences();

  const [shipping, setShipping] = useState<ShippingAddress>(EMPTY_SHIPPING);
  const [prefilled, setPrefilled] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (checkoutOpen && !prefilled && preferences.shipping) {
      setShipping(preferences.shipping);
      setPrefilled(true);
    }
  }, [checkoutOpen, prefilled, preferences.shipping]);

  const items = useMemo(
    () =>
      state.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        brand: item.brand,
      })),
    [state.items]
  );

  const totals = useMemo(() => calculateOrderTotals(items), [items]);

  const updateField = (key: keyof ShippingAddress, value: string) => {
    setShipping((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setFieldErrors({});
    setFormError('');
    setSubmitting(false);
    setPlacedOrder(null);
    setPrefilled(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeCheckout();
      resetForm();
    }
  };

  const handlePay = async () => {
    setSubmitting(true);
    setFieldErrors({});
    setFormError('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          shipping,
          payment: {
            method,
            upiId,
            cardNumber,
            cardExpiry,
            cardCvv,
            cardName,
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setFormError(payload.error || 'Payment failed');
        setFieldErrors(payload.fieldErrors || {});
        return;
      }

      addOrder(payload.order);
      updatePreferences({ shipping });
      clearCart();
      setPlacedOrder(payload.order);
    } catch {
      setFormError('Could not reach the payment service. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={checkoutOpen} onOpenChange={handleOpenChange}>
      <SheetContent className="flex flex-col h-full sm:max-w-md w-full rounded-l-3xl border-l-border/70 bg-card">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">
            {placedOrder ? 'Order confirmed' : 'Checkout'}
          </SheetTitle>
          <SheetDescription>
            {placedOrder
              ? 'Payment completed with the mock Indian gateway.'
              : 'Mock UPI, card, or cash on delivery. No real charge.'}
          </SheetDescription>
        </SheetHeader>

        {placedOrder ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2" data-testid="order-success">
            <CheckCircle2 className="h-12 w-12 text-primary mb-4" />
            <p className="font-semibold text-lg">Thanks, {placedOrder.shipping.fullName.split(' ')[0]}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Order <span className="font-mono text-foreground" data-testid="order-id">{placedOrder.id}</span>
            </p>
            <p className="text-sm mt-3">
              {placedOrder.paymentStatus === 'pending'
                ? `Pay ${formatPrice(placedOrder.totals.total)} on delivery.`
                : `${formatPrice(placedOrder.totals.total)} paid via ${placedOrder.paymentMethod.toUpperCase()}.`}
            </p>
            <div className="mt-6 w-full space-y-2">
              <Button
                className="w-full"
                onClick={() => {
                  closeCheckout();
                  resetForm();
                  openOrders();
                }}
              >
                View orders
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => handleOpenChange(false)}>
                Keep shopping
              </Button>
            </div>
          </div>
        ) : state.items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center">
            <p className="text-muted-foreground">Add something to your bag before checkout.</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-6 py-4">
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold">Delivery</h3>
                  <Field id="checkout-name" label="Full name" error={fieldErrors.fullName}>
                    <Input
                      id="checkout-name"
                      data-testid="checkout-name"
                      value={shipping.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                    />
                  </Field>
                  <Field id="checkout-phone" label="Mobile" error={fieldErrors.phone}>
                    <Input
                      id="checkout-phone"
                      data-testid="checkout-phone"
                      inputMode="tel"
                      placeholder="9876543210"
                      value={shipping.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                    />
                  </Field>
                  <Field id="checkout-email" label="Email" error={fieldErrors.email}>
                    <Input
                      id="checkout-email"
                      data-testid="checkout-email"
                      type="email"
                      value={shipping.email}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </Field>
                  <Field id="checkout-address" label="Address" error={fieldErrors.addressLine}>
                    <Input
                      id="checkout-address"
                      data-testid="checkout-address"
                      value={shipping.addressLine}
                      onChange={(e) => updateField('addressLine', e.target.value)}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field id="checkout-city" label="City" error={fieldErrors.city}>
                      <Input
                        id="checkout-city"
                        data-testid="checkout-city"
                        value={shipping.city}
                        onChange={(e) => updateField('city', e.target.value)}
                      />
                    </Field>
                    <Field id="checkout-state" label="State" error={fieldErrors.state}>
                      <Input
                        id="checkout-state"
                        data-testid="checkout-state"
                        value={shipping.state}
                        onChange={(e) => updateField('state', e.target.value)}
                      />
                    </Field>
                  </div>
                  <Field id="checkout-pincode" label="PIN code" error={fieldErrors.pincode}>
                    <Input
                      id="checkout-pincode"
                      data-testid="checkout-pincode"
                      inputMode="numeric"
                      maxLength={6}
                      value={shipping.pincode}
                      onChange={(e) => updateField('pincode', e.target.value)}
                    />
                  </Field>
                </section>

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold">Payment</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={method === 'upi' ? 'default' : 'outline'}
                      className="flex flex-col h-auto py-3 gap-1"
                      data-testid="pay-upi"
                      onClick={() => setMethod('upi')}
                    >
                      <Smartphone className="h-4 w-4" />
                      <span className="text-xs">UPI</span>
                    </Button>
                    <Button
                      type="button"
                      variant={method === 'card' ? 'default' : 'outline'}
                      className="flex flex-col h-auto py-3 gap-1"
                      data-testid="pay-card"
                      onClick={() => setMethod('card')}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span className="text-xs">Card</span>
                    </Button>
                    <Button
                      type="button"
                      variant={method === 'cod' ? 'default' : 'outline'}
                      className="flex flex-col h-auto py-3 gap-1"
                      data-testid="pay-cod"
                      onClick={() => setMethod('cod')}
                    >
                      <Truck className="h-4 w-4" />
                      <span className="text-xs">COD</span>
                    </Button>
                  </div>

                  {method === 'upi' && (
                    <Field id="checkout-upi-id" label="UPI ID" error={fieldErrors.upiId}>
                      <Input
                        id="checkout-upi-id"
                        data-testid="checkout-upi-id"
                        placeholder="name@okaxis"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                      />
                    </Field>
                  )}

                  {method === 'card' && (
                    <div className="space-y-3">
                      <Field id="checkout-card-number" label="Card number" error={fieldErrors.cardNumber}>
                        <Input
                          id="checkout-card-number"
                          data-testid="checkout-card-number"
                          inputMode="numeric"
                          placeholder="4111 1111 1111 1111"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                        />
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field id="checkout-card-expiry" label="Expiry" error={fieldErrors.cardExpiry}>
                          <Input
                            id="checkout-card-expiry"
                            data-testid="checkout-card-expiry"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                          />
                        </Field>
                        <Field id="checkout-card-cvv" label="CVV" error={fieldErrors.cardCvv}>
                          <Input
                            id="checkout-card-cvv"
                            data-testid="checkout-card-cvv"
                            inputMode="numeric"
                            maxLength={3}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value)}
                          />
                        </Field>
                      </div>
                      <Field id="checkout-card-name" label="Name on card" error={fieldErrors.cardName}>
                        <Input
                          id="checkout-card-name"
                          data-testid="checkout-card-name"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                        />
                      </Field>
                    </div>
                  )}

                  {method === 'cod' && (
                    <p className="text-xs text-muted-foreground">
                      Pay in cash when the order arrives. Status stays pending until delivery.
                    </p>
                  )}
                </section>

                <section className="space-y-2">
                  <h3 className="text-sm font-semibold">Summary</h3>
                  {state.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="truncate mr-2">
                        {item.name} × {item.quantity}
                      </span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST (5%)</span>
                    <span>{formatPrice(totals.tax)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>
                      {totals.shippingFee === 0
                        ? 'Free'
                        : formatPrice(totals.shippingFee)}
                    </span>
                  </div>
                  {totals.shippingFee > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Free shipping over {formatPrice(FREE_SHIPPING_THRESHOLD)}
                    </p>
                  )}
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span data-testid="checkout-total">{formatPrice(totals.total)}</span>
                  </div>
                </section>
              </div>
            </ScrollArea>

            <div className="pt-4 space-y-2">
              {formError && (
                <p className="text-sm text-destructive" data-testid="checkout-error">
                  {formError}
                </p>
              )}
              <Button
                className="w-full"
                size="lg"
                data-testid="pay-now-button"
                disabled={submitting}
                onClick={handlePay}
              >
                {submitting
                  ? 'Processing…'
                  : method === 'cod'
                  ? `Place COD order · ${formatPrice(totals.total)}`
                  : `Pay ${formatPrice(totals.total)}`}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                Sandbox gateway. Use UPI <span className="font-mono">demo@okaxis</span> or card{' '}
                <span className="font-mono">4111111111111111</span>. Cards ending in 0000 are declined.
              </p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
