-- Ejecutar después de google-access.sql y exam-history.sql. Importar luego el CSV privado.
-- Banco y claves sin acceso directo, también para alumnos autenticados.
begin;
create schema if not exists cean_private;
revoke all on schema cean_private from public, anon, authenticated;
create table if not exists public.cean_question_bank (
  id text primary key,
  payload jsonb not null check (payload->>'id'=id and payload->>'version'='2'),
  active boolean not null default true
);
alter table public.cean_question_bank enable row level security;
revoke all on public.cean_question_bank from public, anon, authenticated;
grant all on public.cean_question_bank to service_role;

create table if not exists public.cean_live_exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshot jsonb not null,
  progress jsonb not null,
  revision bigint not null default 0,
  started_at timestamptz not null default now(),
  deadline_at timestamptz not null,
  finished_at timestamptz
);
create unique index if not exists cean_one_active_exam on public.cean_live_exams(user_id) where finished_at is null;
create index if not exists cean_live_owner_started on public.cean_live_exams(user_id,started_at);
alter table public.cean_live_exams enable row level security;
revoke all on public.cean_live_exams from public, anon, authenticated;
grant all on public.cean_live_exams to service_role;
alter table public.cean_exam_attempts add column if not exists verification_source text not null default 'legacy-client';

create or replace function cean_private.visible_exam(exam_id uuid)
returns jsonb language sql stable set search_path = '' as $$
  select x.snapshot || x.progress || jsonb_build_object(
    'questions',(select jsonb_agg(q.value - 'correct' || '{"correct":null}'::jsonb order by q.n)
      from jsonb_array_elements(x.snapshot->'questions') with ordinality q(value,n)),
    'remote',true,'remoteRevision',x.revision)
  from public.cean_live_exams x where x.id=exam_id and x.finished_at is null;
$$;
revoke all on function cean_private.visible_exam(uuid) from public, anon, authenticated;

create or replace function public.cean_current_exam()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_id uuid;
begin
  if not public.cean_has_access() then raise exception 'Acceso no autorizado' using errcode='42501'; end if;
  select id into current_id from public.cean_live_exams where user_id=auth.uid() and finished_at is null;
  return cean_private.visible_exam(current_id);
end;
$$;

create or replace function public.cean_start_exam()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  student uuid := auth.uid(); current_id uuid; questions jsonb; q jsonb; options jsonb;
  started_ms bigint; deadline_ms bigint; base jsonb; initial jsonb;
begin
  if student is null or not public.cean_has_access() then raise exception 'Acceso no autorizado' using errcode='42501'; end if;
  -- Serializar inicios por alumno; nunca abrir dos rondas a la vez.
  perform 1 from auth.users where id=student for update;
  select id into current_id from public.cean_live_exams where user_id=student and finished_at is null;
  if current_id is not null then return cean_private.visible_exam(current_id); end if;
  if (select count(*) from public.cean_live_exams where user_id=student and started_at>clock_timestamp()-interval '24 hours') >= 20 then
    raise exception 'Máximo de 20 simulacros nuevos en 24 horas. Conservas acceso a tu historial.' using errcode='P0001';
  end if;
  if (select count(*) from public.cean_question_bank where active) < 100 then
    raise exception 'El docente debe importar el banco privado (mínimo 100 preguntas).' using errcode='P0001';
  end if;
  questions := '[]'::jsonb;
  for q in select payload from public.cean_question_bank where active order by random() limit 100 loop
    if jsonb_array_length(q->'distractors') <> 100 then raise exception 'Banco incompleto' using errcode='22023'; end if;
    select jsonb_agg(t.choice order by t.rnd) into options from (
      select q->'correct' as choice, random() rnd union all
      select to_jsonb(w.value), random() from (
        select value from jsonb_array_elements_text(q->'distractors') order by random() limit 4
      ) w
    ) t;
    questions := questions || jsonb_build_array(jsonb_build_object(
      'id',q->'id','number',q->'number','page',q->'page','area',q->'area','question',q->'question',
      'options',options,'correct',(select ord::int-1 from jsonb_array_elements(options) with ordinality o(value,ord) where o.value=q->'correct')));
  end loop;
  started_ms := floor(extract(epoch from clock_timestamp())*1000)::bigint;
  deadline_ms := started_ms + 3600000;
  current_id := gen_random_uuid();
  base := jsonb_build_object('schemaVersion',2,'id',current_id,'startedAt',started_ms,
    'deadlineAt',deadline_ms,'timeLimitMs',3600000,'timingVersion',1,'timingCoverage','complete',
    'timingStartedAt',started_ms,'questions',questions);
  initial := jsonb_build_object('updatedAt',started_ms,'observedAt',started_ms,'elapsedMs',0,'current',0,
    'answers',(select jsonb_agg(null::text) from generate_series(1,100)),
    'marked',(select jsonb_agg(false) from generate_series(1,100)),
    'questionTimes',(select jsonb_agg('{"activeMs":0,"firstViewedAt":null,"lastViewedAt":null,"events":[]}'::jsonb) from generate_series(1,100)));
  insert into public.cean_live_exams(id,user_id,snapshot,progress,started_at,deadline_at)
    values(current_id,student,base,initial,to_timestamp(started_ms::double precision/1000),to_timestamp(deadline_ms::double precision/1000));
  return cean_private.visible_exam(current_id);
end;
$$;

create or replace function cean_private.valid_timing(times jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare item jsonb; ev jsonb; field text;
begin
  if jsonb_typeof(times) is distinct from 'array' or jsonb_array_length(times)<>100 then return false; end if;
  for item in select value from jsonb_array_elements(times) loop
    if jsonb_typeof(item) is distinct from 'object'
      or jsonb_typeof(item->'activeMs') is distinct from 'number'
      or (item->>'activeMs')::numeric not between 0 and 3600000
      or jsonb_typeof(item->'events') is distinct from 'array' then return false; end if;
    for ev in select value from jsonb_array_elements(item->'events') loop
      if jsonb_typeof(ev) is distinct from 'object' or coalesce(ev->>'kind','') not in ('answer','clear')
        or ev->'answer' is null or (ev->'answer'<>'null'::jsonb and
          (jsonb_typeof(ev->'answer')<>'number' or ev->>'answer' !~ '^[0-4]$'))
        or jsonb_typeof(ev->'localDay') is distinct from 'string' then return false; end if;
      foreach field in array array['at','activeMs','elapsedMs','remainingMs','weekday','hour','utcOffsetMinutes'] loop
        if jsonb_typeof(ev->field) is distinct from 'number' then return false; end if;
      end loop;
      if (ev->>'activeMs')::numeric not between 0 and 3600000
        or (ev->>'elapsedMs')::numeric not between 0 and 3600000
        or (ev->>'remainingMs')::numeric not between 0 and 3600000
        or ev->>'weekday' !~ '^[0-6]$' or ev->>'hour' !~ '^([0-9]|1[0-9]|2[0-3])$' then return false; end if;
    end loop;
  end loop;
  return true;
end;
$$;
revoke all on function cean_private.valid_timing(jsonb) from public,anon,authenticated;

create or replace function public.cean_store_progress(exam_id uuid, progress jsonb, expected_revision bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare live public.cean_live_exams%rowtype; stamp bigint; cleaned jsonb;
begin
  if not public.cean_has_access() then raise exception 'Acceso no autorizado' using errcode='42501'; end if;
  select * into live from public.cean_live_exams where id=exam_id and user_id=auth.uid() for update;
  if not found or live.finished_at is not null then raise exception 'Examen no disponible' using errcode='42501'; end if;
  if clock_timestamp() >= live.deadline_at then return jsonb_build_object('revision',live.revision,'accepted',false); end if;
  if expected_revision is distinct from live.revision then raise exception 'Otro dispositivo actualizó el examen. Exporta tu copia y reanuda.' using errcode='40001'; end if;
  if progress is null or jsonb_typeof(progress) is distinct from 'object' or octet_length(progress::text)>524288
    or jsonb_typeof(progress->'answers') is distinct from 'array'
    or jsonb_typeof(progress->'marked') is distinct from 'array'
    or jsonb_typeof(progress->'questionTimes') is distinct from 'array'
    or jsonb_typeof(progress->'elapsedMs') is distinct from 'number' then
    raise exception 'Progreso inválido' using errcode='22023';
  end if;
  if jsonb_array_length(progress->'answers')<>100 or jsonb_array_length(progress->'marked')<>100
    or jsonb_array_length(progress->'questionTimes')<>100
    or jsonb_typeof(progress->'current') is distinct from 'number'
    or (progress->>'current') !~ '^(0|[1-9][0-9]?)$'
    or (progress->>'current')::int not between 0 and 99
    or exists(select 1 from jsonb_array_elements(progress->'answers') a(value)
      where a.value<>'null'::jsonb and (jsonb_typeof(a.value)<>'number' or a.value::text !~ '^[0-4]$'))
    or exists(select 1 from jsonb_array_elements(progress->'marked') m(value) where jsonb_typeof(m.value)<>'boolean') then
    raise exception 'Respuestas inválidas' using errcode='22023';
  end if;
  if not cean_private.valid_timing(progress->'questionTimes') then
    raise exception 'Tiempos y eventos inválidos' using errcode='22023';
  end if;
  stamp := floor(extract(epoch from clock_timestamp())*1000)::bigint;
  -- Ignorar preguntas, claves, identidad y plazo proporcionados por el navegador.
  cleaned := jsonb_build_object('answers',progress->'answers','marked',progress->'marked','current',progress->'current',
    'elapsedMs',greatest(0,least(3600000,coalesce((progress->>'elapsedMs')::numeric,0))),
    'questionTimes',progress->'questionTimes','startedCalendar',progress->'startedCalendar',
    'updatedAt',stamp,'observedAt',stamp);
  update public.cean_live_exams set progress=cleaned,revision=revision+1 where id=exam_id;
  return jsonb_build_object('revision',live.revision+1,'accepted',true);
end;
$$;

create or replace function public.cean_finish_exam(exam_id uuid, progress jsonb, expected_revision bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare live public.cean_live_exams%rowtype; result jsonb; stamp bigint; expired boolean; score integer;
begin
  if not public.cean_has_access() then raise exception 'Acceso no autorizado' using errcode='42501'; end if;
  select * into live from public.cean_live_exams where id=exam_id and user_id=auth.uid() for update;
  if not found then raise exception 'Examen no disponible' using errcode='42501'; end if;
  if live.finished_at is not null then
    select exam into result from public.cean_exam_attempts where user_id=auth.uid() and id=exam_id;
    return result;
  end if;
  -- Solo aceptar respuestas recibidas antes del plazo del servidor.
  if clock_timestamp()<live.deadline_at then perform public.cean_store_progress(exam_id,progress,expected_revision); end if;
  select * into live from public.cean_live_exams where id=exam_id;
  expired := clock_timestamp()>=live.deadline_at;
  stamp := floor(extract(epoch from least(clock_timestamp(),live.deadline_at))*1000)::bigint;
  result := live.snapshot || live.progress || jsonb_build_object('completedAt',stamp,
    'durationMs',stamp-(live.snapshot->>'startedAt')::bigint,'finishReason',case when expired then 'timeout' else 'manual' end,
    'remote',true,'serverVerified',true,'remoteRevision',live.revision);
  select count(*) into score from jsonb_array_elements(result->'questions') with ordinality q(value,n)
    where q.value->'correct'=(result->'answers')->(q.n::int-1);
  insert into public.cean_exam_attempts(user_id,id,student_email,started_at,completed_at,correct,duration_ms,exam,verification_source)
    select auth.uid(),exam_id,u.email,live.started_at,to_timestamp(stamp::double precision/1000),score,
      (result->>'durationMs')::bigint,result,'server' from auth.users u where u.id=auth.uid()
    on conflict(user_id,id) do nothing;
  update public.cean_live_exams set finished_at=to_timestamp(stamp::double precision/1000),snapshot='{}',progress='{}' where id=exam_id;
  select exam into result from public.cean_exam_attempts where user_id=auth.uid() and id=exam_id;
  return result;
end;
$$;

revoke all on function public.cean_current_exam(),public.cean_start_exam(),
  public.cean_store_progress(uuid,jsonb,bigint),public.cean_finish_exam(uuid,jsonb,bigint) from public,anon;
grant execute on function public.cean_current_exam(),public.cean_start_exam(),
  public.cean_store_progress(uuid,jsonb,bigint),public.cean_finish_exam(uuid,jsonb,bigint) to authenticated;
-- Mantener importación de historiales antiguos, sin poder falsificar una sesión privada.
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

notify pgrst, 'reload schema';
commit;
