import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiClient } from './_client';
import { Modality } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, dialect, voice } = req.body;
    const client = getGeminiClient();
    const prompt = `Speak this text in ${dialect} Arabic: ${text}`;
    const response = await client.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("Failed to generate audio from Gemini TTS");
    }
    res.status(200).json({ base64Audio });
  } catch (e: any) {
    console.error("Error in /api/gemini/generate-arabic-tts serverless route:", e);
    res.status(500).json({ error: e.message || "Failed to generate Arabic TTS" });
  }
}
