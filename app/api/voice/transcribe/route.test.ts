import { describe, expect, it } from 'vitest';
import { POST } from './route';

describe('POST /api/voice/transcribe', () => {
  it('rejects requests without audio', async () => {
    const form = new FormData();
    const response = await POST(
      new Request('http://localhost/api/voice/transcribe', {
        method: 'POST',
        body: form,
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Audio file is required',
    });
  });
});
