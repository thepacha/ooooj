import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiClient } from './_client';
import { Type } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = getGeminiClient();
    const factors = [
      "Include a VIP customer demanding special treatment.",
      "Include a user who accidentally deleted their data.",
      "Include a sales lead who is budget-conscious.",
      "Include a technical user who thinks they know more than the agent.",
      "Include a user rushing to catch a flight.",
      "Include a user who is pleasantly surprised but has one concern."
    ];
    const randomFactor = factors[Math.floor(Math.random() * factors.length)];
    const seed = Date.now().toString().slice(-4);

    const prompt = `
      Generate 3 distinct, highly realistic customer service roleplay scenarios.
      Random Seed: ${seed}
      Special Constraint: ${randomFactor}
      
      CRITERIA:
      1. Unique Names: Use diverse names and professions (e.g. 'Dr. Aris', 'Captain Lee', 'Sarah the Architect').
      2. Unique Personas: Vary age, job title, and temperament (Angry, Confused, Rush, Happy).
      3. Contexts: Mix of Sales (objections), Technical (bugs), and Support (refunds).
      4. Hidden Secrets: Give each persona a secret (e.g. "lying about usage", "actually broke it themselves", "needs approval from boss").
      5. Voices: Assign a voice that fits the persona from: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'.
      
      Return a JSON object with a "scenarios" key containing an array of 3 objects. Include smart openers for each.
    `;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scenarios: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  difficulty: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced'] },
                  category: { type: Type.STRING, enum: ['Sales', 'Support', 'Technical'] },
                  initialMessage: { type: Type.STRING },
                  systemInstruction: { type: Type.STRING },
                  voice: { type: Type.STRING, enum: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'] },
                  objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                  talkTracks: { type: Type.ARRAY, items: { type: Type.STRING } },
                  openers: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['title', 'description', 'difficulty', 'category', 'initialMessage', 'systemInstruction', 'voice', 'objectives', 'talkTracks', 'openers']
              }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '{"scenarios": []}');
    res.status(200).json(parsed.scenarios || []);
  } catch (e: any) {
    console.error("Error in /api/gemini/generate-training-batch serverless route:", e);
    res.status(500).json({ error: e.message || "Failed to generate training batch" });
  }
}
