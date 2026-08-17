import { describe, expect, it } from 'vitest';
import { POST } from './route';

const shipping = {
  fullName: 'Anish Kumar',
  phone: '9876543210',
  email: 'anish@example.com',
  addressLine: '12 MG Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560001',
};

describe('POST /api/checkout', () => {
  it('reprices items from the catalog and returns an order', async () => {
    const response = await POST(
      new Request('http://localhost/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              id: 'food-001',
              name: 'Hacked name',
              price: 1,
              quantity: 1,
            },
          ],
          shipping,
          payment: { method: 'upi', upiId: 'anish@okaxis' },
        }),
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.order.items[0].name).toBe('Plant-Based Protein Cookies');
    expect(body.order.items[0].price).toBe(299);
    expect(body.order.paymentStatus).toBe('paid');
  });

  it('rejects unknown product ids', async () => {
    const response = await POST(
      new Request('http://localhost/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: 'missing', name: 'Nope', price: 10, quantity: 1 }],
          shipping,
          payment: { method: 'cod' },
        }),
      })
    );

    expect(response.status).toBe(400);
  });
});
