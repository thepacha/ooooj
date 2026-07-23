import { AnalysisResult, Criteria, TrainingResult, TrainingScenario } from "../types";

export enum Modality {
  AUDIO = "AUDIO",
  TEXT = "TEXT"
}

export enum Type {
  OBJECT = "OBJECT",
  ARRAY = "ARRAY",
  STRING = "STRING",
  NUMBER = "NUMBER",
  INTEGER = "INTEGER",
  BOOLEAN = "BOOLEAN"
}

export interface GenerateScenarioParams {
  topic?: string;
  category: string;
  difficulty: string;
  funnelStage?: string;
  persona?: string;
  mood?: string;
  industry?: string;
  language?: string;
  dialect?: string;
}

// Client-side mock of Chat session that redirects requests to server REST API
class ServerSideChatProxy {
  private history: any[] = [];
  private model: string;
  private config: any;

  constructor(config: any) {
    this.model = config?.model || 'gemini-3.5-flash';
    this.config = config || {};
    if (this.config.systemInstruction) {
      this.history.push({ role: 'user', parts: [{ text: this.config.systemInstruction }] });
      this.history.push({ role: 'model', parts: [{ text: 'Understood. I will stay in this role.' }] });
    }
  }

  async sendMessage(params: { message: string }) {
    this.history.push({ role: 'user', parts: [{ text: params.message }] });
    const response = await fetch('/api/gemini?action=chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        history: this.history,
        message: params.message,
        config: this.config
      })
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to send message');
    }
    const data = await response.json();
    this.history.push({ role: 'model', parts: [{ text: data.text }] });
    return { text: data.text };
  }

  async sendMessageStream(params: { message: string }) {
    this.history.push({ role: 'user', parts: [{ text: params.message }] });
    const response = await fetch('/api/gemini?action=chat-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        history: this.history,
        message: params.message,
        config: this.config
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Stream request failed');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const history = this.history;
    let fullResponse = '';

    return {
      async *[Symbol.asyncIterator]() {
        if (!reader) return;
        try {
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                if (dataStr === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.text) {
                    fullResponse += parsed.text;
                    yield { text: parsed.text };
                  }
                } catch (e) {
                  // Ignore partial parse failures
                }
              }
            }
          }
          history.push({ role: 'model', parts: [{ text: fullResponse }] });
        } finally {
          reader.releaseLock();
        }
      }
    };
  }
}

class GoogleGenAIProxy {
  models = {
    generateContent: async (params: { model: string, contents: any, config?: any }) => {
      const response = await fetch('/api/gemini?action=generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate content');
      }
      return await response.json();
    }
  };

  chats = {
    create: (config: any) => {
      return new ServerSideChatProxy(config);
    }
  };
}

export const getAI = () => {
  return new GoogleGenAIProxy();
};

export const createChatSession = (): any => {
  return new ServerSideChatProxy({
    model: 'gemini-3.5-flash',
    systemInstruction: "You are RevuBot, a helpful QA assistant for customer support teams. You help analyze performance, suggest coaching tips, and explain metrics. Be professional and encouraging."
  });
};

export const getLevelInstruction = (difficulty: string, language: string) => {
  const diff = (difficulty || 'B1').toUpperCase();
  if (diff === 'A1' || diff === 'BEGINNER') {
    return `
      - TARGET FLUENCY LEVEL: A1 (BEGINNER).
      - SPEAKING COMPLEXITY: Speak extremely slowly, with clear pauses between words. Keep your sentences super short (3-5 words max, e.g. "Hola. ¿Cómo estás?").
      - VOCABULARY: Use only the absolute most basic, elementary vocabulary (<300 common words). Use present tense only. No idioms, slang, or fast phrasing.
      - ACCENTED ENGLISH CLARIFICATION PROTOCOL (VERY IMPORTANT): If the user is silent, hesitates, stumbles, or explicitly asks for clarification, help, or translation in English (e.g., "what does that mean?", "can you say that in English?", "how do you say..."):
        * Respond in English with a very distinct, heavy ${language}-styled accent (e.g. if Spanish target language, speak English with a heavy Spanish accent: "Ah, *sí*, I asked: how are you? You can say: 'Muy bien, gracias'.").
        * Keep the English clarification extremely brief (under 8 words).
        * Immediately guide them back to ${language} and prompt them to try speaking again.
    `;
  }
  if (diff === 'A2' || diff === 'ELEMENTARY') {
    return `
      - TARGET FLUENCY LEVEL: A2 (ELEMENTARY).
      - SPEAKING COMPLEXITY: Speak slowly, gently, and clearly. Use simple, direct sentence structures (1 short sentence max).
      - VOCABULARY: Use basic everyday vocabulary (<800 words). Stick to present tense and simple past/future when necessary. Avoid complex idioms.
      - ACCENTED ENGLISH CLARIFICATION PROTOCOL (VERY IMPORTANT): If the user struggles, gets stuck, or asks for help/clarification in English:
        * Respond in English with a distinct, charming ${language}-native accent and provide a very brief hint or translation (e.g., "Ah, yes, that means 'I am hungry'. You can say 'Tengo hambre'.").
        * Keep the English explanation under 10 words.
        * Immediately pivot back to ${language} and let them try.
    `;
  }
  if (diff === 'B1' || diff === 'INTERMEDIATE') {
    return `
      - TARGET FLUENCY LEVEL: B1 (INTERMEDIATE).
      - SPEAKING COMPLEXITY: Speak at a clear, comfortable, moderate pace. Use standard sentence structures (1-2 clear sentences).
      - VOCABULARY: Use common everyday words. Avoid complex, archaic, or highly technical vocabulary. Use standard past, present, and future tenses.
      - ACCENTED ENGLISH CLARIFICATION PROTOCOL: If the user gets stuck or asks for translation:
        * First, try to explain it in very simple ${language} words.
        * If they still ask for English help, provide a very short accented English translation of the key phrase, then return to ${language} immediately.
    `;
  }
  if (diff === 'B2' || diff === 'UPPER INTERMEDIATE') {
    return `
      - TARGET FLUENCY LEVEL: B2 (UPPER INTERMEDIATE).
      - SPEAKING COMPLEXITY: Speak at a standard, natural, fluid pace. Use compound sentences and standard connectors (1-2 sentences).
      - VOCABULARY: Use standard everyday language, including common conversational idioms and natural casual phrasing.
      - ACCENTED ENGLISH CLARIFICATION PROTOCOL: Only use accented English if they are completely stuck or explicitly ask "What does that mean in English?" or "Translate that please". Provide a very quick translated phrase with a natural native accent, then immediately resume the conversation in ${language} at natural speed.
    `;
  }
  if (diff === 'C1' || diff === 'ADVANCED') {
    return `
      - TARGET FLUENCY LEVEL: C1 (ADVANCED).
      - SPEAKING COMPLEXITY: Speak at a fully natural, native conversational pace. Use complex structures, subordinate clauses, and standard native pacing.
      - VOCABULARY: Use rich, varied, and sophisticated vocabulary, native-level colloquialisms, and common local idioms.
      - DIALECTAL FLAVOR: Infuse authentic local expressions and slang matching the dialect.
      - INTERACTION: Challenge the user with open-ended, analytical questions. Do NOT use any English or translations. If they ask for translation, explain the concept or word using synonyms or descriptions in ${language} only, encouraging them to expand their vocabulary and stay immersed.
    `;
  }
  if (diff === 'C2' || diff === 'PROFICIENT') {
    return `
      - TARGET FLUENCY LEVEL: C2 (PROFICIENT).
      - SPEAKING COMPLEXITY: Speak like you are talking to another highly proficient or native peer. Use full-speed, natural native conversational flow, including rapid transitions, contractions, and subtle intonations.
      - VOCABULARY: Use advanced cultural expressions, rare idioms, double-entendres, and highly descriptive vocabulary.
      - INTERACTION: Engage in a rich, active, and fast-paced debate or high-level dialogue. Do NOT use any English under any circumstances. If they ask for help, respond as a native friend would, using creative phrasing, metaphors, or idioms in ${language} to clarify.
    `;
  }
  // Fallback
  return `
    - TARGET FLUENCY LEVEL: INTERMEDIATE (B1 - B2).
    - Speak at a moderate, clear pace.
    - Use standard everyday vocabulary and clear, standard sentence structures.
    - Feel free to include common conversational idioms and expressions, but keep the overall content accessible, friendly, and structured.
  `;
};

export const createTrainingSession = (scenario: TrainingScenario): any => {
  const difficulty = scenario.difficulty || 'B1';
  const language = scenario.language || 'English';
  const difficultyInstruction = getLevelInstruction(difficulty, language);

  const strictProtocol = `
      IMPORTANT: YOU ARE A FRIENDLY NATIVE CONVERSATION PARTNER.
      YOU ARE HAVING A CASUAL, REAL-LIFE CONVERSATION TO HELP THE USER PRACTICE THE TARGET LANGUAGE (${scenario.language || 'English'}).
      
      YOUR ROLE:
      1. Speak naturally, warmly, and helpfully. Be a supportive conversation partner.
      2. Keep the conversation focused on the scenario topic/situation: "${scenario.title}" (${scenario.description}).
      3. CRITICAL SPEAKING RATIO: The user MUST speak 65% to 80% of the conversation. Therefore, you must keep your turns extremely concise (1-2 sentences max). Do NOT write long paragraphs. Always end your turns with a supportive, open-ended question or prompt that passes the floor back to the user, encouraging them to speak the vast majority of the time.
      4. Never act as a dry AI assistant, and never mention "As an AI". Act as a real friend or local in this situation.
      
      LANGUAGE: ${scenario.language || 'English'}
      DIALECT: ${scenario.dialect || 'N/A'}
      
      ${difficultyInstruction}

      CRITICAL LANGUAGE INSTRUCTION:
      You MUST speak exclusively in the specified LANGUAGE and DIALECT. 
      ${scenario.language === 'Arabic' ? 'If the language is Arabic, you MUST use the specified dialect (e.g., Egyptian, Gulf, Levantine, Maghrebi, or Standard) in your vocabulary and grammar.' : ''}
      Do NOT break character or switch to English unless the user explicitly asks for translation or help.
      
      HUMAN CONVERSATION RULES:
      - Be patient. If the user makes a mistake, do not stop to correct them in the middle of conversation (this will be done in the scorecard later). Keep the conversation flowing naturally!
      - Speak like a native. Use typical casual phrasing, natural transitions, and friendly expressions.
      
      CONTEXT:
      The conversation has already started. You have just said: "${scenario.initialMessage}".
      Wait for the user's response to this statement, then continue the friendly practice conversation naturally.
  `;

  return new ServerSideChatProxy({
    model: 'gemini-3.5-flash',
    systemInstruction: strictProtocol,
    temperature: 1.2,
    topK: 64,
  });
};

export const analyzeTranscript = async (transcript: string, criteria: Criteria[], userId?: string): Promise<any> => {
  const response = await fetch('/api/gemini?action=analyze-transcript', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, criteria, userId })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to analyze transcript');
  }
  return await response.json();
};

export const generateMockTranscript = async (): Promise<string> => {
  const response = await fetch('/api/gemini?action=generate-mock-transcript', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to generate mock transcript');
  }
  const data = await response.json();
  return data.text;
};

export const transcribeMedia = async (base64Data: string, mimeType: string, userId?: string): Promise<string> => {
  const response = await fetch('/api/gemini?action=transcribe-media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Data, mimeType, userId })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to transcribe media');
  }
  const data = await response.json();
  return data.text;
};

export const generateTrainingTopic = async (params?: GenerateScenarioParams): Promise<string> => {
  const response = await fetch('/api/gemini?action=generate-training-topic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ params })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to generate training topic');
  }
  const data = await response.json();
  return data.text;
};

export const generateAIScenario = async (params: GenerateScenarioParams): Promise<any> => {
  const response = await fetch('/api/gemini?action=generate-ai-scenario', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ params })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to generate AI scenario');
  }
  return await response.json();
};

export const generateTrainingBatch = async (): Promise<any[]> => {
  const response = await fetch('/api/gemini?action=generate-training-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to generate training batch');
  }
  return await response.json();
};

export const generateSmartOpeners = async (scenario: any): Promise<string[]> => {
  const response = await fetch('/api/gemini?action=generate-smart-openers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to generate smart openers');
  }
  return await response.json();
};

export const evaluateTrainingSession = async (transcript: string, scenario: any): Promise<any> => {
  const response = await fetch('/api/gemini?action=evaluate-training-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, scenario })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to evaluate training session');
  }
  return await response.json();
};

export const generateArabicTTS = async (text: string, dialect: string, voice: string = 'Kore'): Promise<string> => {
  const response = await fetch('/api/gemini?action=generate-arabic-tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, dialect, voice })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Failed to generate Arabic TTS');
  }
  const data = await response.json();
  return data.base64Audio;
};

export const GEMINI_MALE_VOICES = ["Puck", "Charon", "Fenrir"];
export const GEMINI_FEMALE_VOICES = ["Zephyr", "Aoede", "Kore"];
export const GEMINI_VOICES = [...GEMINI_MALE_VOICES, ...GEMINI_FEMALE_VOICES];

const KNOWN_MALE_VOICE_IDS = new Set([
  '56c7989e-7a5f-4d12-838f-e0f910e7356e', '3d83e30f-c31b-4f26-b442-7075feafa53a', 'eda5bbff-1ff1-4886-8ef1-4e69a77640a0',
  '7e2a44d1-76b8-42b8-9507-fedfe3a803c8', '4b250449-c635-4b63-bd1d-b654b12ffcd4', 'af482421-80f4-4379-b00c-a118def29cde',
  '0418348a-0ca2-4e90-9986-800fb8b3bbc0', '93c98a2b-7d15-4f7b-8236-294b1e02b1c0', '42f14755-88c3-4124-aae3-5cc3a9618e8f',
  '2be00b67-d53f-4eb5-89e7-96c224d56fbc', 'e019ed7e-6079-4467-bc7f-b599a5dccf6f', '88b329db-85d7-47cc-a5c5-98225a756721',
  '6b92f628-be90-497c-8f4c-3b035002df71', '9436e723-612d-4114-aeb0-fa00d4d639bf', 'f7755efb-1848-4321-aa22-5e5be5d32486',
  '537a82ae-4926-4bfb-9aec-aff0b80a12a5', 'b603811e-54c2-4a0a-8854-09eab9ffa63f', '07b6f895-78b9-4921-8e10-8a21c99c2e8a',
  '1e4176b1-3db9-44d6-a601-4fe68b041942', '888b7df4-e165-4852-bfec-0ab2b96aaa46', '3efb11f3-4c0e-43c2-bad5-85ab99e993e2',
  '4853bafa-52cc-48c8-86a1-1edf8c76e429', '91e91d74-8eb4-43cd-97d3-7466c21db00d', '5a31e4fb-f823-4359-aa91-82c0ae9a991c',
  '926e0766-f380-4d77-aeb0-9aa4ebb16b38', 'a466f9e2-28eb-4bb7-925c-8e8984950700'
]);

export function resolveVoiceForScenario(scenario: any): { voiceName: string; isMale: boolean } {
  const voiceRaw = scenario?.voice || '';

  if (GEMINI_VOICES.includes(voiceRaw)) {
    const isM = GEMINI_MALE_VOICES.includes(voiceRaw);
    return { voiceName: voiceRaw, isMale: isM };
  }

  if (KNOWN_MALE_VOICE_IDS.has(voiceRaw)) {
    return { voiceName: 'Fenrir', isMale: true };
  }

  const text = `${scenario?.title || ''} ${scenario?.description || ''} ${scenario?.systemInstruction || ''} ${voiceRaw}`.toLowerCase();
  
  const maleKeywords = [
    'lucas', 'tristan', 'wade', 'kai', 'jian', 'jeroen', 'antoine', 'mathieu', 'jan', 'dieter', 
    'luca', 'giuseppe', 'kenji', 'katsuya', 'ryeowook', 'minho', 'bruno', 'rafael', 'sergei', 
    'dmitri', 'eduardo', 'alonso', 'aykut', 'murat', 'soren', 'søren', 'baritone', 'doctor', 
    'male', 'he', 'him', 'his', 'guy', 'mülakat', 'mülakatı yapan', 'bay'
  ];

  const isMale = maleKeywords.some(kw => text.includes(kw));

  if (isMale) {
    return { voiceName: 'Fenrir', isMale: true };
  }

  return { voiceName: 'Aoede', isMale: false };
}

export const connectLiveTraining = async (scenario: TrainingScenario, callbacks: {
  onOpen: () => void,
  onMessage: (msg: any) => void,
  onError: (e: any) => void,
  onClose: () => void
}): Promise<any> => {
  const difficulty = scenario.difficulty || 'B1';
  const language = scenario.language || 'English';
  const difficultyInstruction = getLevelInstruction(difficulty, language);

  const { voiceName: resolvedVoiceName, isMale } = resolveVoiceForScenario(scenario);

  const partnerPersona = scenario.systemInstruction || `You are ${scenario.title || 'a friendly conversation partner'}.`;

  const strictVoiceProtocol = `
      ROLE & PERSONA:
      ${partnerPersona}
      
      CRITICAL ROLEPLAY DIRECTIVES:
      - You MUST strictly embody the role and persona defined above.
      - NEVER break character. NEVER claim your name is "Lucas" or "Elena" unless your specific scenario persona explicitly specifies that name.
      - GENDER IDENTITY: You are a ${isMale ? 'MALE' : 'FEMALE'} speaker with a natural ${isMale ? 'male' : 'female'} voice (${resolvedVoiceName}).
      
      CONVERSATION PRACTICE LANGUAGE: ${scenario.language || 'English'}
      EXPECTED AUDIO INPUT LANGUAGE: ${scenario.language || 'English'}
      
      CRITICAL AUDIO TRANSCRIPTION DIRECTIVE:
      - Transcribe all user spoken audio accurately into text as uttered.
      - ALWAYS output the user's spoken audio transcription so the user can review what they said.
      - The user is practicing ${scenario.language || 'English'} ${scenario.dialect ? `(${scenario.dialect} dialect)` : ''}.
      - If the user speaks in ${scenario.language || 'English'}, continue the practice naturally in ${scenario.language || 'English'}.
      - If the user speaks in another language (e.g. French, Spanish, Portuguese, Hindi), transcribe their spoken text accurately, and respond in ${scenario.language || 'English'} encouraging them to speak in ${scenario.language || 'English'}.
      
      SCENARIO: ${scenario.title}
      CONTEXT: ${scenario.description}
      
      LANGUAGE: ${scenario.language || 'English'}
      DIALECT: ${scenario.dialect || 'N/A'}
      
      ${difficultyInstruction}

      CRITICAL LANGUAGE INSTRUCTION:
      You MUST speak exclusively in the specified LANGUAGE and DIALECT. 
      ${scenario.language === 'Arabic' ? 'If the language is Arabic, you MUST use the specified dialect (e.g., Egyptian, Gulf, Levantine, Maghrebi, or Standard) in your pronunciation, vocabulary, and grammar.' : ''}
      Do NOT switch to English or use another language unless explicitly asked for translation help as defined in the Accented English Clarification Protocol.
      
      INSTRUCTIONS FOR HUMAN, SPONTANEOUS REAL-LIFE SPEAKING:
      1. Be smart, adaptive, highly human, and spontaneous. NEVER use repetitive, robotic, or canned openers or responses. Vary your sentence structure, vocabulary, and phrasing every single turn.
      2. Speak naturally and warmly. Use realistic conversational fillers like "um", "uh", "you know", "like" occasionally to sound 100% human.
      3. CRITICAL SPEAKING RATIO: The user MUST speak 65% to 80% of the conversation. Therefore, you must keep your answers extremely brief (1-2 sentences max) so the Learner gets plenty of opportunities to speak and is forced to formulate the bulk of the speech. Never dominate or speak in paragraphs.
      4. Ask engaging open-ended questions related to the scenario to keep the conversation flowing smoothly, prompting the Learner for detailed spoken answers.
      5. Be patient and encouraging.
      6. HUMAN LAUGHTER & EMOTION: When responding to jokes, humor, or lighthearted moments, express natural warmth and laughter using emotion tags like [laughter] or [chuckle] (e.g. "Oh that's hilarious! [laughter]"). NEVER output plain text spellings like "haha", "hahaha", "ha-ha", or "LOL".
  `;

  const selectedVoice = resolvedVoiceName;

  // Check if we are running in a serverless/Vercel environment or custom domain
  const isVercelOrCustom = window.location.hostname.includes("vercel") || 
                           window.location.hostname.includes("revuqai.com");

  if (isVercelOrCustom) {
    try {
      console.log("Serverless/Vercel environment detected. Fetching API key for direct browser-to-upstream Gemini Live connection...");
      const keyRes = await fetch("/api/gemini?action=get-live-key");
      const { apiKey } = await keyRes.json();
      
      if (!apiKey) {
        throw new Error("Gemini API key is not configured on the server.");
      }

      // Standard Gemini Live prebuilt voices
      const GEMINI_VOICES = ["Puck", "Charon", "Kore", "Fenrir", "Zephyr", "Aoede"];
      const geminiVoice = GEMINI_VOICES.includes(selectedVoice) ? selectedVoice : "Zephyr";

      // Direct upstream Gemini Multimodal Live API endpoint
      const upstreamUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      console.log("Connecting directly to upstream Google Gemini Live API...");
      const ws = new WebSocket(upstreamUrl);

      ws.onopen = () => {
        console.log("Direct connection established. Sending setup message...");
        const setupMessage = {
          setup: {
            model: "models/gemini-3.1-flash-live-preview",
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: geminiVoice
                  }
                }
              }
            },
            systemInstruction: {
              parts: [
                {
                  text: strictVoiceProtocol
                }
              ]
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {}
          }
        };
        ws.send(JSON.stringify(setupMessage));
      };

      const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
        let binary = "";
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
      };

      const handleAudioChunk = (buffer: ArrayBuffer) => {
        const base64 = arrayBufferToBase64(buffer);
        callbacks.onMessage({
          serverContent: {
            modelTurn: {
              parts: [
                {
                  inlineData: {
                    mimeType: "audio/pcm;rate=24000",
                    data: base64
                  }
                }
              ]
            }
          }
        });
      };

      const handleGeminiMessage = (msg: any) => {
        if (msg.setupComplete) {
          console.log("Upstream Live session ready!");
          callbacks.onOpen();
        } else if (msg.serverContent) {
          // Forward formatted to match what the component expects
          callbacks.onMessage({ serverContent: msg.serverContent });
        }
      };

      ws.onmessage = async (event) => {
        try {
          const isBlob = event.data instanceof Blob || (event.data && (typeof (event.data as any).text === "function" || (event.data as any).constructor?.name === "Blob"));
          const isArrayBuffer = event.data instanceof ArrayBuffer || (event.data && (event.data as any).constructor?.name === "ArrayBuffer");

          if (isBlob) {
            console.log("Received Blob from Gemini Live");
            const text = await (event.data as any).text();
            try {
              const message = JSON.parse(text);
              handleGeminiMessage(message);
            } catch {
              const audioBuffer = await (event.data as any).arrayBuffer();
              handleAudioChunk(audioBuffer);
            }
            return;
          }

          if (isArrayBuffer) {
            handleAudioChunk(event.data);
            return;
          }

          if (typeof event.data === "string") {
            const message = JSON.parse(event.data);
            handleGeminiMessage(message);
            return;
          }

          console.warn("Unknown Gemini Live message type", event.data);
        } catch (err) {
          console.error("Gemini Live message handling error", err);
        }
      };

      ws.onerror = (err) => {
        console.error("Direct WebSocket error:", err);
        callbacks.onError(err);
      };

      ws.onclose = (event) => {
        console.log(`Direct WebSocket closed. Code: ${event.code}, Reason: ${event.reason || 'No reason specified'}, wasClean: ${event.wasClean}`);
        callbacks.onClose();
      };

      return {
        sendRealtimeInput: (input: any) => {
          if (ws.readyState === WebSocket.OPEN) {
            let base64Audio = "";
            if (input.media?.data) {
              base64Audio = input.media.data;
            } else if (input.media?.inlineData?.data) {
              base64Audio = input.media.inlineData.data;
            } else if (input.audio?.data) {
              base64Audio = input.audio.data;
            } else if (input.audio) {
              base64Audio = input.audio;
            }

            if (!base64Audio || base64Audio.trim() === "") {
              console.warn("Direct connection audio validation failed: audio data is empty or missing.");
              return;
            }

            const payload = {
              realtimeInput: {
                audio: {
                  mimeType: "audio/pcm;rate=16000",
                  data: base64Audio
                }
              }
            };

            console.log("Sending audio payload:", payload);
            ws.send(JSON.stringify(payload));
          }
        },
        close: () => {
          ws.close();
        }
      };
    } catch (err: any) {
      console.warn("Direct connection setup failed. Falling back to WebSocket proxy:", err);
    }
  }

  // Fallback to local server proxy (e.g. Cloud Run, dev environment)
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const customWsUrl = (import.meta as any).env.VITE_WS_URL || (import.meta as any).env.VITE_BACKEND_URL;
  let socketUrl = "";
  
  if (customWsUrl) {
    if (customWsUrl.startsWith("ws://") || customWsUrl.startsWith("wss://")) {
      const baseUrl = customWsUrl.replace(/\/+$/, "");
      socketUrl = baseUrl.endsWith("/api/gemini-live") ? baseUrl : `${baseUrl}/api/gemini-live`;
    } else {
      const cleanHost = customWsUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
      socketUrl = `${protocol}//${cleanHost}/api/gemini-live`;
    }
  } else {
    socketUrl = `${protocol}//${window.location.host}/api/gemini-live`;
  }
  
  console.log(`Connecting to Gemini Live WebSocket at: ${socketUrl}`);
  const ws = new WebSocket(socketUrl);

  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: "setup",
      voice: selectedVoice,
      systemInstruction: strictVoiceProtocol
    }));
  };

  const handleProxyMessage = (msg: any) => {
    if (msg.type === "ready") {
      callbacks.onOpen();
    } else if (msg.type === "server_message") {
      callbacks.onMessage(msg.message);
    } else if (msg.type === "error") {
      callbacks.onError(new Error(msg.error));
    } else if (msg.type === "close") {
      callbacks.onClose();
    }
  };

  const handleProxyAudioChunk = (buffer: ArrayBuffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = window.btoa(binary);

    callbacks.onMessage({
      serverContent: {
        modelTurn: {
          parts: [
            {
              inlineData: {
                mimeType: "audio/pcm;rate=24000",
                data: base64
              }
            }
          ]
        }
      }
    });
  };

  ws.onmessage = async (event) => {
    try {
      const isBlob = event.data instanceof Blob || (event.data && (typeof (event.data as any).text === "function" || (event.data as any).constructor?.name === "Blob"));
      const isArrayBuffer = event.data instanceof ArrayBuffer || (event.data && (event.data as any).constructor?.name === "ArrayBuffer");

      if (isBlob) {
        console.log("Received Blob from Gemini Live proxy");
        const text = await (event.data as any).text();
        try {
          const message = JSON.parse(text);
          handleProxyMessage(message);
        } catch {
          const audioBuffer = await (event.data as any).arrayBuffer();
          handleProxyAudioChunk(audioBuffer);
        }
        return;
      }

      if (isArrayBuffer) {
        handleProxyAudioChunk(event.data);
        return;
      }

      if (typeof event.data === "string") {
        const message = JSON.parse(event.data);
        handleProxyMessage(message);
        return;
      }

      console.warn("Unknown Gemini Live proxy message type", event.data);
    } catch (err) {
      console.error("Gemini Live proxy message handling error", err);
    }
  };

  ws.onerror = (err) => {
    callbacks.onError(err);
  };

  ws.onclose = () => {
    callbacks.onClose();
  };

  return {
    sendRealtimeInput: (input: any) => {
      if (ws.readyState === WebSocket.OPEN) {
        let base64Audio = "";
        if (input.media?.data) {
          base64Audio = input.media.data;
        } else if (input.media?.inlineData?.data) {
          base64Audio = input.media.inlineData.data;
        } else if (input.audio?.data) {
          base64Audio = input.audio.data;
        } else if (input.audio) {
          base64Audio = input.audio;
        }

        if (!base64Audio || base64Audio.trim() === "") {
          console.warn("Fallback connection audio validation failed: audio data is empty or missing.");
          return;
        }

        const payload = {
          realtimeInput: {
            audio: {
              mimeType: "audio/pcm;rate=16000",
              data: base64Audio
            }
          }
        };

        console.log("Sending audio payload:", payload);
        ws.send(JSON.stringify(payload));
      }
    },
    close: () => {
      ws.close();
    }
  };
};
