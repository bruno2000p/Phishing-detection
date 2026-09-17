import React from 'react';
import { ShieldCheck, ShieldAlert, Zap, Globe2 } from 'lucide-react';

export default function StatsOverview({ stats }) {
  const data = stats || {
    total_scans: 0,
    safe_percentage: 0,
    phishing_percentage: 0,
    avg_latency_ms: 14.5
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Scans Card */}
      <div className="glass-panel rounded-xl p-4 border border-slate-800 flex items-center space-x-4">
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Globe2 className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-mono">TOTAL INSPECTIONS</p>
          <p className="text-2xl font-bold text-white font-mono mt-0.5">{data.total_scans}</p>
        </div>
      </div>

      {/* Safe URLs Ratio Card */}
      <div className="glass-panel rounded-xl p-4 border border-slate-800 flex items-center space-x-4">
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-mono">SAFE DOMAINS</p>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="text-2xl font-bold text-white font-mono">{data.safe_count || 0}</span>
            <span className="text-xs text-emerald-400 font-mono">({data.safe_percentage}%)</span>
          </div>
        </div>
      </div>

      {/* Phishing / Threat Detected Card */}
      <div className="glass-panel rounded-xl p-4 border border-slate-800 flex items-center space-x-4">
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-mono">THREATS INTERCEPTED</p>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="text-2xl font-bold text-white font-mono">{data.phishing_count || 0}</span>
            <span className="text-xs text-rose-400 font-mono">({data.phishing_percentage}%)</span>
          </div>
        </div>
      </div>

      {/* Detection Latency Card */}
      <div className="glass-panel rounded-xl p-4 border border-slate-800 flex items-center space-x-4">
        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-mono">RESPONSE LATENCY</p>
          <div className="flex items-baseline space-x-1.5 mt-0.5">
            <span className="text-2xl font-bold text-white font-mono">{data.avg_latency_ms}</span>
            <span className="text-xs text-cyan-400 font-mono">ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
