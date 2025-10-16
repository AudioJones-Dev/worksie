import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isWisprConfigured, transcribeAudioBlob } from '../logic/wisprFlowClient.js';

const SUPPORTS_MEDIA_RECORDER = typeof window !== 'undefined' && 'MediaRecorder' in window;

const VoiceCaptureConsole = ({ onSegmentCommitted }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [segments, setSegments] = useState([]);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const wisprAvailable = useMemo(() => isWisprConfigured, []);

  const resetStreams = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.onresult = null;
      recognitionRef.current.onerror = null;
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const handleResult = useCallback((event) => {
    const transcriptPieces = [];
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      transcriptPieces.push(event.results[i][0].transcript);
    }
    setPartialTranscript(transcriptPieces.join(' '));
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);

    if (!SUPPORTS_MEDIA_RECORDER) {
      setError('This browser does not support MediaRecorder. Try Chrome or Edge.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(500);
      mediaRecorderRef.current = recorder;

      if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = handleResult;
        recognition.onerror = (event) => {
          if (event.error !== 'no-speech') {
            setError(`Speech recognition error: ${event.error}`);
          }
        };
        recognition.start();
        recognitionRef.current = recognition;
      }

      setIsRecording(true);
      setPartialTranscript('');
    } catch (err) {
      setError(err.message || 'Failed to access microphone.');
    }
  }, [handleResult]);

  const stopRecording = useCallback(async () => {
    setIsRecording(false);

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const audioBlob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
    recordedChunksRef.current = [];

    if (audioBlob.size === 0) {
      return;
    }

    setIsProcessing(true);

    try {
      let transcriptData = null;
      if (wisprAvailable) {
        transcriptData = await transcribeAudioBlob(audioBlob, {
          context: partialTranscript ? { draft: partialTranscript } : undefined,
        });
      }

      const committedSegment = {
        transcript: transcriptData?.transcript || partialTranscript,
        structuredNotes: transcriptData?.structuredNotes || null,
        suggestedActions: transcriptData?.suggestedActions || [],
        timestamp: new Date().toISOString(),
        source: transcriptData ? 'wispr-flow' : 'local',
      };

      setSegments((prev) => [...prev, committedSegment]);
      onSegmentCommitted?.(committedSegment);
      setPartialTranscript('');
    } catch (err) {
      setError(err.message || 'Failed to transcribe audio.');
    } finally {
      setIsProcessing(false);
    }
  }, [onSegmentCommitted, partialTranscript, wisprAvailable]);

  useEffect(() => () => {
    resetStreams();
  }, [resetStreams]);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Wispr Flow Voice Console</h3>
          <p className="text-sm text-slate-300">
            Capture field notes hands-free. {wisprAvailable ? 'Audio is sent to your Wispr Flow service for transcription.' : 'Configure the Wispr Flow endpoint to enable cloud transcription.'}
          </p>
        </div>
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            isRecording
              ? 'bg-rose-500 text-white hover:bg-rose-600'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
          disabled={isProcessing}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>

      {partialTranscript && (
        <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800/80 p-4">
          <h4 className="text-sm font-semibold text-slate-200">Live Transcript</h4>
          <p className="mt-2 text-slate-100">{partialTranscript}</p>
        </div>
      )}

      {segments.length > 0 && (
        <div className="mt-6 space-y-4">
          {segments.map((segment, index) => (
            <div key={`${segment.timestamp}-${index}`} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{new Date(segment.timestamp).toLocaleTimeString()}</span>
                <span>{segment.source === 'wispr-flow' ? 'Wispr Flow AI' : 'On-device draft'}</span>
              </div>
              <p className="mt-2 text-sm text-slate-100">{segment.transcript || 'No transcript returned.'}</p>
              {segment.structuredNotes && (
                <div className="mt-3 rounded-md bg-slate-900/80 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Structured Notes</p>
                  <pre className="mt-1 whitespace-pre-wrap text-xs text-slate-200">
                    {typeof segment.structuredNotes === 'string'
                      ? segment.structuredNotes
                      : JSON.stringify(segment.structuredNotes, null, 2)}
                  </pre>
                </div>
              )}
              {segment.suggestedActions.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">Suggested Automations</p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-200">
                    {segment.suggestedActions.map((action, actionIndex) => (
                      <li key={actionIndex} className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-sky-400" aria-hidden="true" />
                        <span>{typeof action === 'string' ? action : action.title || JSON.stringify(action)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
        {isProcessing && <span className="animate-pulse text-amber-300">Processing recording…</span>}
        {error && <span className="text-rose-400">{error}</span>}
        {!SUPPORTS_MEDIA_RECORDER && (
          <span className="text-rose-400">MediaRecorder API not available in this browser.</span>
        )}
      </div>
    </div>
  );
};

export default VoiceCaptureConsole;
