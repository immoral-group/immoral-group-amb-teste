-- Token del formulario de contacto de esta web (contacto.html).
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar todo → Run
--
-- Si en el futuro otra web del grupo quiere usar este mismo endpoint de
-- ingesta (/api/contact.js), se le da su propio token con un INSERT igual a
-- este, con una etiqueta distinta — no hace falta tocar el código del API.

insert into public.tokens_validos (token, etiqueta)
values ('723d7c6ffc60a2e785227136401be8a46a6c89bf637e3f4e', 'contacto-web-immoral')
on conflict (token) do nothing;
