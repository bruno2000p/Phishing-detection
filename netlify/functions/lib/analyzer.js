/**
 * PhishGuard Pro — URL Feature Extractor (JavaScript Port)
 * Extracts lexical, statistical, structural and brand features from candidate URLs.
 */

const { URL } = require('url');
const { PHISHING_KEYWORDS, HIGH_RISK_TLDS, TRUSTED_TLDS, URL_SHORTENERS } = require('./keywords');
const { detectBrandSpoofing } = require('./brands');

function calculateShannonEntropy(text) {
  if (!text) return 0;
  const len = text.length;
  const freq = {};
  for (const ch of text) freq[ch] = (freq[ch] || 0) + 1;
  let entropy = 0;
  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return Math.round(entropy * 1000) / 1000;
}

function isIpAddress(hostname) {
  if (!hostname) return false;
  const host = hostname.split(':')[0];
  const ipv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
  if (ipv4) {
    const parts = host.split('.').map(Number);
    return parts.every(p => p >= 0 && p <= 255);
  }
  if (host.startsWith('0x') || /^[0-9]+$/.test(host) && host.length >= 8) return true;
  if (host.includes(':') && host.length > 3) return true;
  return false;
}

function extractRegisteredDomain(hostname) {
  if (!hostname || isIpAddress(hostname)) return [hostname, [], ''];
  const parts = hostname.toLowerCase().split('.');
  if (parts.length <= 1) return [hostname, [], ''];

  const twoPartTlds = new Set(['co.uk','gov.uk','ac.uk','com.au','net.au','co.nz','com.br','co.za']);
  const possibleTwo = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;

  if (parts.length >= 3 && twoPartTlds.has(possibleTwo)) {
    const tld = possibleTwo;
    const registered = `${parts[parts.length - 3]}.${tld}`;
    const subdomains = parts.slice(0, parts.length - 3);
    return [registered, subdomains, tld];
  }

  const tld = parts[parts.length - 1];
  const registered = parts.length >= 2 ? `${parts[parts.length - 2]}.${tld}` : hostname;
  const subdomains = parts.length >= 2 ? parts.slice(0, parts.length - 2) : [];
  return [registered, subdomains, tld];
}

function extractUrlFeatures(rawUrl) {
  let url = rawUrl.trim();
  if (!/^(https?|ftp):\/\//i.test(url)) url = 'http://' + url;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { raw_url: rawUrl, error: true };
  }

  const hostname = parsed.hostname || '';
  const path = parsed.pathname || '';
  const query = parsed.search || '';
  const scheme = parsed.protocol.replace(':', '').toLowerCase();

  const [registeredDomain, subdomains, tld] = extractRegisteredDomain(hostname);
  const isIp = isIpAddress(hostname);

  const domainEntropy = calculateShannonEntropy(hostname);
  const pathEntropy = calculateShannonEntropy(path);

  const searchable = `${rawUrl.toLowerCase()} ${hostname.toLowerCase()} ${path.toLowerCase()} ${query.toLowerCase()}`;
  const detectedKeywords = {};
  let totalSuspiciousKeywords = 0;
  for (const [category, terms] of Object.entries(PHISHING_KEYWORDS)) {
    const found = terms.filter(t => searchable.includes(t));
    if (found.length > 0) {
      detectedKeywords[category] = found;
      totalSuspiciousKeywords += found.length;
    }
  }

  const brandSpoofing = detectBrandSpoofing(registeredDomain, hostname, path);

  return {
    raw_url: rawUrl,
    normalized_url: url,
    scheme,
    is_https: scheme === 'https',
    hostname,
    port: parsed.port ? parseInt(parsed.port) : null,
    path,
    query,
    registered_domain: registeredDomain,
    subdomains,
    subdomain_count: subdomains.length,
    tld,
    is_ip_address: isIp,
    is_shortener: URL_SHORTENERS.has(hostname.toLowerCase()),
    is_high_risk_tld: HIGH_RISK_TLDS.has(tld.toLowerCase()),
    is_trusted_tld: TRUSTED_TLDS.has(tld.toLowerCase()),
    url_length: rawUrl.length,
    host_length: hostname.length,
    path_length: path.length,
    count_dots: rawUrl.split('.').length - 1,
    count_hyphens: rawUrl.split('-').length - 1,
    count_underscores: rawUrl.split('_').length - 1,
    count_at: rawUrl.split('@').length - 1,
    has_at_symbol: rawUrl.includes('@'),
    count_percent: rawUrl.split('%').length - 1,
    count_question: rawUrl.split('?').length - 1,
    count_equal: rawUrl.split('=').length - 1,
    has_double_slash_redirect: path.includes('//'),
    domain_entropy: domainEntropy,
    path_entropy: pathEntropy,
    detected_keywords: detectedKeywords,
    total_suspicious_keywords: totalSuspiciousKeywords,
    brand_spoofing: brandSpoofing
  };
}

module.exports = { extractUrlFeatures, calculateShannonEntropy, isIpAddress };
