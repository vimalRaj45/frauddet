import React, { useState, useEffect, useRef } from 'react';

export default function PipelineTerminalHUD({ activeTxn }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState([]);
  const [currentStage, setCurrentStage] = useState(0); // 0 to 6
  const [latency, setLatency] = useState(12);
  const [activeTxnSummary, setActiveTxnSummary] = useState(null);
  const consoleRef = useRef(null);

  // 6 Pipeline Stages
  const stages = [
    { num: 1, id: 'INGEST', name: 'Ingestion', sub: 'Payload', icon: 'bi-box-arrow-in-down' },
    { num: 2, id: 'GEO', name: 'IP & Geo', sub: 'Resolution', icon: 'bi-geo-alt' },
    { num: 3, id: 'KAFKA', name: 'Kafka Stream', sub: 'Broker', icon: 'bi-shuffle' },
    { num: 4, id: 'RULES', name: 'Rule Engine', sub: '4-Factor Risk', icon: 'bi-shield-check' },
    { num: 5, id: 'NEON', name: 'Neon DB', sub: 'PostgreSQL', icon: 'bi-database-check' },
    { num: 6, id: 'AI', name: 'AI Copilot', sub: 'Intelligence', icon: 'bi-stars' },
  ];

  // Animate through pipeline stages when a transaction is ingested
  useEffect(() => {
    if (!activeTxn) return;

    const startTimestamp = Date.now();
    const txnId = activeTxn.transaction_id || `TXN-${Math.floor(Math.random() * 100000)}`;
    const amount = Number(activeTxn.amount || 0).toFixed(2);
    const account = activeTxn.account_id || 'ACC-8821';
    const location = activeTxn.location || 'New York, USA';
    const status = activeTxn.status || 'NORMAL';
    const riskScore = activeTxn.risk_score ?? 0;
    const ip = activeTxn.ip_address || '185.220.101.5';
    const merchant = activeTxn.merchant || 'Retail Store';
    const targetTable = status === 'NORMAL' ? 'transactions' : 'suspicious_transactions';

    setActiveTxnSummary({ txnId, amount, account, status, riskScore });
    setCurrentStage(1);

    const stageEvents = [
      {
        stage: 1,
        delay: 30,
        tag: 'INGEST',
        text: `Captured transaction payload: ${txnId} | ${account} | $${amount} @ ${merchant}`,
        color: 'text-sky-300'
      },
      {
        stage: 2,
        delay: 90,
        tag: 'IP-GEO',
        text: `IP lookup (${ip}) -> Resolved: ${location} | Datacenter/Proxy: Verified`,
        color: 'text-cyan-300'
      },
      {
        stage: 3,
        delay: 160,
        tag: 'KAFKA',
        text: `Event streamed to topic 'fintech.transactions' via Aiven Broker :23485`,
        color: 'text-indigo-300'
      },
      {
        stage: 4,
        delay: 240,
        tag: 'SCORING',
        text: `4-Factor Engine scored: ${riskScore}/100 -> Status: [${status}]${activeTxn.fraud_reasons ? ' - Flags: ' + activeTxn.fraud_reasons : ''}`,
        color: status === 'FRAUD' ? 'text-rose-400 font-bold' : status === 'SUSPICIOUS' ? 'text-amber-300 font-semibold' : 'text-emerald-300'
      },
      {
        stage: 5,
        delay: 320,
        tag: 'NEON-DB',
        text: `Committed SQL record into Neon PostgreSQL table '${targetTable}'`,
        color: 'text-emerald-300'
      },
      {
        stage: 6,
        delay: 400,
        tag: 'AI-COPILOT',
        text: `Threat intelligence profile ready for forensic investigation & SAR export.`,
        color: 'text-purple-300'
      }
    ];

    const timeouts = [];
    stageEvents.forEach((ev) => {
      const t = setTimeout(() => {
        setCurrentStage(ev.stage);
        const logLine = {
          id: Math.random(),
          time: new Date().toLocaleTimeString(),
          tag: ev.tag,
          text: ev.text,
          color: ev.color
        };
        setLogs((prev) => [logLine, ...prev.slice(0, 30)]);
        setLatency(Date.now() - startTimestamp);
      }, ev.delay);
      timeouts.push(t);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [activeTxn]);

  return (
    <div className="w-full rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all">
      {/* 1. Top Header Bar */}
      <div className="px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 text-sm">
            <i className="bi bi-diagram-3-fill"></i>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight">
                Live Data Pipeline Stepper & Inspector
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
                Streaming
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Real-time progression through Ingestion, Geolocation, Kafka, Rule Scoring, and Neon PostgreSQL
            </p>
          </div>
        </div>

        {/* Live Metrics & Toggle Button */}
        <div className="flex items-center space-x-2.5">
          {activeTxnSummary && (
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono">
              <span className="text-slate-400 font-sans">Active:</span>
              <span className="font-bold text-slate-800">{activeTxnSummary.txnId}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-bold">${activeTxnSummary.amount}</span>
            </div>
          )}

          <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-600">
            Latency: <b className="text-blue-600 font-bold font-mono">{latency}ms</b>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              isExpanded
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <i className={`bi ${isExpanded ? 'bi-terminal-fill' : 'bi-terminal'}`}></i>
            <span>{isExpanded ? 'Hide Logs' : 'View Logs'}</span>
            <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'} text-[10px]`}></i>
          </button>
        </div>
      </div>

      {/* 2. Visual Pipeline Flow Stepper with Pixel-Perfect Alignment */}
      <div className="px-5 py-4 sm:px-8 sm:py-5 overflow-x-auto touch-scroll">
        <div className="min-w-[620px]">
          {/* Stepper Nodes & Connecting Line Wrapper */}
          <div className="relative flex items-center justify-between">
            {/* Background Base Line (Centered at top 18px matching circle center) */}
            <div className="absolute left-[30px] right-[30px] top-[18px] h-1 bg-slate-200 z-0"></div>

            {/* Active Filled Progress Line */}
            <div
              className="absolute left-[30px] top-[18px] h-1 bg-blue-600 transition-all duration-300 z-0"
              style={{
                width: `${Math.min(100, Math.max(0, ((currentStage - 1) / 5) * 100)) * 0.9 + (currentStage > 1 ? 2 : 0)}%`
              }}
            ></div>

            {/* Stepper Nodes */}
            {stages.map((st) => {
              const isActive = currentStage === st.num;
              const isCompleted = currentStage > st.num;

              return (
                <div key={st.num} className="relative z-10 flex flex-col items-center flex-1">
                  {/* Circle Icon Badge */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30 scale-110 ring-4 ring-blue-100'
                        : isCompleted
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                        : 'bg-white text-slate-400 border-slate-300'
                    }`}
                  >
                    {isCompleted ? (
                      <i className="bi bi-check-lg text-sm stroke-2"></i>
                    ) : (
                      <i className={`bi ${st.icon} ${isActive ? 'animate-pulse' : ''}`}></i>
                    )}
                  </div>

                  {/* Step Label & Sub-label */}
                  <div className="mt-2 text-center">
                    <span
                      className={`block text-[11px] font-bold ${
                        isActive
                          ? 'text-blue-600'
                          : isCompleted
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {st.name}
                    </span>
                    <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-tight">
                      Stage 0{st.num}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Sleek Terminal Log Console (Collapsible with matching margins) */}
      {isExpanded && (
        <div className="p-4 bg-slate-950 text-slate-200 border-t border-slate-100 rounded-b-2xl font-mono text-[11px] space-y-2 max-h-52 overflow-y-auto touch-scroll animate-fadeIn shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px] text-slate-400">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold text-slate-300 uppercase tracking-wider">Live Pipeline Execution Logs:</span>
            </span>
            <button
              onClick={() => setLogs([])}
              className="hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Clear
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="text-slate-500 italic py-2 text-center">
              Awaiting next transaction event... Trigger an attack or sync Mock Bank above.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-2 py-0.5 hover:bg-slate-900/80 px-2 rounded transition-colors">
                <span className="text-slate-500 text-[10px] shrink-0 font-sans">{log.time}</span>
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-blue-300 font-bold text-[10px] shrink-0">
                  [{log.tag}]
                </span>
                <span className={`flex-1 break-all ${log.color}`}>
                  {log.text}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
