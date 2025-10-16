const formatTimestamp = (timestamp) => {
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (error) {
    return 'N/A';
  }
};

const VoiceVisionTimeline = ({ voiceSegments = [], visionFindings = [] }) => {
  const timelineEntries = [
    ...voiceSegments.map((segment) => ({
      type: 'voice',
      timestamp: segment.timestamp,
      payload: segment,
    })),
    ...visionFindings.map((finding) => ({
      type: 'vision',
      timestamp: finding.timestamp,
      payload: finding,
    })),
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  if (timelineEntries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
        Start a recording or upload an image to populate the intelligence timeline.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {timelineEntries.map((entry, index) => {
        if (entry.type === 'voice') {
          return (
            <div key={`voice-${index}`} className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
              <div className="flex items-start justify-between text-xs text-slate-400">
                <span className="flex items-center gap-2 text-emerald-300">
                  <span aria-hidden="true">🎤</span>
                  Voice Memo
                </span>
                <span>{formatTimestamp(entry.timestamp)}</span>
              </div>
              <p className="mt-3 text-sm text-slate-100">{entry.payload.transcript || 'No transcript captured.'}</p>
              {entry.payload.structuredNotes && (
                <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-950/70 p-3 text-xs text-slate-200">
                  {typeof entry.payload.structuredNotes === 'string'
                    ? entry.payload.structuredNotes
                    : JSON.stringify(entry.payload.structuredNotes, null, 2)}
                </pre>
              )}
              {entry.payload.suggestedActions?.length > 0 && (
                <ul className="mt-3 space-y-2 text-xs text-slate-200">
                  {entry.payload.suggestedActions.map((action, actionIndex) => (
                    <li key={actionIndex} className="flex items-start gap-2 rounded-md border border-slate-800/80 bg-slate-900/60 px-3 py-2">
                      <span className="mt-1 text-sky-300" aria-hidden="true">
                        ⚡
                      </span>
                      <span>{typeof action === 'string' ? action : action.title || JSON.stringify(action)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        }

        return (
          <div key={`vision-${index}`} className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
            <div className="flex items-start justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2 text-sky-300">
                <span aria-hidden="true">📸</span>
                Lens Insight
              </span>
              <span>{formatTimestamp(entry.timestamp)}</span>
            </div>
            {entry.payload.fileName && (
              <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">{entry.payload.fileName}</p>
            )}
            {entry.payload.labels?.length > 0 && (
              <div className="mt-3">
                <h5 className="text-xs font-semibold text-emerald-300">Key Labels</h5>
                <div className="mt-2 flex flex-wrap gap-2">
                  {entry.payload.labels.slice(0, 6).map((label) => (
                    <span
                      key={label.description}
                      className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300"
                    >
                      {label.description}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {entry.payload.textBlocks?.length > 0 && (
              <div className="mt-3">
                <h5 className="text-xs font-semibold text-amber-300">Extracted Text</h5>
                <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-950/60 p-3 text-xs text-slate-100">
                  {entry.payload.textBlocks.map((block) => block.description).join('\n\n')}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default VoiceVisionTimeline;
