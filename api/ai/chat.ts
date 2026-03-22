import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const { messages, systemInstruction } = request.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return response.status(500).json({ error: "GEMINI_API_KEY is not set" });
  }

  if (!messages || !Array.isArray(messages)) {
    return response.status(400).json({ error: "Invalid messages array" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages,
      config: {
        systemInstruction: systemInstruction || "You are a helpful assistant.",
      },
    });

    const text = result.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    return response.status(200).json({ text });
  } catch (error: any) {
    console.error("AI Chat error:", error);
    return response.status(500).json({ error: error.message || "Failed to generate AI response" });
  }
}
