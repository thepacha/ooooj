
import { GoogleGenAI, Type, Chat, LiveServerMessage, Modality } from "@google/genai";
import { AnalysisResult, Criteria, TrainingResult, TrainingScenario } from "../types";
import { incrementUsage, checkLimit, COSTS } from "../lib/usageService";

// Helper to initialize AI with environment API key
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
      throw new Error("API Key is missing. Please configure your environment.");
  }
  return new GoogleGenAI({ apiKey });
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
    if (userId) {
        const canProceed = await checkLimit(userId, COSTS.ANALYSIS);
        if (!canProceed) {
            throw new Error(`Usage limit reached. Analysis requires ${COSTS.ANALYSIS} credits.`);
        }
    }

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
    const res = JSON.parse(resultText);
    
    // Ensure criteriaResults is always an array
    if (!res.criteriaResults) res.criteriaResults = [];
    
    return res as Omit<AnalysisResult, 'id' | 'timestamp' | 'rawTranscript'>;
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
    if (userId) {
        const canProceed = await checkLimit(userId, COSTS.TRANSCRIPTION);
        if (!canProceed) {
            throw new Error(`Usage limit reached. Transcription requires ${COSTS.TRANSCRIPTION} credits.`);
        }
    }

    const ai = getAI();
    
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
        
        CONTEXT:
        The conversation has already started. You have just said: "${scenario.initialMessage}".
        Wait for the user's response to this statement, then continue the roleplay naturally.
    `;

    return ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
            systemInstruction: strictProtocol,
            temperature: 1.6, // Increased temperature for more volatility
            topK: 64,
        }
    });
};

export const generateAIScenario = async (topic: string, category: 'Sales' | 'Support' | 'Technical', difficulty: string): Promise<Omit<TrainingScenario, 'id' | 'icon'>> => {
    const ai = getAI();
    
    const prompt = `
        Create a rich, complex training roleplay scenario for a ${category} agent.
        
        TOPIC/CONTEXT: ${topic}
        DIFFICULTY LEVEL: ${difficulty}
        
        INSTRUCTIONS:
        1. Randomly assign a GENDER (Male or Female) to the customer persona.
        2. Select a suitable VOICE for this persona:
           - 'Puck' (Male, Mid-range)
           - 'Charon' (Male, Deep)
           - 'Kore' (Female, Professional)
           - 'Fenrir' (Male, Authoritative)
           - 'Aoede' (Female, Soft/High)
        3. Define "HIDDEN CONTEXT": Secrets the customer holds (e.g., they are lying, they are in a rush, they broke the item themselves).
        4. Write a detailed System Instruction that forces the AI to stay in character.
        5. Be creative! Do not use generic names like "John Doe". Use distinct names and professions.

        Return JSON.
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
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        difficulty: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced'] },
                        category: { type: Type.STRING, enum: ['Sales', 'Support', 'Technical'] },
                        initialMessage: { type: Type.STRING },
                        systemInstruction: { type: Type.STRING },
                        voice: { type: Type.STRING, enum: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'] }
                    },
                    required: ['title', 'description', 'difficulty', 'category', 'initialMessage', 'systemInstruction', 'voice']
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
    
    const strictVoiceProtocol = `
        You are a realistic customer in a training simulation. 
        YOU ARE THE CUSTOMER. The user talking to you is the AGENT.
        NEVER break character. NEVER act as the AI or the agent.
        
        SCENARIO: ${scenario.title}
        CONTEXT: ${scenario.description}
        YOUR PERSONA: ${scenario.systemInstruction}
        
        INSTRUCTIONS FOR HUMAN REALISM:
        1. Speak naturally. Use fillers like "um", "uh", "you know", "like" where appropriate for the emotion.
        2. EMOTIONAL REACTIVITY: If the agent is rude, dismissive, or incompetent, get visibly angry in your tone. If they interrupt you, get annoyed.
        3. TOPIC ADHERENCE: If the agent asks irrelevant questions (like "How are you today?" when you are angry), snap at them. "I don't care how I am, fix my problem!".
        4. Don't be too helpful. Make the agent work for the information.
        5. Be concise. Don't give long monologues.
        6. Vary your vocabulary. Avoid standard AI phrases.
    `;

    const selectedVoice = scenario.voice || 'Puck';

    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: strictVoiceProtocol,
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } } 
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
