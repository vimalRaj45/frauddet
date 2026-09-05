import React, { useState } from 'react';
import { connectExternalApi, triggerMockWebhook, getMockBankFeed } from '../services/api';

export default function ExternalApiConnector({ isOpen, onClose, onIngestSuccess }) {
  const [apiUrl, setApiUrl] = useState('http://localhost:8000/mock-bank/feed');
  const [loading, setLoading] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [bankSyncLoading, setBankSyncLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const webhookEndpoint = `${window.location.protocol}//${window.location.hostname}:8000/api/webhook/transaction`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookEndpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFetchExternalApi = async () => {
    if (!apiUrl) {
      setError('Please enter a valid API URL.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await connectExternalApi(apiUrl);
      setResult(data);
      if (onIngestSuccess) onIngestSuccess(data);
    } catch (err) {
      console.error('External API error:', err);
      setError(err.response?.data?.detail || 'Failed to fetch from external API.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerMockWebhook = async () => {
    setWebhookLoading(true);
    setError(null);
    try {
      const res = await triggerMockWebhook();
      setResult({
        status: 'SUCCESS',
        source_url: 'Payment Gateway Webhook (/mock-bank/webhook/trigger)',
        total_processed: 1,
        normal_count: res.evaluation.status === 'NORMAL' ? 1 : 0,
        suspicious_count: res.evaluation.status === 'SUSPICIOUS' ? 1 : 0,
        fraud_count: res.evaluation.status === 'FRAUD' ? 1 : 0,
        results: [res.evaluation]
      });
      if (onIngestSuccess) onIngestSuccess();
    } catch (err) {
      console.error('Webhook error:', err);
      setError('Failed to trigger mock webhook.');
    } finally {
      setWebhookLoading(false);
    }
  };

  const handleSyncMockBank = async () => {
    setBankSyncLoading(true);
    setError(null);
    try {
      const bankData = await getMockBankFeed(6, 0.4);
      const ingestRes = await connectExternalApi('http://localhost:8000/mock-bank/feed');
      setResult(ingestRes);
      if (onIngestSuccess) onIngestSuccess(ingestRes);
    } catch (err) {
      console.error('Bank sync error:', err);
      setError('Failed to sync from Mock Banking API.');
    } finally {
      setBankSyncLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center text-lg">
              <i className="bi bi-diagram-3-fill"></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">External API & Mock Core Banking</h3>
              <p className="text-xs text-slate-500">Stream transactions from external payment APIs, Core Banking ledgers, or Webhooks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* 1. Quick Mock Banking Actions Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/80 via-blue-50/40 to-white border border-indigo-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 text-xs flex items-center space-x-2">
                <i className="bi bi-bank2 text-indigo-600"></i>
                <span>Built-in Mock Core Banking Server</span>
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Online
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mb-3">
              Simulate enterprise core banking transaction batches or incoming payment gateway webhooks (Stripe / Visa / Adyen).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                disabled={bankSyncLoading}
                onClick={handleSyncMockBank}
                className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50"
              >
                {bankSyncLoading ? (
                  <>
                    <i className="bi bi-arrow-repeat animate-spin"></i>
                    <span>Syncing Core Bank Ledger...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-arrow-down-up"></i>
                    <span>Fetch Mock Bank Ledger (6 Txns)</span>
                  </>
                )}
              </button>

              <button
                disabled={webhookLoading}
                onClick={handleTriggerMockWebhook}
                className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {webhookLoading ? (
                  <>
                    <i className="bi bi-arrow-repeat animate-spin"></i>
                    <span>Dispatching Webhook...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-broadcast"></i>
                    <span>Simulate Payment Webhook</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 2. Custom External API Pull Form */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="font-bold text-slate-800 block">
              Connect Custom External REST API URL
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.myfintech.com/transactions"
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:border-blue-500 font-mono shadow-2xs"
              />
              <button
                disabled={loading}
                onClick={handleFetchExternalApi}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50 shrink-0"
              >
                {loading ? (
                  <>
                    <i className="bi bi-arrow-repeat animate-spin"></i>
                    <span>Fetching...</span>
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-down"></i>
                    <span>Fetch & Score</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Performs an HTTP GET, extracts transaction arrays, normalizes fields, and streams them into Kafka & Neon DB.
            </p>
          </div>

          {/* 3. Inbound Webhook URL */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 block">Public Webhook Receiver Endpoint</span>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-[11px] text-slate-800 shadow-2xs">
              <span className="truncate mr-2">{webhookEndpoint}</span>
              <button
                onClick={handleCopyWebhook}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-sans font-bold transition-colors shrink-0 flex items-center space-x-1 border border-blue-200"
              >
                <i className={`bi ${copied ? 'bi-check-lg text-emerald-600' : 'bi-clipboard'}`}></i>
                <span>{copied ? 'Copied!' : 'Copy URL'}</span>
              </button>
            </div>
          </div>

          {/* Results Summary */}
          {result && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <i className="bi bi-check-circle-fill text-lg text-emerald-600"></i>
                  <span className="font-bold text-slate-900 text-xs">External Ingestion Successful!</span>
                </div>
                <span className="text-[11px] text-slate-600 font-medium">Total: {result.total_processed}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white border border-emerald-200">
                  <span className="text-[10px] text-slate-500 block">Normal</span>
                  <span className="text-sm font-black text-emerald-700">{result.normal_count}</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-amber-200">
                  <span className="text-[10px] text-slate-500 block">Suspicious</span>
                  <span className="text-sm font-black text-amber-700">{result.suspicious_count}</span>
                </div>
                <div className="p-2 rounded-lg bg-white border border-rose-200">
                  <span className="text-[10px] text-slate-500 block">Fraud</span>
                  <span className="text-sm font-black text-rose-700">{result.fraud_count}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <i className="bi bi-exclamation-circle-fill text-rose-600"></i>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
