import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Criteria, AnalysisResult } from "../types";

// Global instance to be initialized lazily
let aiInstance: GoogleGenAI | null = null;

// Helper to get or initialize the AI client
const getAI = () => {
  if (!aiInstance) {
    const apiKey = import.meta.env.VITE_API_KEY;

    if (!apiKey) {
      throw new Error('VITE_API_KEY environment variable is not set');
    }

    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const analyzeTranscript = async (
  transcript: string,
  criteria: Criteria[]
): Promise<Omit<AnalysisResult, 'id' | 'timestamp' | 'rawTranscript'>> => {

  const criteriaPrompt = criteria.map(c => `- ${c.name}: ${c.description} (Importance: ${c.weight}/10)`).join('\n');

  const systemInstruction = `
    You are an expert QA Quality Assurance Analyst for Customer Support.
    Your job is to evaluate customer service transcripts based on specific criteria.
    Be strict but fair.
    Identify the Agent and Customer names if possible, otherwise use "Agent" and "Customer".
    Calculate an overall score (0-100) based on the weighted average of the criteria scores.
    Determine the overall customer sentiment.
  `;

  const prompt = `
    Please analyze the following transcript:
    
    "${transcript}"

    Evaluate it against these criteria:
    ${criteriaPrompt}
  `;

  // Lazily get the AI instance
  const ai = getAI();

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          agentName: { type: Type.STRING },
          customerName: { type: Type.STRING },
          summary: { type: Type.STRING },
          overallScore: { type: Type.NUMBER },
          sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative'] },
          criteriaResults: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                score: { type: Type.NUMBER, description: "Score from 0 to 100" },
                reasoning: { type: Type.STRING },
                suggestion: { type: Type.STRING }
              },
              required: ['name', 'score', 'reasoning', 'suggestion']
            }
          }
        },
        required: ['agentName', 'customerName', 'summary', 'overallScore', 'sentiment', 'criteriaResults']
      }
    }
  });

  const resultText = response.text;
  if (!resultText) {
    throw new Error("No response from AI");
  }

  return JSON.parse(resultText) as Omit<AnalysisResult, 'id' | 'timestamp' | 'rawTranscript'>;
};

export const transcribeMedia = async (base64Data: string, mimeType: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { text: "Transcribe the following audio/video verbatim. Identify speakers if possible (e.g., Speaker 1, Speaker 2)." },
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        }
      ]
    }
  });
  return response.text || "";
};

export const generateMockTranscript = async (): Promise<string> => {
   const ai = getAI();
   const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: "Generate a realistic, slightly problematic customer service chat transcript between a customer (Sarah) and an agent (John) regarding a refund delay. It should be about 10-15 lines long. Do not include markdown formatting, just the text.",
  });
  return response.text || "Agent: Hello, how can I help?\nCustomer: I need a refund.\nAgent: Okay one sec.";
};

export const createChatSession = (): Chat => {
  const ai = getAI();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `You are RevuBot, an intelligent assistant for the RevuQA AI platform.
      Your goal is to assist Customer Support QA Managers and Analysts.
      You can help with:
      - Explaining QA criteria and scoring logic.
      - Drafting coaching feedback for agents based on descriptions.
      - Suggesting ways to improve team empathy, efficiency, and compliance.
      - Navigating the RevuQA app (Dashboard, Analysis, History, Settings).
      
      Be professional, concise, and helpful. Use the context of being a QA expert tool.`,
    }
  });
};