
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
  isDeleted?: boolean;
}

export interface TrainingScenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Sales' | 'Support' | 'Technical';
  icon: 'Shield' | 'TrendingUp' | 'Wrench';
  initialMessage: string;
  systemInstruction: string;
  voice?: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Aoede'; // Voice selection
  objectives?: string[]; // Specific goals for the scenario
  talkTracks?: string[]; // Suggested phrases
  openers?: string[]; // Smart opening lines tailored to the scenario
}

export interface TrainingResult {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  sentiment: 'Positive' | 'Neutral' | 'Negative';
}

export type UserRole = 'admin' | 'manager' | 'analyst' | 'agent';

export interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  website?: string;
  role?: UserRole;
  avatar_url?: string;
}

export interface UsageMetrics {
  user_id: string;
  credits_used: number;
  monthly_limit: number;
  analyses_count: number;
  transcriptions_count: number;
  chat_messages_count: number;
  reset_date: string;
}

export interface UsageHistory {
  id: string;
  user_id: string;
  period_end: string;
  credits_used: number;
  analyses_count: number;
  transcriptions_count: number;
  chat_messages_count: number;
}

export type ViewState = 'dashboard' | 'analyze' | 'history' | 'settings' | 'evaluation' | 'usage' | 'roster' | 'pricing' | 'training' | 'admin' | 'terms' | 'privacy' | 'account';

export const DEFAULT_CRITERIA: Criteria[] = [
  { id: '1', name: 'Empathy & Tone', description: 'Did the agent demonstrate empathy and maintain a professional tone?', weight: 9 },
  { id: '2', name: 'Solution Accuracy', description: 'Was the correct solution provided to the customer?', weight: 10 },
  { id: '3', name: 'Grammar & Mechanics', description: 'Was the response free of spelling and grammar errors?', weight: 5 },
  { id: '4', name: 'Procedure Compliance', description: 'Did the agent follow standard operating procedures (greeting, closing)?', weight: 7 },
  { id: '5', name: 'Response Efficiency', description: 'Was the communication concise and direct without unnecessary fluff?', weight: 6 },
];
