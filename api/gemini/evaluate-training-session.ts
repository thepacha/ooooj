import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiClient } from './_client';
import { Type } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transcript, scenario } = req.body;
    const client = getGeminiClient();
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

    res.status(200).json(JSON.parse(response.text || "{}"));
  } catch (e: any) {
    console.error("Error in /api/gemini/evaluate-training-session serverless route:", e);
    res.status(500).json({ error: e.message || "Failed to evaluate training session" });
  }
}
