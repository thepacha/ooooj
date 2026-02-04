import { GoogleGenAI, Type, Chat, LiveServerMessage, Modality } from "@google/genai";
import { AnalysisResult, Criteria, TrainingResult, TrainingScenario } from "../types";
import { incrementUsage, COSTS } from "../lib/usageService";

// Helper to initialize AI with environment API key
const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Retry mechanism for robustness
const retryWithBackoff = async <T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries === 0 || (error.status >= 400 && error.status < 500)) throw error; 
    await new Promise(res => setTimeout(res, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
};

export const analyzeTranscript = async (transcript: string, criteria: Criteria[], userId?: string): Promise<Omit<AnalysisResult, 'id' | 'timestamp' | 'rawTranscript'>> => {
    const ai = getAI();
    const criteriaList = criteria.map(c => `- ${c.name} (Weight: ${c.weight}): ${c.description}`).join('\n');

    const prompt = `
        Analyze the following customer service transcript.
        
        TRANSCRIPT:
        ${transcript}
        
        CRITERIA TO EVALUATE:
        ${criteriaList}
        
        Extract the Agent Name and Customer Name if available (otherwise use "Agent" and "Customer").
        Provide a summary.
        Determine the overall sentiment.
        Score each criterion from 0-100 based on the description and weight.
        Provide reasoning and a suggestion for improvement for each criterion.
        Calculate an overall weighted score.

        Return the result in JSON format.
    `;

    const response = await retryWithBackoff(async () => {
        return await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        agentName: { type: Type.STRING },
                        customerName: { type: Type.STRING },
                        summary: { type: Type.STRING },
                        sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative'] },
                        overallScore: { type: Type.NUMBER },
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
                    required: ['agentName', 'customerName', 'summary', 'sentiment', 'overallScore', 'criteriaResults']
                }
            }
        });
    });

    if (userId) {
        await incrementUsage(userId, COSTS.ANALYSIS, 'analysis');
    }

    const resultText = response.text || "{}";
    return JSON.parse(resultText) as Omit<AnalysisResult, 'id' | 'timestamp' | 'rawTranscript'>;
};

export const generateMockTranscript = async (): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Generate a realistic 10-turn customer support transcript between an Agent and a Customer regarding a billing dispute. The customer should be slightly annoyed but the agent resolves it. Format it as plain text.",
    });
    return response.text || "";
};

export const transcribeMedia = async (base64Data: string, mimeType: string, userId?: string): Promise<string> => {
    const ai = getAI();
    
    // Using 2.5 flash for multimodal input capability
    const response = await retryWithBackoff(async () => {
        return await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Data } },
                    { text: "Transcribe this audio. Return only the transcript text with speaker labels (Agent/Customer)." }
                ]
            }
        });
    });

    if (userId) {
        await incrementUsage(userId, COSTS.TRANSCRIPTION, 'transcription');
    }

    return response.text || "";
};

export const createChatSession = (): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
            systemInstruction: "You are RevuBot, a helpful QA assistant for customer support teams. You help analyze performance, suggest coaching tips, and explain metrics. Be professional and encouraging."
        }
    });
};

export const createTrainingSession = (scenario: TrainingScenario): Chat => {
    const ai = getAI();
    // Inject the initial message into the history so the model knows context
    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        history: [
            {
                role: 'model',
                parts: [{ text: scenario.initialMessage }],
            },
        ],
        config: {
            systemInstruction: scenario.systemInstruction
        }
    });
};

export const generateAIScenario = async (topic: string, category: 'Sales' | 'Support' | 'Technical', difficulty: string): Promise<Omit<TrainingScenario, 'id' | 'icon'>> => {
    const ai = getAI();
    
    const prompt = `
        Create a detailed, highly intelligent, and realistic training roleplay scenario for a ${category} agent.
        
        TOPIC/CONTEXT: ${topic}
        DIFFICULTY LEVEL: ${difficulty}
        
        The scenario should be rich and challenging.
        - Create a catchy Title.
        - Write a Description of the situation.
        - Write the Initial Message the customer sends.
        - Write a detailed System Instruction for the AI playing the customer. This should include:
          - The customer's name and persona (e.g., impatient, confused, skeptical).
          - Hidden motivations or constraints.
          - Triggers that make them happier or angrier.
          - Specific objection handling instructions.
          - IMPORTANT: The AI must be reactive and keep responses concise (1-3 sentences) to keep the conversation flowing fast.

        Return JSON.
    `;

    const response = await retryWithBackoff(async () => {
        return await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Upgraded to Pro for smarter scenario generation
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        difficulty: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced'] },
                        category: { type: Type.STRING, enum: ['Sales', 'Support', 'Technical'] },
                        initialMessage: { type: Type.STRING },
                        systemInstruction: { type: Type.STRING }
                    },
                    required: ['title', 'description', 'difficulty', 'category', 'initialMessage', 'systemInstruction']
                }
            }
        });
    });

    const resultText = response.text || "{}";
    return JSON.parse(resultText) as Omit<TrainingScenario, 'id' | 'icon'>;
};

export const evaluateTrainingSession = async (transcript: string, scenario: TrainingScenario): Promise<TrainingResult> => {
    const ai = getAI();
    
    const prompt = `
        Analyze the following training roleplay transcript between an Agent (User) and a Customer (AI).
        
        SCENARIO: ${scenario.title}
        DIFFICULTY: ${scenario.difficulty}
        DESCRIPTION: ${scenario.description}
        
        TRANSCRIPT:
        ${transcript}
        
        Evaluate the Agent's performance based on:
        1. Adherence to the goal of the scenario.
        2. Empathy and tone appropriate for the difficulty level.
        3. Problem-solving efficiency.
        
        Provide the result in JSON format.
    `;

    const response = await retryWithBackoff(async () => {
        return await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER, description: "Score from 0-100" },
                        feedback: { type: Type.STRING, description: "A 2-3 sentence summary of how they did." },
                        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                        improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
                        sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative'], description: "The overall sentiment of the interaction." }
                    },
                    required: ['score', 'feedback', 'strengths', 'improvements', 'sentiment']
                }
            }
        });
    });

    const resultText = response.text || "{}";
    try {
        return JSON.parse(resultText) as TrainingResult;
    } catch (e) {
        console.error("Failed to parse training result", e);
        return {
            score: 0,
            feedback: "Error analyzing session.",
            strengths: [],
            improvements: [],
            sentiment: 'Neutral'
        };
    }
};

export const connectLiveTraining = (scenario: TrainingScenario, callbacks: {
    onOpen: () => void,
    onMessage: (msg: LiveServerMessage) => void,
    onError: (e: any) => void,
    onClose: () => void
}): Promise<any> => {
    const ai = getAI();
    // Add context about the start of the conversation so the model knows it 'said' the initial message
    const enhancedSystemInstruction = `${scenario.systemInstruction}\n\nIMPORTANT CONTEXT: The conversation just started. You (the Customer) have just said: "${scenario.initialMessage}". Wait for the Agent to respond to this.`;
    
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: enhancedSystemInstruction,
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } 
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
        },
        callbacks: {
            onopen: callbacks.onOpen,
            onmessage: callbacks.onMessage,
            onerror: callbacks.onError,
            onclose: callbacks.onClose,
        }
    });
};