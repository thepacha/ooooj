import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiClient } from './_client';
import { Type } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { scenario } = req.body;
    const client = getGeminiClient();
    const prompt = `
      Generate 4 distinct, professional, and highly effective opening lines for a customer service agent handling this specific situation.
      
      SCENARIO: ${scenario.title}
      DESCRIPTION: ${scenario.description}
      CUSTOMER PERSONA: ${scenario.systemInstruction}
      GOAL: Resolve the issue efficiently while maintaining high empathy.
      
      LANGUAGE: ${scenario.language || 'English'}
      DIALECT: ${scenario.dialect || 'N/A'}

      REQUIREMENTS:
      1. Openers must be "Smart" & "Professional" - avoid generic "How can I help?".
      2. Tailor them to the specific context (e.g. if angry, validate emotion first).
      3. Use psychological techniques (e.g. labeling, agenda setting).
      4. Make them sound human, not robotic.
      5. The openers MUST be in the specified LANGUAGE and DIALECT.

      Return strictly a JSON array of strings.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    res.status(200).json(JSON.parse(response.text || "[]"));
  } catch (e: any) {
    console.error("Error in /api/gemini/generate-smart-openers serverless route:", e);
    res.status(500).json({ error: e.message || "Failed to generate smart openers" });
  }
}
