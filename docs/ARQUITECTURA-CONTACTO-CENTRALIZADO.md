# Arquitectura del formulario de contacto del grupo (centralizado + reCAPTCHA v3)

**Fecha:** 10/08/2026
**Origen de la decisión:** llamada entre Gregory Jaques y Julian Muñoz (techlead), 10/08/2026, ~18:26. Diagrama de referencia hecho en Excalidraw durante esa llamada.
**Estado:** implementado, 4 PRs abiertos pendientes de merge + configuración de env vars (ver "Pendiente para mañana" al final).

Este documento existe para que cualquiera (persona o IA) que retome este trabajo entienda el diseño completo sin tener que reconstruirlo leyendo diffs de 4 repos distintos.

---

## 1. Por qué se hizo esto

El formulario de contacto (`nombre`, `email`, `mensaje`, checkbox de privacidad) existe en 4 webs del grupo: **immoral.es** (producción), el **ambiente de teste** de immoral.es (este repo), **immoralia.es** y **imcontent.es**. Antes de este cambio:

1. El formulario de immoral.es enviaba el mensaje por email vía Resend. Se detectó que además **llevaba roto desde el 27/11/2025** (commit `e96e6e8`): el JS que enganchaba el formulario solo se ejecutaba en una carga dura de página, nunca tras navegación SPA por links internos — el caso normal de un visitante. El botón "Enviar" hacía un submit nativo del navegador (GET, nunca llegaba al backend). Se corrigió moviendo la inicialización a `initAll()` (la función que sí se re-ejecuta en cada navegación SPA) en `src/main.js`, tanto aquí como en `immoral-group-cliente`.
2. Un primer intento de reemplazar el email por guardado en base de datos se hizo **duplicando** el endpoint (con la `service_role` key de Supabase) en cada web (amb-teste, immoral-group-cliente, immoralia, imcontent). El techlead marcó esto como incorrecto en la llamada del 10/08: la `service_role` key nunca debe vivir en más de un lugar, y cada proyecto no necesita saber nada de la base de datos — solo necesita saber a qué URL mandar el formulario y con qué token.
3. Se corrigió centralizando todo en **un único endpoint de ingesta**, que vive solo en este repo (`immoral-group-amb-teste`, la "web madre"). Las demás webs le hacen un `fetch` cross-origin con su propio token.
4. Por último, se agregó **reCAPTCHA v3** (pedido explícito del techlead, mismo llamada) para frenar spam/bots, con la verificación real también centralizada en el mismo endpoint.

---

## 2. Arquitectura resultante

```
                    ┌─────────────────────────────────────────┐
                    │   immoral-group-amb-teste (web madre)    │
                    │                                           │
  fetch POST        │   /api/contact.js                        │
  ────────────────► │     1. valida reCAPTCHA (siteverify)     │
  {token,           │     2. valida `token` contra              │
   nombre, email,   │        tokens_validos                    │
   mensaje,         │     3. inserta en contact_messages        │
   recaptchaToken}  │        (usando service_role key)          │
                    │                                           │
                    │   Panel interno (solo admin/usuario):     │
                    │     /mensajes  → leer, marcar leído, borrar│
                    │     /tokens    → alta de tokens nuevos     │
                    └─────────────────────────────────────────┘
                              ▲        ▲        ▲        ▲
                              │        │        │        │
                    ┌─────────┘  ┌─────┘  ┌─────┘  ┌─────┘
                    │            │        │        │
              immoral.es   amb-teste  immoralia.es imcontent.es
             (el mismo     (su propio  (modal en   (form junto
              token que     /contacto)  el CTA      al Calendly,
              amb-teste)                final)      home + /contacto)
```

Cada una de las 4 webs solo tiene, en su propio código:
- La URL del endpoint central: `https://immoral-group-amb-teste.vercel.app/api/contact`
- Su propio **token** (string, no es secreto profundo — viaja en el bundle público del cliente igual que cualquier clave `anon`)
- El código de reCAPTCHA v3 en el cliente (`grecaptcha.execute()`) usando el **site key** (público)

Ninguna de las 4 tiene: la `service_role` key de Supabase, la `secret key` de reCAPTCHA, ni código que hable directamente con la base de datos. Todo eso vive solo en `immoral-group-amb-teste`.

---

## 3. Base de datos (Supabase compartido)

Proyecto: `jefpmqavxsprnklzezrr` (`https://jefpmqavxsprnklzezrr.supabase.co`) — el mismo proyecto de Supabase que ya usa este repo para `team_members`, `profiles`, `case_studies`, etc.

### Tabla `tokens_validos`
| Columna | Tipo | Notas |
|---|---|---|
| `token` | `text` | PK |
| `etiqueta` | `text` | identifica de qué web viene cada mensaje |
| `created_at` | `timestamptz` | default `now()` |

RLS: sin políticas para `anon`/`authenticated` salvo `admin` (vía `is_admin()`) — select/insert/delete. La única otra vía de escritura es `service_role`, usada por `/api/contact.js`. Migración: `supabase/migrations/0012_tokens_validos_rls.sql`.

### Tabla `contact_messages`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `uuid` | PK |
| `nombre`, `email`, `mensaje` | `text` | del formulario |
| `telefono`, `asunto` | `text` | opcionales (`nullable`) — solo los usa el formulario de imfashion.es, que tiene más campos que el resto. Añadidos en `0015_contact_messages_telefono_asunto.sql` |
| `etiqueta` | `text` | copiada de `tokens_validos` en el momento del insert |
| `leido` | `boolean` | default `false` |
| `created_at` | `timestamptz` | default `now()` |

RLS: `select`/`update` (marcar leído) para cualquier `authenticated` (admin o usuario); `delete` solo admin. Insert solo vía `service_role`. Migración: `supabase/migrations/0010_contact_messages_schema.sql` (+ seed `0011`).

### Tokens ya emitidos

| Token | Etiqueta | Usado por |
|---|---|---|
| `723d7c6ffc60a2e785227136401be8a46a6c89bf637e3f4e` | `contacto-web-immoral` | **immoral.es** (producción, repo `immoral-group-cliente`) y el `/contacto` de **este ambiente de teste** — comparten token a propósito, son conceptualmente el mismo sitio en dos etapas |
| `2b4c74a246f23d21717c34557d34d6e93d0c9068852a8296` | `contacto-web-immoralia` | **immoralia.es** |
| `615990946ab69829f06132317e927275099b868ee1aa09e7` | `contacto-web-imcontent` | **imcontent.es** |
| `38292742b8883a48f96e121097e558866f11429ef4d48de1` | `contacto-web-imfashion` | **imfashion.es** — único formulario del grupo con campos extra (`telefono`, `asunto`) |

Para dar de alta un token nuevo (ej. imfilms.es en el futuro) **no hace falta tocar SQL**: entrar a `/tokens` en este panel (solo admin), poner la etiqueta, y el propio panel genera el token y lo inserta.

---

## 4. El endpoint centralizado — `api/contact.js` (solo en este repo)

Flujo, en orden:

1. **CORS**: si el header `Origin` está en `ALLOWED_ORIGINS` (dominios de producción + sus `*.vercel.app` + localhost de dev), responde con los headers `Access-Control-Allow-*`. Maneja `OPTIONS` (preflight) devolviendo 204.
2. Solo acepta `POST`.
3. Chequea que existan las 3 env vars requeridas (`VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RECAPTCHA_SECRET_KEY`) — si falta alguna, responde 500 con JSON claro **antes** de intentar instanciar el cliente de Supabase (si `createClient()` se llamara a nivel de módulo con una URL vacía, tira abajo todo el proceso de Node con un crash no controlado — pasó de verdad en producción tras el primer PR, ver sección 7).
4. Valida que el body tenga `token`, `nombre`, `email`, `mensaje` y `recaptchaToken`.
5. **Verifica reCAPTCHA**: `POST` a `https://www.google.com/recaptcha/api/siteverify` con la `secret` key y el `recaptchaToken` recibido. Rechaza (403) si `success` es falso, si el `score` es menor a `0.5`, o si el campo `action` devuelto no es `"contact_form"`.
6. Busca el `token` en `tokens_validos`. Si no existe, 401.
7. Inserta en `contact_messages` con la `etiqueta` correspondiente a ese token.
8. Devuelve `{ success: true }` (200) o un mensaje de error claro en cualquier paso anterior.

## 5. El lado del cliente (igual en las 4 webs, adaptado al lenguaje de cada una)

Patrón idéntico en los 4 repos:

```js
const CONTACT_FORM_TOKEN = '...'; // propio de cada web
const RECAPTCHA_SITE_KEY = <env var>; // mismo valor en las 4

// Carga el script de reCAPTCHA una sola vez, cacheando la promesa
function loadRecaptchaScript() { ... }

// grecaptcha.ready() + grecaptcha.execute(SITE_KEY, {action:'contact_form'})
async function getRecaptchaToken() { ... }

// En el submit del formulario:
const recaptchaToken = await getRecaptchaToken();
fetch(CONTACT_FORM_ENDPOINT, {
  method: 'POST',
  body: JSON.stringify({ ...datosDelForm, token: CONTACT_FORM_TOKEN, recaptchaToken }),
});
```

El badge flotante de reCAPTCHA (esquina inferior) se deja visible por defecto — ocultarlo requeriría añadir el texto de atribución exigido por los términos de Google en otro lugar de la página, y no se hizo.

---

## 6. Qué cambió en cada repo

### `immoral-group-amb-teste` (este repo) — "web madre"
- `api/contact.js`: endpoint centralizado completo (CORS + reCAPTCHA + tokens + insert).
- `src/main.js`: `initContactForm()` corregido (bug SPA) + cliente de reCAPTCHA. Su propio `/contacto` usa el token `contacto-web-immoral`.
- `src/tokens.js` + `tokens.html`: panel nuevo `/tokens` (alta/copiar/borrar tokens), solo admin.
- `src/mensajes.js` + `mensajes.html`: panel `/mensajes` (ya existía de un paso anterior) — lee, marca leído, borra mensajes.
- `src/dashboardShell.js`: nav del panel con los links a `/mensajes` y `/tokens`.
- Migraciones `0010`, `0011`, `0012` en `supabase/migrations/`.
- **PR:** [#49](https://github.com/immoral-group/immoral-group-amb-teste/pull/49) — rama `fix/contact-endpoint-no-crashear-sin-env-vars`.

### `immoral-group-cliente` (repo GitHub `immoral-group/immoral-group`, producción, `immoral.es`)
- Se **eliminó** `api/contact.js` y la dependencia `@supabase/supabase-js` (ya no toca la base de datos directamente).
- `src/main.js`: mismo fix del bug SPA + fetch al endpoint central (con `CONTACT_FORM_ENDPOINT` absoluto) + cliente de reCAPTCHA.
- **PR:** [#6](https://github.com/immoral-group/immoral-group/pull/6) — rama `fix/contact-endpoint-no-crashear-sin-env-vars`. (El PR #5, ya mergeado, fue el primer intento con el endpoint duplicado — el #6 lo corrige.)

### `immoralia` (Next.js, repo GitHub `immoral-group/immoralia`)
- El botón "Contáctanos" del CTA final (`components/CreativeMotionCTA.tsx`, sección antes del footer) abría un `mailto:` — ahora abre un modal (`components/ContactModal.tsx`, sobre el `Dialog` de Radix ya presente en el proyecto).
- Se **eliminó** `app/api/contact/route.ts` (existió brevemente con el endpoint duplicado, se quitó al centralizar).
- **PR:** [#14](https://github.com/immoral-group/immoralia/pull/14) — rama `feat/contacto-modal-supabase`.
- Nota de entorno: este repo depende de un paquete privado de GitHub Packages (`@Immoral-marketing/motor-blog`) que requiere `NODE_AUTH_TOKEN` — no disponible en esta sesión, así que no se pudo correr `npm run build` localmente sin un workaround temporal (quitar la dependencia y comentar su uso en `app/layout.tsx` solo para levantar el server y ver el modal, revertido después). El build real lo hace Vercel en el PR.

### `imcontent` (Next.js, repo GitHub `immoral-group/imcontent-landing`)
- La sección "¿Hablamos de tu contenido?" de la home (`components/ContactFormHome.tsx`) y la página `/contacto` (`components/pages-legacy/ContactPage.tsx`) tenían un formulario embebido de ActiveCampaign (`_form_15`) junto al widget de Calendly. Se reemplazó por un formulario propio (`components/ContactForm.tsx`), dejando el Calendly intacto.
- **PR:** [#4](https://github.com/immoral-group/imcontent-landing/pull/4) — rama `feat/contacto-form-supabase`.
- Mismo problema de `NODE_AUTH_TOKEN` que immoralia, más pnpm (no instalado en esta sesión) — tampoco se pudo verificar con build local.

---

## 7. Incidente real durante el rollout (por qué existe el "hardening")

Tras mergear el primer PR de immoral-group-cliente (#5, endpoint duplicado sin este hardening), el formulario en producción (`immoral.es`) empezó a devolver 500 con un error de parseo JSON en el cliente ("Unexpected token 'A'..."). Se confirmó vía logs de Vercel (`get_runtime_logs`) que la causa era `createClient()` llamado a nivel de módulo con `SUPABASE_URL` sin configurar — eso crashea todo el proceso de Node antes de responder nada, y Vercel devuelve su página de error genérica (texto, no JSON). Se corrigió en todos los repos moviendo `createClient()` dentro del handler, después de validar las env vars requeridas.

**Lección:** cualquier serverless function que dependa de env vars debe validar su presencia *antes* de instanciar clientes a nivel de módulo, o un simple olvido de configuración se convierte en una caída total del endpoint en vez de un error controlado.

---

## 8. Deuda / decisiones explícitas que se tomaron distintas a lo descrito en la llamada

- El techlead sugirió que el **site key de reCAPTCHA** fuera configurable desde el panel de administración (un campo "configuración/captcha" para pegar el código sin redeploy). Se implementó en cambio como **variable de entorno** (`VITE_RECAPTCHA_SITE_KEY` / `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`) en cada proyecto de Vercel — más simple, consistente con cómo ya se maneja `VITE_SUPABASE_URL`, pero requiere un redeploy (no solo un cambio en el panel) si el site key cambia. Si se quiere la versión dinámica descrita en la llamada, es trabajo pendiente.
- `api/send-email.js` (el envío por Resend original) **no se borró** en `immoral-group-amb-teste` ni en `immoral-group-cliente** — quedó como código muerto, sin ninguna ruta que lo llame, por si se quiere reutilizar para el reenvío por email vía n8n.
- El **flujo de n8n** (escuchar `contact_messages`, mandar Slack + email) descrito en la llamada **no se construyó** — es el siguiente paso, explícitamente fuera de este trabajo.

---

## 9. Pendiente para mañana (checklist de pruebas)

### Antes de probar
1. **Mergear el PR #49 primero** (`immoral-group-amb-teste`) y esperar a que Vercel lo despliegue a producción — es el endpoint que los otros 3 llaman por URL absoluta (`https://immoral-group-amb-teste.vercel.app/api/contact`), así que si se mergean los otros 3 antes, sus formularios van a fallar (el endpoint viejo no entiende `recaptchaToken`).
2. Correr en Supabase (SQL Editor) las migraciones que falten: `0010`, `0011`, `0012` (si no se corrieron ya).
3. Configurar en Vercel, por proyecto:

| Proyecto Vercel | Variables nuevas/requeridas |
|---|---|
| `immoral-group-amb-teste` | `SUPABASE_SERVICE_ROLE_KEY`, `RECAPTCHA_SECRET_KEY`, `VITE_RECAPTCHA_SITE_KEY` |
| `immoral-group` (cliente, `immoral.es`) | `VITE_RECAPTCHA_SITE_KEY` |
| `immoralia` | `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` |
| `imcontent-landing` | `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` |

   Mismo site key de reCAPTCHA en las 4 (Google permite varios dominios por site key); la secret key solo en `immoral-group-amb-teste`.
4. Mergear #6, #14 y #4 (en cualquier orden entre sí, pero después de #49).

### Pruebas a hacer
- [ ] Enviar el formulario de cada una de las 4 webs y confirmar que aparece en `/mensajes` (amb-teste) con la etiqueta correcta.
- [ ] Confirmar que un `fetch` cross-origin desde immoralia.es/imcontent.es al endpoint central no es bloqueado por CORS (revisar consola del navegador).
- [ ] Entrar a `/tokens` como admin y generar un token de prueba, confirmar que aparece en la lista y se puede copiar/borrar.
- [ ] Probar el endpoint con un `recaptchaToken` ausente o inválido (ej. con curl/Postman) y confirmar 400/403, no un crash.
- [ ] Revisar que el badge de reCAPTCHA aparece visualmente en las 4 webs (esquina inferior).

### Fuera de este alcance (próximos pasos, no construidos)
- Flujo de n8n (Slack + email al insertarse un mensaje nuevo).
- Hacer el site key de reCAPTCHA configurable desde el panel en vez de env var.
- `imcontent-landing`/`immoralia`: no se pudo verificar build local por falta de `NODE_AUTH_TOKEN` — confiar en el build de Vercel de cada PR antes de mergear.
