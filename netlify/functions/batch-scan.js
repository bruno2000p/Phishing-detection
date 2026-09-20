/**
 * Netlify Serverless Function: POST /api/batch-scan
 * Scans up to 50 URLs concurrently and returns summarized results.
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
    const urls = body.urls;

    if (!Array.isArray(urls) || urls.length === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "A list of 'urls' is required." }) };
    }

    const results = urls.slice(0, 50).map((rawUrl) => {
      const u = String(rawUrl).trim();
      if (!u) return null;
      try {
        const features = extractUrlFeatures(u);
        if (features.error) return { url: u, error: 'Parsing failed' };
        const score = calculateRiskScore(features);
        return {
          id: Math.floor(Math.random() * 1000000),
          url: u,
          domain: features.registered_domain,
          risk_score: score.risk_score,
          verdict: score.verdict,
          verdict_color: score.verdict_color,
          signals_count: score.signals.length
        };
      } catch {
        return { url: u, error: 'Parsing failed' };
      }
    }).filter(Boolean);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ status: 'success', total: results.length, results })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: `Batch scan failed: ${err.message}` })
    };
  }
};
