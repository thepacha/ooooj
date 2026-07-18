import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiClient } from './_client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, contents, config } = req.body;
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: model || "gemini-3.5-flash",
      contents,
      config
    });
    res.status(200).json({
      text: response.text,
      candidates: response.candidates
    });
  } catch (e: any) {
    console.error("Error in /api/gemini/generate-content serverless route:", e);
    res.status(500).json({ error: e.message || "Failed to generate content" });
  }
}
