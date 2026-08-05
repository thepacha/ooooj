import type { VercelRequest, VercelResponse } from '@vercel/node';
import { preprocessCartesiaText } from '../../lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voiceId } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    if (!voiceId) {
      return res.status(400).json({ error: "Voice ID is required" });
    }

    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "CARTESIA_API_KEY is not configured in environment variables." });
    }

    const formattedTranscript = preprocessCartesiaText(text);

    let response = await fetch("https://api.cartesia.ai/tts/bytes", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Cartesia-Version": "2024-06-10",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model_id: "sonic-3.5",
        transcript: formattedTranscript,
        voice: {
          mode: "id",
          id: voiceId
        },
        output_format: {
          container: "wav",
          encoding: "pcm_s16le",
          sample_rate: 24000
        }
      })
    });

    if (!response.ok && response.status === 404) {
      // Fallback to Grace (c2ad7092-0447-47ea-948b-61fbb6faf153)
      const fallbackVoiceId = "c2ad7092-0447-47ea-948b-61fbb6faf153";
      response = await fetch("https://api.cartesia.ai/tts/bytes", {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Cartesia-Version": "2024-06-10",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model_id: "sonic-3.5",
          transcript: formattedTranscript,
          voice: {
            mode: "id",
            id: fallbackVoiceId
          },
          output_format: {
            container: "wav",
            encoding: "pcm_s16le",
            sample_rate: 24000
          }
        })
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cartesia API Error:", errorText);
      return res.status(response.status).json({ error: `Cartesia API error: ${errorText}` });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/wav");
    res.send(buffer);

  } catch (error: any) {
    console.error("Error in Cartesia TTS serverless route:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
