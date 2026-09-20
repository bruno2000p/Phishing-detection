import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import StatsOverview from './components/StatsOverview';
import Scanner from './components/Scanner';
import RiskGauge from './components/RiskGauge';
import FeatureBreakdown from './components/FeatureBreakdown';
import BatchScanner from './components/BatchScanner';
import HistoryTable from './components/HistoryTable';
import AuditReportModal from './components/AuditReportModal';
import ApiDocsModal from './components/ApiDocsModal';

// On Netlify: /api/* is rewritten to /.netlify/functions/* (no prefix needed).
// Locally with `netlify dev`: same routing applies via the dev server.
// Fallback to Python backend only when VITE_API_URL is explicitly set.
const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [activeTab, setActiveTab] = useState('scanner');
  const [currentResult, setCurrentResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [batchResults, setBatchResults] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showApiDocs, setShowApiDocs] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Fetch initial telemetry and history
  const fetchTelemetry = async () => {
    try {
      const [statsRes, histRes] = await Promise.all([
        fetch(`${API_BASE}/api/stats`).catch(() => null),
        fetch(`${API_BASE}/api/history?limit=30`).catch(() => null)
      ]);

      if (statsRes && statsRes.ok) {
        const sData = await statsRes.json();
        setStats(sData.stats);
      }
      if (histRes && histRes.ok) {
        const hData = await histRes.json();
        setHistoryList(hData.scans || []);
      }
    } catch (err) {
      console.warn('Initial telemetry sync warning:', err);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  // Single URL scan handler
  const handleSingleScan = async (url) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch(`${API_BASE}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.error || 'Scan failed');
      }

      setCurrentResult(resJson.data);
      // Refresh stats & history
      fetchTelemetry();
    } catch (err) {
      setErrorMsg(err.message || 'Unable to connect to PhishGuard backend engine.');
    } finally {
      setLoading(false);
    }
  };

  // Batch scan handler
  const handleBatchScan = async (urls) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch(`${API_BASE}/api/batch-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.error || 'Batch scan failed');
      }

      setBatchResults(resJson.results || []);
      fetchTelemetry();
    } catch (err) {
      setErrorMsg(err.message || 'Batch analysis service unavailable.');
    } finally {
      setLoading(false);
    }
  };

  // Clear history handler
  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to purge all historical scan logs?')) return;
    try {
      await fetch(`${API_BASE}/api/history`, { method: 'DELETE' });
      setHistoryList([]);
      fetchTelemetry();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-cyber-900 text-slate-100 cyber-grid flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenApiDocs={() => setShowApiDocs(true)}
        onOpenDocumentation={() => {
          // Open documentation in new window or anchor
          window.open('/DOCUMENTATION.html', '_blank');
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-600 text-rose-200 text-sm flex items-center justify-between shadow-lg">
            <span>{errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs font-mono font-bold hover:text-white ml-4 underline"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Global Telemetry Metrics Bar */}
        <StatsOverview stats={stats} />

        {/* Tab 1: Single URL Scanner */}
        {activeTab === 'scanner' && (
          <div className="space-y-8">
            <Scanner onScan={handleSingleScan} loading={loading} />

            {currentResult && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Risk Gauge & Quick Status */}
                <div className="lg:col-span-4 space-y-4">
                  <RiskGauge
                    score={currentResult.risk_score}
                    verdict={currentResult.verdict}
                    confidence={currentResult.confidence_percentage}
                  />

                  {/* Summary Card */}
                  <div className="glass-panel rounded-2xl p-5 border border-slate-800 text-xs font-mono space-y-2">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">LATENCY:</span>
                      <span className="text-cyan-400 font-bold">{currentResult.latency_ms} ms</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">HOST TYPE:</span>
                      <span className="text-slate-200">
                        {currentResult.is_ip_address ? 'DIRECT IP' : 'DOMAIN'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">VERIFIED AT:</span>
                      <span className="text-slate-300">{currentResult.scanned_at}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Detailed Feature Breakdown & Signals */}
                <div className="lg:col-span-8">
                  <FeatureBreakdown
                    result={currentResult}
                    onOpenReport={() => setSelectedReport(currentResult)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Batch Scanner */}
        {activeTab === 'batch' && (
          <BatchScanner
            onBatchScan={handleBatchScan}
            batchResults={batchResults}
            loading={loading}
          />
        )}

        {/* Tab 3: History Feed */}
        {activeTab === 'history' && (
          <HistoryTable
            scans={historyList}
            onSelectScan={(scan) => setSelectedReport(scan)}
            onClearHistory={handleClearHistory}
            onRefresh={fetchTelemetry}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 font-mono space-y-1">
          <p>PhishGuard AI — Advanced Algorithmic Phishing & Fraud Prevention System</p>
          <p className="text-[11px] text-slate-600">Built with React 18, Tailwind CSS, Netlify Serverless Functions & Node.js</p>
        </div>
      </footer>

      {/* Modals */}
      {selectedReport && (
        <AuditReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}

      {showApiDocs && <ApiDocsModal onClose={() => setShowApiDocs(false)} />}
    </div>
  );
}
