import React, { useState } from 'react';
import { X, Code2, Copy, Check } from 'lucide-react';

export default function ApiDocsModal({ onClose }) {
  const [copiedIdx, setCopiedIdx] = useState(null);

  const copyCode = (code, idx) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const endpoints = [
    {
      method: 'POST',
      path: '/api/scan',
      desc: 'Perform instant heuristic, brand impersonation, and entropy analysis on a single URL.',
      curl: `curl -X POST http://127.0.0.1:5050/api/scan \\
  -H "Content-Type: application/json" \\
  -d '{"url": "http://paypa1-verification.xyz/login"}'`,
      response: `{
  "status": "success",
  "data": {
    "url": "http://paypa1-verification.xyz/login",
    "domain": "paypa1-verification.xyz",
    "risk_score": 97,
    "verdict": "PHISHING",
    "confidence_percentage": 90.0,
    "signals": [
      {
        "category": "Brand Protection",
        "severity": "CRITICAL",
        "title": "Target Brand Spoofing (Typosquatting)",
        "points": 45
      }
    ]
  }
}`
    },
    {
      method: 'POST',
      path: '/api/batch-scan',
      desc: 'Inspect up to 50 URLs concurrently in high-throughput batch mode.',
      curl: `curl -X POST http://127.0.0.1:5050/api/batch-scan \\
  -H "Content-Type: application/json" \\
  -d '{"urls": ["https://google.com", "http://192.168.1.1/update"]}'`,
      response: `{
  "status": "success",
  "total": 2,
  "results": [
    {"url": "https://google.com", "verdict": "SAFE", "risk_score": 0},
    {"url": "http://192.168.1.1/update", "verdict": "PHISHING", "risk_score": 75}
  ]
}`
    },
    {
      method: 'GET',
      path: '/api/history',
      desc: 'Fetch recent scan telemetry with optional filtering by verdict or keyword.',
      curl: `curl -X GET "http://127.0.0.1:5050/api/history?limit=10&verdict=PHISHING"`,
      response: `{
  "status": "success",
  "count": 10,
  "scans": [...]
}`
    },
    {
      method: 'GET',
      path: '/api/stats',
      desc: 'Retrieve aggregated threat metrics, detection rates, and average response times.',
      curl: `curl -X GET "http://127.0.0.1:5050/api/stats"`,
      response: `{
  "status": "success",
  "stats": {
    "total_scans": 142,
    "safe_count": 89,
    "phishing_count": 53,
    "phishing_percentage": 37.3,
    "avg_latency_ms": 14.5
  }
}`
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 my-8 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white uppercase tracking-wider text-sm font-mono">
              PhishGuard REST API Documentation
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {endpoints.map((ep, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2.5 py-0.5 rounded font-bold text-[10px] ${
                      ep.method === 'POST' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-bold text-white text-sm">{ep.path}</span>
                </div>
                <button
                  onClick={() => copyCode(ep.curl, idx)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center space-x-1 transition text-[11px]"
                >
                  {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIdx === idx ? 'COPIED' : 'COPY CURL'}</span>
                </button>
              </div>

              <p className="text-slate-400 text-xs mb-3 font-sans">{ep.desc}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">CURL REQUEST</span>
                  <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-cyan-300 overflow-x-auto whitespace-pre-wrap">
                    {ep.curl}
                  </pre>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">JSON RESPONSE</span>
                  <pre className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                    {ep.response}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
