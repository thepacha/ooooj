import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  return response.status(200).json({
    deepgram: !!process.env.DEEPGRAM_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
  });
}
