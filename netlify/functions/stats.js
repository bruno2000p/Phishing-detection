/**
 * Netlify Serverless Function: GET /api/stats
 * Returns system health and static demo statistics for the Netlify deployment.
 * (No persistent database on Netlify — returns demo telemetry)
 */

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const stats = {
    total_scans: 1247,
    safe_count: 731,
    suspicious_count: 198,
    phishing_count: 318,
    phishing_percentage: 25.5,
    safe_percentage: 58.6,
    average_risk_score: 38.4,
    avg_latency_ms: 14.5,
    engine: 'PhishGuard Heuristic + Shannon Entropy + Levenshtein Brand Guard v2.4',
    deployed_on: 'Netlify Edge Functions',
    status: 'operational'
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ status: 'success', stats })
  };
};
