import type {
  CheckoutItem,
  Order,
  OrderTotals,
  PaymentDetails,
  PaymentMethod,
  ShippingAddress,
} from '@/lib/types';

export const TAX_RATE = 0.05;
export const FREE_SHIPPING_THRESHOLD = 499;
export const SHIPPING_FEE = 49;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PINCODE_RE = /^[1-9][0-9]{5}$/;
const UPI_RE = /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/;
const CARD_RE = /^\d{16}$/;
const EXPIRY_RE = /^(0[1-9]|1[0-2])\/\d{2}$/;
const CVV_RE = /^\d{3}$/;

export interface CheckoutRequest {
  items: CheckoutItem[];
  shipping: ShippingAddress;
  payment: PaymentDetails;
}

export interface CheckoutFailure {
  ok: false;
  error: string;
  fieldErrors: Record<string, string>;
}

export interface CheckoutSuccess {
  ok: true;
  order: Order;
}

export type CheckoutResult = CheckoutSuccess | CheckoutFailure;

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91${digits.slice(2)}`;
  }
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  return phone.trim();
}

export function isValidIndianMobile(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^\+91[6-9]\d{9}$/.test(normalized);
}

export function calculateOrderTotals(items: CheckoutItem[]): OrderTotals {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
  return {
    subtotal,
    tax,
    shippingFee,
    total: subtotal + tax + shippingFee,
  };
}

export function validateShipping(shipping: ShippingAddress): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (!shipping.fullName || shipping.fullName.trim().length < 2) {
    fieldErrors.fullName = 'Enter your full name';
  }
  if (!isValidIndianMobile(shipping.phone)) {
    fieldErrors.phone = 'Enter a valid 10-digit Indian mobile number';
  }
  if (!shipping.email || !EMAIL_RE.test(shipping.email.trim())) {
    fieldErrors.email = 'Enter a valid email address';
  }
  if (!shipping.addressLine || shipping.addressLine.trim().length < 6) {
    fieldErrors.addressLine = 'Enter a delivery address';
  }
  if (!shipping.city || shipping.city.trim().length < 2) {
    fieldErrors.city = 'Enter your city';
  }
  if (!shipping.state || shipping.state.trim().length < 2) {
    fieldErrors.state = 'Enter your state';
  }
  if (!PINCODE_RE.test(shipping.pincode?.trim() || '')) {
    fieldErrors.pincode = 'Enter a valid 6-digit PIN code';
  }

  return fieldErrors;
}

export function validatePayment(payment: PaymentDetails): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (!payment.method || !['upi', 'card', 'cod'].includes(payment.method)) {
    fieldErrors.method = 'Choose a payment method';
    return fieldErrors;
  }

  if (payment.method === 'upi') {
    if (!payment.upiId || !UPI_RE.test(payment.upiId.trim())) {
      fieldErrors.upiId = 'Enter a valid UPI ID (for example name@okaxis)';
    }
  }

  if (payment.method === 'card') {
    const number = (payment.cardNumber || '').replace(/\s/g, '');
    if (!CARD_RE.test(number)) {
      fieldErrors.cardNumber = 'Enter a 16-digit card number';
    }
    if (!EXPIRY_RE.test(payment.cardExpiry || '')) {
      fieldErrors.cardExpiry = 'Enter expiry as MM/YY';
    }
    if (!CVV_RE.test(payment.cardCvv || '')) {
      fieldErrors.cardCvv = 'Enter a 3-digit CVV';
    }
    if (!payment.cardName || payment.cardName.trim().length < 2) {
      fieldErrors.cardName = 'Enter the name on the card';
    }
  }

  return fieldErrors;
}

function generateOrderId(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LUM-${stamp}${rand}`;
}

function simulateGateway(payment: PaymentDetails): { status: Order['paymentStatus']; error?: string } {
  if (payment.method === 'cod') {
    return { status: 'pending' };
  }

  if (payment.method === 'card') {
    const number = (payment.cardNumber || '').replace(/\s/g, '');
    if (number.endsWith('0000')) {
      return { status: 'failed', error: 'Card was declined. Try another card or UPI.' };
    }
  }

  return { status: 'paid' };
}

export function processCheckout(request: CheckoutRequest): CheckoutResult {
  if (!request.items || request.items.length === 0) {
    return { ok: false, error: 'Your cart is empty', fieldErrors: {} };
  }

  if (request.items.some((item) => item.quantity < 1 || item.price < 0)) {
    return { ok: false, error: 'Cart contains invalid items', fieldErrors: {} };
  }

  const fieldErrors = {
    ...validateShipping(request.shipping),
    ...validatePayment(request.payment),
  };

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: 'Please fix the highlighted fields', fieldErrors };
  }

  const gateway = simulateGateway(request.payment);
  if (gateway.status === 'failed') {
    return { ok: false, error: gateway.error || 'Payment failed', fieldErrors: { cardNumber: gateway.error || 'Payment failed' } };
  }

  const shipping: ShippingAddress = {
    fullName: request.shipping.fullName.trim(),
    phone: normalizePhone(request.shipping.phone),
    email: request.shipping.email.trim().toLowerCase(),
    addressLine: request.shipping.addressLine.trim(),
    city: request.shipping.city.trim(),
    state: request.shipping.state.trim(),
    pincode: request.shipping.pincode.trim(),
  };

  const order: Order = {
    id: generateOrderId(),
    createdAt: new Date().toISOString(),
    items: request.items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imageUrl,
      brand: item.brand,
    })),
    shipping,
    paymentMethod: request.payment.method as PaymentMethod,
    paymentStatus: gateway.status,
    totals: calculateOrderTotals(request.items),
  };

  return { ok: true, order };
}
