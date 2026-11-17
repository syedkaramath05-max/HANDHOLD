-- Run this entire script in Supabase Dashboard > SQL Editor.
-- Each signed-in user can only read and change their own transactions.

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense', 'saving')),
  amount numeric(12,2) not null check (amount > 0),
  purpose text not null check (char_length(purpose) between 1 and 80),
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users can view their own transactions"
on public.transactions for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can add their own transactions"
on public.transactions for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete their own transactions"
on public.transactions for delete
to authenticated
using (auth.uid() = user_id);

-- No update policy is created in Version 1.
-- This keeps the first version simple and prevents users from editing
-- a transaction accidentally. A later version can add safe edit support.
