-- SPEC-08 (CA-15): Auth Hook "Before User Created" — restringe el login
-- (email/contraseña y Google) a los dominios @immoral.es y @immoral.marketing.
--
-- Este SQL crea la función. Después de ejecutarlo, actívala en:
-- Dashboard → Authentication → Hooks → "Before User Created"
-- → elegir esta función (public.restrict_email_domain) → guardar.
-- La restricción NO tiene efecto hasta que se activa ese hook en el Dashboard
-- (no se puede hacer solo con SQL).

create or replace function public.restrict_email_domain(event jsonb)
returns jsonb
language plpgsql
as $$
declare
  user_email text;
  allowed boolean;
begin
  user_email := lower(event->'user'->>'email');

  allowed := user_email is not null and (
    user_email like '%@immoral.es'
    or user_email like '%@immoral.marketing'
  );

  if not allowed then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'http_code', 403,
        'message', 'Solo se permiten cuentas de email @immoral.es o @immoral.marketing'
      )
    );
  end if;

  return jsonb_build_object();
end;
$$;

-- El hook de Supabase invoca esta función con permisos del rol
-- supabase_auth_admin; se le concede explícitamente para poder ejecutarla.
grant execute on function public.restrict_email_domain(jsonb) to supabase_auth_admin;
revoke execute on function public.restrict_email_domain(jsonb) from authenticated, anon, public;
