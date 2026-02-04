
-- Existing tables (assumed)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  company text
);

create table if not exists user_usage (
  user_id uuid references auth.users on delete cascade primary key,
  credits_used int default 0,
  monthly_limit int default 1000,
  analyses_count int default 0,
  transcriptions_count int default 0,
  chat_messages_count int default 0,
  reset_date timestamp with time zone
);

create table if not exists criteria (
  id uuid primary key,
  user_id uuid references auth.users on delete cascade,
  name text,
  description text,
  weight int
);

create table if not exists evaluations (
  id text primary key, -- Using text ID from app logic
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

-- NEW: Scenarios Table
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

-- RLS Policies
alter table scenarios enable row level security;

create policy "Users can view their own scenarios"
  on scenarios for select
  using (auth.uid() = user_id);

create policy "Users can insert their own scenarios"
  on scenarios for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own scenarios"
  on scenarios for delete
  using (auth.uid() = user_id);
