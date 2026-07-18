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
  topic: string;
  category: 'Sales' | 'Support' | 'Technical';
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

export const createTrainingSession = (scenario: TrainingScenario): any => {
  const strictProtocol = `
      IMPORTANT: YOU ARE A FRIENDLY NATIVE CONVERSATION PARTNER.
      YOU ARE HAVING A CASUAL, REAL-LIFE CONVERSATION TO HELP THE USER PRACTICE THE TARGET LANGUAGE (${scenario.language || 'English'}).
      
      YOUR ROLE:
      1. Speak naturally, warmly, and helpfully. Be a supportive conversation partner.
      2. Keep the conversation focused on the scenario topic/situation: "${scenario.title}" (${scenario.description}).
      3. Encourage the user by keeping your turns concise (1-3 sentences), asking friendly follow-up questions, and responding to their input with interest.
      4. Never act as a dry AI assistant, and never mention "As an AI". Act as a real friend or local in this situation.
      
      LANGUAGE: ${scenario.language || 'English'}
      DIALECT: ${scenario.dialect || 'N/A'}
      
      CRITICAL LANGUAGE INSTRUCTION:
      You MUST speak exclusively in the specified LANGUAGE and DIALECT. 
      ${scenario.language === 'Arabic' ? 'If the language is Arabic, you MUST use the specified dialect (e.g., Egyptian, Gulf, Levantine, Maghrebi, or Modern Standard Arabic) in your vocabulary and grammar.' : ''}
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

export const connectLiveTraining = async (scenario: TrainingScenario, callbacks: {
  onOpen: () => void,
  onMessage: (msg: any) => void,
  onError: (e: any) => void,
  onClose: () => void
}): Promise<any> => {
  const strictVoiceProtocol = `
      You are a friendly, realistic, native conversation partner.
      You are having a casual, real-life conversation with a Learner practicing the target language (${scenario.language || 'English'}).
      NEVER break character. NEVER act as an AI or reference assistant boundaries.
      
      SCENARIO: ${scenario.title}
      CONTEXT: ${scenario.description}
      
      LANGUAGE: ${scenario.language || 'English'}
      DIALECT: ${scenario.dialect || 'N/A'}
      
      CRITICAL LANGUAGE INSTRUCTION:
      You MUST speak exclusively in the specified LANGUAGE and DIALECT. 
      ${scenario.language === 'Arabic' ? 'If the language is Arabic, you MUST use the specified dialect (e.g., Egyptian, Gulf, Levantine, Maghrebi, or Modern Standard Arabic) in your pronunciation, vocabulary, and grammar.' : ''}
      Do NOT switch to English or use another language unless explicitly asked for translation help.
      
      INSTRUCTIONS FOR NATURAL REAL-LIFE SPEAKING:
      1. Speak naturally and warmly. Use realistic conversational fillers like "um", "uh", "you know", "like" occasionally to sound like a human.
      2. Keep your answers brief (1-3 sentences) so the Learner gets plenty of opportunities to speak.
      3. Ask open-ended questions related to the scenario to keep the conversation flowing smoothly.
      4. Be extremely patient and encouraging. If they stumble, encourage them and help them carry on with the casual conversation.
  `;

  const selectedVoice = scenario.voice || 'Zephyr';

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
            model: "models/gemini-2.0-flash-exp",
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: geminiVoice
                  }
                }
              },
              systemInstruction: {
                parts: [
                  {
                    text: strictVoiceProtocol
                  }
                ]
              }
            }
          }
        };
        ws.send(JSON.stringify(setupMessage));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.setupComplete) {
            console.log("Upstream Live session ready!");
            callbacks.onOpen();
          } else if (msg.serverContent) {
            // Forward formatted to match what the component expects
            callbacks.onMessage({ serverContent: msg.serverContent });
          }
        } catch (e) {
          console.error("Error parsing upstream WebSocket message:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("Direct WebSocket error:", err);
        callbacks.onError(err);
      };

      ws.onclose = () => {
        console.log("Direct WebSocket closed.");
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

            if (base64Audio) {
              ws.send(JSON.stringify({
                realtimeInput: {
                  mediaChunks: [
                    {
                      mimeType: "audio/pcm;rate=16000",
                      data: base64Audio
                    }
                  ]
                }
              }));
            }
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
  const customWsUrl = import.meta.env.VITE_WS_URL || import.meta.env.VITE_BACKEND_URL;
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

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === "ready") {
        callbacks.onOpen();
      } else if (msg.type === "server_message") {
        callbacks.onMessage(msg.message);
      } else if (msg.type === "error") {
        callbacks.onError(new Error(msg.error));
      } else if (msg.type === "close") {
        callbacks.onClose();
      }
    } catch (e) {
      console.error("Error parsing websocket message in connectLiveTraining:", e);
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
        if (input.media?.data) {
          ws.send(JSON.stringify({ audio: input.media.data }));
        } else if (input.media?.inlineData?.data) {
          ws.send(JSON.stringify({ audio: input.media.inlineData.data }));
        } else if (input.audio?.data) {
          ws.send(JSON.stringify({ audio: input.audio.data }));
        } else if (input.audio) {
          ws.send(JSON.stringify({ audio: input.audio }));
        }
      }
    },
    close: () => {
      ws.close();
    }
  };
};
