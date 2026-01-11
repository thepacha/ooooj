import { GoogleGenAI, Type } from "@google/genai";
import { Criteria, AnalysisResult } from "../types";

// Global instance to be initialized lazily
let aiInstance: GoogleGenAI | null = null;
let initPromise: Promise<GoogleGenAI> | null = null;

// Helper to get or initialize the AI client
const getAI = async (): Promise<GoogleGenAI> => {
  if (aiInstance) return aiInstance;

  if (!initPromise) {
    initPromise = (async () => {
      let apiKey = process.env.API_KEY;

      // If key is missing or not injected during build, fetch from Netlify function
      if (!apiKey || apiKey === 'undefined') {
        try {
          const response = await fetch('/api/get-api-key');
          if (!response.ok) {
             throw new Error('Failed to fetch API configuration');
          }
          const data = await response.json();
          apiKey = data.apiKey;
        } catch (error) {
           console.warn("Could not retrieve API Key from backend:", error);
        }
      }

      if (!apiKey) {
        throw new Error('API_KEY environment variable is not set. Please ensure you have configured your API key in the environment.');
      }

      aiInstance = new GoogleGenAI({ apiKey });
      return aiInstance;
    })();
  }
  
  return initPromise;
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
  const ai = await getAI();

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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

  // Robust cleaning to handle potential Markdown code blocks in the response
  let cleanText = resultText.trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(cleanText) as Omit<AnalysisResult, 'id' | 'timestamp' | 'rawTranscript'>;
  } catch (e) {
    console.error("Failed to parse AI response:", cleanText);
    throw new Error("AI response was not valid JSON.");
  }
};

export const transcribeMedia = async (base64Data: string, mimeType: string): Promise<string> => {
  const ai = await getAI();
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
   const ai = await getAI();
   const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: "Generate a realistic, slightly problematic customer service chat transcript between a customer (Sarah) and an agent (John) regarding a refund delay. It should be about 10-15 lines long. Do not include markdown formatting, just the text.",
  });
  return response.text || "Agent: Hello, how can I help?\nCustomer: I need a refund.\nAgent: Okay one sec.";
};

// Use any for return type to avoid import crashes if Chat isn't exported as value in CDN bundle
export const createChatSession = async (): Promise<any> => {
  const ai = await getAI();
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
