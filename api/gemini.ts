import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Modality } from "@google/genai";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow both GET and POST. Check query params or POST body for the action.
  const action = req.query?.action || req.body?.action;

  if (!action) {
    return res.status(400).json({ error: "Action parameter is required" });
  }

  try {
    const client = getGeminiClient();

    switch (action) {
      case 'get-live-key': {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        return res.status(200).json({ apiKey });
      }

      case 'generate-content': {
        const { model, contents, config } = req.body;
        const response = await client.models.generateContent({
          model: model || "gemini-3.5-flash",
          contents,
          config
        });
        return res.status(200).json({
          text: response.text,
          candidates: response.candidates
        });
      }

      case 'chat': {
        const { model, history, message, config } = req.body;
        const cleanHistory = Array.isArray(history) && history.length > 0 ? history.slice(0, -1) : [];
        const chat = client.chats.create({
          model: model || "gemini-3.5-flash",
          history: cleanHistory,
          config
        });
        const response = await chat.sendMessage({ message });
        return res.status(200).json({ text: response.text });
      }

      case 'chat-stream': {
        const { model, history, message, config } = req.body;
        const cleanHistory = Array.isArray(history) && history.length > 0 ? history.slice(0, -1) : [];
        const chat = client.chats.create({
          model: model || "gemini-3.5-flash",
          history: cleanHistory,
          config
        });

        const responseStream = await chat.sendMessageStream({ message });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of responseStream) {
          if (chunk.text) {
            res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
          }
        }
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      case 'analyze-transcript': {
        const { transcript, criteria } = req.body;
        const criteriaList = Array.isArray(criteria) 
          ? criteria.map((c: any) => `- ${c.name} (Weight: ${c.weight}): ${c.description}`).join('\n')
          : '';
        const prompt = `
          Analyze the following customer service transcript.
          
          TRANSCRIPT:
          ${transcript}
          
          CRITERIA TO EVALUATE:
          ${criteriaList}
          
          Extract the Agent Name and Customer Name if available (otherwise use "Unknown").
          Provide a summary.
          Determine the overall sentiment.
          Score each criterion from 0-100 based on the description and weight.
          Provide reasoning and a suggestion for improvement for each criterion.
          Calculate an overall weighted score.

          Return the result in JSON format.
        `;

        const response = await client.models.generateContent({
          model: 'gemini-3.5-flash',
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

        const resultText = response.text || "{}";
        const parsed = JSON.parse(resultText);

        if (parsed.criteriaResults && parsed.criteriaResults.length > 0 && Array.isArray(criteria)) {
          let totalWeight = 0;
          let weightedScoreSum = 0;
          parsed.criteriaResults.forEach((result: any) => {
            const originalCriterion = criteria.find((c: any) => c.name === result.name);
            const weight = originalCriterion ? originalCriterion.weight : 1;
            totalWeight += weight;
            weightedScoreSum += (result.score || 0) * weight;
          });
          if (totalWeight > 0) {
            parsed.overallScore = Math.round(weightedScoreSum / totalWeight);
          }
        }

        return res.status(200).json(parsed);
      }

      case 'generate-mock-transcript': {
        const response = await client.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: "Generate a realistic 10-turn customer support transcript between an Agent and a Customer regarding a billing dispute. The customer should be slightly annoyed but the agent resolves it. Format it as plain text.",
        });
        return res.status(200).json({ text: response.text || "" });
      }

      case 'transcribe-media': {
        const { base64Data, mimeType } = req.body;
        const response = await client.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: {
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: "Transcribe this audio. Return only the transcript text with speaker labels (Agent/Customer)." }
            ]
          }
        });
        return res.status(200).json({ text: response.text || "" });
      }

      case 'generate-training-topic': {
        const { params } = req.body;
        let contextStr = '';
        if (params) {
          contextStr = `
          Please tailor the topic to the following parameters:
          - Language: ${params.language}
          - Buyer Mode: ${params.mood}
          - Persona: ${params.persona}
          - Difficulty: ${params.difficulty}
          - Industry: ${params.industry}
          - Funnel Stage: ${params.funnelStage}
          - Category: ${params.category}
          `;
        }
        const prompt = `
          Generate a single, concise, and creative scenario description for a customer service or sales roleplay training session.
          It should be 1-2 sentences.
          ${contextStr}
          
          Examples:
          - "A long-time customer is threatening to cancel because a competitor offered a lower price."
          - "A confused user cannot find the export button and is getting frustrated."
          - "A potential client is interested in the Enterprise plan but thinks the implementation time is too long."
          
          Return ONLY the text of the scenario description. No JSON, no markdown.
        `;
        const response = await client.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt
        });
        return res.status(200).json({ text: response.text?.trim() || "" });
      }

      case 'generate-ai-scenario': {
        const { params } = req.body;
        const seed = Date.now().toString();
        const { topic, category, difficulty, funnelStage, persona, mood, industry, language, dialect } = params || {};

        const prompt = `
          Create a rich, complex training roleplay scenario for a ${category || 'Support'} agent.
          Random Seed: ${seed}
          
          CORE CONTEXT: ${topic || 'General customer issue'}
          ${industry ? `INDUSTRY: ${industry} (Ensure terminology and context is specific to this industry)` : ''}
          DIFFICULTY: ${difficulty || 'Intermediate'}
          
          ${funnelStage ? `SALES STAGE: ${funnelStage} (Ensure the customer behavior reflects this specific stage of the funnel)` : ''}
          ${persona ? `BUYER PERSONA: ${persona}` : 'PERSONA: Create a random realistic persona'}
          ${mood ? `CUSTOMER MOOD: ${mood}` : ''}
          ${language ? `LANGUAGE: ${language}` : 'LANGUAGE: English'}
          ${dialect ? `DIALECT: ${dialect}` : ''}
          
          INSTRUCTIONS:
          1. Assign a GENDER and NAME suitable for the persona and language/dialect.
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
             The AI MUST speak in the requested LANGUAGE (${language || 'English'})${dialect ? ` and DIALECT (${dialect})` : ''}.
           5. Be creative!
           6. Generate 5 distinct "Mission Objectives" for the agent relevant to the ${funnelStage || 'situation'}.
           7. Generate 6 "Suggested Talk Tracks" (direct quotes/phrases) in the requested language.
           8. Generate 4 "Smart Openers" - effective opening lines for the agent to use in this specific scenario, in the requested language.
           9. The initialMessage MUST be in the requested language and dialect.
           
           IMPORTANT: Ensure the scenario details (Name, Context, Secret) are fresh and creative.

           Return JSON.
        `;

        const response = await client.models.generateContent({
          model: 'gemini-3.5-flash',
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
                language: { type: Type.STRING },
                dialect: { type: Type.STRING },
                objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                talkTracks: { type: Type.ARRAY, items: { type: Type.STRING } },
                openers: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ['title', 'description', 'difficulty', 'category', 'initialMessage', 'systemInstruction', 'voice', 'objectives', 'talkTracks', 'openers']
            }
          }
        });

        return res.status(200).json(JSON.parse(response.text || "{}"));
      }

      case 'generate-training-batch': {
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

        const response = await client.models.generateContent({
          model: 'gemini-3.5-flash',
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

        const parsed = JSON.parse(response.text || '{"scenarios": []}');
        return res.status(200).json(parsed.scenarios || []);
      }

      case 'generate-smart-openers': {
        const { scenario } = req.body;
        const prompt = `
          Generate 4 distinct, professional, and highly effective opening lines for a customer service agent handling this specific situation.
          
          SCENARIO: ${scenario.title}
          DESCRIPTION: ${scenario.description}
          CUSTOMER PERSONA: ${scenario.systemInstruction}
          GOAL: Resolve the issue efficiently while maintaining high empathy.
          
          LANGUAGE: ${scenario.language || 'English'}
          DIALECT: ${scenario.dialect || 'N/A'}

          REQUIREMENTS:
          1. Openers must be "Smart" & "Professional" - avoid generic "How can I help?".
          2. Tailor them to the specific context (e.g. if angry, validate emotion first).
          3. Use psychological techniques (e.g. labeling, agenda setting).
          4. Make them sound human, not robotic.
          5. The openers MUST be in the specified LANGUAGE and DIALECT.

          Return strictly a JSON array of strings.
        `;

        const response = await client.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        });

        return res.status(200).json(JSON.parse(response.text || "[]"));
      }

      case 'evaluate-training-session': {
        const { transcript, scenario } = req.body;
        const prompt = `
          Analyze the following language practice conversation transcript between a Learner (User) and their Friendly Native AI Partner.
          
          SCENARIO: ${scenario.title}
          DIFFICULTY: ${scenario.difficulty}
          DESCRIPTION: ${scenario.description}
          TARGET LANGUAGE: ${scenario.language || 'English'}
          
          TRANSCRIPT:
          ${transcript}
          
          Evaluate the Learner's performance across exactly 5 specific language learning metrics, allocating scores from 0 to 100 for each. Each metric has a specific weight:
          1. "Task Completion" (Weight: 40%): Did the learner achieve the functional goals of the real-life conversation?
          2. "Fluency" (Weight: 20%): How smooth, natural, and conversational was the learner's response flow?
          3. "Pronunciation" (Weight: 15%): Based on textual phonetic hints or spelling mistakes, how clear and correct was the pronunciation/enunciation?
          4. "Vocabulary" (Weight: 15%): Did the learner use appropriate, varied, and relevant vocabulary for this situation?
          5. "Grammar" (Weight: 10%): Was the learner's grammar, tense usage, word order, and syntax correct?
          
          Calculate the overall score as a weighted sum of these five metrics:
          Overall Score = (Task Completion * 0.4) + (Fluency * 0.2) + (Pronunciation * 0.15) + (Vocabulary * 0.15) + (Grammar * 0.1)
          
          Also provide a "Conversation Breakdown" detailing:
          - Strengths: What did they do particularly well? (e.g. "Good pronunciation of 'reservation'", "Natural greeting")
          - Mistakes: Specific grammatical, lexical, or pronunciation errors they made. (e.g. "Wrong past tense", "Missed article")
          - Native Alternatives: Pairs of "What they said" vs "What a native would say" to help them sound more natural.
          
          Provide the result in JSON format matching the schema.
        `;

        const response = await client.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.NUMBER, description: "Weighted Overall Score from 0-100 calculated using the weights: Task Completion 40%, Fluency 20%, Pronunciation 15%, Vocabulary 15%, Grammar 10%." },
                feedback: { type: Type.STRING, description: "A friendly 2-3 sentence summary of how they did." },
                criteriaResults: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING, description: "Name of the criterion: 'Task Completion', 'Fluency', 'Pronunciation', 'Vocabulary', or 'Grammar'" },
                      score: { type: Type.NUMBER, description: "Score from 0-100 for this specific criterion" },
                      reasoning: { type: Type.STRING, description: "Why this score was given" },
                      suggestion: { type: Type.STRING, description: "How to improve" }
                    },
                    required: ['name', 'score', 'reasoning', 'suggestion']
                  }
                },
                strengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of specific visual, verbal, or conceptual strengths in the conversation."
                },
                mistakes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "List of specific vocabulary, syntax, or grammar errors made."
                },
                nativeAlternatives: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      original: { type: Type.STRING, description: "What the learner actually said or wrote." },
                      better: { type: Type.STRING, description: "How a native speaker would express this naturally." },
                      explanation: { type: Type.STRING, description: "Brief explanation of why the alternative is more natural." }
                    },
                    required: ['original', 'better', 'explanation']
                  },
                  description: "Specific phrasings mapped to natural, native speaker idioms or sentences."
                },
                sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative'], description: "The overall sentiment of the interaction." }
              },
              required: ['score', 'feedback', 'criteriaResults', 'strengths', 'mistakes', 'nativeAlternatives', 'sentiment']
            }
          }
        });

        return res.status(200).json(JSON.parse(response.text || "{}"));
      }

      case 'generate-arabic-tts': {
        const { text, dialect, voice } = req.body;
        const prompt = `Speak this text in ${dialect} Arabic: ${text}`;
        const response = await client.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
          throw new Error("Failed to generate audio from Gemini TTS");
        }
        return res.status(200).json({ base64Audio });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (e: any) {
    console.error(`Error in /api/gemini [action=${action}]:`, e);
    return res.status(500).json({ error: e.message || "Failed to execute Gemini action" });
  }
}
