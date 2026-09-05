import React, { useState, useRef, useEffect } from 'react';

export default function LiveTransactionEventLog({ feedItems, onSelectTxn }) {
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const logContainerRef = useRef(null);

  // Filter logs
  const filteredItems = feedItems?.filter((item) => {
    // Status filter
    if (filter === 'NORMAL' && item.status !== 'NORMAL') return false;
    if (filter === 'SUSPICIOUS' && item.status !== 'SUSPICIOUS') return false;
    if (filter === 'FRAUD' && item.status !== 'FRAUD') return false;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchId = item.transaction_id?.toLowerCase().includes(term);
      const matchAcc = item.account_id?.toLowerCase().includes(term);
      const matchMerchant = item.merchant?.toLowerCase().includes(term);
      const matchLoc = item.location?.toLowerCase().includes(term);
      const matchStatus = item.status?.toLowerCase().includes(term);
      return matchId || matchAcc || matchMerchant || matchLoc || matchStatus;
    }
    return true;
  }) || [];

  // Auto-scroll to top or bottom if enabled
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [feedItems, autoScroll]);

  const handleCopyJson = (item, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(item, null, 2));
    setCopiedId(item.transaction_id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredItems, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `transaction_logs_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <i className="bi bi-terminal text-sm"></i>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900">Live Transaction Event Stream Logs</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-[11px] text-slate-500">Real-time Kafka ingestion, scoring pipeline, and database persistence logs</p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center space-x-2 self-start sm:self-center">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              autoScroll ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
            }`}
            title="Auto-scroll to latest incoming events"
          >
            <i className={`bi ${autoScroll ? 'bi-lock-fill text-blue-600' : 'bi-unlock'}`}></i>
            <span>Live Follow</span>
          </button>

          <button
            onClick={handleExportLogs}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition-colors"
            title="Export filtered logs as JSON"
          >
            <i className="bi bi-download"></i>
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-3 border-b border-slate-100 text-xs">
        {/* Filter Pills */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              filter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Events ({feedItems?.length || 0})
          </button>
          <button
            onClick={() => setFilter('FRAUD')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              filter === 'FRAUD' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-rose-700'
            }`}
          >
            Fraud
          </button>
          <button
            onClick={() => setFilter('SUSPICIOUS')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              filter === 'SUSPICIOUS' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-amber-700'
            }`}
          >
            Suspicious
          </button>
          <button
            onClick={() => setFilter('NORMAL')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              filter === 'NORMAL' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Normal
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <i className="bi bi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Txn ID, Account, City..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>
      </div>

      {/* Logs Stream Container */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1 touch-scroll font-mono text-[11px]"
      >
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-12">
            <i className="bi bi-journal-text text-3xl text-slate-300"></i>
            <span className="text-xs font-medium text-slate-500">No transaction event logs recorded yet</span>
            <span className="text-[11px] text-slate-400">Inject transactions above to see real-time pipeline execution logs</span>
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const isFraud = item.status === 'FRAUD';
            const isSuspicious = item.status === 'SUSPICIOUS';
            const isExpanded = expandedId === (item.id || item.transaction_id);

            return (
              <div
                key={item.id || item.transaction_id || index}
                onClick={() => setExpandedId(isExpanded ? null : (item.id || item.transaction_id))}
                className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${
                  isFraud
                    ? 'bg-rose-50/40 border-rose-200/80 hover:bg-rose-50/80'
                    : isSuspicious
                    ? 'bg-amber-50/40 border-amber-200/80 hover:bg-amber-50/80'
                    : 'bg-slate-50/50 border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                {/* Event Row Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center space-x-2 flex-wrap">
                    {/* Timestamp */}
                    <span className="text-slate-400 text-[10px]">
                      {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'N/A'}
                    </span>

                    {/* Stage Tag */}
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      INGEST & SCORED
                    </span>

                    {/* Txn ID */}
                    <span className="font-bold text-slate-900">{item.transaction_id}</span>

                    {/* Account & Amount */}
                    <span className="text-slate-600 font-sans font-medium">
                      [{item.account_id}] • <b className="text-slate-900">${Number(item.amount).toFixed(2)}</b>
                    </span>
                  </div>

                  {/* Classification Badge & Controls */}
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isFraud
                        ? 'bg-rose-100 text-rose-800 border-rose-200'
                        : isSuspicious
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      {item.status} ({item.risk_score}/100)
                    </span>

                    <button
                      onClick={(e) => handleCopyJson(item, e)}
                      className="p-1 rounded hover:bg-slate-200 text-slate-500 transition-colors"
                      title="Copy raw JSON payload"
                    >
                      <i className={`bi ${copiedId === item.transaction_id ? 'bi-check-lg text-emerald-600' : 'bi-copy'}`}></i>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectTxn) onSelectTxn(item);
                      }}
                      className="px-2 py-0.5 rounded bg-blue-600 text-white font-sans text-[10px] font-bold hover:bg-blue-500 transition-colors"
                    >
                      Audit
                    </button>
                  </div>
                </div>

                {/* Sub-line: Location, Merchant, Reason */}
                <div className="mt-1 text-[10px] text-slate-500 font-sans flex items-center justify-between flex-wrap gap-1">
                  <span>
                    <i className="bi bi-geo-alt text-slate-400 mr-1"></i>
                    {item.location} • <b className="text-slate-700">{item.merchant}</b> ({item.category})
                  </span>

                  {item.fraud_reasons && (
                    <span className="text-rose-700 font-medium truncate max-w-md" title={item.fraud_reasons}>
                      Flags: {item.fraud_reasons.split(';')[0]}
                    </span>
                  )}
                </div>

                {/* Expanded Raw JSON View */}
                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 animate-fadeIn">
                    <div className="flex items-center justify-between mb-1 text-[10px] text-slate-500 font-sans">
                      <span className="font-bold text-slate-700">Database & Pipeline Payload:</span>
                      <span className="text-[10px] text-slate-400">Target Table: <b className="text-slate-700">{item.status === 'NORMAL' ? 'transactions' : 'suspicious_transactions'}</b></span>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-100 text-[10px] overflow-x-auto leading-tight shadow-inner">
                      {JSON.stringify(item, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
