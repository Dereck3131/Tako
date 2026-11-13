-- Tako Supabase Schema (project: jdwoszkyonkzxhgzfgnb)

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Tako Friend',
  avatar_color text not null default '#FF7A8A',
  payment_handle text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

do $$ begin
  create policy "Profiles are viewable by authenticated users" on public.profiles for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can insert their own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can update their own profile" on public.profiles for update to authenticated using (auth.uid() = id);
exception when duplicate_object then null; end $$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, 'Friend'), '@', 1), 'Tako Friend')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

do $$ begin
  create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
exception when duplicate_object then null; end $$;

-- Groups table
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '🐙',
  invite_code text unique not null default upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;

-- Group members table
create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  color text not null default '#2EC4B6',
  created_at timestamptz not null default now()
);

alter table public.group_members enable row level security;

-- Helper function to check group membership
create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid()
  ) or exists (
    select 1 from public.groups
    where id = gid and created_by = auth.uid()
  );
$$;

-- Groups policies
do $$ begin
  create policy "Users can view groups they belong to" on public.groups for select to authenticated using (public.is_group_member(id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Authenticated users can create groups" on public.groups for insert to authenticated with check (auth.uid() = created_by);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Group members can update group" on public.groups for update to authenticated using (public.is_group_member(id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Group creator can delete group" on public.groups for delete to authenticated using (created_by = auth.uid());
exception when duplicate_object then null; end $$;

-- Group members policies
do $$ begin
  create policy "Members can view group members" on public.group_members for select to authenticated using (public.is_group_member(group_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Members can add group members" on public.group_members for insert to authenticated with check (public.is_group_member(group_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Members can update group members" on public.group_members for update to authenticated using (public.is_group_member(group_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Members can delete group members" on public.group_members for delete to authenticated using (public.is_group_member(group_id));
exception when duplicate_object then null; end $$;

-- Expenses table
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  amount_cents bigint not null check (amount_cents > 0),
  paid_by_member_id uuid not null references public.group_members(id) on delete cascade,
  split_type text not null default 'equal' check (split_type in ('equal', 'exact')),
  category text not null default 'food',
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

do $$ begin
  create policy "Members can view expenses" on public.expenses for select to authenticated using (public.is_group_member(group_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Members can add expenses" on public.expenses for insert to authenticated with check (public.is_group_member(group_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Members can update expenses" on public.expenses for update to authenticated using (public.is_group_member(group_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Members can delete expenses" on public.expenses for delete to authenticated using (public.is_group_member(group_id));
exception when duplicate_object then null; end $$;

-- Expense splits table
create table if not exists public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  member_id uuid not null references public.group_members(id) on delete cascade,
  amount_cents bigint not null check (amount_cents >= 0)
);

alter table public.expense_splits enable row level security;

do $$ begin
  create policy "Members can view expense splits" on public.expense_splits for select to authenticated using (exists (select 1 from public.expenses e where e.id = expense_id and public.is_group_member(e.group_id)));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Members can insert expense splits" on public.expense_splits for insert to authenticated with check (exists (select 1 from public.expenses e where e.id = expense_id and public.is_group_member(e.group_id)));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Members can delete expense splits" on public.expense_splits for delete to authenticated using (exists (select 1 from public.expenses e where e.id = expense_id and public.is_group_member(e.group_id)));
exception when duplicate_object then null; end $$;

-- Settlements table
create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  from_member_id uuid not null references public.group_members(id) on delete cascade,
  to_member_id uuid not null references public.group_members(id) on delete cascade,
  amount_cents bigint not null check (amount_cents > 0),
  note text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.settlements enable row level security;

do $$ begin
  create policy "Members can view settlements" on public.settlements for select to authenticated using (public.is_group_member(group_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Members can add settlements" on public.settlements for insert to authenticated with check (public.is_group_member(group_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Members can delete settlements" on public.settlements for delete to authenticated using (public.is_group_member(group_id));
exception when duplicate_object then null; end $$;

-- Join group by invite code RPC
create or replace function public.join_group_by_code(p_code text, p_member_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_name text;
begin
  select id into v_group_id
  from public.groups
  where upper(invite_code) = upper(trim(p_code))
  limit 1;

  if v_group_id is null then
    raise exception 'Group not found for code %', p_code;
  end if;

  if not exists (
    select 1 from public.group_members
    where group_id = v_group_id and user_id = auth.uid()
  ) then
    select coalesce(nullif(trim(p_member_name), ''), p.display_name, 'Friend')
    into v_name
    from public.profiles p
    where p.id = auth.uid();

    insert into public.group_members (group_id, user_id, name, color)
    values (v_group_id, auth.uid(), coalesce(v_name, 'Friend'), '#2EC4B6');
  end if;

  return v_group_id;
end;
$$;
