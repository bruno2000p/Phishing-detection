/**
 * PhishGuard Pro — Brand Typosquatting & Levenshtein Detection Engine (JS Port)
 */

const { TARGETED_BRANDS } = require('./keywords');

const CHAR_SUBSTITUTIONS = {
  '0':'o','1':'l','3':'e','4':'a','5':'s','8':'b','vv':'w','rn':'m','cl':'d'
};

function levenshteinDistance(s1, s2) {
  if (s1.length < s2.length) return levenshteinDistance(s2, s1);
  if (s2.length === 0) return s1.length;
  let prevRow = Array.from({ length: s2.length + 1 }, (_, i) => i);
  for (let i = 0; i < s1.length; i++) {
    const currRow = [i + 1];
    for (let j = 0; j < s2.length; j++) {
      const ins = prevRow[j + 1] + 1;
      const del = currRow[j] + 1;
      const sub = prevRow[j] + (s1[i] !== s2[j] ? 1 : 0);
      currRow.push(Math.min(ins, del, sub));
    }
    prevRow = currRow;
  }
  return prevRow[prevRow.length - 1];
}

function normalizeSubstitutions(text) {
  let result = text.toLowerCase();
  for (const [pseudo, legit] of Object.entries(CHAR_SUBSTITUTIONS)) {
    result = result.split(pseudo).join(legit);
  }
  return result;
}

function detectBrandSpoofing(registeredDomain, fullHost, urlPath) {
  const hostClean = fullHost.toLowerCase().trim();
  const pathClean = urlPath.toLowerCase().trim();
  const domainClean = registeredDomain.toLowerCase().trim();

  // Global legit whitelist check first
  for (const [, legitList] of Object.entries(TARGETED_BRANDS)) {
    if (legitList.some(ld => hostClean === ld || hostClean.endsWith('.' + ld) || domainClean === ld)) {
      return { impersonated: false, brand: null, type: null, details: 'Authentic verified brand domain' };
    }
  }

  const sld = domainClean.includes('.') ? domainClean.split('.')[0] : domainClean;
  const normalizedSld = normalizeSubstitutions(sld);

  for (const [brand, legitDomains] of Object.entries(TARGETED_BRANDS)) {
    // Combosquatting
    if (domainClean.includes(brand) && !legitDomains.includes(domainClean)) {
      return {
        impersonated: true, brand: brand.charAt(0).toUpperCase() + brand.slice(1),
        type: 'Combosquatting',
        details: `Target brand '${brand}' appears in foreign domain '${domainClean}'`
      };
    }
    // Subdomain impersonation
    if (hostClean.includes(brand) && !domainClean.includes(brand)) {
      return {
        impersonated: true, brand: brand.charAt(0).toUpperCase() + brand.slice(1),
        type: 'Subdomain Impersonation',
        details: `Brand '${brand}' masquerades as subdomain under '${domainClean}'`
      };
    }
    // Typosquatting via Levenshtein
    const distDirect = levenshteinDistance(sld, brand);
    const distNorm = levenshteinDistance(normalizedSld, brand);
    const minDist = Math.min(distDirect, distNorm);
    const threshold = brand.length <= 7 ? 1 : 2;
    if (minDist <= threshold && sld !== brand && sld.length >= 3) {
      return {
        impersonated: true, brand: brand.charAt(0).toUpperCase() + brand.slice(1),
        type: 'Typosquatting (Lookalike)',
        details: `Domain '${domainClean}' is ${minDist} edit(s) away from authentic brand '${brand}'`
      };
    }
    // Path brand masquerading
    if (pathClean.includes(`/${brand}/`) || pathClean.includes(`/${brand}-`) || pathClean.includes(`-${brand}/`)) {
      return {
        impersonated: true, brand: brand.charAt(0).toUpperCase() + brand.slice(1),
        type: 'Path Brand Masquerading',
        details: `Brand token '${brand}' placed in URL path on untrusted host '${domainClean}'`
      };
    }
  }

  return { impersonated: false, brand: null, type: null, details: 'No brand impersonation detected' };
}

module.exports = { detectBrandSpoofing, levenshteinDistance };
