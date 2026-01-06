import { Criteria, AnalysisResult } from "../types";

const API_ENDPOINT = '/.netlify/functions/gemini';

// Helper for Fetching from the Netlify Function
const callApi = async (action: string, payload: any) => {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, payload })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: response.statusText }));
            throw new Error(err.error || 'API Request Failed');
        }

        return response.json();
    } catch (error: any) {
        console.error("Gemini Service Error:", error);
        throw new Error(error.message || "Failed to communicate with AI service");
    }
};

export const analyzeTranscript = async (
  transcript: string,
  criteria: Criteria[]
): Promise<Omit<AnalysisResult, 'id' | 'timestamp' | 'rawTranscript'>> => {
  
  const data = await callApi('analyze', { transcript, criteria });
  
  if (!data.text) {
    throw new Error("No response from AI");
  }

  return JSON.parse(data.text) as Omit<AnalysisResult, 'id' | 'timestamp' | 'rawTranscript'>;
};

export const transcribeMedia = async (base64Data: string, mimeType: string): Promise<string> => {
  const data = await callApi('transcribe', { base64Data, mimeType });
  return data.text || "";
};

export const generateMockTranscript = async (): Promise<string> => {
   const data = await callApi('mock', {});
   return data.text || "Agent: Hello, how can I help?\nCustomer: I need a refund.\nAgent: Okay one sec.";
};

// Interface for the Chat Session used in ChatBot
export interface ChatSession {
    sendMessage(params: { message: string }): Promise<{ text: string }>;
}

// Remote Chat Session that manages history locally but processes via backend
class RemoteChatSession implements ChatSession {
    private history: { role: string, parts: { text: string }[] }[] = [];
    private systemInstruction: string;

    constructor(systemInstruction: string) {
        this.systemInstruction = systemInstruction;
    }

    async sendMessage(params: { message: string }) {
        // 1. Call Backend with current history + new message
        const data = await callApi('chat', {
            history: this.history,
            message: params.message,
            systemInstruction: this.systemInstruction
        });

        // 2. Update Local History
        // We track the history client-side to persist context across stateless serverless calls
        this.history.push({ role: 'user', parts: [{ text: params.message }] });
        this.history.push({ role: 'model', parts: [{ text: data.text }] });

        return { text: data.text };
    }
}

export const createChatSession = (): ChatSession => {
  const systemInstruction = `You are RevuBot, an intelligent assistant for the RevuQA AI platform.
      Your goal is to assist Customer Support QA Managers and Analysts.
      You can help with:
      - Explaining QA criteria and scoring logic.
      - Drafting coaching feedback for agents based on descriptions.
      - Suggesting ways to improve team empathy, efficiency, and compliance.
      - Navigating the RevuQA app (Dashboard, Analysis, History, Settings).
      
      Be professional, concise, and helpful. Use the context of being a QA expert tool.`;
      
  return new RemoteChatSession(systemInstruction);
};