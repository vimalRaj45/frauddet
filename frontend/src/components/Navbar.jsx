import React, { useState } from 'react';

export default function Navbar({
  isLive,
  setIsLive,
  pollingInterval,
  setPollingInterval,
  isBackendOnline,
  onRefresh,
  onOpenCsvModal,
  onOpenApiModal
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
            <i className="bi bi-shield-check text-xl"></i>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">FinShield</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Real-Time
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Kafka Stream & Neon PostgreSQL Fraud Engine</p>
          </div>
        </div>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center space-x-3">
          {/* Action Modals */}
          <button
            onClick={onOpenCsvModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium text-xs transition-all shadow-2xs"
          >
            <i className="bi bi-filetype-csv text-blue-600"></i>
            <span>Upload CSV</span>
          </button>

          <button
            onClick={onOpenApiModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-medium text-xs transition-all shadow-2xs"
          >
            <i className="bi bi-bank2 text-indigo-600"></i>
            <span>External API / Bank</span>
          </button>

          {/* Backend Status */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
            <span className={`w-2 h-2 rounded-full ${isBackendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
            <span className="text-slate-600 font-medium">API:</span>
            <span className={isBackendOnline ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
              {isBackendOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Live Polling Toggle */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                isLive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <i className={`bi ${isLive ? 'bi-broadcast text-rose-200 animate-pulse' : 'bi-pause-circle'}`}></i>
              <span>{isLive ? 'Live Sync' : 'Paused'}</span>
            </button>

            {isLive && (
              <select
                value={pollingInterval}
                onChange={(e) => setPollingInterval(Number(e.target.value))}
                className="bg-white text-slate-700 text-xs rounded border border-slate-200 py-1 px-1.5 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
              >
                <option value={2000}>2s</option>
                <option value={3000}>3s</option>
                <option value={5000}>5s</option>
              </select>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            title="Refresh now"
          >
            <i className="bi bi-arrow-clockwise text-base"></i>
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center space-x-2">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`p-2 rounded-lg text-xs font-bold ${
              isLive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <i className={`bi ${isLive ? 'bi-broadcast' : 'bi-pause-circle'}`}></i>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700"
          >
            <i className={`bi ${mobileMenuOpen ? 'bi-x-lg' : 'bi-list'} text-lg`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white p-4 space-y-3 shadow-lg animate-fadeIn">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { onOpenCsvModal(); setMobileMenuOpen(false); }}
              className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-xs flex items-center justify-center space-x-1.5"
            >
              <i className="bi bi-filetype-csv"></i>
              <span>Upload CSV</span>
            </button>

            <button
              onClick={() => { onOpenApiModal(); setMobileMenuOpen(false); }}
              className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-xs flex items-center justify-center space-x-1.5"
            >
              <i className="bi bi-bank2"></i>
              <span>External Bank</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${isBackendOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              <span>API: <b className={isBackendOnline ? 'text-emerald-700' : 'text-rose-600'}>{isBackendOnline ? 'Online' : 'Offline'}</b></span>
            </div>

            <button
              onClick={() => { onRefresh(); setMobileMenuOpen(false); }}
              className="text-blue-600 font-semibold flex items-center space-x-1"
            >
              <i className="bi bi-arrow-clockwise"></i>
              <span>Sync Now</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
