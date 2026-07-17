import type { VercelRequest, VercelResponse } from '@vercel/node';

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

    let response = await fetch("https://api.cartesia.ai/tts/bytes", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Cartesia-Version": "2024-06-10",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model_id: "sonic-3.5",
        transcript: text,
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
      console.warn(`Cartesia voice '${voiceId}' returned 404. Retrying with guaranteed valid multilingual voice ID...`);
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
          transcript: text,
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

    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Transfer-Encoding", "chunked");

    if (response.body) {
      if (typeof (response.body as any).pipe === "function") {
        (response.body as any).pipe(res);
      } else if (typeof response.body.getReader === "function") {
        const reader = response.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(Buffer.from(value));
          }
          res.end();
        } catch (streamError) {
          console.error("Error reading stream from Cartesia:", streamError);
          if (!res.headersSent) {
            res.status(500).end();
          }
        } finally {
          reader.releaseLock();
        }
      } else if (Symbol.asyncIterator in response.body) {
        try {
          for await (const chunk of (response.body as any)) {
            res.write(Buffer.from(chunk));
          }
          res.end();
        } catch (streamError) {
          console.error("Error reading stream from Cartesia:", streamError);
          if (!res.headersSent) {
            res.status(500).end();
          }
        }
      } else {
        const arrayBuffer = await response.arrayBuffer();
        res.write(Buffer.from(arrayBuffer));
        res.end();
      }
    } else {
      res.status(500).json({ error: "Cartesia response body is empty" });
    }
  } catch (error: any) {
    console.error("Error in Cartesia TTS route:", error);
    res.status(500).json({ 
      error: error.message || "Internal server error",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
