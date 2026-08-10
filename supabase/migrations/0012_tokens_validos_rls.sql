-- Permite gestionar tokens_validos desde el panel interno (/tokens).
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar todo → Run
--
-- Hasta ahora esta tabla no tenía ninguna política (solo la service_role key
-- de /api/contact.js podía leerla, saltándose RLS). Con el endpoint de
-- ingesta ya centralizado, cada nueva web del grupo necesita su propio
-- token — este panel evita tener que darlo de alta a mano por SQL cada vez.
-- Los tokens son en la práctica credenciales de escritura (cualquiera con uno
-- puede insertar en contact_messages), así que a diferencia del resto de
-- tablas del panel (donde "usuario" ve en modo lectura), aquí tanto ver como
-- crear/borrar tokens queda restringido a admin.

create policy "tokens_validos_select_admin_only"
  on public.tokens_validos for select
  to authenticated
  using (public.is_admin());

create policy "tokens_validos_insert_admin_only"
  on public.tokens_validos for insert
  to authenticated
  with check (public.is_admin());

create policy "tokens_validos_delete_admin_only"
  on public.tokens_validos for delete
  to authenticated
  using (public.is_admin());
