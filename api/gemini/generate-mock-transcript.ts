import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiClient } from './_client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: "Generate a realistic 10-turn customer support transcript between an Agent and a Customer regarding a billing dispute. The customer should be slightly annoyed but the agent resolves it. Format it as plain text.",
    });
    res.status(200).json({ text: response.text || "" });
  } catch (e: any) {
    console.error("Error in /api/gemini/generate-mock-transcript serverless route:", e);
    res.status(500).json({ error: e.message || "Failed to generate mock transcript" });
  }
}
