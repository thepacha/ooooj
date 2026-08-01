import type { VercelRequest, VercelResponse } from '@vercel/node';
import { preprocessCartesiaText } from '../../lib/utils';

const CARTESIA_LANG_MAP: Record<string, string> = {
  'english': 'en',
  'turkish': 'tr',
  'spanish': 'es',
  'french': 'fr',
  'german': 'de',
  'italian': 'it',
  'japanese': 'ja',
  'chinese': 'zh',
  'korean': 'ko',
  'portuguese': 'pt',
  'russian': 'ru',
  'dutch': 'nl',
  'danish': 'da',
  'arabic': 'ar',
  'swedish': 'sv',
  'hindi': 'hi',
  'polish': 'pl'
};

function getCartesiaLanguageCode(lang: string | undefined): string {
  if (!lang) return 'en';
  const clean = lang.toLowerCase().trim();
  for (const [key, code] of Object.entries(CARTESIA_LANG_MAP)) {
    if (clean.includes(key)) return code;
  }
  return 'en';
}

async function tryDeepgramTTS(text: string): Promise<Buffer | null> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch("https://api.deepgram.com/v1/speak?model=aura-asteria-en", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${apiKey}`
      },
      body: JSON.stringify({ text })
    });
    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      return Buffer.from(arrayBuf);
    }
  } catch (e) {
    console.error("Deepgram fallback error:", e);
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voiceId, language } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    if (!voiceId) {
      return res.status(400).json({ error: "Voice ID is required" });
    }

    const apiKey = process.env.CARTESIA_API_KEY;
    const formattedTranscript = preprocessCartesiaText(text);

    if (apiKey) {
      const langCode = getCartesiaLanguageCode(language);
      let targetVoiceId = voiceId;
      if (!targetVoiceId.includes('-')) {
        targetVoiceId = "c2ad7092-0447-47ea-948b-61fbb6faf153"; // Grace fallback
      }

      const modelsToTry = ["sonic-3", "sonic-latest"];
      
      for (const modelId of modelsToTry) {
        try {
          const bodyObj: any = {
            model_id: modelId,
            transcript: formattedTranscript,
            voice: {
              mode: "id",
              id: targetVoiceId
            },
            output_format: {
              container: "wav",
              encoding: "pcm_s16le",
              sample_rate: 24000
            }
          };

          if (langCode) {
            bodyObj.language = langCode;
          }

          let response = await fetch("https://api.cartesia.ai/tts/bytes", {
            method: "POST",
            headers: {
              "X-API-Key": apiKey,
              "Cartesia-Version": "2024-06-10",
              "Content-Type": "application/json"
            },
            body: JSON.stringify(bodyObj)
          });

          if (!response.ok && (response.status === 404 || response.status === 400 || response.status === 422)) {
            // Fallback voice ID according to language
            const fallbackVoiceId = langCode === 'tr' 
              ? "bb2347fe-69e9-4810-873f-ffd759fe8420" // Aylin (Turkish)
              : "c2ad7092-0447-47ea-948b-61fbb6faf153"; // Grace (English)
            bodyObj.voice.id = fallbackVoiceId;
            response = await fetch("https://api.cartesia.ai/tts/bytes", {
              method: "POST",
              headers: {
                "X-API-Key": apiKey,
                "Cartesia-Version": "2024-06-10",
                "Content-Type": "application/json"
              },
              body: JSON.stringify(bodyObj)
            });
          }

          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            res.setHeader("Content-Type", "audio/wav");
            return res.send(buffer);
          } else {
            const errText = await response.text();
            console.warn(`Cartesia model ${modelId} failed with status ${response.status}:`, errText);
          }
        } catch (cartesiaErr) {
          console.error(`Cartesia API request failed for model ${modelId}:`, cartesiaErr);
        }
      }
    }

    // Try Deepgram Fallback
    const deepgramAudio = await tryDeepgramTTS(text);
    if (deepgramAudio) {
      res.setHeader("Content-Type", "audio/mpeg");
      return res.send(deepgramAudio);
    }

    // Try Gemini Audio Fallback
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Say this clearly in the original language: ${text}` }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Aoede" }
                }
              }
            }
          })
        });
        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const candidate = data.candidates?.[0];
          const part = candidate?.content?.parts?.find((p: any) => p.inlineData?.data);
          if (part?.inlineData?.data) {
            const audioBuffer = Buffer.from(part.inlineData.data, "base64");
            res.setHeader("Content-Type", part.inlineData.mimeType || "audio/pcm");
            return res.send(audioBuffer);
          }
        }
      } catch (gErr) {
        console.error("Gemini TTS fallback error:", gErr);
      }
    }

    return res.status(500).json({ error: "TTS unavailable. Please try again or use standard voice." });

  } catch (error: any) {
    console.error("Error in Cartesia TTS serverless route:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}

