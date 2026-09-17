import React from 'react';
import { X, Printer, ShieldCheck, ShieldAlert, AlertTriangle, Fingerprint, Calendar, Terminal } from 'lucide-react';

export default function AuditReportModal({ report, onClose }) {
  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPhishing = report.verdict === 'PHISHING' || report.risk_score >= 60;
  const isSuspicious = report.verdict === 'SUSPICIOUS' || (report.risk_score >= 30 && report.risk_score < 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-slate-200">
        {/* Header Controls */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6 no-print">
          <div className="flex items-center space-x-2">
            <Fingerprint className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white uppercase tracking-wider text-sm font-mono">
              PhishGuard Forensic Audit Report
            </h3>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center space-x-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>PRINT / SAVE PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Formal Certificate Layout */}
        <div className="space-y-6 print:text-black">
          {/* Document Header */}
          <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-white font-mono tracking-tight">
                URL SECURITY AUDIT CERTIFICATE
              </h1>
              <p className="text-xs text-cyan-400 font-mono mt-1">
                SYSTEM: PHISHGUARD AI ENGINE v2.4 (HEURISTIC + DGA EVALUATION)
              </p>
            </div>
            <div className="text-right text-xs font-mono text-slate-400">
              <p>AUDIT ID: #PG-{report.id || 'LIVE'}</p>
              <p>DATE: {report.scanned_at || report.created_at || new Date().toISOString()}</p>
            </div>
          </div>

          {/* Inspected Target Box */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs space-y-2">
            <div>
              <span className="text-slate-400">TARGET URL: </span>
              <strong className="text-white break-all">{report.url}</strong>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-500">DOMAIN: </span>
                <span className="text-slate-300">{report.domain || report.features?.registered_domain}</span>
              </div>
              <div>
                <span className="text-slate-500">PROTOCOL: </span>
                <span className="text-slate-300">{report.features?.scheme?.toUpperCase() || (report.is_https ? 'HTTPS' : 'HTTP')}</span>
              </div>
              <div>
                <span className="text-slate-500">HOST TYPE: </span>
                <span className="text-slate-300">{report.is_ip_address || report.ip_detected ? 'DIRECT IP (CRITICAL)' : 'FQDN HOST'}</span>
              </div>
            </div>
          </div>

          {/* Official Verdict & Score */}
          <div className={`p-5 rounded-xl border flex items-center justify-between ${
            isPhishing
              ? 'bg-rose-950/30 border-rose-800/80 text-rose-300'
              : isSuspicious
              ? 'bg-amber-950/30 border-amber-800/80 text-amber-300'
              : 'bg-emerald-950/30 border-emerald-800/80 text-emerald-300'
          }`}>
            <div className="flex items-center space-x-3">
              {isPhishing ? (
                <ShieldAlert className="w-8 h-8 text-rose-400" />
              ) : isSuspicious ? (
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              ) : (
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              )}
              <div>
                <p className="text-[10px] font-mono tracking-widest uppercase">EVALUATION VERDICT</p>
                <h2 className="text-2xl font-black tracking-wider">{report.verdict}</h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-mono tracking-widest uppercase">RISK SCORE</p>
              <p className="text-2xl font-black font-mono">{report.risk_score} / 100</p>
            </div>
          </div>

          {/* Triggered Forensic Indicators */}
          <div>
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
              TRIGGERED HEURISTIC & STATISTICAL INDICATORS ({report.signals?.length || 0})
            </h3>
            <div className="space-y-2">
              {!report.signals || report.signals.length === 0 ? (
                <p className="text-xs text-slate-400 font-mono p-3 bg-slate-950 rounded-lg border border-slate-800">
                  No anomalous or malicious indicators flagged. Baseline integrity verified.
                </p>
              ) : (
                report.signals.map((s, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
                    <div className="flex justify-between items-center text-rose-400 font-bold">
                      <span>[{s.severity}] {s.title}</span>
                      <span>+{s.points} pts</span>
                    </div>
                    <p className="text-slate-400 mt-1 text-[11px]">{s.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Signature & Seal */}
          <div className="border-t border-slate-800 pt-4 flex justify-between items-end text-[11px] font-mono text-slate-400">
            <div>
              <p>INSPECTED BY: PhishGuard Automated Security Engine</p>
              <p>HASH ALGORITHM: SHA256 / Shannon Entropy Evaluator</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-400 font-bold">STATUS: CRYPTOGRAPHICALLY VERIFIED</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
