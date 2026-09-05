import React from 'react';

export default function RiskChart({ stats }) {
  const total = stats?.total_transactions || 1;
  const normal = stats?.normal_count || 0;
  const suspicious = stats?.suspicious_count || 0;
  const fraud = stats?.fraud_count || 0;

  const normalPct = Math.round((normal / total) * 100);
  const suspiciousPct = Math.round((suspicious / total) * 100);
  const fraudPct = Math.round((fraud / total) * 100);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <i className="bi bi-pie-chart text-sm"></i>
            </span>
            <h3 className="text-sm font-bold text-slate-900">Risk Classification Distribution</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">Total: {stats?.total_transactions || 0}</span>
        </div>

        {/* Multi-segment Progress Bar with fluid % */}
        <div className="mt-4">
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200 p-0.5">
            <div
              style={{ width: `${normalPct}%` }}
              className="bg-emerald-500 rounded-l-full transition-all duration-500 hover:opacity-90"
              title={`Normal: ${normal} (${normalPct}%)`}
            ></div>
            <div
              style={{ width: `${suspiciousPct}%` }}
              className="bg-amber-500 transition-all duration-500 hover:opacity-90"
              title={`Suspicious: ${suspicious} (${suspiciousPct}%)`}
            ></div>
            <div
              style={{ width: `${fraudPct}%` }}
              className="bg-rose-500 rounded-r-full transition-all duration-500 hover:opacity-90"
              title={`Fraud: ${fraud} (${fraudPct}%)`}
            ></div>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mt-4">
          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold text-emerald-800">Normal</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-black text-slate-900">{normal}</span>
              <span className="text-xs text-emerald-600 font-bold">{normalPct}%</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Score 0–39</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-xs font-bold text-amber-800">Suspicious</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-black text-slate-900">{suspicious}</span>
              <span className="text-xs text-amber-600 font-bold">{suspiciousPct}%</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Score 40–69</span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-xs font-bold text-rose-800">Fraud</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-black text-slate-900">{fraud}</span>
              <span className="text-xs text-rose-600 font-bold">{fraudPct}%</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Score 70–100</span>
          </div>
        </div>
      </div>

      {/* Rule weights banner */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center space-x-1.5">
          <i className="bi bi-shield-lock text-blue-600"></i>
          <span>Rule Weights: Amount (50) • Velocity (45) • Geo (35) • IP Proxy (25) • Off-Hours (15)</span>
        </span>
      </div>
    </div>
  );
}
