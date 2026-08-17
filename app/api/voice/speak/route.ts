import {
  GROQ_TTS_MODEL,
  GROQ_TTS_VOICE,
  groqApiKey,
  toSpokenText,
} from '@/lib/voice/speech';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = toSpokenText(typeof body?.text === 'string' ? body.text : '');

    if (!text) {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_TTS_MODEL,
        voice: GROQ_TTS_VOICE,
        input: text,
        response_format: 'wav',
      }),
    });

    if (!response.ok) {
      const payload = await response.text();
      console.error('Groq TTS error:', payload);
      return Response.json({ error: 'Could not generate speech' }, { status: 502 });
    }

    const audio = await response.arrayBuffer();
    return new Response(audio, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Speak error:', error);
    return Response.json({ error: 'Voice playback failed' }, { status: 500 });
  }
}
