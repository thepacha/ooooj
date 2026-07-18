import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiClient } from './_client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { params } = req.body;
    const client = getGeminiClient();
    let contextStr = '';
    if (params) {
      contextStr = `
      Please tailor the topic to the following parameters:
      - Language: ${params.language}
      - Buyer Mode: ${params.mood}
      - Persona: ${params.persona}
      - Difficulty: ${params.difficulty}
      - Industry: ${params.industry}
      - Funnel Stage: ${params.funnelStage}
      - Category: ${params.category}
      `;
    }
    const prompt = `
      Generate a single, concise, and creative scenario description for a customer service or sales roleplay training session.
      It should be 1-2 sentences.
      ${contextStr}
      
      Examples:
      - "A long-time customer is threatening to cancel because a competitor offered a lower price."
      - "A confused user cannot find the export button and is getting frustrated."
      - "A potential client is interested in the Enterprise plan but thinks the implementation time is too long."
      
      Return ONLY the text of the scenario description. No JSON, no markdown.
    `;
    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt
    });
    res.status(200).json({ text: response.text?.trim() || "" });
  } catch (e: any) {
    console.error("Error in /api/gemini/generate-training-topic serverless route:", e);
    res.status(500).json({ error: e.message || "Failed to generate training topic" });
  }
}
