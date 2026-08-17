import { describe, expect, it } from 'vitest';
import {
  calculateOrderTotals,
  FREE_SHIPPING_THRESHOLD,
  isValidIndianMobile,
  normalizePhone,
  processCheckout,
  SHIPPING_FEE,
  TAX_RATE,
  type CheckoutRequest,
} from './checkout';

const item = {
  id: 'food-001',
  name: 'Plant-Based Protein Cookies',
  price: 299,
  quantity: 1,
};

const shipping = {
  fullName: 'Anish Kumar',
  phone: '9876543210',
  email: 'anish@example.com',
  addressLine: '12 MG Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560001',
};

function request(overrides: Partial<CheckoutRequest> = {}): CheckoutRequest {
  return {
    items: [item],
    shipping,
    payment: { method: 'upi', upiId: 'anish@okaxis' },
    ...overrides,
  };
}

describe('normalizePhone', () => {
  it('adds +91 to 10-digit numbers', () => {
    expect(normalizePhone('9876543210')).toBe('+919876543210');
  });

  it('accepts already prefixed numbers', () => {
    expect(normalizePhone('+91 98765 43210')).toBe('+919876543210');
  });
});

describe('isValidIndianMobile', () => {
  it('accepts numbers starting 6-9', () => {
    expect(isValidIndianMobile('9876543210')).toBe(true);
    expect(isValidIndianMobile('6123456789')).toBe(true);
  });

  it('rejects landline-like starts', () => {
    expect(isValidIndianMobile('5123456789')).toBe(false);
  });
});

describe('calculateOrderTotals', () => {
  it('charges shipping under the free threshold', () => {
    const totals = calculateOrderTotals([item]);
    expect(totals.subtotal).toBe(299);
    expect(totals.tax).toBe(Math.round(299 * TAX_RATE));
    expect(totals.shippingFee).toBe(SHIPPING_FEE);
    expect(totals.total).toBe(299 + totals.tax + SHIPPING_FEE);
    expect(299).toBeLessThan(FREE_SHIPPING_THRESHOLD);
  });

  it('waives shipping at or above the threshold', () => {
    const totals = calculateOrderTotals([{ ...item, quantity: 2 }]);
    expect(totals.subtotal).toBe(598);
    expect(totals.shippingFee).toBe(0);
    expect(totals.total).toBe(598 + totals.tax);
  });
});

describe('processCheckout', () => {
  it('places a paid UPI order', () => {
    const result = processCheckout(request());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.id).toMatch(/^LUM-/);
    expect(result.order.paymentStatus).toBe('paid');
    expect(result.order.paymentMethod).toBe('upi');
    expect(result.order.shipping.phone).toBe('+919876543210');
  });

  it('keeps COD orders pending', () => {
    const result = processCheckout(request({ payment: { method: 'cod' } }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.order.paymentStatus).toBe('pending');
  });

  it('declines cards ending in 0000', () => {
    const result = processCheckout(
      request({
        payment: {
          method: 'card',
          cardNumber: '4111111111110000',
          cardExpiry: '12/28',
          cardCvv: '123',
          cardName: 'Anish Kumar',
        },
      })
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/declined/i);
  });

  it('accepts a valid test card', () => {
    const result = processCheckout(
      request({
        payment: {
          method: 'card',
          cardNumber: '4111 1111 1111 1111',
          cardExpiry: '12/28',
          cardCvv: '123',
          cardName: 'Anish Kumar',
        },
      })
    );
    expect(result.ok).toBe(true);
  });

  it('rejects an empty cart', () => {
    const result = processCheckout(request({ items: [] }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/empty/i);
  });

  it('rejects invalid PIN and UPI together', () => {
    const result = processCheckout(
      request({
        shipping: { ...shipping, pincode: '000001' },
        payment: { method: 'upi', upiId: 'not-an-upi' },
      })
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.pincode).toBeTruthy();
    expect(result.fieldErrors.upiId).toBeTruthy();
  });
});
