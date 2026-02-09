
import { supabase } from './supabase';
import { UsageMetrics, UsageHistory } from '../types';

export const COSTS = {
  ANALYSIS: 100,
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
      reset_date: nextMonth.toISOString(),
      suspended: false
    };
  }

  // Check if we need to reset the billing cycle
  const now = new Date();
  const resetDate = new Date(data.reset_date);

  if (now > resetDate) {
    // 1. Archive current stats to history
    // We only archive if there was actually activity to avoid empty rows
    if (data.credits_used > 0 || data.analyses_count > 0 || data.transcriptions_count > 0) {
        try {
            await supabase.from('usage_history').insert({
                user_id: userId,
                period_end: data.reset_date,
                credits_used: data.credits_used,
                analyses_count: data.analyses_count || 0,
                transcriptions_count: data.transcriptions_count || 0,
                chat_messages_count: data.chat_messages_count || 0
            });
        } catch (e) {
            console.error("Failed to archive usage history", e);
        }
    }

    // 2. Advance reset date
    const newResetDate = new Date(resetDate);
    while (newResetDate < now) {
        newResetDate.setMonth(newResetDate.getMonth() + 1);
    }

    // 3. Reset usage AND COUNTS in DB
    const { data: updatedData, error: updateError } = await supabase
        .from('user_usage')
        .update({
            credits_used: 0,
            analyses_count: 0,
            transcriptions_count: 0,
            chat_messages_count: 0,
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

export const getUsageHistory = async (userId: string): Promise<UsageHistory[]> => {
    // 1. Fetch existing history from DB
    const { data, error } = await supabase
        .from('usage_history')
        .select('*')
        .eq('user_id', userId)
        .order('period_end', { ascending: false });

    // Handle missing table gracefully
    if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
            console.warn("Usage history table missing. Please run the SQL migration.");
            return [];
        }
        console.error("Failed to fetch usage history", error);
        return [];
    }
    
    return (data || []) as UsageHistory[];
};

export const checkLimit = async (userId: string, cost: number): Promise<boolean> => {
  const usage = await getUsage(userId);
  
  if (usage.suspended) {
      // User is suspended, block all usage
      return false;
  }

  return (usage.credits_used + cost) <= usage.monthly_limit;
};

export const incrementUsage = async (
  userId: string, 
  cost: number, 
  type: 'analysis' | 'transcription' | 'chat'
): Promise<void> => {
  const usage = await getUsage(userId);
  
  if (usage.suspended) return; // Double check

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
    if (error.code === '42P01') {
        console.warn("Usage tracking skipped: 'user_usage' table not found.");
    } else {
        console.error("Failed to update usage:", error.message);
    }
  }
};

export const purchaseCredits = async (userId: string, amount: number): Promise<void> => {
  const usage = await getUsage(userId);
  
  if (usage.suspended) throw new Error("Account suspended. Cannot purchase credits.");

  const { error } = await supabase
    .from('user_usage')
    .upsert({
      ...usage,
      monthly_limit: usage.monthly_limit + amount,
      user_id: userId
    }, { onConflict: 'user_id' });

  if (error) {
    console.error("Purchase failed:", error);
    throw new Error("Failed to purchase credits");
  }
};
