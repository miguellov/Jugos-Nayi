-- JUGOS NAYI: estado por usuario (JSON) + RLS con auth.uid()
-- Supabase → SQL Editor → pega y ejecuta (seguro repetir: borra policies viejas antes).

create table if not exists public.jugos_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.jugos_state enable row level security;

drop policy if exists "jugos_state_select_own" on public.jugos_state;
drop policy if exists "jugos_state_insert_own" on public.jugos_state;
drop policy if exists "jugos_state_update_own" on public.jugos_state;
drop policy if exists "jugos_state_delete_own" on public.jugos_state;

create policy "jugos_state_select_own"
  on public.jugos_state for select
  using (auth.uid() = user_id);

create policy "jugos_state_insert_own"
  on public.jugos_state for insert
  with check (auth.uid() = user_id);

create policy "jugos_state_update_own"
  on public.jugos_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "jugos_state_delete_own"
  on public.jugos_state for delete
  using (auth.uid() = user_id);
