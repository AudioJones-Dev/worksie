import { useCallback, useMemo, useState } from 'react';
import { analyzeImageWithLens, isGoogleLensConfigured } from '../logic/googleLensClient.js';

const VisionInsightsPanel = ({ onAnalysisComplete }) => {
  const [selectedFileName, setSelectedFileName] = useState('');
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const lensAvailable = useMemo(() => isGoogleLensConfigured, []);

  const handleFileChange = useCallback(
    async (event) => {
      setError(null);
      const [file] = event.target.files || [];
      if (!file) {
        return;
      }

      setSelectedFileName(file.name);

      if (!lensAvailable) {
        setInsights({
          labels: [],
          objects: [],
          textBlocks: [],
          note: 'Configure Google Vision API to enable automatic analysis.',
        });
        return;
      }

      setIsLoading(true);
      try {
        const analysis = await analyzeImageWithLens(file);
        const result = {
          ...analysis,
          fileName: file.name,
          timestamp: new Date().toISOString(),
        };
        setInsights(result);
        onAnalysisComplete?.(result);
      } catch (err) {
        setError(err.message || 'Unable to analyze image.');
      } finally {
        setIsLoading(false);
      }
    },
    [lensAvailable, onAnalysisComplete],
  );

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-6 shadow-lg">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Google Lens Visual Intelligence</h3>
          <p className="text-sm text-slate-300">
            Upload a site image to surface equipment, hazards, and OCR details in seconds.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-3 rounded-full border border-slate-600 px-4 py-2 text-sm font-medium text-white transition hover:border-slate-400">
          <span className="text-emerald-300">Upload Photo</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      </div>

      {selectedFileName && (
        <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">Selected: {selectedFileName}</p>
      )}

      {isLoading && <p className="mt-4 text-sm text-amber-300">Analyzing with Google Lens…</p>}

      {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}

      {insights && (
        <div className="mt-4 space-y-4">
          {insights.note && <p className="text-sm text-slate-300">{insights.note}</p>}

          {insights.labels && insights.labels.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-emerald-300">Detected Labels</h4>
              <ul className="mt-2 space-y-1 text-sm text-slate-100">
                {insights.labels.map((label) => (
                  <li key={label.description} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2">
                    <span>{label.description}</span>
                    <span className="text-xs text-slate-400">{Math.round(label.score * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.objects && insights.objects.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-sky-300">Localized Objects</h4>
              <ul className="mt-2 space-y-1 text-sm text-slate-100">
                {insights.objects.map((object, index) => (
                  <li key={`${object.name}-${index}`} className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2">
                    <span>{object.name}</span>
                    <span className="text-xs text-slate-400">{Math.round(object.score * 100)}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.textBlocks && insights.textBlocks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-amber-300">Optical Character Recognition</h4>
              <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-700 bg-slate-800/60 p-3 text-sm text-slate-100">
                {insights.textBlocks.map((block) => block.description).join('\n\n')}
              </pre>
            </div>
          )}

          {insights.safeSearch && (
            <div>
              <h4 className="text-sm font-semibold text-rose-300">Safety Signals</h4>
              <ul className="mt-2 grid grid-cols-2 gap-3 text-xs text-slate-200 sm:grid-cols-3">
                {Object.entries(insights.safeSearch).map(([key, value]) => (
                  <li key={key} className="rounded-md border border-slate-700 bg-slate-800/60 px-3 py-2 capitalize">
                    <span className="text-slate-400">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <div className="font-semibold text-white">{value}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!lensAvailable && (
        <p className="mt-4 text-xs text-slate-400">
          Tip: add <code className="rounded bg-slate-800 px-1 py-0.5 text-emerald-300">VITE_GOOGLE_VISION_API_KEY</code> to your environment to enable Google Lens intelligence.
        </p>
      )}
    </div>
  );
};

export default VisionInsightsPanel;
