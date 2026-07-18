import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiClient } from './_client';
import { Type } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { params } = req.body;
    const client = getGeminiClient();
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

    res.status(200).json(JSON.parse(response.text || "{}"));
  } catch (e: any) {
    console.error("Error in /api/gemini/generate-ai-scenario serverless route:", e);
    res.status(500).json({ error: e.message || "Failed to generate AI scenario" });
  }
}
