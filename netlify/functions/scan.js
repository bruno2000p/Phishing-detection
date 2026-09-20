/**
 * Netlify Serverless Function: POST /api/scan
 * Scans a single URL and returns full forensic analysis.
 */

const { extractUrlFeatures } = require('./lib/analyzer');
const { calculateRiskScore } = require('./lib/scorer');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const url = (body.url || '').trim();

    if (!url) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'URL parameter is required.' }) };
    }
    if (url.length > 2048) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'URL exceeds maximum length (2048 chars).' }) };
    }

    const start = Date.now();
    const features = extractUrlFeatures(url);

    if (features.error) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid or unparseable URL.' }) };
    }

    const scoreResult = calculateRiskScore(features);
    const latencyMs = Date.now() - start;

    const payload = {
      id: Math.floor(Math.random() * 1000000),
      url: features.raw_url,
      normalized_url: features.normalized_url,
      domain: features.registered_domain,
      hostname: features.hostname,
      tld: features.tld,
      is_https: features.is_https,
      is_ip_address: features.is_ip_address,
      domain_entropy: features.domain_entropy,
      path_entropy: features.path_entropy,
      risk_score: scoreResult.risk_score,
      verdict: scoreResult.verdict,
      verdict_color: scoreResult.verdict_color,
      risk_level: scoreResult.risk_level,
      confidence_percentage: scoreResult.confidence_percentage,
      recommendation: scoreResult.recommendation,
      signals: scoreResult.signals,
      features,
      latency_ms: latencyMs,
      scanned_at: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'success', data: payload })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: `Scan failed: ${err.message}` })
    };
  }
};
