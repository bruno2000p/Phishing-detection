import React, { useState } from 'react';
import { Search, ShieldAlert, Sparkles, Loader2, ArrowRight } from 'lucide-react';

const PRESET_URLS = [
  {
    name: 'Google (Legitimate)',
    url: 'https://www.google.com',
    type: 'safe'
  },
  {
    name: 'PayPal Spoof (Typosquatting)',
    url: 'http://paypa1-security-verification.xyz/login/index.php',
    type: 'phishing'
  },
  {
    name: 'Direct IP Attack',
    url: 'http://192.168.1.1/banking/chase/verify-account.html',
    type: 'phishing'
  },
  {
    name: 'DGA High Entropy Domain',
    url: 'http://x8q2z9wbv0a1ckp7.top/auth/verify',
    type: 'phishing'
  },
  {
    name: 'Netflix Suspension Bait',
    url: 'http://netflix-billing-update-urgent.click/billing',
    type: 'phishing'
  }
];

export default function Scanner({ onScan, loading }) {
  const [inputUrl, setInputUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    onScan(inputUrl.trim());
  };

  const handleSelectPreset = (url) => {
    setInputUrl(url);
    onScan(url);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative">
      <div className="max-w-3xl mx-auto text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Inspect URLs with Multi-Factor Heuristic AI
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Analyze deep lexical anatomy, typosquatting brand spoofing, Shannon domain entropy, and IP masking in real-time.
        </p>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Paste URL (e.g. https://domain.com/login)..."
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition shadow-inner"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !inputUrl.trim()}
            className="px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold font-mono tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 whitespace-nowrap"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>SCANNING...</span>
              </>
            ) : (
              <>
                <span>ANALYZE</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick-test Presets Bar */}
      <div className="max-w-3xl mx-auto mt-5">
        <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono mb-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>TRY SAMPLE TEST TARGETS:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_URLS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(preset.url)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition flex items-center space-x-1.5 ${
                preset.type === 'safe'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300 hover:bg-rose-900/60'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${preset.type === 'safe' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
