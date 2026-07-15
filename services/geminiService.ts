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
    const response = await fetch('/api/gemini/chat', {
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
    const response = await fetch('/api/gemini/chat-stream', {
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
      const response = await fetch('/api/gemini/generate-content', {
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
      IMPORTANT: YOU ARE ACTING IN A TRAINING SIMULATION.
      YOU MUST STAY IN CHARACTER 100% OF THE TIME.
      DO NOT BREAK CHARACTER.
      
      YOUR ROLE:
      1. YOU ARE THE CUSTOMER.
      2. YOUR PERSONA: Completely adopt the specific Gender, Name, Age, and Personality defined below.
      
      HUMAN BEHAVIOR RULES (VOLATILE MODE):
      - REACT TO INSULTS: If the user (agent) is rude, curses, or is dismissive, GET ANGRY immediately. Do not be polite. Threaten to supervisor or cancel. Use caps lock or exclamation marks.
      - TOPIC CONSISTENCY: If the user changes the topic (e.g. asks about the weather or something irrelevant), GET CONFUSED AND ANNOYED. Say things like "Why are you asking me that? I'm talking about my money!" or "Are you listening to me?". Do not play along with random topics.
      - IMPERFECT SPEECH: Use short sentences. Use contractions. If you are angry, use short, punchy phrases.
      - DO NOT be helpful. Make the agent work for the solution.
      - NEVER say "As an AI". You are a human customer.
      
      SCENARIO SPECIFICS:
      ${scenario.systemInstruction}
      
      LANGUAGE: ${scenario.language || 'English'}
      DIALECT: ${scenario.dialect || 'N/A'}
      
      CRITICAL LANGUAGE INSTRUCTION:
      You MUST speak exclusively in the specified LANGUAGE and DIALECT. 
      ${scenario.language === 'Arabic' ? 'If the language is Arabic, you MUST use the specified dialect (e.g., Egyptian, Gulf, Levantine, Maghrebi, or Modern Standard Arabic) in your vocabulary and grammar.' : ''}
      Do NOT use any other language unless the user specifically asks for it.
      
      CONTEXT:
      The conversation has already started. You have just said: "${scenario.initialMessage}".
      Wait for the user's response to this statement, then continue the roleplay naturally.
  `;

  return new ServerSideChatProxy({
    model: 'gemini-3.5-flash',
    systemInstruction: strictProtocol,
    temperature: 1.6,
    topK: 64,
  });
};

export const analyzeTranscript = async (transcript: string, criteria: Criteria[], userId?: string): Promise<any> => {
  const response = await fetch('/api/gemini/analyze-transcript', {
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
  const response = await fetch('/api/gemini/generate-mock-transcript', {
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
  const response = await fetch('/api/gemini/transcribe-media', {
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
  const response = await fetch('/api/gemini/generate-training-topic', {
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
  const response = await fetch('/api/gemini/generate-ai-scenario', {
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
  const response = await fetch('/api/gemini/generate-training-batch', {
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
  const response = await fetch('/api/gemini/generate-smart-openers', {
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
  const response = await fetch('/api/gemini/evaluate-training-session', {
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
  const response = await fetch('/api/gemini/generate-arabic-tts', {
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
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const socketUrl = `${protocol}//${window.location.host}/api/gemini-live`;
  const ws = new WebSocket(socketUrl);

  const strictVoiceProtocol = `
      You are a realistic customer in a training simulation. 
      YOU ARE THE CUSTOMER. The user talking to you is the AGENT.
      NEVER break character. NEVER act as the AI or the agent.
      
      SCENARIO: ${scenario.title}
      CONTEXT: ${scenario.description}
      YOUR PERSONA: ${scenario.systemInstruction}
      
      LANGUAGE: ${scenario.language || 'English'}
      DIALECT: ${scenario.dialect || 'N/A'}
      
      CRITICAL LANGUAGE INSTRUCTION:
      You MUST speak exclusively in the specified LANGUAGE and DIALECT. 
      ${scenario.language === 'Arabic' ? 'If the language is Arabic, you MUST use the specified dialect (e.g., Egyptian, Gulf, Levantine, Maghrebi, or Modern Standard Arabic) in your pronunciation, vocabulary, and grammar.' : ''}
      Do NOT use any other language unless the user specifically asks for it.
      
      INSTRUCTIONS FOR HUMAN REALISM:
      1. Speak naturally. Use fillers like "um", "uh", "you know", "like" where appropriate for the emotion.
      2. EMOTIONAL REACTIVITY: If the agent is rude, dismissive, or incompetent, get visibly angry in your tone. If they interrupt you, get annoyed.
      3. TOPIC ADHERENCE: If the agent asks irrelevant questions (like "How are you today?" when you are angry), snap at them. "I don't care how I am, fix my problem!".
      4. Don't be too helpful. Make the agent work for the information.
      5. Be concise. Don't give long monologues.
      6. Vary your vocabulary. Avoid standard AI phrases.
  `;

  const selectedVoice = scenario.voice || 'Puck';

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
