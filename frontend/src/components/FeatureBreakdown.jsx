import React, { useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  ExternalLink, 
  Copy, 
  Check, 
  FileText, 
  Layers, 
  Fingerprint,
  Cpu,
  EyeOff
} from 'lucide-react';

export default function FeatureBreakdown({ result, onOpenReport }) {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const { features, signals, recommendation, risk_score, verdict, confidence_percentage } = result;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'LOW':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'SAFE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600';
    }
  };

  const brandInfo = features?.brand_spoofing;

  return (
    <div className="space-y-6">
      {/* Actionable Guidance Banner */}
      <div className={`p-4 rounded-xl border flex items-start space-x-3.5 ${
        verdict === 'PHISHING'
          ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
          : verdict === 'SUSPICIOUS'
          ? 'bg-amber-950/40 border-amber-800/60 text-amber-200'
          : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
      }`}>
        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <span className="font-bold uppercase tracking-wider font-mono mr-2">ACTIONABLE GUIDANCE:</span>
          {recommendation}
        </div>
      </div>

      {/* Brand Spoofing Alert Card (if detected) */}
      {brandInfo && brandInfo.impersonated && (
        <div className="p-4 rounded-xl bg-rose-900/30 border border-rose-500/50 flex items-start space-x-3">
          <EyeOff className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm">
            <h4 className="font-bold text-rose-300 flex items-center space-x-2">
              <span>BRAND MASQUERADE DETECTED:</span>
              <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-600 text-white font-mono">
                {brandInfo.brand} ({brandInfo.type})
              </span>
            </h4>
            <p className="text-slate-300 mt-1">{brandInfo.details}</p>
          </div>
        </div>
      )}

      {/* Triggered Signals Section */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Fingerprint className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Forensic Risk Indicators ({signals.length})
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Weighted Rule Deductions
          </span>
        </div>

        {signals.length === 0 ? (
          <div className="py-6 text-center text-slate-400 font-mono text-xs flex flex-col items-center justify-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <span>Zero malicious heuristic patterns identified. Standard safe baseline.</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {signals.map((sig, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start justify-between space-x-4 hover:border-slate-700 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getSeverityBadge(sig.severity)}`}>
                      {sig.severity}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">[{sig.category}]</span>
                    <h4 className="text-sm font-semibold text-white">{sig.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 pl-0.5">{sig.description}</p>
                </div>
                <div className="font-mono text-xs font-bold text-rose-400 whitespace-nowrap bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  +{sig.points} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lexical & Domain Anatomy Inspector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* URL Anatomy Card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center space-x-2 mb-4">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">Lexical Anatomy</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">URL LENGTH</span>
              <span className="font-bold text-white">{features?.url_length} chars</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">PROTOCOL</span>
              <div className="flex items-center space-x-1 mt-0.5">
                {features?.is_https ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold text-emerald-400">HTTPS</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-rose-400" />
                    <span className="font-bold text-rose-400">HTTP</span>
                  </>
                )}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">DOTS / HYPHENS</span>
              <span className="font-bold text-white">{features?.count_dots} / {features?.count_hyphens}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">SUBDOMAINS</span>
              <span className="font-bold text-white">{features?.subdomain_count} level(s)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 col-span-2">
              <span className="text-slate-400 block text-[10px]">REGISTERED DOMAIN</span>
              <span className="font-bold text-cyan-300 break-all">{features?.registered_domain || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Statistical & Entropy Card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center space-x-2 mb-4">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">Domain Entropy & Statistics</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-400">SHANNON ENTROPY:</span>
                <span className={`font-bold ${features?.domain_entropy >= 3.8 ? 'text-rose-400' : 'text-cyan-400'}`}>
                  {features?.domain_entropy} bits/char
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    features?.domain_entropy >= 3.8 ? 'bg-rose-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${Math.min((features?.domain_entropy / 5.0) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>0.0 (Uniform)</span>
                <span>3.4 (Natural)</span>
                <span>5.0 (High DGA)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">IP HOST DETECTED</span>
                <span className={features?.is_ip_address ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                  {features?.is_ip_address ? 'TRUE (Critical)' : 'FALSE'}
                </span>
              </div>
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">URL SHORTENER</span>
                <span className={features?.is_shortener ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                  {features?.is_shortener ? 'DETECTED' : 'NO'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          onClick={onOpenReport}
          className="px-4 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center space-x-2 transition"
        >
          <FileText className="w-4 h-4" />
          <span>VIEW FORENSIC AUDIT REPORT</span>
        </button>

        <button
          onClick={handleCopyJson}
          className="px-4 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 text-slate-300 text-xs font-mono flex items-center space-x-2 transition"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY JSON TELEMETRY'}</span>
        </button>
      </div>
    </div>
  );
}
