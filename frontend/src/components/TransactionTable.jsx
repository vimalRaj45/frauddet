import React from 'react';

export default function TransactionTable({ items, onSelectTxn, loading }) {
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <i className="bi bi-list-columns-reverse text-sm"></i>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Live Transaction Stream</h3>
            <p className="text-[11px] text-slate-500">Normal transactions in <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded">transactions</code></p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-500">
          {items?.length || 0} recent
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-4 flex-1 touch-scroll">
        {!items || items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
            <i className="bi bi-inbox text-4xl text-slate-300"></i>
            <span className="text-xs font-semibold text-slate-600">No normal transactions recorded yet</span>
            <span className="text-[11px] text-slate-400">Click "Clean Retail" or "Random Flow" to generate stream</span>
          </div>
        ) : (
          <table className="w-full text-left text-xs min-w-[550px]">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] bg-slate-50/60">
                <th className="py-2.5 px-3 font-bold rounded-l-lg">Txn / Time</th>
                <th className="py-2.5 px-3 font-bold">Account / User</th>
                <th className="py-2.5 px-3 font-bold">Merchant</th>
                <th className="py-2.5 px-3 font-bold">Amount</th>
                <th className="py-2.5 px-3 font-bold">Risk</th>
                <th className="py-2.5 px-3 font-bold text-right rounded-r-lg">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((txn) => (
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
                    <div className="text-[10px] text-slate-400">{txn.user_id}</div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="text-slate-800 font-semibold">{txn.merchant}</div>
                    <div className="text-[11px] text-slate-500">{txn.category} • {txn.location}</div>
                  </td>

                  <td className="py-3 px-3 font-bold text-slate-900">
                    ${Number(txn.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {txn.risk_score}/100
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectTxn) onSelectTxn(txn);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <i className="bi bi-chevron-right font-bold"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
