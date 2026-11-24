-- Tako Supabase Schema (project: jdwoszkyonkzxhgzfgnb)

-- Email verification codes (accessed only by service_role Edge Functions)
create table if not exists public.email_verification_codes (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  last_sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.email_verification_codes enable row level security;

do $$ begin
  create policy "No client access to email verification codes"
    on public.email_verification_codes
    for all
    to anon, authenticated
    using (false)
    with check (false);
exception when duplicate_object then null; end $$;

-- Profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Tako Friend',
  avatar_color text not null default '#FF7A8A',
  avatar_url text,
  payment_handle text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

do $$ begin
  create policy "Profiles are viewable by authenticated users" on public.profiles for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can insert their own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users can update their own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id);
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
    where group_id = gid and user_id = (select auth.uid())
  ) or exists (
    select 1 from public.groups
    where id = gid and created_by = (select auth.uid())
  );
$$;

-- Groups policies
do $$ begin
  create policy "Users can view groups they belong to" on public.groups for select to authenticated using (public.is_group_member(id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Authenticated users can create groups" on public.groups for insert to authenticated with check ((select auth.uid()) = created_by);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Group members can update group" on public.groups for update to authenticated using (public.is_group_member(id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Group creator can delete group" on public.groups for delete to authenticated using (created_by = (select auth.uid()));
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

-- Preview group by invite code RPC
create or replace function public.preview_group_by_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group public.groups%rowtype;
  v_total_cents bigint;
  v_item_count bigint;
  v_member_count bigint;
  v_host_name text;
  v_members jsonb;
begin
  select * into v_group
  from public.groups
  where upper(invite_code) = upper(trim(regexp_replace(p_code, '^TAKO-', '', 'i')))
  limit 1;

  if v_group.id is null then
    return null;
  end if;

  select coalesce(sum(amount_cents), 0), count(*)
  into v_total_cents, v_item_count
  from public.expenses
  where group_id = v_group.id;

  select count(*),
         coalesce(
           jsonb_agg(
             jsonb_build_object(
               'id', id,
               'name', name,
               'color', color,
               'is_placeholder', (user_id is null),
               'is_me', (user_id = auth.uid())
             ) order by created_at asc
           ),
           '[]'::jsonb
         )
  into v_member_count, v_members
  from public.group_members
  where group_id = v_group.id;

  select name into v_host_name
  from public.group_members
  where group_id = v_group.id
  order by created_at asc
  limit 1;

  return jsonb_build_object(
    'id', v_group.id,
    'name', v_group.name,
    'invite_code', v_group.invite_code,
    'total_cents', v_total_cents,
    'item_count', v_item_count,
    'member_count', v_member_count,
    'paid_by', coalesce(v_host_name, 'Host'),
    'members', v_members
  );
end;
$$;

-- Join group by invite code RPC
create or replace function public.join_group_by_code(
  p_code text,
  p_member_name text default null,
  p_claim_member_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_name text;
  v_my_member_id uuid;
  v_matched_id uuid;
  v_is_new_member boolean := false;
  v_exp record;
  v_member_ids uuid[];
  v_count int;
  v_base bigint;
  v_rem bigint;
  v_idx int;
  v_palette text[] := array['#2EC4B6', '#FF7A8A', '#B9A5E8', '#F5D6BA', '#6C9BFF', '#FFC857'];
  v_existing_count int;
begin
  select id into v_group_id
  from public.groups
  where upper(invite_code) = upper(trim(regexp_replace(p_code, '^TAKO-', '', 'i')))
  limit 1;

  if v_group_id is null then
    raise exception 'Group not found for code %', p_code;
  end if;

  select id into v_my_member_id
  from public.group_members
  where group_id = v_group_id and user_id = auth.uid()
  limit 1;

  if v_my_member_id is null then
    select coalesce(nullif(trim(p_member_name), ''), p.display_name, 'Friend')
    into v_name
    from public.profiles p
    where p.id = auth.uid();

    v_name := coalesce(v_name, 'Friend');

    if p_claim_member_id is not null then
      update public.group_members
      set user_id = auth.uid()
      where id = p_claim_member_id
        and group_id = v_group_id
        and user_id is null
      returning id into v_matched_id;
    end if;

    if v_matched_id is null then
      select id into v_matched_id
      from public.group_members
      where group_id = v_group_id
        and user_id is null
        and lower(trim(name)) = lower(trim(v_name))
      order by created_at asc
      limit 1;

      if v_matched_id is not null then
        update public.group_members
        set user_id = auth.uid()
        where id = v_matched_id;
      end if;
    end if;

    if v_matched_id is null then
      select count(*) into v_existing_count
      from public.group_members
      where group_id = v_group_id;

      insert into public.group_members (group_id, user_id, name, color)
      values (
        v_group_id,
        auth.uid(),
        v_name,
        v_palette[(v_existing_count % array_length(v_palette, 1)) + 1]
      )
      returning id into v_my_member_id;

      v_is_new_member := true;
    end if;
  end if;

  if v_is_new_member then
    select array_agg(id order by created_at asc, id asc)
    into v_member_ids
    from public.group_members
    where group_id = v_group_id;

    v_count := coalesce(array_length(v_member_ids, 1), 0);

    if v_count > 0 then
      for v_exp in
        select id, amount_cents
        from public.expenses
        where group_id = v_group_id and split_type = 'equal'
      loop
        delete from public.expense_splits where expense_id = v_exp.id;
        v_base := v_exp.amount_cents / v_count;
        v_rem := v_exp.amount_cents - (v_base * v_count);
        for v_idx in 1..v_count loop
          insert into public.expense_splits (expense_id, member_id, amount_cents)
          values (
            v_exp.id,
            v_member_ids[v_idx],
            v_base + (case when v_idx <= v_rem then 1 else 0 end)
          );
        end loop;
      end loop;
    end if;
  end if;

  return v_group_id;
end;
$$;

-- Covering indexes for foreign keys
create index if not exists idx_groups_created_by on public.groups(created_by);
create index if not exists idx_group_members_group_id on public.group_members(group_id);
create index if not exists idx_group_members_user_id on public.group_members(user_id);
create index if not exists idx_expenses_group_id on public.expenses(group_id);
create index if not exists idx_expenses_paid_by_member_id on public.expenses(paid_by_member_id);
create index if not exists idx_expenses_created_by on public.expenses(created_by);
create index if not exists idx_expense_splits_expense_id on public.expense_splits(expense_id);
create index if not exists idx_expense_splits_member_id on public.expense_splits(member_id);
create index if not exists idx_settlements_group_id on public.settlements(group_id);
create index if not exists idx_settlements_from_member_id on public.settlements(from_member_id);
create index if not exists idx_settlements_to_member_id on public.settlements(to_member_id);
create index if not exists idx_settlements_created_by on public.settlements(created_by);

-- SECURITY DEFINER execute permissions
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_group_member(uuid) from public, anon;
revoke execute on function public.preview_group_by_code(text) from public, anon;
revoke execute on function public.join_group_by_code(text, text, uuid) from public, anon;

grant execute on function public.is_group_member(uuid) to authenticated, service_role;
grant execute on function public.preview_group_by_code(text) to authenticated, service_role;
grant execute on function public.join_group_by_code(text, text, uuid) to authenticated, service_role;

-- Storage bucket & policies for user avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

do $$ begin
  create policy "Avatar images are publicly accessible"
    on storage.objects for select
    using (bucket_id = 'avatars');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Authenticated users can upload their own avatar"
    on storage.objects for insert to authenticated
    with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Authenticated users can update their own avatar"
    on storage.objects for update to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Authenticated users can delete their own avatar"
    on storage.objects for delete to authenticated
    using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null; end $$;
