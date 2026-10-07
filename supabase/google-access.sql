-- Ejecutar una vez en Supabase → SQL Editor. Es seguro volver a ejecutarlo.
-- No contiene claves secretas ni contraseñas. No crea cuentas Auth manualmente.
begin;

create table if not exists public.cean_authorized_emails (
  email text primary key check (email = lower(btrim(email)) and position('@' in email) > 1),
  name text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.cean_authorized_emails enable row level security;
revoke all on public.cean_authorized_emails from public, anon, authenticated;
grant select on public.cean_authorized_emails to supabase_auth_admin;
grant all on public.cean_authorized_emails to service_role;
drop policy if exists cean_auth_hook_read on public.cean_authorized_emails;
create policy cean_auth_hook_read on public.cean_authorized_emails
  for select to supabase_auth_admin using (true);

-- Solo correos autorizados pueden crear su cuenta mediante Google.
-- Hay que seleccionar esta función en Authentication → Hooks → Before User Created.
create or replace function public.cean_before_user_created(event jsonb)
returns jsonb language plpgsql security invoker set search_path = '' as $$
begin
  if event->'user'->'app_metadata'->>'provider' = 'google'
     and exists (
       select 1 from public.cean_authorized_emails a
       where a.email = lower(btrim(event->'user'->>'email')) and a.active
     ) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object(
    'http_code', 403, 'message', 'Este correo no tiene acceso autorizado en CEAN.'
  ));
end;
$$;
revoke all on function public.cean_before_user_created(jsonb) from public, anon, authenticated;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.cean_before_user_created(jsonb) to supabase_auth_admin;

-- Sin argumentos editables: usa UUID/JWT autenticados y el correo registrado en Auth.
-- La lista completa no se expone ni siquiera a alumnos autenticados.
create or replace function public.cean_has_access()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(auth.jwt()->'amr', '[]'::jsonb) @> '[{"method":"oauth"}]'::jsonb
    and exists (
      select 1 from auth.users u
      join public.cean_authorized_emails a on a.email = lower(u.email) and a.active
      join auth.identities i on i.user_id = u.id and i.provider = 'google'
      where u.id = auth.uid() and u.email_confirmed_at is not null
        and lower(i.identity_data->>'email') = lower(u.email)
        and i.identity_data->>'email_verified' = 'true'
    );
$$;
revoke all on function public.cean_has_access() from public, anon;
grant execute on function public.cean_has_access() to authenticated;

-- Correo del docente proporcionado en esta conversación; no reactiva una baja existente.
insert into public.cean_authorized_emails (email, name)
values ('davidduranibanez@gmail.com', 'David Durán Ibáñez')
on conflict (email) do nothing;

commit;
