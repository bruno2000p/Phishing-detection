import React from 'react';
import { AlertTriangle, CheckCircle, ShieldX } from 'lucide-react';

export default function RiskGauge({ score = 0, verdict = 'SAFE', confidence = 95 }) {
  // SVG circular gauge math
  const radius = 70;
  const circumference = 2 * Math.PI * radius; // ~439.8
  // We use a semi-circle or 270 degree arc
  const arcPercentage = 0.75;
  const maxStroke = circumference * arcPercentage;
  const strokeDashoffset = maxStroke - (maxStroke * Math.min(Math.max(score, 0), 100)) / 100;

  // Color selection
  let primaryColor = '#10b981'; // Emerald Safe
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  let bgArcColor = 'rgba(16, 185, 129, 0.15)';
  let verdictBadge = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  let IconComponent = CheckCircle;

  if (verdict === 'PHISHING' || score >= 60) {
    primaryColor = '#ef4444'; // Red Phishing
    glowColor = 'rgba(239, 68, 68, 0.5)';
    bgArcColor = 'rgba(239, 68, 68, 0.15)';
    verdictBadge = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    IconComponent = ShieldX;
  } else if (verdict === 'SUSPICIOUS' || score >= 30) {
    primaryColor = '#f59e0b'; // Amber Suspicious
    glowColor = 'rgba(245, 158, 11, 0.5)';
    bgArcColor = 'rgba(245, 158, 11, 0.15)';
    verdictBadge = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    IconComponent = AlertTriangle;
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 glass-panel rounded-2xl border border-slate-800 relative overflow-hidden">
      {/* Subtle background glow */}
      <div
        className="absolute w-40 h-40 rounded-full filter blur-3xl opacity-30 transition-all duration-700 pointer-events-none"
        style={{ backgroundColor: primaryColor }}
      />

      {/* SVG Radial Gauge */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-135" viewBox="0 0 180 180">
          {/* Background Track */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth="12"
            strokeDasharray={`${maxStroke} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Animated Value Arc */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={primaryColor}
            strokeWidth="12"
            strokeDasharray={`${maxStroke} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
          />
        </svg>

        {/* Center Score Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
            {score}
          </span>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
            Risk Index / 100
          </span>
        </div>
      </div>

      {/* Authoritative Verdict Badge */}
      <div className="mt-2 flex flex-col items-center space-y-1">
        <div className={`px-4 py-1.5 rounded-full text-xs font-bold font-mono tracking-wider border flex items-center space-x-1.5 ${verdictBadge}`}>
          <IconComponent className="w-4 h-4" />
          <span>{verdict}</span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Confidence Level: <strong className="text-slate-200">{confidence}%</strong>
        </span>
      </div>
    </div>
  );
}
