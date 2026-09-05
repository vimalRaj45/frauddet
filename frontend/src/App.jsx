import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import PipelineTerminalHUD from './components/PipelineTerminalHUD';
import StatCards from './components/StatCards';
import AIBriefingCard from './components/AIBriefingCard';
import SimulatorControls from './components/SimulatorControls';
import RiskChart from './components/RiskChart';
import LiveTransactionEventLog from './components/LiveTransactionEventLog';
import TransactionTable from './components/TransactionTable';
import SuspiciousTable from './components/SuspiciousTable';
import TransactionModal from './components/TransactionModal';
import CsvUploadModal from './components/CsvUploadModal';
import ExternalApiConnector from './components/ExternalApiConnector';
import { getStats, getNormalTransactions, getSuspiciousTransactions, getLiveFeed, checkHealth } from './services/api';

export default function App() {
  const [stats, setStats] = useState(null);
  const [normalTxns, setNormalTxns] = useState([]);
  const [suspiciousTxns, setSuspiciousTxns] = useState([]);
  const [feedItems, setFeedItems] = useState([]);
  const [activePipelineTxn, setActivePipelineTxn] = useState(null);
  const [isLive, setIsLive] = useState(true);
  const [pollingInterval, setPollingInterval] = useState(3000);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [kafkaStatus, setKafkaStatus] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Modals
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  const lastSeenTxnId = useRef(null);

  // Fetch all dashboard data
  const fetchData = useCallback(async () => {
    try {
      const [statsData, normalData, suspiciousData, feedData, healthData] = await Promise.all([
        getStats().catch(() => null),
        getNormalTransactions(30).catch(() => []),
        getSuspiciousTransactions(30).catch(() => []),
        getLiveFeed(60).catch(() => []),
        checkHealth().catch(() => null)
      ]);

      if (statsData) setStats(statsData);
      if (normalData) setNormalTxns(normalData);
      if (suspiciousData) setSuspiciousTxns(suspiciousData);
      if (feedData) {
        setFeedItems(feedData);
        if (feedData.length > 0) {
          const newest = feedData[0];
          if (newest.transaction_id !== lastSeenTxnId.current) {
            lastSeenTxnId.current = newest.transaction_id;
            setActivePipelineTxn(newest);
          }
        }
      }
      
      if (healthData) {
        setIsBackendOnline(true);
        setKafkaStatus(healthData.kafka_connected);
      } else {
        setIsBackendOnline(false);
      }
    } catch (err) {
      console.error('Data fetch error:', err);
      setIsBackendOnline(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    let timer = null;
    if (isLive) {
      timer = setInterval(fetchData, pollingInterval);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLive, pollingInterval, fetchData]);

  const handleTransactionGenerated = (results) => {
    if (results && results.length > 0) {
      setActivePipelineTxn(results[0]);
    }
    fetchData();
  };

  const handleClearComplete = () => {
    setStats({
      total_transactions: 0,
      normal_count: 0,
      suspicious_count: 0,
      fraud_count: 0,
      total_flagged_count: 0,
      total_volume_usd: 0,
      flagged_volume_usd: 0,
      average_risk_score: 0,
      fraud_rate_percentage: 0
    });
    setNormalTxns([]);
    setSuspiciousTxns([]);
    setFeedItems([]);
    setActivePipelineTxn(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-['Inter',sans-serif] selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        isLive={isLive}
        setIsLive={setIsLive}
        pollingInterval={pollingInterval}
        setPollingInterval={setPollingInterval}
        isBackendOnline={isBackendOnline}
        kafkaStatus={kafkaStatus}
        onRefresh={fetchData}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
        onOpenApiModal={() => setIsApiModalOpen(true)}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6">
        {/* Offline Banner */}
        {!isBackendOnline && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-amber-900 gap-2 shadow-sm">
            <div className="flex items-center space-x-2.5">
              <i className="bi bi-exclamation-triangle-fill text-amber-600 text-base"></i>
              <span className="font-medium">Backend API server is not detected on <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded font-bold">http://localhost:8000</code>. Please run <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded font-bold">python -m uvicorn app.main:app --reload --port 8000</code> in backend.</span>
            </div>
            <button
              onClick={fetchData}
              className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 font-bold transition-colors self-start sm:self-center"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* 1. Transparent Live Pipeline Execution Terminal HUD (Top of Screen) */}
        <PipelineTerminalHUD activeTxn={activePipelineTxn} />

        {/* 2. Metric Overview Cards */}
        <StatCards stats={stats} />

        {/* 3. Ingestion Quick-Action Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div
            onClick={() => setIsCsvModalOpen(true)}
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/90 via-white to-white border border-blue-200/80 hover:border-blue-400 cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs">
                <i className="bi bi-file-earmark-spreadsheet"></i>
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm block">Upload Transaction CSV Batch</span>
                <span className="text-xs text-slate-500">Ingest, score, and persist offline CSV files into Neon DB</span>
              </div>
            </div>
            <span className="text-blue-600 text-xs font-bold flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
              <span>Open</span>
              <i className="bi bi-arrow-right"></i>
            </span>
          </div>

          <div
            onClick={() => setIsApiModalOpen(true)}
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-white to-white border border-indigo-200/80 hover:border-indigo-400 cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-md flex items-center justify-between group"
          >
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-2xs">
                <i className="bi bi-bank2"></i>
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm block">External API & Mock Core Bank</span>
                <span className="text-xs text-slate-500">Sync mock ledger feeds or trigger payment gateway webhooks</span>
              </div>
            </div>
            <span className="text-indigo-600 text-xs font-bold flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
              <span>Connect</span>
              <i className="bi bi-arrow-right"></i>
            </span>
          </div>
        </div>

        {/* 4. AI Threat Intelligence Copilot */}
        <AIBriefingCard stats={stats} />

        {/* 5. Simulator & Attack Controls */}
        <SimulatorControls
          onTransactionGenerated={handleTransactionGenerated}
          onClearComplete={handleClearComplete}
        />

        {/* 6. Risk Distribution & Analytics Chart */}
        <RiskChart stats={stats} />

        {/* 7. Comprehensive Live Transaction Event Logs Console */}
        <LiveTransactionEventLog
          feedItems={feedItems}
          onSelectTxn={setSelectedTxn}
        />

        {/* 8. Tab Selector for Database Tables */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
          <div className="flex items-center space-x-1.5 text-xs bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className="bi bi-grid-fill mr-1.5 text-blue-600"></i>
              Split Table View
            </button>
            <button
              onClick={() => setActiveTab('flagged')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'flagged'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <i className="bi bi-shield-x mr-1.5"></i>
              Fraud Records ({suspiciousTxns.length})
            </button>
            <button
              onClick={() => setActiveTab('normal')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'normal'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <i className="bi bi-check2-circle mr-1.5"></i>
              Normal Records ({normalTxns.length})
            </button>
          </div>

          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
            Auto-syncing every {pollingInterval / 1000}s
          </span>
        </div>

        {/* 9. Live Database Tables */}
        {activeTab === 'all' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-start">
            <SuspiciousTable
              items={suspiciousTxns}
              onSelectTxn={setSelectedTxn}
            />
            <TransactionTable
              items={normalTxns}
              onSelectTxn={setSelectedTxn}
            />
          </div>
        ) : activeTab === 'flagged' ? (
          <SuspiciousTable
            items={suspiciousTxns}
            onSelectTxn={setSelectedTxn}
          />
        ) : (
          <TransactionTable
            items={normalTxns}
            onSelectTxn={setSelectedTxn}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 bg-white py-5 mt-12 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center space-x-2">
            <i className="bi bi-shield-check text-blue-600 text-base"></i>
            <span className="font-bold text-slate-800">FinShield Real-Time FinTech Fraud Detection Engine</span>
          </div>
          <div className="flex items-center space-x-3 font-medium text-slate-500">
            <span>FastAPI + Python</span>
            <span>•</span>
            <span>AI Intelligence Engine</span>
            <span>•</span>
            <span>Aiven Kafka</span>
            <span>•</span>
            <span>Neon PostgreSQL</span>
            <span>•</span>
            <span>React + Tailwind</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TransactionModal
        txn={selectedTxn}
        onClose={() => setSelectedTxn(null)}
      />

      <CsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onUploadSuccess={fetchData}
      />

      <ExternalApiConnector
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        onIngestSuccess={fetchData}
      />
    </div>
  );
}
