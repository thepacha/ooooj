import { GoogleGenAI, Type } from "@google/genai";
import { Criteria, AnalysisResult } from "../types";

// Global instance to be initialized lazily
let aiInstance: GoogleGenAI | null = null;

// Helper to get or initialize the AI client
const getAI = () => {
  if (!aiInstance) {
    // Strictly use process.env.API_KEY as per security guidelines.
    // We removed GEMINI_API_KEY fallbacks to prevent build tools from inlining secrets.
    // The environment (index.html polyfill or secure runtime) must provide this value.
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      throw new Error('API_KEY environment variable is not set. Please ensure you have configured your API key in the environment.');
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
    
    CONTEXT ON SPEAKER IDENTIFICATION:
    The transcript provided follows the format "[Time] Speaker: Text".
    - Often, the "Speaker" will be a specific name (e.g., "John", "Sarah").
    - Sometimes, it might be "Speaker 1" or "Speaker 2".
    - Your job is to infer who is the AGENT and who is the CUSTOMER based on the content of what they say (e.g., who is asking for help vs. who is offering help).
    
    OUTPUT REQUIREMENTS:
    1. Identify the 'agentName' and 'customerName' clearly.
    2. Calculate an overall score (0-100).
    3. Analyze the conversation against the provided criteria.
    4. Be strict but fair in scoring.
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
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: `You are a professional audio transcriber. Your task is to provide a VERBATIM transcript of the audio.
        
        CRITICAL INSTRUCTIONS:
        1. Capture every word spoken. Do NOT summarize. Do NOT skip sections.
        2. SPEAKER IDENTIFICATION:
           - Listen carefully for names. If a speaker introduces themselves (e.g., "This is John"), label them as "John" for the entire transcript.
           - If names are not mentioned, use "Speaker 1" and "Speaker 2".
           - Do NOT use generic labels like "Agent" or "Customer" unless they explicitly call themselves that.
        3. TIMESTAMPS: Start every new turn with a timestamp in [MM:SS] format.
        
        FORMAT:
        [00:00] Name: Text...
        [00:05] Name: Text...
        
        Return ONLY the raw transcript text. No markdown, no preambles.` },
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
    model: 'gemini-3-flash-preview',
    contents: `Generate a realistic, slightly problematic customer service chat transcript between a customer (Sarah) and an agent (John) regarding a refund delay. It should be about 10-15 lines long.

Strict Formatting Rules:
1. Speaker Identification: Use the actual names 'John' and 'Sarah' as the speaker labels. Do NOT use 'Agent' or 'Customer'.
2. Timestamps: Provide a timestamp at the start of every new turn in [MM:SS] format.
3. Format: Each line must look exactly like this: [Time] Speaker: The spoken text.

Do not include markdown formatting, just the text.`,
  });
  return response.text || "[00:00] John: Hello, how can I help?\n[00:05] Sarah: I need a refund.\n[00:10] John: Okay one sec.";
};

// Use any for return type to avoid import crashes if Chat isn't exported as value in CDN bundle
export const createChatSession = (): any => {
  const ai = getAI();
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
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