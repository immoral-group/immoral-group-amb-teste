# SPEC-06: Analítica — GA4/GTM

**Versión:** 1.2
**Estado:** draft — bloqueada, pendiente de ID de GTM/GA4 de Julián o David
**Tipo de proyecto:** web-app
**Última actualización:** 2026-07-17
**Owner:** David Navarrete

---

## Descripción

Instalar el snippet de Google Tag Manager en el `<head>` de todas las páginas del sitio para poder medir tráfico, comportamiento y conversiones con GA4. Hoy `https://immoral.es` no tiene ninguna analítica instalada (verificado: sin GA4, sin GTM, sin ningún pixel, sin falsos positivos de clases CSS con nombres parecidos). Sin analítica, cualquier decisión sobre el impacto de las SPEC-01 a SPEC-05 (o de cualquier campaña futura) se basa en intuición, no en datos.

---

## ⚠️ Bloqueo — Ambigüedad crítica sin resolver

**No existe un ID de contenedor GTM (`GTM-XXXXXXX`) ni un ID de propiedad GA4 (`G-XXXXXXXXXX`) real para este proyecto.** Se ha verificado que no está disponible en:
- El código del repositorio (ningún snippet, ninguna variable de entorno referenciada).
- `vercel.json` ni en ninguna configuración de build.
- Ningún archivo `.env`/`.env.example` presente en el repo (no existen en este proyecto).

**Esta SPEC NO se implementa con un ID inventado o de placeholder.** Instalar un contenedor GTM falso generaría un error 404 silencioso en cada carga de página (GTM intenta cargar `https://www.googletagmanager.com/gtm.js?id={ID}` y falla si el ID no existe), contaminaría cualquier futura instalación real, y podría inducir a error a quien revise el sitio pensando que la analítica ya está activa cuando no lo está.

**Quién debe resolver el bloqueo:** Julián o David deben proporcionar:
1. El ID de contenedor GTM (`GTM-XXXXXXX`) de la cuenta de Immoral Group, **o**
2. Confirmación de que hay que crear uno nuevo (en cuyo caso, quién tiene acceso a la cuenta de Google Tag Manager/Analytics de la organización para crearlo).

Hasta que se resuelva esta ambigüedad, esta SPEC permanece en `draft` y no entra en la ronda de implementación de código de SPEC-01 a SPEC-05.

---

## Actores

- **Administrador de analítica (David/Julián):** consulta los datos de GA4 para decisiones de negocio y marketing.
- **Visitante del sitio:** su navegación se registra de forma anonimizada/agregada en GA4 (sujeto a política de cookies/consentimiento — ver Notas de seguridad).
- **Google Tag Manager:** contenedor que carga y gestiona las etiquetas de medición (GA4 y futuras: Google Ads, Meta Pixel, etc.) sin requerir cambios de código adicionales por cada etiqueta nueva.

---

## Flujos principales

### Flujo 1: Carga del snippet GTM en cada página (una vez resuelto el bloqueo)

1. El visitante carga cualquier página del sitio.
2. El `<head>` incluye el snippet estándar de GTM, que carga `gtm.js` de forma asíncrona con el ID de contenedor real.
3. GTM ejecuta las etiquetas configuradas en su panel (GA4 como mínimo) sin necesidad de tocar más código en este repo para futuras etiquetas.

### Flujo 2: Consentimiento de cookies antes de la carga de analítica

1. El visitante ve el banner de cookies, implementado el 2026-07-17 en `src/cookie-banner.js` (renombrado a `src/bottom-panel.js` el 2026-07-31 porque algunos ad-blockers bloqueaban el archivo por el patrón "cookie-banner" en el nombre, y al ser un import estático tumbaba todo `main.js`; ahora se carga vía import dinámico desde `src/main.js`, aislado en un try/catch). Guarda la elección en `localStorage` (`cookie_consent`, `cookie_analytics`, `cookie_marketing`), las mismas claves que ya lee/escribe el panel de preferencias de `cookies.html`.
2. **El banner hoy es solo un registro de preferencia — no bloquea nada porque no hay ningún script de GTM/GA4/Meta Pixel instalado que gatear** (ver Descripción). Cuando se resuelva el bloqueo del ID y se instale el snippet de GTM, ese snippet **debe** comprobar `localStorage.getItem('cookie_analytics') === 'true'` (y el equivalente para marketing/Meta Pixel) antes de cargarse, o implementar Consent Mode v2 de Google leyendo esas mismas claves como señal de consentimiento inicial.
3. Si el visitante rechaza cookies no esenciales (`cookie_analytics = 'false'`), GA4 no debe registrar su navegación una vez instalado (o debe hacerlo en modo consentido limitado, según Consent Mode v2 de Google).

*(La ambigüedad de "si existe un gestor de consentimiento" queda resuelta: sí existe. Lo que sigue pendiente es la implementación del propio GTM/GA4 y su gating contra estas claves — ver Edge cases y Desglose de tareas.)*

---

## Flujos alternativos / Edge cases

- **[Actualizado 2026-07-17] Ya existe un banner de consentimiento de cookies en el código** (`src/bottom-panel.js`, renombrado desde `src/cookie-banner.js` el 2026-07-31, + integración vía import dinámico en `src/main.js`), que guarda la preferencia en `localStorage` (`cookie_consent`, `cookie_analytics`, `cookie_marketing`) y es coherente con el panel de preferencias de `cookies.html`. **Esto no elimina el bloqueo de esta SPEC**: el banner es un mecanismo de UI/registro, pero el snippet de GTM que se instalaría aquí debe implementar el gating real leyendo esas claves (o vía Consent Mode v2) — si se instala GTM sin ese gating, el banner quedaría siendo decorativo y el sitio incumpliría RGPD/LSSI igual que si no existiera banner. Ese gating pasa a ser parte explícita del Plan de implementación de esta SPEC (ver Desglose de tareas).
- **ID de GTM proporcionado pero cuenta sin permisos para David/Julián:** si se proporciona el ID pero nadie del equipo tiene acceso de administrador al contenedor para configurar las etiquetas después de instalarlo, la SPEC se completaría a medias (snippet instalado, pero sin etiquetas configuradas del lado de GTM). Se documenta como riesgo, no bloquea la instalación del snippet en sí.

---

## Criterios de aceptación

*(Todos los CA siguientes quedan en estado "no verificable" mientras la SPEC esté en `draft`. Se activan y verifican solo tras resolver el bloqueo y pasar a `aprobada`.)*

- [ ] CA-01: El snippet de GTM está presente en el `<head>` de las 34 páginas indexables del sitio, con el ID de contenedor real proporcionado por Julián/David (no un placeholder).
- [ ] CA-02: El snippet `noscript` de GTM (`<iframe>` de respaldo) está presente inmediatamente después de la apertura de `<body>` en cada página, según el estándar de instalación de Google.
- [ ] CA-03: Al cargar cualquier página en un navegador con las DevTools abiertas, la pestaña Network muestra una petición a `googletagmanager.com/gtm.js?id={ID}` con respuesta 200.
- [ ] CA-04: GA4 (verificado desde el panel de Google Analytics, vista en tiempo real) registra una sesión al navegar el sitio en un entorno de prueba.
- [ ] CA-05: `npm run build` termina sin errores con el snippet instalado.
- [ ] CA-06 (defecto seguro): mientras esta SPEC esté en `draft`, `grep -l "googletagmanager\|GTM-\|gtag(" *.html` no debe devolver ningún archivo — es decir, ninguna otra spec ni cambio "por si acaso" instala un ID de placeholder en el HTML.

*(La verificación de que el mecanismo de consentimiento de cookies bloquea etiquetas no esenciales — apartada del listado de CA para no bloquear la implementación técnica de GTM cuando eventualmente se desbloquee esta SPEC — queda documentada como riesgo legal en "Otros riesgos identificados" y como acción pendiente por decidir en el Desglose de tareas. No es un CA de esta SPEC porque su verificación depende de un mecanismo (banner de cookies + Consent Mode v2 + configuración en GTM) que hoy no existe en el repo y que, en caso de decidirse, requiere su propia SPEC.)*

---

## Modelo de datos

### Entidades nuevas o modificadas

No aplica.

### Relaciones

No aplica.

### Migraciones necesarias

No aplica.

---

## UI / Páginas afectadas

### Páginas nuevas

Ninguna.

### Páginas modificadas

Las 34 páginas indexables del sitio (mismo alcance que SPEC-01/02/04), una vez resuelto el bloqueo.

### Componentes reutilizables

No aplica.

### Breakpoints obligatorios

No aplica.

### Estándar de calidad visual

No aplica — el snippet GTM no es visible (salvo el `<noscript>` de respaldo, que tampoco tiene impacto visual en navegadores con JS habilitado).

---

## API / Endpoints

### Endpoints nuevos

No aplica.

### Endpoints modificados

No aplica.

### Contratos de request/response

No aplica.

---

## Notas de seguridad

### Datos sensibles involucrados

Datos de navegación de visitantes (IP, user agent, comportamiento en el sitio) — datos personales según RGPD si no se anonimizan. GA4 por defecto no almacena IP completa, pero sí genera identificadores de cliente.

### Validaciones server-side requeridas

No aplica — GTM/GA4 son scripts de cliente.

### Autenticación y autorización

No aplica.

### Otros riesgos identificados

- 🔴 **CRÍTICO — instalar el snippet de GTM sin conectarlo al gating del banner de consentimiento es un riesgo legal (RGPD/LSSI), no solo técnico.** El banner (`src/bottom-panel.js`, renombrado desde `src/cookie-banner.js` el 2026-07-31) ya existe desde 2026-07-17, pero por sí solo no basta: si al desbloquear el ID se instala GTM leyendo las claves de `localStorage` (`cookie_analytics`/`cookie_marketing`) o Consent Mode v2, se cumple; si se instala "a secas" ignorando esas claves, el sitio registraría visitantes que rechazaron el consentimiento. SECURITY-AGENT debe verificar este gating como parte de la aprobación de esta SPEC, no solo la presencia del banner.
- 🟠 **ALTO — un ID de GTM inventado o de otra cuenta contaminaría los datos de esa otra cuenta o generaría errores silenciosos.** Motivo por el que esta SPEC se mantiene en `draft` en vez de forzar una implementación parcial.

*(SECURITY-AGENT aplicará el checklist de `.brianspec/security-checklists.md` sección "Tipo: web-app", en particular la subsección "Datos personales (si aplica)".)*

---

## Plan de implementación

### Arquitectura propuesta

Snippet estándar de GTM (head + noscript body) insertado en las 34 páginas, una vez exista un ID de contenedor real y una decisión sobre consentimiento de cookies.

### Desglose de tareas

1. **[BLOQUEADO] Obtener el ID de contenedor GTM real** de Julián/David, o confirmación de que hay que crear una cuenta/contenedor nuevo.
2. ~~Decidir si esta SPEC incluye un mecanismo de consentimiento de cookies~~ — **[Resuelto 2026-07-17]** ya existe un banner de consentimiento (`src/bottom-panel.js`, renombrado desde `src/cookie-banner.js` el 2026-07-31 por bloqueo de ad-blockers) que guarda la elección en `localStorage`. La tarea pendiente ya no es "decidir si se implementa un banner", sino:
3. Insertar el snippet de GTM (head + noscript) en las 34 páginas, **cargándolo solo si `localStorage.getItem('cookie_analytics') === 'true'`** (o vía Consent Mode v2 leyendo esa misma señal), para que el consentimiento del banner tenga efecto real y no sea decorativo.
4. Configurar la etiqueta GA4 dentro del panel de GTM (fuera del repo, en la interfaz web de Tag Manager).
5. Verificar en modo Preview de GTM y en tiempo real de GA4 que los datos llegan correctamente, y que rechazar en el banner efectivamente impide que se dispare la etiqueta.

### Dependencias con otras specs

- **Bloqueada por:** decisión externa de Julián/David sobre el ID de GTM (no es una SPEC previa, es una decisión de negocio/acceso a cuentas).
- **Podría bloquear a:** cualquier SPEC futura de medición de impacto de las SPEC-01 a SPEC-05 (sin analítica, no se puede medir si la metadata nueva mejora el CTR real).

---

## Tests requeridos

### Tests unitarios

No aplica.

### Tests de integración

CA-03 y CA-04 (petición de red a `gtm.js` + sesión en tiempo real de GA4) una vez desbloqueada e implementada.

### Tests E2E

No aplica.

---

## Out of scope (explícito)

- Configuración de eventos de conversión específicos (envío de formulario de contacto, clics en WhatsApp, etc.) dentro de GTM — eso es trabajo de configuración en el panel de GTM, posterior a la instalación del snippet, y normalmente no requiere cambios de código adicionales.
- Cualquier otro píxel de tracking (Meta Pixel, LinkedIn Insight Tag, etc.) — esta SPEC es específicamente sobre GA4/GTM según el encargo. Píxeles adicionales serían SPECs futuras, gestionables igualmente vía GTM una vez instalado.
- ~~Implementación de un banner de consentimiento de cookies completo~~ — **[Actualizado 2026-07-17]** ya implementado fuera de esta SPEC, en `src/bottom-panel.js` (renombrado desde `src/cookie-banner.js` el 2026-07-31). Sigue fuera de alcance de esta SPEC el mantenimiento de ese banner (su copy, diseño o el panel de `cookies.html`); lo que sí entra en el alcance de esta SPEC es conectar el snippet de GTM al consentimiento que ese banner ya registra (ver Desglose de tareas).

---

## Historial

| Versión | Fecha | Cambio | Autor |
|---|---|---|---|
| 1.0 | 2026-07-13 | Versión inicial, creada en estado `draft — bloqueada` por falta de ID de GTM/GA4 real. No se implementa código en esta ronda. | David Navarrete |
| 1.1 | 2026-07-13 | Auditoría con Claude Opus: el CA-05 original (consentimiento de cookies bloquea etiquetas no esenciales) mezclaba dos bloqueos distintos (ID + consentimiento) y hacía que ni siquiera desbloqueando el ID fuera verificable esta SPEC sin implementar antes un banner + Consent Mode. Movido el consentimiento fuera del listado de CA (queda como riesgo documentado + pendiente de decisión formal en SPEC propia). Añadido CA-06 de "defecto seguro": mientras la SPEC esté en draft, ningún archivo debe contener tracking con placeholder. | David Navarrete |
| 1.2 | 2026-07-17 | Se implementó el banner de consentimiento de cookies (`src/cookie-banner.js`, integrado en `src/main.js`) en una sesión separada, no como parte de esta SPEC. Esto resuelve la segunda ambigüedad documentada en v1.1 ("no hay gestor de consentimiento"), pero **no desbloquea la SPEC**: el bloqueo por falta de ID de GTM/GA4 sigue vigente. Se actualizó Flujo 2, Edge cases, riesgos, Desglose de tareas y Out of scope para reflejar que el banner existe pero hoy no gatea nada (porque no hay ningún script de analítica/marketing instalado), y para dejar explícito que conectar el futuro snippet de GTM a las claves de `localStorage` de ese banner (`cookie_analytics`, `cookie_marketing`) pasa a ser parte del trabajo de esta SPEC, no una decisión pendiente aparte. | Gregory Jaques (con Claude) |
| 1.3 | 2026-07-31 | Se detectó que algunos ad-blockers (ej. Adblock Plus) bloqueaban la descarga de `src/cookie-banner.js` por el patrón "cookie-banner" en el nombre del archivo, y al importarse de forma estática desde `src/main.js`, ese bloqueo hacía fallar la carga de **todo** `main.js` (Tailwind y el resto de scripts del sitio dejaban de aplicarse) para cualquier visitante con ese tipo de extensión. Corregido: el archivo se renombró a `src/bottom-panel.js` (IDs internos también renombrados de `cookie-banner*` a `site-bottom-panel*`) y se cambió su integración en `main.js` de import estático a import dinámico con `.catch()`, para que un bloqueo futuro de este u otro script no vuelva a tumbar el sitio completo. Sin cambios en las claves de `localStorage` ni en el comportamiento visible del banner. | Claude (Sonnet 5) |
