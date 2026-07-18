import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiClient } from './_client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { model, history, message, config } = req.body;
    const client = getGeminiClient();
    const cleanHistory = Array.isArray(history) && history.length > 0 ? history.slice(0, -1) : [];
    const chat = client.chats.create({
      model: model || "gemini-3.5-flash",
      history: cleanHistory,
      config
    });

    const responseStream = await chat.sendMessageStream({ message });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (e: any) {
    console.error("Error in /api/gemini/chat-stream serverless route:", e);
    res.status(500).json({ error: e.message || "Chat stream failed" });
  }
}
