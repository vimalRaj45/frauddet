import React, { useState } from 'react';
import { uploadCsvFile, downloadCsvTemplateUrl } from '../services/api';

export default function CsvUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith('.csv')) {
        setError('Please select a valid .csv file.');
        return;
      }
      setFile(selected);
      setError(null);
      setResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (!dropped.name.endsWith('.csv')) {
        setError('Please drop a valid .csv file.');
        return;
      }
      setFile(dropped);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file to upload.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await uploadCsvFile(file);
      setResult(data);
      if (onUploadSuccess) onUploadSuccess(data);
    } catch (err) {
      console.error('CSV upload error:', err);
      setError(err.response?.data?.detail || 'Failed to process CSV file.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setExpandedRow(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-lg shadow-xs">
              <i className="bi bi-filetype-csv"></i>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-slate-900 text-base">Batch CSV Ingestion & Forensic Pipeline</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  100% Transparent
                </span>
              </div>
              <p className="text-xs text-slate-500">Live stream, score, and persist offline CSV datasets into Neon PostgreSQL</p>
            </div>
          </div>
          <button
            onClick={() => { handleReset(); onClose(); }}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Template Download Banner */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2.5">
              <i className="bi bi-info-circle-fill text-blue-600 text-base shrink-0"></i>
              <div>
                <span className="font-bold text-slate-900">Need formatted sample data?</span>
                <p className="text-[11px] text-slate-600">Download our sample dataset containing retail and simulated fraud transactions.</p>
              </div>
            </div>
            <a
              href={downloadCsvTemplateUrl}
              download="fintech_transactions_sample.csv"
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs flex items-center space-x-1.5 border border-blue-300 transition-colors shrink-0 shadow-2xs self-start sm:self-center"
            >
              <i className="bi bi-download"></i>
              <span>Download CSV Template</span>
            </a>
          </div>

          {/* Upload Zone & Loading Progress */}
          {!result ? (
            <div className="space-y-3">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
                }`}
              >
                <input
                  type="file"
                  id="csvInput"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="csvInput" className="cursor-pointer flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl mb-3 shadow-2xs">
                    <i className="bi bi-cloud-arrow-up"></i>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {file ? file.name : "Click to select or drag and drop a CSV file"}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1">
                    {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports columns: transaction_id, amount, user_id, merchant, location, ip_address"}
                  </span>
                </label>

                {file && (
                  <div className="mt-4 flex items-center justify-center space-x-3">
                    <button
                      disabled={loading}
                      onClick={handleUpload}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center space-x-2 disabled:opacity-50 transition-all"
                    >
                      {loading ? (
                        <>
                          <i className="bi bi-arrow-repeat animate-spin"></i>
                          <span>Executing Pipeline & Scoring...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check2-circle"></i>
                          <span>Ingest & Score CSV</span>
                        </>
                      )}
                    </button>

                    <button
                      disabled={loading}
                      onClick={handleReset}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Live Ingestion Pipeline Stages Stepper */}
              {loading && (
                <div className="p-4 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-2 animate-fadeIn border border-slate-800 shadow-inner">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-blue-400">
                    <span className="font-bold flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Processing Batch Pipeline in Real-Time:</span>
                    </span>
                    <span className="text-slate-400 text-[10px]">Neon PostgreSQL SSL</span>
                  </div>
                  <div className="space-y-1 text-slate-300 text-[10px]">
                    <div className="text-sky-300">✓ [STAGE 1] Header Schema Normalization & CSV Row Parsing</div>
                    <div className="text-cyan-300">✓ [STAGE 2] IP Geolocation Lookup & Proxy/VPN Verification</div>
                    <div className="text-indigo-300">✓ [STAGE 3] Aiven Kafka REST Broker Streaming</div>
                    <div className="text-amber-300">✓ [STAGE 4] 4-Factor Fraud Rules & Scoring Engine</div>
                    <div className="text-emerald-300">✓ [STAGE 5] Neon DB UPSERT & Table Partitioning</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 100% Transparent Results Breakdown */
            <div className="space-y-4 animate-fadeIn">
              {/* Batch Success Summary Banner */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-xs">
                    <i className="bi bi-check2-all"></i>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">Batch Ingestion Completed Successfully!</h4>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      Processed <b className="text-slate-900">{result.total_processed}</b> records from <span className="font-mono">{result.filename}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs"
                >
                  Upload Another File
                </button>
              </div>

              {/* Breakdown Metric Widgets */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-slate-600 block mb-1 font-bold">Normal (Clean)</span>
                  <span className="text-xl font-black text-emerald-700">{result.normal_count}</span>
                  <span className="text-[10px] text-slate-500 block font-mono">Table: `transactions`</span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <span className="text-slate-600 block mb-1 font-bold">Suspicious (Review)</span>
                  <span className="text-xl font-black text-amber-700">{result.suspicious_count}</span>
                  <span className="text-[10px] text-slate-500 block font-mono">Table: `suspicious_txns`</span>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
                  <span className="text-slate-600 block mb-1 font-bold">Fraud (Blocked)</span>
                  <span className="text-xl font-black text-rose-700">{result.fraud_count}</span>
                  <span className="text-[10px] text-slate-500 block font-mono">Table: `suspicious_txns`</span>
                </div>
              </div>

              {/* Row-by-Row Transparent Audit Table */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
                  <span className="font-extrabold text-slate-800">
                    Row-by-Row Pipeline Audit & Rule Breakdown:
                  </span>
                  <span className="text-[10px] text-slate-500">Click any row to view full payload & rules</span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {result.results?.map((row, idx) => {
                    const isFraud = row.status === 'FRAUD';
                    const isSuspicious = row.status === 'SUSPICIOUS';
                    const isExpanded = expandedRow === (row.transaction_id || idx);

                    return (
                      <div
                        key={row.transaction_id || idx}
                        onClick={() => setExpandedRow(isExpanded ? null : (row.transaction_id || idx))}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isFraud
                            ? 'bg-rose-50/60 border-rose-200 hover:bg-rose-50'
                            : isSuspicious
                            ? 'bg-amber-50/60 border-amber-200 hover:bg-amber-50'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-slate-900">{row.transaction_id}</span>
                            <span className="text-slate-600 font-bold">• ${Number(row.amount).toFixed(2)}</span>
                            <span className="text-slate-500 font-sans hidden sm:inline">• {row.location}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isFraud
                                ? 'bg-rose-100 text-rose-800 border-rose-200'
                                : isSuspicious
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            }`}>
                              {row.status} (Score: {row.risk_score}/100)
                            </span>
                            <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'} text-slate-400 text-xs`}></i>
                          </div>
                        </div>

                        {/* Expanded Rule Explanations & SQL Target */}
                        {isExpanded && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/80 space-y-1.5 animate-fadeIn font-sans">
                            <div className="text-[11px] text-slate-700">
                              <span className="font-bold">Neon Database Target: </span>
                              <code className="font-mono text-blue-700 bg-blue-50 px-1 py-0.5 rounded">
                                {row.status === 'NORMAL' ? 'public.transactions' : 'public.suspicious_transactions'}
                              </code>
                            </div>

                            {row.fraud_reasons && row.fraud_reasons.length > 0 && (
                              <div className="text-[11px] text-rose-800">
                                <span className="font-bold block mb-1">Triggered Fraud Rules:</span>
                                <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                                  {row.fraud_reasons.map((r, i) => (
                                    <li key={i}>{r}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="pt-1 text-[10px] text-slate-500 font-mono">
                              Timestamp: {row.timestamp} | Account: {row.account_id}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <i className="bi bi-exclamation-circle-fill text-rose-600 text-base"></i>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={() => { handleReset(); onClose(); }}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
