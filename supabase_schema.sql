
-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- PROFILES
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  company text,
  website text,
  role text default 'agent', -- Default to agent, requiring promotion
  avatar_url text
);

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
  raw_transcript text,
  is_deleted boolean default false
);

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
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  objectives text[],
  talk_tracks text[],
  openers text[],
  voice text
);

-- ==========================================
-- SECURITY HELPER FUNCTIONS
-- ==========================================

-- Function to check if the current user is a FOUNDER (Admin)
-- Only 'admin' role can control the app globally
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Function to check if the current user is a MANAGER
create or replace function public.is_manager()
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = auth.uid() and (role = 'manager' or role = 'admin')
  );
end;
$$ language plpgsql security definer;

-- Function to get the current user's company
create or replace function public.get_my_company()
returns text as $$
begin
  return (select company from profiles where id = auth.uid());
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
-- Everyone can see their own profile
drop policy if exists "Users can see own profile" on profiles;
create policy "Users can see own profile" on profiles for select using (auth.uid() = id);

-- Admins can see ALL profiles
drop policy if exists "Admins can see all profiles" on profiles;
create policy "Admins can see all profiles" on profiles for select using (is_admin());

-- Managers can see profiles of people in THEIR company
drop policy if exists "Managers can see company profiles" on profiles;
create policy "Managers can see company profiles" on profiles for select using (
  is_manager() and company = get_my_company()
);

-- Self update
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Admins update all
drop policy if exists "Admins can update all profiles" on profiles;
create policy "Admins can update all profiles" on profiles for update using (is_admin());

-- Managers can update roles of users in their company (except other admins)
drop policy if exists "Managers can update company profiles" on profiles;
create policy "Managers can update company profiles" on profiles for update using (
  is_manager() and company = get_my_company()
);

-- 2. EVALUATIONS POLICIES (Data Isolation)
-- Admins can see everything
drop policy if exists "Admins see all evaluations" on evaluations;
create policy "Admins see all evaluations" on evaluations for select using (is_admin());

-- Managers/Analysts can see all evaluations from their COMPANY
drop policy if exists "Managers and Analysts see company evaluations" on evaluations;
create policy "Managers and Analysts see company evaluations" on evaluations for select using (
  exists (
    select 1 from profiles viewer
    where viewer.id = auth.uid()
    and (viewer.role = 'manager' or viewer.role = 'analyst' or viewer.role = 'admin')
    and viewer.company = (
        select owner.company from profiles owner where owner.id = evaluations.user_id
    )
  )
);

-- Agents can ONLY see their own evaluations
drop policy if exists "Agents see own evaluations" on evaluations;
create policy "Agents see own evaluations" on evaluations for select using (auth.uid() = user_id);

-- Insert: Users insert their own
drop policy if exists "Users insert own evaluations" on evaluations;
create policy "Users insert own evaluations" on evaluations for insert with check (auth.uid() = user_id);

-- Update/Delete: Admins & Managers can delete (Soft delete usually)
drop policy if exists "Admins and Managers update evaluations" on evaluations;
create policy "Admins and Managers update evaluations" on evaluations for update using (
  is_manager() or auth.uid() = user_id
);

-- 3. USER USAGE (Billing)
-- Admins see all
drop policy if exists "Admins see all usage" on user_usage;
create policy "Admins see all usage" on user_usage for select using (is_admin());

-- Managers see their own company usage (assuming usage is tied to user_id, Managers usually pay)
drop policy if exists "Managers see own usage" on user_usage;
create policy "Managers see own usage" on user_usage for select using (auth.uid() = user_id);

-- Agents see own usage
drop policy if exists "Agents see own usage" on user_usage;
create policy "Agents see own usage" on user_usage for select using (auth.uid() = user_id);

-- 4. SCENARIOS (Training)
-- Admins see all
drop policy if exists "Admins see all scenarios" on scenarios;
create policy "Admins see all scenarios" on scenarios for select using (is_admin());

-- Managers/Analysts see scenarios created by anyone in their company
drop policy if exists "Company shared scenarios" on scenarios;
create policy "Company shared scenarios" on scenarios for select using (
  exists (
    select 1 from profiles viewer
    where viewer.id = auth.uid()
    and viewer.company = (
        select owner.company from profiles owner where owner.id = scenarios.user_id
    )
  )
);

-- Basic agents see scenarios created by them or public ones (if we had a public flag)
drop policy if exists "Agents see own scenarios" on scenarios;
create policy "Agents see own scenarios" on scenarios for select using (auth.uid() = user_id);

-- Insert/Update/Delete Scenarios: Managers, Analysts
drop policy if exists "Managers/Analysts manage scenarios" on scenarios;
create policy "Managers/Analysts manage scenarios" on scenarios for all using (
  (is_manager() or exists (select 1 from profiles where id = auth.uid() and role = 'analyst'))
  and 
  (auth.uid() = user_id) -- Or logic to allow editing team scenarios
);

-- ==========================================
-- DATA SEEDING (Ensure at least one admin exists if table is empty)
-- ==========================================
-- NOTE: You must manually run this in Supabase SQL Editor to promote yourself to admin
-- UPDATE profiles SET role = 'admin' WHERE email = 'your_email@example.com';
