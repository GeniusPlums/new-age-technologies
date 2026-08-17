import { GROQ_WHISPER_MODEL, groqApiKey } from '@/lib/voice/speech';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: 'Audio file is required' }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return Response.json({ error: 'Audio file is too large' }, { status: 413 });
    }

    const groqForm = new FormData();
    groqForm.append('file', file, file.name || 'speech.webm');
    groqForm.append('model', GROQ_WHISPER_MODEL);
    groqForm.append('response_format', 'json');

    const response = await fetch(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqApiKey()}`,
        },
        body: groqForm,
      }
    );

    const payload = await response.json();
    if (!response.ok) {
      console.error('Groq transcribe error:', payload);
      return Response.json(
        { error: 'Could not transcribe audio' },
        { status: 502 }
      );
    }

    const text = typeof payload.text === 'string' ? payload.text.trim() : '';
    if (!text) {
      return Response.json({ error: 'No speech detected' }, { status: 422 });
    }

    return Response.json({ text });
  } catch (error) {
    console.error('Transcribe error:', error);
    return Response.json({ error: 'Voice transcription failed' }, { status: 500 });
  }
}
