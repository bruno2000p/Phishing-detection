import React, { useState } from 'react';
import { Layers, Loader2, Download, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

const SAMPLE_BATCH = [
  'https://www.google.com',
  'http://paypa1-security-verification.xyz/login/index.php',
  'http://192.168.1.1/banking/login.html',
  'https://en.wikipedia.org/wiki/Computer_security',
  'http://appleid.apple.com.attacker-controlled.top/auth',
  'https://github.com/torvalds/linux',
  'http://netflix-billing-update-urgent.click/billing'
].join('\n');

export default function BatchScanner({ onBatchScan, batchResults, loading }) {
  const [textInput, setTextInput] = useState('');

  const handleStartScan = () => {
    const urls = textInput
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
    if (urls.length === 0) return;
    onBatchScan(urls);
  };

  const handleExportCsv = () => {
    if (!batchResults || batchResults.length === 0) return;
    const header = ['URL', 'Domain', 'Risk Score', 'Verdict', 'Signals Count'];
    const rows = batchResults.map((r) => [
      `"${r.url}"`,
      `"${r.domain || ''}"`,
      r.risk_score || 0,
      `"${r.verdict || ''}"`,
      r.signals_count || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [header.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `phishguard_batch_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>High-Throughput Batch URL Inspection</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Analyze batches of up to 50 URLs concurrently. Enter one URL per line.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setTextInput(SAMPLE_BATCH)}
            className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-cyan-300 hover:bg-slate-700 transition"
          >
            Load Sample Batch
          </button>
        </div>

        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          rows={6}
          placeholder="https://example1.com&#10;http://phishing-site.xyz/login&#10;https://example3.org"
          className="w-full p-4 rounded-xl bg-slate-900/90 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
          disabled={loading}
        />

        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400">
            Targets Detected:{' '}
            <strong className="text-white">
              {textInput.split('\n').filter((u) => u.trim().length > 0).length}
            </strong>
          </span>

          <button
            onClick={handleStartScan}
            disabled={loading || !textInput.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold font-mono tracking-wider transition disabled:opacity-50 flex items-center space-x-2 shadow-lg shadow-cyan-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>EVALUATING BATCH...</span>
              </>
            ) : (
              <>
                <span>EXECUTE BATCH SCAN</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Batch Results Table */}
      {batchResults && batchResults.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Batch Scan Findings ({batchResults.length})</h3>
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-mono flex items-center space-x-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT TO CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Target URL</th>
                  <th className="px-4 py-3">Verdict</th>
                  <th className="px-4 py-3">Risk Score</th>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3 text-right">Signals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {batchResults.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3 font-semibold text-slate-200 max-w-xs truncate" title={item.url}>
                      {item.url}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.verdict === 'PHISHING'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : item.verdict === 'SUSPICIOUS'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {item.verdict}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-white">{item.risk_score} / 100</td>
                    <td className="px-4 py-3 text-slate-400">{item.domain || 'N/A'}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{item.signals_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
