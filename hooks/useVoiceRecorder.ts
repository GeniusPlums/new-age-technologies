'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

function pickRecorderMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
  ];
  if (typeof MediaRecorder === 'undefined') return '';
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop();
      stopTracks();
    };
  }, [stopTracks]);

  const start = useCallback(async () => {
    setError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Voice is not supported in this browser.');
      return;
    }

    const mimeType = pickRecorderMimeType();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];

    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    recorder.start();
    setIsRecording(true);
  }, []);

  const stop = useCallback(async (): Promise<string | null> => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      setIsRecording(false);
      stopTracks();
      return null;
    }

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' }));
      };
      recorder.stop();
    });

    setIsRecording(false);
    stopTracks();

    if (blob.size < 800) {
      setError('I did not catch that. Try again?');
      return null;
    }

    setIsTranscribing(true);
    try {
      const form = new FormData();
      form.append('file', blob, 'speech.webm');
      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: form,
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || 'Could not hear that clearly.');
        return null;
      }
      return payload.text as string;
    } catch {
      setError('Voice transcription failed.');
      return null;
    } finally {
      setIsTranscribing(false);
    }
  }, [stopTracks]);

  return { isRecording, isTranscribing, error, start, stop, setError };
}
