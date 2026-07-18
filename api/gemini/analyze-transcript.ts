import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiClient } from './_client';
import { Type } from "@google/genai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transcript, criteria } = req.body;
    const client = getGeminiClient();
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

    res.status(200).json(parsed);
  } catch (e: any) {
    console.error("Error in /api/gemini/analyze-transcript serverless route:", e);
    res.status(500).json({ error: e.message || "Failed to analyze transcript" });
  }
}
