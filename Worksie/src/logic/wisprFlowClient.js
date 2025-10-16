const WISPR_ENDPOINT = import.meta.env.VITE_WISPR_FLOW_TRANSCRIBE_URL;
const WISPR_API_KEY = import.meta.env.VITE_WISPR_FLOW_API_KEY;

export const isWisprConfigured = Boolean(WISPR_ENDPOINT);

export async function transcribeAudioBlob(blob, { context, signal } = {}) {
  if (!WISPR_ENDPOINT) {
    throw new Error('Wispr Flow transcription endpoint is not configured. Set VITE_WISPR_FLOW_TRANSCRIBE_URL.');
  }

  const formData = new FormData();
  formData.append('file', blob, 'recording.webm');
  if (context) {
    formData.append('context', JSON.stringify(context));
  }

  const headers = {};
  if (WISPR_API_KEY) {
    headers.Authorization = `Bearer ${WISPR_API_KEY}`;
  }

  const response = await fetch(WISPR_ENDPOINT, {
    method: 'POST',
    headers,
    body: formData,
    signal,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message || `Wispr Flow request failed with status ${response.status}`;
    throw new Error(message);
  }

  return {
    transcript: payload.transcript || '',
    structuredNotes: payload.structuredNotes || payload.notes || null,
    suggestedActions: payload.actions || payload.suggestedActions || [],
    raw: payload,
  };
}
