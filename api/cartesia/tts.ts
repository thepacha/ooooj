import type { VercelRequest, VercelResponse } from '@vercel/node';

// Inline self-contained text preprocessor for Cartesia TTS to avoid external bundle/path issues on Vercel
function preprocessCartesiaText(text: string): string {
  if (!text) return text;
  let processed = text;
  // 1. Strip markdown symbols that cause speech artifacts (*, _, #, ~)
  processed = processed.replace(/[\*_~`#]/g, '');
  // 2. Convert parenthetical or action descriptions into Cartesia sound tags
  processed = processed.replace(/\(?(laughs|laughing|giggles|giggle|chuckles|chuckle|snickers|snicker|sighs|sigh)\)?/gi, (match, action) => {
    const lower = action.toLowerCase();
    if (lower.includes('chuckle') || lower.includes('snicker')) return '[chuckle]';
    if (lower.includes('giggle')) return '[giggle]';
    if (lower.includes('sigh')) return '[sigh]';
    return '[laughter]';
  });
  // 3. Convert written laughter spellings ("hahaha", "haha", "ha-ha", "ha ha", "hehe", "hehehe", "lol", "lmao", "rofl")
  processed = processed.replace(/\b(ha(ha)+|ha-ha|ha\sha|hehe(he)*|lol|rofl|lmao)\b/gi, (match) => {
    if (match.toLowerCase().startsWith('he')) {
      return '[chuckle]';
    }
    return '[laughter]';
  });
  // 4. Clean up repeated consecutive tags like "[laughter] [laughter]" -> "[laughter]"
  processed = processed.replace(/(\[(laughter|chuckle|giggle|sigh)\]\s*)+/gi, '$1');
  // 5. Ensure space after tags if followed immediately by text
  processed = processed.replace(/(\[(laughter|chuckle|giggle|sigh)\])([A-Za-z])/g, '$1 $3');
  // 6. Normalize multiple spaces
  processed = processed.replace(/\s+/g, ' ').trim();
  return processed;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Safely parse request body if Vercel doesn't pre-parse it
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        return res.status(400).json({ error: "Invalid JSON request body." });
      }
    }

    const { text, voiceId } = body || {};
    
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    if (!voiceId) {
      return res.status(400).json({ error: "Voice ID is required" });
    }

    const apiKey = process.env.CARTESIA_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "CARTESIA_API_KEY is not configured in your server environment variables. Please configure this key in your project settings." });
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

    // Fallback to Grace if voiceId is not found (404) or bad request due to invalid voice (400)
    if (!response.ok && (response.status === 404 || response.status === 400)) {
      console.warn(`Cartesia voice '${voiceId}' returned status ${response.status}. Retrying with guaranteed valid fallback voice ID...`);
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
      return res.status(response.status).json({ error: `Cartesia API error (${response.status}): ${errorText}` });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Length", buffer.length.toString());
    res.send(buffer);

  } catch (error: any) {
    console.error("Error in Cartesia TTS serverless route:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
