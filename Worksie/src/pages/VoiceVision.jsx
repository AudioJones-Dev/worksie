import { useState } from 'react';
import VoiceCaptureConsole from '../components/VoiceCaptureConsole.jsx';
import VisionInsightsPanel from '../components/VisionInsightsPanel.jsx';
import VoiceVisionTimeline from '../components/VoiceVisionTimeline.jsx';

const VoiceVision = () => {
  const [voiceSegments, setVoiceSegments] = useState([]);
  const [visionFindings, setVisionFindings] = useState([]);

  return (
    <div className="min-h-screen bg-slate-950 pb-16 text-white">
      <header className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 pb-12 pt-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Voice + Vision</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
            Wispr Flow transcription meets Google Lens field intelligence
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-300">
            Turn any walkthrough into structured job notes. Stream audio to Wispr Flow for transcription while Lens highlights
            hazards, equipment, and documentation details—all in one collaborative console.
          </p>
        </div>
      </header>

      <main className="mx-auto mt-[-4rem] flex max-w-6xl flex-col gap-8 px-6">
        <section className="grid gap-6 lg:grid-cols-2">
          <VoiceCaptureConsole
            onSegmentCommitted={(segment) => setVoiceSegments((prev) => [...prev, segment])}
          />
          <VisionInsightsPanel
            onAnalysisComplete={(finding) => setVisionFindings((prev) => [...prev, finding])}
          />
        </section>

        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Multimodal Activity Timeline</h2>
              <p className="text-sm text-slate-300">
                Worksie fuses transcripts, structured notes, and Lens annotations into a single chronological feed ready for
                automations.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <VoiceVisionTimeline voiceSegments={voiceSegments} visionFindings={visionFindings} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default VoiceVision;
