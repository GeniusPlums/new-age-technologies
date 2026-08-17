import { describe, expect, it } from 'vitest';
import { POST } from './route';

describe('POST /api/voice/speak', () => {
  it('rejects empty text', async () => {
    const response = await POST(
      new Request('http://localhost/api/voice/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: '   ' }),
      })
    );

    expect(response.status).toBe(400);
  });
});
