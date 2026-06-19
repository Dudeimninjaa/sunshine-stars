-- Sunshine Stars Supabase schema
-- Multi-teacher classroom version

create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists public.classrooms (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_by uuid references auth.users(id) on delete cascade not null,
  invite_code text unique default upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8)),
  theme text default 'Ninja Academy',
  sounds_enabled boolean default true,
  kiosk_mode boolean default false,
  animation_level text default 'high',
  created_at timestamptz default now()
);

alter table public.classrooms
add column if not exists invite_code text unique default upper(substr(replace(uuid_generate_v4()::text, '-', ''), 1, 8));

alter table public.classrooms
add column if not exists theme text default 'Ninja Academy';

alter table public.classrooms
add column if not exists sounds_enabled boolean default true;

alter table public.classrooms
add column if not exists kiosk_mode boolean default false;

alter table public.classrooms
add column if not exists animation_level text default 'high';


create table if not exists public.classroom_members (
  id uuid primary key default uuid_generate_v4(),
  classroom_id uuid references public.classrooms(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'teacher',
  created_at timestamptz default now(),
  unique(classroom_id, user_id)
);

create table if not exists public.students (
  id uuid primary key default uuid_generate_v4(),
  classroom_id uuid references public.classrooms(id) on delete cascade not null,
  name text not null,
  avatar text default '⭐',
  total_points int default 0,
  created_at timestamptz default now()
);

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  classroom_id uuid references public.classrooms(id) on delete cascade not null,
  name text not null,
  emoji text default '⭐',
  points int default 1,
  created_at timestamptz default now()
);

create table if not exists public.class_goals (
  id uuid primary key default uuid_generate_v4(),
  classroom_id uuid references public.classrooms(id) on delete cascade not null,
  name text default 'Fill the Sunshine',
  reward_name text default 'Bubble Time',
  target_points int default 30,
  current_points int default 0,
  created_at timestamptz default now()
);

create table if not exists public.rewards (
  id uuid primary key default uuid_generate_v4(),
  classroom_id uuid references public.classrooms(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete cascade not null,
  teacher_id uuid references auth.users(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  category_name text not null,
  points int default 1,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_members enable row level security;
alter table public.students enable row level security;
alter table public.categories enable row level security;
alter table public.class_goals enable row level security;
alter table public.rewards enable row level security;

create or replace function public.is_classroom_member(cid uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.classroom_members
    where classroom_id = cid and user_id = auth.uid()
  );
$$;

create or replace function public.join_classroom_by_invite(code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_classroom uuid;
begin
  select id into target_classroom
  from public.classrooms
  where invite_code = upper(trim(code));

  if target_classroom is null then
    raise exception 'Invalid classroom invite code';
  end if;

  insert into public.classroom_members (classroom_id, user_id, role)
  values (target_classroom, auth.uid(), 'teacher')
  on conflict (classroom_id, user_id) do nothing;

  return target_classroom;
end;
$$;

drop policy if exists "Profiles are own profile" on public.profiles;
create policy "Profiles are own profile" on public.profiles
for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Classrooms visible to members or creator" on public.classrooms;
create policy "Classrooms visible to members or creator" on public.classrooms
for select using (created_by = auth.uid() or public.is_classroom_member(id));

drop policy if exists "Users can create classrooms" on public.classrooms;
create policy "Users can create classrooms" on public.classrooms
for insert with check (created_by = auth.uid());

drop policy if exists "Members can update classrooms" on public.classrooms;
create policy "Members can update classrooms" on public.classrooms
for update using (created_by = auth.uid() or public.is_classroom_member(id)) with check (created_by = auth.uid() or public.is_classroom_member(id));

drop policy if exists "Members can view memberships" on public.classroom_members;
create policy "Members can view memberships" on public.classroom_members
for select using (user_id = auth.uid() or public.is_classroom_member(classroom_id));

drop policy if exists "Users can join classrooms" on public.classroom_members;
create policy "Users can join classrooms" on public.classroom_members
for insert with check (user_id = auth.uid());

drop policy if exists "Members manage students" on public.students;
create policy "Members manage students" on public.students
for all using (public.is_classroom_member(classroom_id)) with check (public.is_classroom_member(classroom_id));

drop policy if exists "Members manage categories" on public.categories;
create policy "Members manage categories" on public.categories
for all using (public.is_classroom_member(classroom_id)) with check (public.is_classroom_member(classroom_id));

drop policy if exists "Members manage goals" on public.class_goals;
create policy "Members manage goals" on public.class_goals
for all using (public.is_classroom_member(classroom_id)) with check (public.is_classroom_member(classroom_id));

drop policy if exists "Members manage rewards" on public.rewards;
create policy "Members manage rewards" on public.rewards
for all using (public.is_classroom_member(classroom_id)) with check (public.is_classroom_member(classroom_id));


-- Step: Student teams and class captain picker
create table if not exists public.teams (
  id uuid primary key default uuid_generate_v4(),
  classroom_id uuid references public.classrooms(id) on delete cascade not null,
  name text not null,
  emoji text default '⭐',
  color text default '#f97316',
  created_at timestamptz default now()
);

alter table public.students
add column if not exists team_id uuid references public.teams(id) on delete set null;

create table if not exists public.captain_history (
  id uuid primary key default uuid_generate_v4(),
  classroom_id uuid references public.classrooms(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete cascade not null,
  selected_date date default current_date,
  created_at timestamptz default now()
);

alter table public.teams enable row level security;
alter table public.captain_history enable row level security;

drop policy if exists "Members manage teams" on public.teams;
create policy "Members manage teams" on public.teams
for all using (public.is_classroom_member(classroom_id)) with check (public.is_classroom_member(classroom_id));

drop policy if exists "Members manage captain history" on public.captain_history;
create policy "Members manage captain history" on public.captain_history
for all using (public.is_classroom_member(classroom_id)) with check (public.is_classroom_member(classroom_id));


drop policy if exists "Creators can delete classrooms" on public.classrooms;
create policy "Creators can delete classrooms" on public.classrooms
for delete using (created_by = auth.uid());


-- Step: Grade / class competitions

create table if not exists public.competitions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  grade_name text default '',
  created_by uuid references auth.users(id) on delete cascade not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.competition_classrooms (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid references public.competitions(id) on delete cascade not null,
  classroom_id uuid references public.classrooms(id) on delete cascade not null,
  display_name text not null,
  joined_at timestamptz default now(),
  unique(competition_id, classroom_id)
);

create table if not exists public.competition_scores (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid references public.competitions(id) on delete cascade not null,
  classroom_id uuid references public.classrooms(id) on delete cascade not null,
  score int default 0,
  updated_at timestamptz default now(),
  unique(competition_id, classroom_id)
);

alter table public.competitions enable row level security;
alter table public.competition_classrooms enable row level security;
alter table public.competition_scores enable row level security;

drop policy if exists "Authenticated users can view competitions" on public.competitions;
create policy "Authenticated users can view competitions" on public.competitions
for select using (auth.uid() is not null);

drop policy if exists "Users can create competitions" on public.competitions;
create policy "Users can create competitions" on public.competitions
for insert with check (created_by = auth.uid());

drop policy if exists "Creators can update competitions" on public.competitions;
create policy "Creators can update competitions" on public.competitions
for update using (created_by = auth.uid()) with check (created_by = auth.uid());

drop policy if exists "Creators can delete competitions" on public.competitions;
create policy "Creators can delete competitions" on public.competitions
for delete using (created_by = auth.uid());

drop policy if exists "Authenticated users can view competition classrooms" on public.competition_classrooms;
create policy "Authenticated users can view competition classrooms" on public.competition_classrooms
for select using (auth.uid() is not null);

drop policy if exists "Class members can join competitions" on public.competition_classrooms;
create policy "Class members can join competitions" on public.competition_classrooms
for insert with check (public.is_classroom_member(classroom_id));

drop policy if exists "Class members can remove class from competitions" on public.competition_classrooms;
create policy "Class members can remove class from competitions" on public.competition_classrooms
for delete using (public.is_classroom_member(classroom_id));

drop policy if exists "Authenticated users can view competition scores" on public.competition_scores;
create policy "Authenticated users can view competition scores" on public.competition_scores
for select using (auth.uid() is not null);

drop policy if exists "Class members can create competition scores" on public.competition_scores;
create policy "Class members can create competition scores" on public.competition_scores
for insert with check (public.is_classroom_member(classroom_id));

drop policy if exists "Class members can update competition scores" on public.competition_scores;
create policy "Class members can update competition scores" on public.competition_scores
for update using (public.is_classroom_member(classroom_id)) with check (public.is_classroom_member(classroom_id));


-- Reliability Step 1: robust competition scoring RPC
create or replace function public.add_competition_points_for_classroom(
  target_classroom_id uuid,
  points_delta int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  comp record;
  current_score int;
begin
  if points_delta = 0 then
    return;
  end if;

  if not public.is_classroom_member(target_classroom_id) then
    raise exception 'You are not a member of this classroom';
  end if;

  for comp in
    select competition_id
    from public.competition_classrooms
    where classroom_id = target_classroom_id
  loop
    select score into current_score
    from public.competition_scores
    where competition_id = comp.competition_id
      and classroom_id = target_classroom_id;

    insert into public.competition_scores (
      competition_id,
      classroom_id,
      score,
      updated_at
    )
    values (
      comp.competition_id,
      target_classroom_id,
      greatest(0, coalesce(current_score, 0) + points_delta),
      now()
    )
    on conflict (competition_id, classroom_id)
    do update set
      score = greatest(0, public.competition_scores.score + points_delta),
      updated_at = now();
  end loop;
end;
$$;

grant execute on function public.add_competition_points_for_classroom(uuid, int) to authenticated;
