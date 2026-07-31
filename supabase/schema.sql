create table if not exists public.terra_projects (
  id uuid primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  document jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.terra_projects enable row level security;

create policy "owners can read terra projects" on public.terra_projects
  for select using (auth.uid() = owner_id or owner_id is null);
create policy "owners can write terra projects" on public.terra_projects
  for all using (auth.uid() = owner_id or owner_id is null)
  with check (auth.uid() = owner_id or owner_id is null);
