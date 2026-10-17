
-- =========================================================
-- MODERA: INITIAL DATABASE SCHEMA
-- =========================================================

begin;

-- 1. Applicant profiles
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Assessment scenarios
create table public.scenarios (
    id uuid primary key default gen_random_uuid(),
    scenario_number integer not null unique
        check (scenario_number between 1 and 20),
    title text not null,
    prompt text not null,
    evaluation_criteria text not null,
    is_published boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 3. Assessment attempts
create table public.assessment_attempts (
    id uuid primary key default gen_random_uuid(),
    applicant_id uuid not null references auth.users(id) on delete cascade,
    status text not null default 'in_progress'
        check (status in ('in_progress', 'submitted', 'reviewed')),
    outcome text
        check (outcome in ('approved', 'rejected')),
    review_notes text,
    reviewer_id uuid references auth.users(id) on delete set null,
    started_at timestamptz not null default now(),
    submitted_at timestamptz,
    reviewed_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint reviewed_attempt_has_outcome
        check (
            (status = 'reviewed' and outcome is not null)
            or
            (status <> 'reviewed' and outcome is null)
        )
);

create index assessment_attempts_applicant_idx
    on public.assessment_attempts(applicant_id);

create index assessment_attempts_status_idx
    on public.assessment_attempts(status);

-- 4. Responses to individual scenarios
create table public.assessment_responses (
    id uuid primary key default gen_random_uuid(),
    attempt_id uuid not null
        references public.assessment_attempts(id) on delete cascade,
    scenario_id uuid not null
        references public.scenarios(id) on delete restrict,
    response_text text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (attempt_id, scenario_id)
);

create index assessment_responses_attempt_idx
    on public.assessment_responses(attempt_id);

-- 5. Automatically maintain updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger scenarios_updated_at
before update on public.scenarios
for each row execute function public.set_updated_at();

create trigger assessment_attempts_updated_at
before update on public.assessment_attempts
for each row execute function public.set_updated_at();

create trigger assessment_responses_updated_at
before update on public.assessment_responses
for each row execute function public.set_updated_at();

-- 6. Create a profile when a user registers
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, full_name)
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'full_name', '')
    )
    on conflict (id) do nothing;

    return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill profiles for existing accounts
insert into public.profiles (id, full_name)
select
    id,
    coalesce(raw_user_meta_data ->> 'full_name', '')
from auth.users
on conflict (id) do nothing;

-- 7. Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.scenarios enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.assessment_responses enable row level security;

-- Profiles: applicants can read and update their own profiles
create policy "Applicants read own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Applicants update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- Scenarios: applicants can read published scenarios
create policy "Applicants read published scenarios"
on public.scenarios
for select
to authenticated
using (is_published);

-- Attempts: applicants can read their own attempts
create policy "Applicants read own attempts"
on public.assessment_attempts
for select
to authenticated
using (applicant_id = (select auth.uid()));

-- Applicants can start their own attempt
create policy "Applicants start own attempts"
on public.assessment_attempts
for insert
to authenticated
with check (
    applicant_id = (select auth.uid())
    and status = 'in_progress'
    and outcome is null
    and reviewer_id is null
    and reviewed_at is null
    and submitted_at is null
);

-- Responses: applicants can read their own responses
create policy "Applicants read own responses"
on public.assessment_responses
for select
to authenticated
using (
    exists (
        select 1
        from public.assessment_attempts a
        where a.id = attempt_id
          and a.applicant_id = (select auth.uid())
    )
);

-- Applicants can add responses only to their own active attempts
create policy "Applicants add responses to active attempts"
on public.assessment_responses
for insert
to authenticated
with check (
    exists (
        select 1
        from public.assessment_attempts a
        where a.id = attempt_id
          and a.applicant_id = (select auth.uid())
          and a.status = 'in_progress'
    )
    and exists (
        select 1
        from public.scenarios s
        where s.id = scenario_id
          and s.is_published = true
    )
);

-- Applicants can edit responses only while their attempt is active
create policy "Applicants edit responses to active attempts"
on public.assessment_responses
for update
to authenticated
using (
    exists (
        select 1
        from public.assessment_attempts a
        where a.id = attempt_id
          and a.applicant_id = (select auth.uid())
          and a.status = 'in_progress'
    )
)
with check (
    exists (
        select 1
        from public.assessment_attempts a
        where a.id = attempt_id
          and a.applicant_id = (select auth.uid())
          and a.status = 'in_progress'
    )
    and exists (
        select 1
        from public.scenarios s
        where s.id = scenario_id
          and s.is_published = true
    )
);

-- Applicants can delete responses only while their attempt is active
create policy "Applicants delete responses to active attempts"
on public.assessment_responses
for delete
to authenticated
using (
    exists (
        select 1
        from public.assessment_attempts a
        where a.id = attempt_id
          and a.applicant_id = (select auth.uid())
          and a.status = 'in_progress'
    )
);

-- 8. Submit an attempt after all 20 published scenarios are answered
create or replace function public.submit_assessment_attempt(
    p_attempt_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_applicant_id uuid;
    v_status text;
    v_scenario_count integer;
    v_response_count integer;
begin
    if (select auth.uid()) is null then
        raise exception 'Authentication required';
    end if;

    select a.applicant_id, a.status
    into v_applicant_id, v_status
    from public.assessment_attempts a
    where a.id = p_attempt_id
    for update;

    if not found
       or v_applicant_id is distinct from (select auth.uid()) then
        raise exception 'Assessment attempt not found';
    end if;

    if v_status <> 'in_progress' then
        raise exception 'Assessment is not in progress';
    end if;

    select count(*)
    into v_scenario_count
    from public.scenarios s
    where s.is_published = true;

    if v_scenario_count <> 20 then
        raise exception 'The assessment must have exactly 20 published scenarios';
    end if;

    select count(*)
    into v_response_count
    from public.assessment_responses r
    join public.scenarios s on s.id = r.scenario_id
    where r.attempt_id = p_attempt_id
      and s.is_published = true
      and length(trim(r.response_text)) > 0;

    if v_response_count <> 20 then
        raise exception 'Please answer all 20 scenarios before submitting';
    end if;

    update public.assessment_attempts
    set status = 'submitted',
        submitted_at = now(),
        updated_at = now()
    where id = p_attempt_id;
end;
$$;

-- 9. Admin review function
-- Admin role must be assigned through trusted app_metadata.
-- Never allow applicants to grant themselves this role.
create or replace function public.review_assessment_attempt(
    p_attempt_id uuid,
    p_outcome text,
    p_review_notes text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
    if (select auth.jwt() -> 'app_metadata' ->> 'role')
       is distinct from 'admin' then
        raise exception 'Administrator access required';
    end if;

    if p_outcome is null
       or p_outcome not in ('approved', 'rejected') then
        raise exception 'Outcome must be approved or rejected';
    end if;

    update public.assessment_attempts
    set status = 'reviewed',
        outcome = p_outcome,
        review_notes = p_review_notes,
        reviewer_id = (select auth.uid()),
        reviewed_at = now(),
        updated_at = now()
    where id = p_attempt_id
      and status = 'submitted';

    if not found then
        raise exception 'Submitted assessment attempt not found';
    end if;
end;
$$;

-- 10. Restrict privileged function execution
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

revoke all on function public.submit_assessment_attempt(uuid)
    from public, anon;
grant execute on function public.submit_assessment_attempt(uuid)
    to authenticated;

revoke all on function public.review_assessment_attempt(uuid, text, text)
    from public, anon, authenticated;
grant execute on function public.review_assessment_attempt(uuid, text, text)
    to authenticated;

commit;
