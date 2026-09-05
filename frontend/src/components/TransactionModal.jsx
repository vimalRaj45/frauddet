import React, { useState } from 'react';
import { analyzeWithMistralAI } from '../services/api';

export default function TransactionModal({ txn, onClose }) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  if (!txn) return null;

  const isFraud = txn.status === 'FRAUD';
  const isSuspicious = txn.status === 'SUSPICIOUS';

  const handleRunAI = async () => {
    setAiLoading(true);
    try {
      const result = await analyzeWithMistralAI(txn);
      setAiAnalysis(result);
    } catch (err) {
      console.error("AI Forensic Error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
              isFraud ? 'bg-rose-50 text-rose-600 border border-rose-200' : isSuspicious ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}>
              <i className={`bi ${isFraud ? 'bi-shield-x' : isSuspicious ? 'bi-exclamation-triangle' : 'bi-shield-check'}`}></i>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-base">Transaction Inspection</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center space-x-1">
                  <i className="bi bi-stars text-purple-600"></i>
                  <span>AI Forensic Copilot</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">{txn.transaction_id}</p>
            </div>
          </div>
          <button
            onClick={() => { setAiAnalysis(null); onClose(); }}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Risk Score Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isFraud
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : isSuspicious
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">Classification</span>
              <div className="text-lg font-black">{txn.status}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">Risk Score</span>
              <div className="text-2xl font-black">{txn.risk_score} / 100</div>
            </div>
          </div>

          {/* Triggered Reasons */}
          {txn.fraud_reasons && (
            <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200">
              <span className="font-bold text-rose-900 block mb-2">Rule Violations Triggered:</span>
              <div className="space-y-1.5">
                {txn.fraud_reasons.split(';').map((reason, i) => (
                  <div key={i} className="flex items-start space-x-2 text-rose-800">
                    <i className="bi bi-exclamation-circle-fill text-xs mt-0.5 text-rose-600 shrink-0"></i>
                    <span>{reason.trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Forensic Audit Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 via-indigo-50/50 to-blue-50 border border-purple-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs">
                  <i className="bi bi-robot"></i>
                </span>
                <span className="font-bold text-slate-900 text-xs">AI Forensic Intelligence</span>
              </div>

              {!aiAnalysis && (
                <button
                  disabled={aiLoading}
                  onClick={handleRunAI}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-[11px] flex items-center space-x-1.5 shadow-sm transition-all disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <i className="bi bi-arrow-repeat animate-spin"></i>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-stars"></i>
                      <span>Run AI Audit</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {aiLoading && (
              <div className="py-6 flex flex-col items-center justify-center space-y-2 text-purple-700">
                <div className="w-7 h-7 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[11px] font-medium">AI is evaluating attack vectors, anomalous behavior & AML compliance...</span>
              </div>
            )}

            {aiAnalysis && (
              <div className="space-y-3 mt-3 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                  <span className="text-slate-700 font-bold">Threat Level:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                    aiAnalysis.threat_level === 'CRITICAL' || aiAnalysis.threat_level === 'HIGH'
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : aiAnalysis.threat_level === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                    {aiAnalysis.threat_level}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">Executive Assessment:</span>
                  <p className="text-slate-800 text-[11px] leading-relaxed bg-white p-2.5 rounded-lg border border-purple-100 shadow-2xs font-medium">
                    {aiAnalysis.summary}
                  </p>
                </div>

                {aiAnalysis.modus_operandi && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 block mb-1">Identified Modus Operandi:</span>
                    <p className="text-purple-900 text-[11px] bg-purple-100/60 p-2.5 rounded-lg border border-purple-200 font-medium">
                      {aiAnalysis.modus_operandi}
                    </p>
                  </div>
                )}

                {aiAnalysis.recommended_action && (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start space-x-2 text-emerald-900">
                    <i className="bi bi-shield-check text-base text-emerald-600 shrink-0 mt-0.5"></i>
                    <div>
                      <span className="font-bold text-[11px] block">Recommended Action:</span>
                      <span className="text-[11px] font-medium">{aiAnalysis.recommended_action}</span>
                    </div>
                  </div>
                )}

                {aiAnalysis.compliance_note && (
                  <div className="text-[10px] text-slate-500 italic pt-1">
                    Regulatory Note: {aiAnalysis.compliance_note}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-1 font-medium">Amount</span>
              <span className="text-sm font-black text-slate-900">${Number(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {txn.currency}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-1 font-medium">Account ID</span>
              <span className="text-sm font-mono font-bold text-slate-800">{txn.account_id}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-1 font-medium">Merchant</span>
              <span className="font-bold text-slate-800">{txn.merchant}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-1 font-medium">Category</span>
              <span className="font-medium text-slate-700">{txn.category}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-1 font-medium">Location</span>
              <span className="font-bold text-slate-800">{txn.location}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-400 block mb-1 font-medium">Device / IP</span>
              <span className="font-mono text-slate-700">{txn.device_type} • {txn.ip_address}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={() => { setAiAnalysis(null); onClose(); }}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
