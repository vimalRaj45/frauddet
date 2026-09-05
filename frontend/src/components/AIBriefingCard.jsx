import React, { useState } from 'react';
import { getAIMistralBriefing } from '../services/api';

export default function AIBriefingCard({ stats }) {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBriefing = async () => {
    setLoading(true);
    try {
      const data = await getAIMistralBriefing();
      setBriefing(data.briefing);
    } catch (err) {
      console.error("Failed to load AI briefing:", err);
      setBriefing("Unable to connect to the AI engine at this moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white border border-blue-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg shrink-0 shadow-md shadow-blue-500/20">
          <i className="bi bi-stars"></i>
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-bold text-slate-900">AI Threat Intelligence Copilot</h4>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
              Live AI Analysis
            </span>
          </div>
          <div className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
            {briefing ? (
              <div className="whitespace-pre-line text-slate-800 bg-white/90 p-3 rounded-xl border border-blue-100 shadow-2xs font-medium">
                {briefing}
              </div>
            ) : (
              <p>
                Generate an instant Chief Risk Officer executive threat briefing analyzing today's transaction volume, anomaly vectors, and fraud exposure using AI.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center self-end md:self-center">
        <button
          disabled={loading}
          onClick={fetchBriefing}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <i className="bi bi-arrow-repeat animate-spin"></i>
              <span>Generating AI Brief...</span>
            </>
          ) : (
            <>
              <i className="bi bi-lightning-charge-fill text-amber-300"></i>
              <span>{briefing ? 'Refresh AI Brief' : 'Generate CISO AI Briefing'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
