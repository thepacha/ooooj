import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiClient } from './_client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { base64Data, mimeType } = req.body;
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Transcribe this audio. Return only the transcript text with speaker labels (Agent/Customer)." }
        ]
      }
    });
    res.status(200).json({ text: response.text || "" });
  } catch (e: any) {
    console.error("Error in /api/gemini/transcribe-media serverless route:", e);
    res.status(500).json({ error: e.message || "Failed to transcribe media" });
  }
}
