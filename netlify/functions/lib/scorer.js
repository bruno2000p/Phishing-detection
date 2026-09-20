/**
 * PhishGuard Pro — Risk Scoring & Decision Engine (JavaScript Port)
 * Computes weighted 0-100 threat score with categorical verdict and forensic signals.
 */

function calculateRiskScore(features) {
  let score = 0;
  const signals = [];

  // 1. Direct IP Address Host (Critical)
  if (features.is_ip_address) {
    score += 35;
    signals.push({ category:'Host Identity', severity:'CRITICAL', points:35,
      title:'Direct IP Address as Hostname',
      description:`URL connects directly to IP '${features.hostname}' instead of a registered domain.` });
  }

  // 2. Brand Impersonation
  const brandSpoof = features.brand_spoofing || {};
  if (brandSpoof.impersonated) {
    const pts = { 'Typosquatting (Lookalike)':45, 'Combosquatting':40, 'Subdomain Impersonation':35 }[brandSpoof.type] || 25;
    score += pts;
    signals.push({ category:'Brand Protection', severity:'CRITICAL', points:pts,
      title:`Brand Spoofing (${brandSpoof.type})`,
      description: brandSpoof.details });
  }

  // 3. '@' Obfuscation
  if (features.has_at_symbol) {
    score += 25;
    signals.push({ category:'URL Obfuscation', severity:'HIGH', points:25,
      title:"Deceptive '@' Character",
      description:"The '@' symbol causes browsers to ignore everything before it and redirect to the trailing host." });
  }

  // 4. Double-slash redirect
  if (features.has_double_slash_redirect) {
    score += 20;
    signals.push({ category:'URL Obfuscation', severity:'HIGH', points:20,
      title:'Embedded Double-Slash Redirection',
      description:"Path contains '//' which can be exploited for open-redirect attacks." });
  }

  // 5. Excessive percent-encoding
  if ((features.count_percent || 0) >= 3) {
    score += 15;
    signals.push({ category:'URL Obfuscation', severity:'MEDIUM', points:15,
      title:'Excessive Hex/Percent Encoding',
      description:`URL exhibits ${features.count_percent} percent-encoded sequences.` });
  }

  // 6. URL length anomaly
  const urlLen = features.url_length || 0;
  if (urlLen > 120) {
    score += 18;
    signals.push({ category:'Lexical Structure', severity:'MEDIUM', points:18,
      title:'Extremely Long URL',
      description:`URL length is ${urlLen} characters (abnormal > 120 chars).` });
  } else if (urlLen > 75) {
    score += 10;
    signals.push({ category:'Lexical Structure', severity:'LOW', points:10,
      title:'Elevated URL Length',
      description:`URL length is ${urlLen} characters.` });
  }

  // 7. Dot count (subdomain flooding)
  const dots = features.count_dots || 0;
  if (dots >= 5) {
    score += 18;
    signals.push({ category:'Lexical Structure', severity:'HIGH', points:18,
      title:'Abnormal Dot Delimiter Count',
      description:`Detected ${dots} dots indicating deeply nested host camouflage.` });
  } else if (dots >= 3) {
    score += 8;
  }

  // 8. Excessive hyphens
  const hyphens = features.count_hyphens || 0;
  if (hyphens >= 3) {
    score += 14;
    signals.push({ category:'Lexical Structure', severity:'MEDIUM', points:14,
      title:'Excessive Hyphen Usage',
      description:`${hyphens} hyphens detected, commonly used to combine brand names with security terms.` });
  }

  // 9. Deep subdomain nesting
  const subCount = features.subdomain_count || 0;
  if (subCount >= 3) {
    score += 20;
    signals.push({ category:'DNS & Architecture', severity:'HIGH', points:20,
      title:'Deep Subdomain Nesting',
      description:`Host has ${subCount} subdomain levels: ${(features.subdomains || []).join(', ')}.` });
  }

  // 10. High-risk TLD
  if (features.is_high_risk_tld) {
    score += 25;
    signals.push({ category:'TLD Reputation', severity:'HIGH', points:25,
      title:`High-Risk Top-Level Domain (.${features.tld})`,
      description:`The TLD '.${features.tld}' is heavily used in cybercrime infrastructure.` });
  }

  // 11. Shannon Entropy (DGA detection)
  const ent = features.domain_entropy || 0;
  if (!features.is_ip_address && ent >= 3.8) {
    score += 22;
    signals.push({ category:'Statistical Heuristics', severity:'HIGH', points:22,
      title:'High Domain Shannon Entropy',
      description:`Domain entropy of ${ent} bits/char indicates pseudo-random DGA generation.` });
  } else if (!features.is_ip_address && ent >= 3.4) {
    score += 10;
    signals.push({ category:'Statistical Heuristics', severity:'LOW', points:10,
      title:'Moderate Domain Entropy',
      description:`Domain entropy is ${ent}.` });
  }

  // 12. Phishing keywords
  const kw = features.detected_keywords || {};
  const credTheft = kw.credential_theft || [];
  const financial = kw.financial_banking || [];
  const urgency = kw.urgency_and_security || [];
  const techSpoof = kw.tech_impersonation || [];

  if (credTheft.length > 0) {
    const pts = Math.min(credTheft.length * 12, 24);
    score += pts;
    signals.push({ category:'Social Engineering', severity:'HIGH', points:pts,
      title:'Credential Harvest Keywords',
      description:`Detected: ${credTheft.join(', ')}.` });
  }
  if (financial.length > 0) {
    const pts = Math.min(financial.length * 10, 20);
    score += pts;
    signals.push({ category:'Social Engineering', severity:'HIGH', points:pts,
      title:'Financial & Payment Tokens',
      description:`Detected: ${financial.join(', ')}.` });
  }
  if (urgency.length > 0) {
    const pts = Math.min(urgency.length * 8, 16);
    score += pts;
    signals.push({ category:'Social Engineering', severity:'MEDIUM', points:pts,
      title:'Urgency & Account Lock Bait',
      description:`Detected: ${urgency.join(', ')}.` });
  }
  if (techSpoof.length > 0) {
    score += 20;
    signals.push({ category:'Social Engineering', severity:'HIGH', points:20,
      title:'Enterprise Cloud Impersonation',
      description:`Detected: ${techSpoof.join(', ')}.` });
  }

  // 13. URL Shortener
  if (features.is_shortener) {
    score += 15;
    signals.push({ category:'Evasion Mechanism', severity:'MEDIUM', points:15,
      title:'URL Shortener / Destination Concealment',
      description:`Host '${features.hostname}' obscures the real endpoint.` });
  }

  // 14. Insecure HTTP
  if (!features.is_https) {
    if (credTheft.length > 0 || financial.length > 0 || brandSpoof.impersonated) {
      score += 18;
      signals.push({ category:'Transport Security', severity:'HIGH', points:18,
        title:'Unencrypted HTTP on Sensitive Resource',
        description:'Site does not use TLS while requesting sensitive credentials or financial data.' });
    } else {
      score += 8;
      signals.push({ category:'Transport Security', severity:'LOW', points:8,
        title:'Insecure Cleartext Protocol (HTTP)',
        description:'URL uses plain HTTP instead of secure HTTPS.' });
    }
  }

  // 15. Trusted TLD offset
  if (features.is_trusted_tld && !brandSpoof.impersonated && !features.is_ip_address) {
    score = Math.max(0, score - 30);
    signals.push({ category:'Trust Baseline', severity:'SAFE', points:-30,
      title:`Verified Institutional Domain (.${features.tld})`,
      description:`Domain is under an authoritative educational or governmental namespace.` });
  }

  const finalScore = Math.min(Math.max(Math.round(score), 0), 100);
  let verdict, verdictColor, riskLevel, recommendation;

  if (finalScore >= 60) {
    verdict = 'PHISHING'; verdictColor = 'red'; riskLevel = 'High / Critical Risk';
    recommendation = 'DO NOT OPEN. This URL shows clear indicators of phishing. Entering any information here may lead to identity theft.';
  } else if (finalScore >= 30) {
    verdict = 'SUSPICIOUS'; verdictColor = 'amber'; riskLevel = 'Moderate Risk';
    recommendation = 'PROCEED WITH EXTREME CAUTION. Multiple heuristic anomalies detected. Verify the source before interacting.';
  } else {
    verdict = 'SAFE'; verdictColor = 'green'; riskLevel = 'Low Risk';
    recommendation = 'This URL exhibits standard legitimate structure with no major red flags detected.';
  }

  const confidence = Math.min(65 + signals.length * 5, 99.5);

  return { risk_score: finalScore, verdict, verdict_color: verdictColor, risk_level: riskLevel,
    confidence_percentage: confidence, recommendation, signals_count: signals.length, signals };
}

module.exports = { calculateRiskScore };
