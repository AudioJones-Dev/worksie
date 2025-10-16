import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <section className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.4em] text-emerald-300">Worksie Platform</p>
            <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl">
              Field ops cockpit with Wispr Flow voice and Google Lens vision intelligence
            </h1>
            <p className="mt-6 text-lg text-slate-300">
              Capture walk-throughs, surface hazards, and trigger automations in real time. Worksie orchestrates
              multimodal insights so crews stay aligned without juggling extra apps.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/voice-vision"
                className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600"
              >
                Launch Voice + Vision Console
              </Link>
              <Link
                to="/dashboard"
                className="rounded-full border border-slate-600 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-400"
              >
                View Operator Dashboard
              </Link>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Live Transcript</p>
              <p className="mt-3 text-sm text-slate-100">
                “Unit 3 condenser installed. Need 200 ft of 12-gauge wire—assign to Marcus. Schedule inspection for Friday.”
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lens Highlights</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-100">
                <li className="flex items-center justify-between">
                  <span>Fall hazard sign detected</span>
                  <span className="text-xs text-emerald-300">93%</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Serial #: ACX-8834</span>
                  <span className="text-xs text-emerald-300">OCR</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Electrical panel door open</span>
                  <span className="text-xs text-emerald-300">87%</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-semibold">Wispr Flow-style automations baked into Worksie</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Hands-free reporting',
              body: 'Stream transcripts into PDF job reports, automatically attaching Lens highlights and timestamps.',
            },
            {
              title: 'Command-and-control',
              body: 'Use natural language to assign tasks, book inspections, or kick off purchase orders in seconds.',
            },
            {
              title: 'Safety-first intelligence',
              body: 'Combine OCR serial numbers and hazard detections with asset records for fully auditable site histories.',
            },
          ].map((card) => (
            <div key={card.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h3 className="text-lg font-semibold text-emerald-300">{card.title}</h3>
              <p className="mt-3 text-sm text-slate-300">{card.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
