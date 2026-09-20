/**
 * Netlify Serverless Function: GET /api/history
 * Returns an empty scan history (no persistent DB on Netlify serverless).
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

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      status: 'success',
      note: 'History is session-based on Netlify (no persistent DB). Use the scan results directly.',
      history: []
    })
  };
};
