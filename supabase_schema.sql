
-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- PROFILES
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  company text,
  website text
);

-- Safely add role column if it doesn't exist (Migration)
alter table profiles add column if not exists role text default 'user';

-- USER USAGE
create table if not exists user_usage (
  user_id uuid references auth.users on delete cascade primary key,
  credits_used int default 0,
  monthly_limit int default 1000,
  analyses_count int default 0,
  transcriptions_count int default 0,
  chat_messages_count int default 0,
  reset_date timestamp with time zone
);

-- USAGE HISTORY
create table if not exists usage_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade,
  period_end timestamp with time zone,
  credits_used int default 0,
  analyses_count int default 0,
  transcriptions_count int default 0,
  chat_messages_count int default 0,
  created_at timestamp with time zone default now()
);

-- CRITERIA
create table if not exists criteria (
  id uuid primary key,
  user_id uuid references auth.users on delete cascade,
  name text,
  description text,
  weight int
);

-- EVALUATIONS
create table if not exists evaluations (
  id text primary key,
  user_id uuid references auth.users on delete cascade,
  timestamp timestamp with time zone,
  agent_name text,
  customer_name text,
  summary text,
  overall_score numeric,
  sentiment text,
  criteria_results jsonb,
  raw_transcript text
);

-- Add is_deleted column for Soft Delete functionality (Migration)
alter table evaluations add column if not exists is_deleted boolean default false;

-- SCENARIOS
create table if not exists scenarios (
  id text primary key,
  user_id uuid references auth.users on delete cascade,
  title text not null,
  description text,
  difficulty text,
  category text,
  icon text,
  initial_message text,
  system_instruction text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add new columns for enhanced scenarios (Migration)
alter table scenarios add column if not exists objectives text[];
alter table scenarios add column if not exists talk_tracks text[];
alter table scenarios add column if not exists openers text[];
alter table scenarios add column if not exists voice text;

-- ==========================================
-- SECURITY HELPER FUNCTIONS
-- ==========================================

-- Function to check if the current user is an admin
-- SECURITY DEFINER allows this to run with higher privileges, bypassing RLS on 'profiles'
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table user_usage enable row level security;
alter table usage_history enable row level security;
alter table criteria enable row level security;
alter table evaluations enable row level security;
alter table scenarios enable row level security;

-- 1. PROFILES POLICIES
drop policy if exists "Users can see own profile" on profiles;
create policy "Users can see own profile" on profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

drop policy if exists "Admins can read all profiles" on profiles;
create policy "Admins can read all profiles" on profiles for select using (is_admin());

drop policy if exists "Admins can update all profiles" on profiles;
create policy "Admins can update all profiles" on profiles for update using (is_admin());

-- 2. USER USAGE POLICIES
drop policy if exists "Users can read own usage" on user_usage;
create policy "Users can read own usage" on user_usage for select using (auth.uid() = user_id);

drop policy if exists "Users can update own usage" on user_usage;
create policy "Users can update own usage" on user_usage for update using (auth.uid() = user_id);

drop policy if exists "Admins can read all usage" on user_usage;
create policy "Admins can read all usage" on user_usage for select using (is_admin());

drop policy if exists "Admins can update all usage" on user_usage;
create policy "Admins can update all usage" on user_usage for update using (is_admin());

drop policy if exists "Admins can insert usage" on user_usage;
create policy "Admins can insert usage" on user_usage for insert with check (is_admin());

-- 3. USAGE HISTORY POLICIES
drop policy if exists "Users can read own usage history" on usage_history;
create policy "Users can read own usage history" on usage_history for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own usage history" on usage_history;
create policy "Users can insert own usage history" on usage_history for insert with check (auth.uid() = user_id);

-- ALLOW ADMINS TO READ ALL HISTORY (Required for Lifetime Usage Calculation)
drop policy if exists "Admins can read all usage history" on usage_history;
create policy "Admins can read all usage history" on usage_history for select using (is_admin());

-- 4. SCENARIOS POLICIES
drop policy if exists "Users can view their own scenarios" on scenarios;
create policy "Users can view their own scenarios" on scenarios for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own scenarios" on scenarios;
create policy "Users can insert their own scenarios" on scenarios for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own scenarios" on scenarios;
create policy "Users can delete their own scenarios" on scenarios for delete using (auth.uid() = user_id);

-- 5. CRITERIA & EVALUATIONS
drop policy if exists "Users view own criteria" on criteria;
create policy "Users view own criteria" on criteria for select using (auth.uid() = user_id);

drop policy if exists "Users insert own criteria" on criteria;
create policy "Users insert own criteria" on criteria for insert with check (auth.uid() = user_id);

drop policy if exists "Users delete own criteria" on criteria;
create policy "Users delete own criteria" on criteria for delete using (auth.uid() = user_id);

drop policy if exists "Users view own evaluations" on evaluations;
create policy "Users view own evaluations" on evaluations for select using (auth.uid() = user_id);

drop policy if exists "Users update own evaluations" on evaluations;
create policy "Users update own evaluations" on evaluations for update using (auth.uid() = user_id);

drop policy if exists "Users insert own evaluations" on evaluations;
create policy "Users insert own evaluations" on evaluations for insert with check (auth.uid() = user_id);

-- ==========================================
-- DATA SEEDING (Run once)
-- ==========================================

-- Insert the requested 51 evaluations history record for all current users
-- This makes the 'Billing History' table populate with data immediately.
INSERT INTO usage_history (user_id, period_end, credits_used, analyses_count, transcriptions_count, chat_messages_count)
SELECT 
  id as user_id,
  NOW() - INTERVAL '1 month' as period_end,
  5350 as credits_used, 
  51 as analyses_count,
  12 as transcriptions_count,
  50 as chat_messages_count
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM usage_history WHERE user_id = auth.users.id AND analyses_count = 51
);
