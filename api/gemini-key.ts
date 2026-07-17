import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Support both GET and POST for maximum compatibility
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  
  if (!key) {
    console.error("GEMINI_API_KEY is not configured on the server environment.");
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  // Set standard CORS and cache-control headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Return both 'key' and 'apiKey' fields to be perfectly compatible with any client version
  return res.status(200).json({
    key: key,
    apiKey: key
  });
}
