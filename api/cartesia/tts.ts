import type { VercelRequest, VercelResponse } from '@vercel/node';

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
  // into Cartesia audio tags [laughter] or [chuckle]
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

async function tryDeepgramTTS(text: string): Promise<Buffer | null> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    console.warn("[TTS Fallback] DEEPGRAM_API_KEY is missing.");
    return null;
  }
  try {
    console.log("[TTS Fallback] Attempting Deepgram TTS...");
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
      console.log("[TTS Fallback] Deepgram TTS succeeded.");
      return Buffer.from(arrayBuf);
    } else {
      const errText = await res.text();
      console.error(`[TTS Fallback] Deepgram API returned status ${res.status}:`, errText);
    }
  } catch (e) {
    console.error("[TTS Fallback] Deepgram fallback error:", e);
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voiceId, language } = req.body;
    console.log(`[Cartesia TTS Route] Incoming request: voiceId="${voiceId}", language="${language}", textLength=${text?.length || 0}`);
    
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    if (!voiceId) {
      return res.status(400).json({ error: "Voice ID is required" });
    }

    const apiKey = process.env.CARTESIA_API_KEY;
    const formattedTranscript = preprocessCartesiaText(text);

    console.log(`[Cartesia TTS Route] CARTESIA_API_KEY presence: ${apiKey ? "YES (configured)" : "NO (missing)"}`);

    if (apiKey) {
      const langCode = getCartesiaLanguageCode(language);
      let targetVoiceId = voiceId;
      if (!targetVoiceId.includes('-')) {
        targetVoiceId = "c2ad7092-0447-47ea-948b-61fbb6faf153"; // Grace fallback
      }

      const modelsToTry = ["sonic-3", "sonic-latest"];
      
      for (const modelId of modelsToTry) {
        try {
          console.log(`[Cartesia TTS Route] Attempting model="${modelId}" for voiceId="${targetVoiceId}" and langCode="${langCode}"`);
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
            console.warn(`[Cartesia TTS Route] First attempt failed with status ${response.status}. Trying fallback voice ID...`);
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
            console.log(`[Cartesia TTS Route] Cartesia generation succeeded. Audio size: ${buffer.length} bytes`);
            res.setHeader("Content-Type", "audio/wav");
            return res.send(buffer);
          } else {
            const errText = await response.text();
            console.warn(`[Cartesia TTS Route] Cartesia model ${modelId} failed with status ${response.status}:`, errText);
          }
        } catch (cartesiaErr) {
          console.error(`[Cartesia TTS Route] Cartesia API request failed for model ${modelId}:`, cartesiaErr);
        }
      }
    } else {
      console.warn("[Cartesia TTS Route] Skipping Cartesia generation since CARTESIA_API_KEY is not defined in the environment.");
    }

    // Try Deepgram Fallback
    console.log("[Cartesia TTS Route] Cartesia failed or was skipped. Trying Deepgram fallback...");
    const deepgramAudio = await tryDeepgramTTS(text);
    if (deepgramAudio) {
      res.setHeader("Content-Type", "audio/mpeg");
      return res.send(deepgramAudio);
    }

    // Try Gemini Audio Fallback
    console.log("[Cartesia TTS Route] Deepgram fallback failed or skipped. Trying Gemini fallback...");
    const geminiApiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    console.log(`[Cartesia TTS Route] GEMINI_API_KEY presence: ${geminiApiKey ? "YES" : "NO"}`);
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
            console.log(`[Cartesia TTS Route] Gemini fallback succeeded. Audio size: ${audioBuffer.length} bytes`);
            res.setHeader("Content-Type", part.inlineData.mimeType || "audio/pcm");
            return res.send(audioBuffer);
          } else {
            console.error("[Cartesia TTS Route] Gemini response did not contain audio inlineData.");
          }
        } else {
          const errText = await geminiRes.text();
          console.error(`[Cartesia TTS Route] Gemini fallback API returned status ${geminiRes.status}:`, errText);
        }
      } catch (gErr) {
        console.error("[Cartesia TTS Route] Gemini TTS fallback error:", gErr);
      }
    }

    console.error("[Cartesia TTS Route] All TTS options failed. Returning 500.");
    return res.status(500).json({ error: "TTS unavailable. Please verify API keys are configured correctly or try again later." });

  } catch (error: any) {
    console.error("[Cartesia TTS Route] Error in Cartesia TTS serverless route:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
