import React, { useState } from 'react';
import { History, Search, Trash2, ExternalLink, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function HistoryTable({ scans, onSelectScan, onClearHistory, onRefresh }) {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filtered = (scans || []).filter((s) => {
    const matchesFilter = filter === 'ALL' || s.verdict?.toUpperCase() === filter;
    const matchesSearch =
      !search ||
      s.url?.toLowerCase().includes(search.toLowerCase()) ||
      s.domain?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getVerdictPill = (verdict) => {
    switch (verdict?.toUpperCase()) {
      case 'PHISHING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center space-x-1 w-fit">
            <ShieldAlert className="w-3 h-3" />
            <span>PHISHING</span>
          </span>
        );
      case 'SUSPICIOUS':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center space-x-1 w-fit">
            <AlertTriangle className="w-3 h-3" />
            <span>SUSPICIOUS</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 w-fit">
            <ShieldCheck className="w-3 h-3" />
            <span>SAFE</span>
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-cyan-400" />
            <span>Threat Telemetry & Scan History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Persistent audit trail of all URLs inspected by the PhishGuard heuristic engine.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white transition"
          >
            Refresh
          </button>
          <button
            onClick={onClearHistory}
            className="text-xs font-mono px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 hover:bg-rose-900/60 transition flex items-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        {/* Category Tabs */}
        <div className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          {['ALL', 'SAFE', 'SUSPICIOUS', 'PHISHING'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded-lg transition ${
                filter === cat
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by URL or domain..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Scans Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Inspected URL</th>
              <th className="px-4 py-3">Verdict</th>
              <th className="px-4 py-3">Risk Index</th>
              <th className="px-4 py-3">Domain</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 font-mono text-xs">
                  No scan logs matching current criteria.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/30 transition group">
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-[11px]">
                    {s.created_at}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-200 max-w-sm truncate" title={s.url}>
                    {s.url}
                  </td>
                  <td className="px-4 py-3">{getVerdictPill(s.verdict)}</td>
                  <td className="px-4 py-3 font-bold text-white">
                    <span
                      className={
                        s.risk_score >= 60
                          ? 'text-rose-400'
                          : s.risk_score >= 30
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }
                    >
                      {s.risk_score}
                    </span>{' '}
                    / 100
                  </td>
                  <td className="px-4 py-3 text-slate-400 max-w-[150px] truncate">{s.domain || 'N/A'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onSelectScan(s)}
                      className="text-cyan-400 hover:text-cyan-300 transition text-[11px] underline flex items-center justify-end space-x-1 ml-auto"
                    >
                      <span>Forensics</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
