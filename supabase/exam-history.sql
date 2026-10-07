-- Ejecutar después de google-access.sql en Supabase > SQL Editor > Run.
-- No borra historiales. Es seguro repetirlo. Sin claves secretas.
begin;
create table if not exists public.cean_exam_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  student_email text not null,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  correct integer not null check (correct between 0 and 100),
  duration_ms bigint not null check (duration_ms >= 0),
  exam jsonb not null,
  received_at timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.cean_exam_attempts enable row level security;
revoke all on public.cean_exam_attempts from public, anon, authenticated;
grant select on public.cean_exam_attempts to authenticated;
grant all on public.cean_exam_attempts to service_role;
drop policy if exists cean_read_own_attempts on public.cean_exam_attempts;
create policy cean_read_own_attempts on public.cean_exam_attempts
  for select to authenticated using (user_id = (select auth.uid()) and (select public.cean_has_access()));

create or replace function public.cean_save_attempt(attempt jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  student uuid := auth.uid();
  attempt_id uuid;
  saved jsonb;
  score integer;
  protected_id boolean;
begin
  if student is null or not public.cean_has_access() then
    raise exception 'Acceso no autorizado' using errcode = '42501';
  end if;
  if pg_catalog.octet_length(attempt::text) > 524288
    or jsonb_typeof(attempt) <> 'object'
    or jsonb_typeof(attempt->'questions') is distinct from 'array'
    or jsonb_typeof(attempt->'answers') is distinct from 'array'
    or jsonb_typeof(attempt->'marked') is distinct from 'array'
    or jsonb_typeof(attempt->'startedAt') is distinct from 'number'
    or jsonb_typeof(attempt->'completedAt') is distinct from 'number' then
    raise exception 'Formato de intento inválido' using errcode = '22023';
  end if;
  if jsonb_array_length(attempt->'questions') <> 100
    or jsonb_array_length(attempt->'answers') <> 100
    or jsonb_array_length(attempt->'marked') <> 100
    or (attempt->>'completedAt')::numeric < (attempt->>'startedAt')::numeric then
    raise exception 'Intento incompleto' using errcode = '22023';
  end if;
  attempt_id := (attempt->>'id')::uuid;
  if to_regclass('public.cean_live_exams') is not null then
    execute 'select exists(select 1 from public.cean_live_exams where id=$1 and user_id=$2)'
      into protected_id using attempt_id,student;
    if protected_id then raise exception 'Usa cean_finish_exam para exámenes del banco privado' using errcode='42501'; end if;
  end if;
  attempt := attempt - 'remote' - 'serverVerified' - 'remoteRevision';
  if attempt_id is null then raise exception 'Falta identificador' using errcode = '22023'; end if;
  select count(*) into score from jsonb_array_elements(attempt->'questions') with ordinality as q(value,n)
    where q.value->'correct' = (attempt->'answers')->(q.n::integer - 1);
  insert into public.cean_exam_attempts(user_id,id,student_email,started_at,completed_at,correct,duration_ms,exam)
    select student,attempt_id,u.email,
      to_timestamp((attempt->>'startedAt')::double precision / 1000),
      to_timestamp((attempt->>'completedAt')::double precision / 1000),score,
      coalesce((attempt->>'durationMs')::bigint,(attempt->>'elapsedMs')::bigint),attempt
    from auth.users u where u.id=student
    on conflict (user_id,id) do nothing;
  -- Reintentos y distintos dispositivos no sobrescriben resultados ya recibidos.
  select a.exam into saved from public.cean_exam_attempts a where a.user_id=student and a.id=attempt_id;
  return saved;
end;
$$;
revoke all on function public.cean_save_attempt(jsonb) from public, anon;
grant execute on function public.cean_save_attempt(jsonb) to authenticated;
commit;
