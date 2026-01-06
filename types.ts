
export interface Criteria {
  id: string;
  name: string;
  description: string;
  weight: number; // 1-10 scale of importance
}

export interface CriteriaResult {
  name: string;
  score: number; // 0-100
  reasoning: string;
  suggestion: string;
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  agentName: string; // Extracted or Manual
  customerName: string; // Extracted
  summary: string;
  overallScore: number;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  criteriaResults: CriteriaResult[];
  rawTranscript: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
}

export type ViewState = 'dashboard' | 'analyze' | 'history' | 'settings' | 'evaluation';

export const DEFAULT_CRITERIA: Criteria[] = [
  { id: '1', name: 'Empathy & Tone', description: 'Did the agent demonstrate empathy and maintain a professional tone?', weight: 9 },
  { id: '2', name: 'Solution Accuracy', description: 'Was the correct solution provided to the customer?', weight: 10 },
  { id: '3', name: 'Grammar & Mechanics', description: 'Was the response free of spelling and grammar errors?', weight: 5 },
  { id: '4', name: 'Procedure Compliance', description: 'Did the agent follow standard operating procedures (greeting, closing)?', weight: 7 },
  { id: '5', name: 'Response Efficiency', description: 'Was the communication concise and direct without unnecessary fluff?', weight: 6 },
];
