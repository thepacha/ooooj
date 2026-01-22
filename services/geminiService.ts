import { GoogleGenAI, Type } from "@google/genai";
import { Criteria, AnalysisResult } from "../types";
import { checkLimit, incrementUsage, COSTS } from "../lib/usageService";

// Global instance to be initialized lazily
let aiInstance: GoogleGenAI | null = null;

// Helper to get or initialize the AI client
const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      throw new Error('API_KEY environment variable is not set. Please ensure you have configured your API key in the environment.');
    }
    
    // Initialize with a longer timeout (10 minutes)
    aiInstance = new GoogleGenAI({ 
      apiKey,
      requestOptions: {
        timeout: 600000 // 10 minutes
      }
    } as any);
  }
  return aiInstance;
};

// Retry utility for API calls
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function retryWithBackoff<T>(
  fn: () => Promise<T>, 
  retries = 1, // Reduced to 1 retry to fail fast if persistent error
  baseDelay = 1000 
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      const isOverloaded = error.status === 503 || error.code === 503 || error.message?.includes('overloaded');
      const isRateLimit = error.status === 429 || error.code === 429 || error.message?.includes('429');
      // 400 Bad Request usually means context length exceeded or invalid format - do not retry
      const isBadRequest = error.status === 400 || error.code === 400; 
      
      if (attempt < retries && (isOverloaded || isRateLimit) && !isBadRequest) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`Gemini API busy (attempt ${attempt + 1}/${retries + 1}). Retrying in ${delay}ms...`);
        await wait(delay);
      } else {
        throw error;
      }
    }
  }
  throw lastError;
};

// Robust JSON extraction
const extractJSON = (text: string): any => {
  try {
    // 1. Remove markdown code blocks
    let clean = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '').replace(/```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    // 2. Fallback: Find first '{' and last '}'
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      try {
        const jsonStr = text.substring(start, end + 1);
        return JSON.parse(jsonStr);
      } catch (e2) {
        // Failed fallback
      }
    }
    console.error("Failed to parse JSON:", text);
    throw new Error("The AI response was not in a valid format. Please try again.");
  }
};

export const analyzeTranscript = async (
  transcript: string,
  criteria: Criteria[],
  userId?: string
): Promise<Omit<AnalysisResult, 'id' | 'timestamp' | 'rawTranscript'>> => {

  // 1. Check Usage Limits
  if (userId) {
    const canProceed = await checkLimit(userId, COSTS.ANALYSIS);
    if (!canProceed) {
        throw new Error("Usage limit exceeded. Please upgrade your plan to continue.");
    }
  }

  // 2. Truncate Input if too large (approx 100k characters ~ 25k tokens) to prevent 400 errors
  let processedTranscript = transcript;
  const CHAR_LIMIT = 100000;
  if (processedTranscript.length > CHAR_LIMIT) {
    console.warn("Transcript too long, truncating...");
    processedTranscript = processedTranscript.substring(0, CHAR_LIMIT) + "\n...[TRUNCATED DUE TO LENGTH]...";
  }

  const criteriaPrompt = criteria.map(c => `- ${c.name}: ${c.description} (Importance: ${c.weight}/10)`).join('\n');

  const systemInstruction = `
    You are an expert QA Quality Assurance Analyst for Customer Support.
    Your job is to evaluate customer service transcripts based on specific criteria.
    
    OUTPUT REQUIREMENTS:
    1. Identify 'agentName' and 'customerName'. Use "Unknown" if not clear.
    2. Calculate 'overallScore' (0-100).
    3. Analyze criteria.
    4. RETURN ONLY JSON.
  `;

  const prompt = `
    Analyze this transcript:
    "${processedTranscript}"

    Criteria:
    ${criteriaPrompt}
  `;

  const ai = getAI();

  const response = await retryWithBackoff(async () => {
    return await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        // Do NOT use responseSchema with gemini-3-flash-preview sometimes if it causes strict mode issues with large text.
        // However, it is recommended. We will simplify it.
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
                  score: { type: Type.NUMBER },
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
  });

  const resultText = response.text;
  if (!resultText) {
    throw new Error("No response received from AI service.");
  }

  if (userId) {
     await incrementUsage(userId, COSTS.ANALYSIS, 'analysis');
  }

  return extractJSON(resultText);
};

export const transcribeMedia = async (base64Data: string, mimeType: string, userId?: string): Promise<string> => {
  if (userId) {
    const canProceed = await checkLimit(userId, COSTS.TRANSCRIPTION);
    if (!canProceed) {
        throw new Error("Usage limit exceeded. Please upgrade your plan to continue.");
    }
  }
  
  const ai = getAI();
  
  // Use Flash Lite for transcription speed
  const response = await retryWithBackoff(async () => {
    return await ai.models.generateContent({
      model: 'gemini-flash-lite-latest', 
      contents: {
        parts: [
          { text: "Transcribe this audio verbatim. Format: [MM:SS] Speaker: Text." },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]
      },
      config: {} 
    });
  });

  if (userId) {
    await incrementUsage(userId, COSTS.TRANSCRIPTION, 'transcription');
  }

  return response.text || "";
};

export const generateMockTranscript = async (): Promise<string> => {
   const ai = getAI();
   const response = await retryWithBackoff(async () => {
     return await ai.models.generateContent({
      model: 'gemini-flash-lite-latest', 
      contents: "Generate a 10 line customer service chat (John vs Sarah) about a refund. Format: [00:00] Speaker: Text. Plain text only.",
      config: {} 
    });
   });
   
  return response.text || "[00:00] John: Hello\n[00:05] Sarah: Hi";
};

export const createChatSession = (): any => {
  const ai = getAI();
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: "You are RevuBot, a QA assistant. Help users understand their quality scores.",
    }
  });
};