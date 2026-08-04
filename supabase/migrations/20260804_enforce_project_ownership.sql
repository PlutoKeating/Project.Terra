drop policy if exists "owners can read terra projects" on public.terra_projects;
drop policy if exists "owners can write terra projects" on public.terra_projects;

create policy "owners can read terra projects" on public.terra_projects
  for select using (auth.uid() = owner_id);

create policy "owners can write terra projects" on public.terra_projects
  for all using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
