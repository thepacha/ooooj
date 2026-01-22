import { supabase } from './supabase';
import { UsageMetrics } from '../types';

export const COSTS = {
  ANALYSIS: 10,
  TRANSCRIPTION: 20,
  CHAT: 1,
};

export const getUsage = async (userId: string): Promise<UsageMetrics> => {
  const { data, error } = await supabase
    .from('user_usage')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // Return default/free tier if no record exists yet
    // Set reset_date to 1 month from now
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return {
      user_id: userId,
      credits_used: 0,
      monthly_limit: 1000,
      analyses_count: 0,
      transcriptions_count: 0,
      chat_messages_count: 0,
      reset_date: nextMonth.toISOString()
    };
  }

  // Check if we need to reset the billing cycle
  const now = new Date();
  const resetDate = new Date(data.reset_date);

  if (now > resetDate) {
    // Advance reset date by months until it is in the future
    // This handles cases where a user might be inactive for multiple months
    const newResetDate = new Date(resetDate);
    while (newResetDate < now) {
        newResetDate.setMonth(newResetDate.getMonth() + 1);
    }

    // Reset usage in DB
    const { data: updatedData, error: updateError } = await supabase
        .from('user_usage')
        .update({
            credits_used: 0,
            reset_date: newResetDate.toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

    if (!updateError && updatedData) {
        return updatedData as UsageMetrics;
    }
  }

  return data as UsageMetrics;
};

export const checkLimit = async (userId: string, cost: number): Promise<boolean> => {
  const usage = await getUsage(userId);
  return (usage.credits_used + cost) <= usage.monthly_limit;
};

export const incrementUsage = async (
  userId: string, 
  cost: number, 
  type: 'analysis' | 'transcription' | 'chat'
): Promise<void> => {
  const usage = await getUsage(userId);
  
  // We must spread the existing usage object (which contains defaults for new users)
  // to ensure all required fields (like monthly_limit, reset_date) are sent during upsert.
  // Otherwise, Supabase rejects the insert for missing non-nullable columns.
  const updates: any = {
    ...usage,
    credits_used: usage.credits_used + cost,
    user_id: userId // Ensure ID is present for upsert
  };

  if (type === 'analysis') updates.analyses_count = (usage.analyses_count || 0) + 1;
  if (type === 'transcription') updates.transcriptions_count = (usage.transcriptions_count || 0) + 1;
  if (type === 'chat') updates.chat_messages_count = (usage.chat_messages_count || 0) + 1;

  const { error } = await supabase
    .from('user_usage')
    .upsert(updates, { onConflict: 'user_id' });

  if (error) {
    // Suppress "Relation does not exist" error (code 42P01) to avoid console spam 
    // before the user has run the SQL migration.
    if (error.code === '42P01') {
        console.warn("Usage tracking skipped: 'user_usage' table not found. Please run the SQL migration.");
    } else {
        console.error("Failed to update usage:", error.message, error.details || '');
    }
  }
};