import React, { useState } from 'react';

export default function SuspiciousTable({ items, onSelectTxn, loading }) {
  const [filter, setFilter] = useState('ALL');

  const filteredItems = items?.filter((item) => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  }) || [];

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
            <i className="bi bi-shield-slash-fill text-sm"></i>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Suspicious & Fraud Incidents</h3>
            <p className="text-[11px] text-slate-500">Stored in <code className="text-rose-700 font-mono bg-rose-50 px-1 py-0.5 rounded">suspicious_transactions</code></p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs self-start sm:self-center">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
              filter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({items?.length || 0})
          </button>
          <button
            onClick={() => setFilter('FRAUD')}
            className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
              filter === 'FRAUD' ? 'bg-rose-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            Fraud
          </button>
          <button
            onClick={() => setFilter('SUSPICIOUS')}
            className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
              filter === 'SUSPICIOUS' ? 'bg-amber-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            Suspicious
          </button>
        </div>
      </div>

      {/* Table Container with touch scrolling */}
      <div className="overflow-x-auto mt-4 flex-1 touch-scroll">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
            <i className="bi bi-shield-check text-4xl text-emerald-500"></i>
            <span className="text-xs font-semibold text-slate-600">No flagged fraud incidents detected</span>
            <span className="text-[11px] text-slate-400">Click a scenario button above or upload a CSV</span>
          </div>
        ) : (
          <table className="w-full text-left text-xs min-w-[550px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50/60">
                <th className="py-2.5 px-3 font-bold rounded-l-lg">Txn / Time</th>
                <th className="py-2.5 px-3 font-bold">Account & Merchant</th>
                <th className="py-2.5 px-3 font-bold">Amount</th>
                <th className="py-2.5 px-3 font-bold">Risk</th>
                <th className="py-2.5 px-3 font-bold">Status</th>
                <th className="py-2.5 px-3 font-bold text-right rounded-r-lg">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((txn) => {
                const isFraud = txn.status === 'FRAUD';
                return (
                  <tr
                    key={txn.id || txn.transaction_id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectTxn && onSelectTxn(txn)}
                  >
                    <td className="py-3 px-3 font-mono text-slate-800 font-bold">
                      <div>{txn.transaction_id}</div>
                      <div className="text-[10px] text-slate-400 font-sans font-normal">
                        {txn.timestamp ? new Date(txn.timestamp).toLocaleTimeString() : 'N/A'}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono text-slate-700 font-medium">{txn.account_id}</div>
                      <div className="text-[11px] text-slate-500">{txn.merchant} • {txn.location}</div>
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-900">
                      ${Number(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${isFraud ? 'bg-rose-500' : 'bg-amber-500'}`}
                            style={{ width: `${txn.risk_score}%` }}
                          ></div>
                        </div>
                        <span className={`font-mono font-bold ${isFraud ? 'text-rose-600' : 'text-amber-600'}`}>
                          {txn.risk_score}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isFraud
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {txn.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectTxn) onSelectTxn(txn);
                        }}
                        className="px-2 py-1 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors font-semibold text-[11px] inline-flex items-center space-x-1"
                      >
                        <i className="bi bi-stars text-xs"></i>
                        <span>Audit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
