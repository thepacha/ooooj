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

export const generateTrainingTopic = async (): Promise<string> => {
    const ai = getAI();
    const prompt = `
        Generate a single, concise, and creative scenario description for a customer service or sales roleplay training session.
        It should be 1-2 sentences.
        
        Examples:
        - "A long-time customer is threatening to cancel because a competitor offered a lower price."
        - "A confused user cannot find the export button and is getting frustrated."
        - "A potential client is interested in the Enterprise plan but thinks the implementation time is too long."
        
        Return ONLY the text of the scenario description. No JSON, no markdown.
    `;

    const response = await retryWithBackoff(async () => {
        return await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
    });

    return response.text?.trim() || "";
};

export interface GenerateScenarioParams {
    topic: string;
    category: 'Sales' | 'Support' | 'Technical';
    difficulty: string;
    funnelStage?: string;
    persona?: string;
    mood?: string;
    industry?: string;
}

export const generateAIScenario = async (params: GenerateScenarioParams): Promise<Omit<TrainingScenario, 'id' | 'icon'>> => {
    const ai = getAI();
    const seed = Date.now().toString();
    
    const { topic, category, difficulty, funnelStage, persona, mood, industry } = params;

    const prompt = `
        Create a rich, complex training roleplay scenario for a ${category} agent.
        Random Seed: ${seed}
        
        CORE CONTEXT: ${topic}
        ${industry ? `INDUSTRY: ${industry} (Ensure terminology and context is specific to this industry)` : ''}
        DIFFICULTY: ${difficulty}
        
        ${funnelStage ? `SALES STAGE: ${funnelStage} (Ensure the customer behavior reflects this specific stage of the funnel)` : ''}
        ${persona ? `BUYER PERSONA: ${persona}` : 'PERSONA: Create a random realistic persona'}
        ${mood ? `CUSTOMER MOOD: ${mood}` : ''}
        
        INSTRUCTIONS:
        1. Assign a GENDER and NAME suitable for the persona.
        2. Select a suitable VOICE for this persona:
           - 'Puck' (Male, Mid-range)
           - 'Charon' (Male, Deep)
           - 'Kore' (Female, Professional)
           - 'Fenrir' (Male, Authoritative)
           - 'Aoede' (Female, Soft/High)
        3. Define "HIDDEN CONTEXT": Secrets the customer holds (e.g., budget constraints, hidden decision makers, technical limitations).
        4. Write a detailed System Instruction that forces the AI to stay in character. 
           If Sales Stage is 'Closing', make them negotiate terms.
           If Sales Stage is 'Discovery', make them answer questions but be guarded.
           If Mood is '${mood}', reflect that in sentence length and tone.
        5. Be creative!
        6. Generate 5 distinct "Mission Objectives" for the agent relevant to the ${funnelStage || 'situation'}.
        7. Generate 6 "Suggested Talk Tracks" (direct quotes/phrases).
        8. Generate 4 "Smart Openers" - effective opening lines for the agent to use in this specific scenario.
        
        IMPORTANT: Ensure the scenario details (Name, Context, Secret) are fresh and creative.

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
                        voice: { type: Type.STRING, enum: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'] },
                        objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                        talkTracks: { type: Type.ARRAY, items: { type: Type.STRING } },
                        openers: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['title', 'description', 'difficulty', 'category', 'initialMessage', 'systemInstruction', 'voice', 'objectives', 'talkTracks', 'openers']
                }
            }
        });
    });

    const resultText = response.text || "{}";
    return JSON.parse(resultText) as Omit<TrainingScenario, 'id' | 'icon'>;
};

export const generateTrainingBatch = async (): Promise<Omit<TrainingScenario, 'id' | 'icon'>[]> => {
    const ai = getAI();
    
    // Inject randomness to ensure variety on every click
    const factors = [
        "Include a VIP customer demanding special treatment.",
        "Include a user who accidentally deleted their data.",
        "Include a sales lead who is budget-conscious.",
        "Include a technical user who thinks they know more than the agent.",
        "Include a user rushing to catch a flight.",
        "Include a user who is pleasantly surprised but has one concern."
    ];
    const randomFactor = factors[Math.floor(Math.random() * factors.length)];
    const seed = Date.now().toString().slice(-4);

    const prompt = `
        Generate 3 distinct, highly realistic customer service roleplay scenarios.
        Random Seed: ${seed}
        Special Constraint: ${randomFactor}
        
        CRITERIA:
        1. Unique Names: Use diverse names and professions (e.g. 'Dr. Aris', 'Captain Lee', 'Sarah the Architect').
        2. Unique Personas: Vary age, job title, and temperament (Angry, Confused, Rush, Happy).
        3. Contexts: Mix of Sales (objections), Technical (bugs), and Support (refunds).
        4. Hidden Secrets: Give each persona a secret (e.g. "lying about usage", "actually broke it themselves", "needs approval from boss").
        5. Voices: Assign a voice that fits the persona from: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'.
        
        Return a JSON object with a "scenarios" key containing an array of 3 objects. Include smart openers for each.
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
                        scenarios: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    difficulty: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced'] },
                                    category: { type: Type.STRING, enum: ['Sales', 'Support', 'Technical'] },
                                    initialMessage: { type: Type.STRING },
                                    systemInstruction: { type: Type.STRING },
                                    voice: { type: Type.STRING, enum: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'] },
                                    objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    talkTracks: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    openers: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ['title', 'description', 'difficulty', 'category', 'initialMessage', 'systemInstruction', 'voice', 'objectives', 'talkTracks', 'openers']
                            }
                        }
                    }
                }
            }
        });
    });

    const resultText = response.text || '{"scenarios": []}';
    const parsed = JSON.parse(resultText);
    return parsed.scenarios || [];
};

export const generateSmartOpeners = async (scenario: TrainingScenario): Promise<string[]> => {
    const ai = getAI();
    const prompt = `
        Generate 4 distinct, professional, and highly effective opening lines for a customer service agent handling this specific situation.
        
        SCENARIO: ${scenario.title}
        DESCRIPTION: ${scenario.description}
        CUSTOMER PERSONA: ${scenario.systemInstruction}
        GOAL: Resolve the issue efficiently while maintaining high empathy.

        REQUIREMENTS:
        1. Openers must be "Smart" & "Professional" - avoid generic "How can I help?".
        2. Tailor them to the specific context (e.g. if angry, validate emotion first).
        3. Use psychological techniques (e.g. labeling, agenda setting).
        4. Make them sound human, not robotic.

        Return strictly a JSON array of strings.
    `;

    const response = await retryWithBackoff(async () => {
        return await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
    });

    const resultText = response.text || "[]";
    return JSON.parse(resultText);
};

export const evaluateTrainingSession = async (transcript: string, scenario: TrainingScenario): Promise<TrainingResult> => {
    const ai = getAI();
    
    const prompt = `
        Analyze the following training roleplay transcript between an Agent (User) and a Customer (AI).
        
        SCENARIO: ${scenario.title}
        DIFFICULTY: ${scenario.difficulty}
        DESCRIPTION: ${scenario.description}
        OBJECTIVES: ${scenario.objectives ? scenario.objectives.join(', ') : 'N/A'}
        
        TRANSCRIPT:
        ${transcript}
        
        Evaluate the Agent's performance based on:
        1. Adherence to the stated objectives (if any).
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