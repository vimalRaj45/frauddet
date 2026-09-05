import React, { useState, useEffect } from 'react';
import { simulateTransaction, clearDatabase } from '../services/api';

export default function SimulatorControls({ onTransactionGenerated, onClearComplete }) {
  const [loading, setLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);
  const [isAutoStreaming, setIsAutoStreaming] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleSimulate = async (scenario) => {
    setLoading(true);
    setActiveScenario(scenario);
    try {
      const results = await simulateTransaction(scenario, scenario === 'VELOCITY_SPIKE' ? 4 : 1);
      setLastResult(results[0] || null);
      if (onTransactionGenerated) {
        onTransactionGenerated(results);
      }
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setLoading(false);
      setActiveScenario(null);
    }
  };

  const handleClear = async () => {
    if (window.confirm("Are you sure you want to clear all transactions from the database?")) {
      try {
        await clearDatabase();
        setLastResult(null);
        if (onClearComplete) onClearComplete();
      } catch (err) {
        console.error("Clear error:", err);
      }
    }
  };

  useEffect(() => {
    let interval = null;
    if (isAutoStreaming) {
      interval = setInterval(() => {
        handleSimulate('RANDOM');
      }, 1800);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoStreaming]);

  const scenarios = [
    {
      id: 'RANDOM',
      label: 'Random Flow',
      icon: 'bi-shuffle',
      border: 'border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50',
      textColor: 'text-blue-700',
      desc: 'Mixed realistic traffic'
    },
    {
      id: 'NORMAL',
      label: 'Clean Retail',
      icon: 'bi-bag-check',
      border: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/40 hover:bg-emerald-50',
      textColor: 'text-emerald-700',
      desc: 'Low-risk purchase ($50)'
    },
    {
      id: 'HIGH_AMOUNT',
      label: 'High Value ($10k+)',
      icon: 'bi-cash-stack',
      border: 'border-rose-200 hover:border-rose-400 bg-rose-50/40 hover:bg-rose-50',
      textColor: 'text-rose-700',
      desc: 'Triggers Amount Rule (+50)'
    },
    {
      id: 'VELOCITY_SPIKE',
      label: 'Velocity Burst',
      icon: 'bi-lightning-charge',
      border: 'border-amber-200 hover:border-amber-400 bg-amber-50/40 hover:bg-amber-50',
      textColor: 'text-amber-700',
      desc: '4 rapid hits in 60s (+45)'
    },
    {
      id: 'FOREIGN_LOCATION',
      label: 'High-Risk Geo',
      icon: 'bi-geo-alt',
      border: 'border-purple-200 hover:border-purple-400 bg-purple-50/40 hover:bg-purple-50',
      textColor: 'text-purple-700',
      desc: 'Offshore / Proxy (+35)'
    },
    {
      id: 'OFF_HOURS_SPIKE',
      label: 'Off-Hours Casino',
      icon: 'bi-moon-stars',
      border: 'border-orange-200 hover:border-orange-400 bg-orange-50/40 hover:bg-orange-50',
      textColor: 'text-orange-700',
      desc: '2 AM Casino Structuring (+25)'
    },
  ];

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <i className="bi bi-cpu text-sm"></i>
            </span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Live Transaction Generator & Attack Simulator</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate real-time transactions to trigger Kafka streaming, scoring engine, and database persistence.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <button
            onClick={() => setIsAutoStreaming(!isAutoStreaming)}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              isAutoStreaming
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            <i className={`bi ${isAutoStreaming ? 'bi-stop-circle-fill' : 'bi-play-circle-fill'}`}></i>
            <span>{isAutoStreaming ? 'Stop Stream' : 'Auto Stream'}</span>
          </button>

          <button
            onClick={handleClear}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 bg-slate-50 border border-slate-200 hover:border-rose-200 transition-colors"
            title="Wipe database records"
          >
            <i className="bi bi-trash3"></i>
            <span className="hidden xs:inline">Reset DB</span>
          </button>
        </div>
      </div>

      {/* Simulator Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 mt-4">
        {scenarios.map((sc) => (
          <button
            key={sc.id}
            disabled={loading || isAutoStreaming}
            onClick={() => handleSimulate(sc.id)}
            className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${sc.border} ${
              loading && activeScenario === sc.id ? 'ring-2 ring-blue-500 shadow-md' : 'shadow-2xs'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center space-x-2 w-full justify-between mb-1.5">
              <i className={`bi ${sc.icon} text-lg ${sc.textColor}`}></i>
              <span className="text-[10px] uppercase font-bold text-slate-400">Inject</span>
            </div>
            <span className="text-xs font-bold text-slate-900 truncate w-full">{sc.label}</span>
            <span className="text-[11px] text-slate-500 mt-1 line-clamp-1">{sc.desc}</span>
          </button>
        ))}
      </div>

      {/* Real-time feedback badge */}
      {lastResult && (
        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs flex-wrap gap-2 animate-fadeIn">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Latest Ingested:</span>
            <span className="font-mono text-slate-900 font-bold">{lastResult.transaction_id}</span>
            <span className="text-slate-500">• ${Number(lastResult.amount).toFixed(2)}</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium">Scoring Engine:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
              lastResult.status === 'FRAUD'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : lastResult.status === 'SUSPICIOUS'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {lastResult.status} (Score: {lastResult.risk_score}/100)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
