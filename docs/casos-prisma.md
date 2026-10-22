# Pasar las páginas de caso de éxito al diseño Prisma

Guía para el agente que migre las páginas `caso-<slug>.html` que quedan al diseño nuevo (Prisma). La página de **Mun Kombucha** (`caso-munkombucha.html`) ya está hecha y aprobada: es la referencia. El objetivo es que las demás queden **igual que esa**, con su propio contenido.

Léela entera antes de tocar nada.

---

## 1. Lo más importante: estas páginas NO se editan a mano

Todas las `caso-*.html` las **genera** `scripts/generate-case-studies.mjs` a partir de Supabase (tablas `case_studies`, `case_study_results`, `case_study_testimonials`). El script se ejecuta solo antes de `npm run dev` y de `npm run build`, y **sobrescribe** los ficheros. La primera línea de cada página lo avisa: `<!-- AUTO-GENERATED FROM SUPABASE — NO EDITAR A MANO, usa /casos-admin -->`.

Por tanto:

- **Nunca edites un `caso-*.html` a mano.** El siguiente build lo borraría.
- **No hace falta escribir HTML ni CSS por caso.** La plantilla Prisma ya existe en el generador (`renderPrismaDetailPage`) y está probada con los 19 casos.
- **Migrar un caso = añadir su slug a `PRISMA_CASES`**, regenerar y revisar el resultado.

```js
// scripts/generate-case-studies.mjs
export const PRISMA_CASES = new Set(['munkombucha']);
```

Los casos que no están en ese `Set` siguen saliendo con la plantilla antigua (`renderDetailPage`). Así se puede migrar de uno en uno sin romper los demás.

---

## 2. Qué hay ya hecho (no lo cambies)

| Pieza | Dónde |
|---|---|
| Plantilla Prisma de la página | `scripts/generate-case-studies.mjs` → `renderPrismaDetailPage` y las funciones `prisma*Html` |
| Estilos propios del caso | `src/prisma-pages.css`, bloque `/* ---------- Case page (caso-<slug>.html on the Prisma design) ---------- */` |
| Script de la página | `src/page-caso.js` (importa `prisma-site.js` y `page-service.js`) |
| Nav, menú móvil y footer | Se copian de `casos-de-exito.html` en cada build (`getPrismaChrome`). No los dupliques. |

Estructura de la página, en orden (cada sección se omite sola si el caso no tiene ese dato):

1. **Hero** (`.hero-case`): enlace "← Casos de éxito", etiquetas de sector y resultado, nombre de la marca (H1), descripción y la portada inclinada con el clip del caso en bucle. El logo va en una burbuja de vidrio, siempre en negro.
2. **El reto** (`.about-svc.case-challenge`): título fijo y el texto que se enciende palabra a palabra.
3. **Imagen** (`.case-shot`): `mid_image_url` con parallax.
4. **La solución** (`.rows-svc.case-solution`): un paso por párrafo de `solution_text`, numerados.
5. **Lo que cambió** (`.kpis`): las cifras de `case_study_results`, cortadas por la línea del logo. Si el valor es un entero con prefijo o sufijo (`+51%`, `-38 €`, `+310M`) cuenta al aparecer; si no (`+2.7M`) se muestra tal cual.
6. **Testimonio** (`.case-voice`): un `quote` por testimonio. Si el logo existe, va como avatar en negro; si no, las iniciales del autor.
7. **Más casos de éxito** (`.case-next`): los 3 casos siguientes en el orden de `/casos-de-exito`.
8. **Cierre** (`.talk`) y **footer**.

---

## 3. Procedimiento

Trabaja en la rama que te indique el usuario. No hagas `push` ni abras PR sin que te lo pida.

Migra **de uno en uno**. Para cada caso:

1. **Añade el slug** a `PRISMA_CASES` en `scripts/generate-case-studies.mjs`. No cambies nada más del fichero.
   ```js
   export const PRISMA_CASES = new Set(['munkombucha', 'nutfruit']);
   ```
2. **Regenera:**
   ```bash
   node scripts/generate-case-studies.mjs
   ```
   Debe imprimir `[generate-case-studies] 19 caso(s) generado(s).` Si imprime un aviso de Supabase o de `.env`, **para** y avisa al usuario: sin conexión el script no regenera nada.
3. **Comprueba el alcance del cambio** con `git status --short`. Solo deben cambiar `scripts/generate-case-studies.mjs` y el `caso-<slug>.html` que estás migrando. Si cambian otros `caso-*.html` o `casos-de-exito.html`, es porque alguien editó datos en `/casos-admin`. No es un error tuyo, pero díselo al usuario en el informe.
4. **Revisa en el navegador** con el servidor de desarrollo (`npm run dev`, o el `preview_start` de `.claude/launch.json`): `http://localhost:<puerto>/caso-<slug>.html`. Usa la lista de la sección 4, a **1440×900** y a **375×812** (móvil).
5. **Compara el contenido con la versión anterior.** El texto del reto, la solución, las cifras y los testimonios deben ser los mismos de Supabase. Puedes ver la versión anterior con `git show HEAD:caso-<slug>.html`.
6. **Haz commit de ese caso** (o de un lote pequeño de casos ya revisados), con un mensaje como `Caso Nutfruit en diseño Prisma`.

Casos pendientes (todos los activos menos `munkombucha`), en el orden de `/casos-de-exito`:

`nutfruit`, `velites`, `amlul`, `bobo`, `lamanso`, `marcawell`, `angelanavarro`, `coolbottles`, `gabrielforsach`, `grupomimara`, `iventions`, `oxpertacapital`, `oxpertaexpress`, `teamder`, `thecrewel`, `travelperk`, `vasquiat`, `wetribu`

Para saber la lista real en cada momento, ejecuta `node scripts/generate-case-studies.mjs` y mira los `caso-*.html` del directorio raíz. Si aparece un slug que no está en esta lista, trátalo igual.

---

## 4. Lista de revisión por página

Marca cada punto antes de dar un caso por bueno:

- [ ] La consola del navegador no muestra errores.
- [ ] La página no se desplaza en horizontal: `document.documentElement.scrollWidth` es igual al ancho de la ventana, en desktop y en móvil.
- [ ] **Hero:** se ven las etiquetas, el H1 con el nombre de la marca y la descripción completa. La portada carga y el clip se reproduce. El logo se ve en negro dentro de la burbuja, o no hay burbuja si el logo no existe.
- [ ] **El reto:** el texto completo, igual al de Supabase.
- [ ] **Imagen:** carga y no aparece cortada de forma rara.
- [ ] **La solución:** un paso por párrafo, sin texto perdido ni duplicado.
- [ ] **Lo que cambió:** las cifras coinciden con Supabase y cada una lleva su etiqueta.
- [ ] **Testimonio:** aparece si el caso lo tiene, con el nombre, el cargo y el texto completos.
- [ ] **Más casos:** 3 tarjetas con imagen.
- [ ] **Cierre y footer:** se ven, y la tarjeta azul se desliza por encima de la última sección.
- [ ] En móvil todo queda en una columna y es legible.

Si el panel del navegador está oculto, las animaciones van muy lentas (unos 2 fps). Espera unos segundos antes de capturar, o comprueba el estado con `javascript_tool`. **No confundas una animación a medias con un fallo.**

---

## 5. Datos de cada caso que ya sabemos que son raros

Revisado en todos los casos contra Supabase. La plantilla ya los gestiona; **no hay que tocar código por ellos**:

| Caso | Qué pasa | Qué hace la plantilla |
|---|---|---|
| `velites`, `teamder`, `thecrewel`, `travelperk` | El logo es blanco | Se muestra en negro en la burbuja y en el avatar |
| `coolbottles` | `logo_url` apunta a un fichero que no existe en `public/` | No hay burbuja; el avatar del testimonio muestra iniciales |
| `nutfruit` | Una cifra no es entera (`+2.7M`) | Se muestra tal cual, sin contador |
| `lamanso` | La portada está en Supabase Storage (URL completa) | Se usa la URL tal cual, también para Open Graph |
| `bobo`, `angelanavarro` | Tienen 2 testimonios | Salen 2 tarjetas, la segunda inclinada a la derecha |
| Varios | Sin testimonio | La sección de testimonio no aparece |
| `travelperk` | La solución es un solo párrafo | Un único paso |

**Cifras que parecen erróneas en los datos** (no las cambies, avísalo al usuario): `coolbottles` tiene `-121%` y `lamanso` tiene `-449%`. Un porcentaje negativo de más del 100 % suele ser un dato mal escrito en `/casos-admin`.

---

## 6. Lo que NO debes hacer

- **No edites `caso-*.html` a mano.** Se sobrescriben en cada build.
- **No modifiques datos en Supabase** ni inventes texto, cifras o testimonios. Si un dato falta o parece mal, la sección se omite o se muestra como está, y se avisa al usuario. Los datos se corrigen en `/casos-admin`.
- **No cambies la plantilla, los estilos ni `page-caso.js`** para ajustar un caso concreto. Si un caso se ve mal, describe el problema con una captura y pregunta. La página de Mun Kombucha está aprobada tal cual.
- **No crees clases CSS nuevas sin buscar antes** si el nombre ya existe (`grep -rn "nombre" src/*.css`). Ya pasó con `.case-more`, que existía en la Home: la sección heredaba sus estilos y se quedaba con 300 px de ancho. Por eso se llama `.case-next`.
- **No borres la plantilla antigua** (`renderDetailPage`) aunque migres todos los casos. Eso se decide aparte.
- **No toques otras páginas** (Home, `casos-de-exito.html`, servicios) ni `dist/`.
- **No hagas `push`, PR ni merge** sin que el usuario lo pida.

---

## 7. Informe final

Al terminar, dile al usuario:

1. Qué casos has migrado y cuáles no, y por qué.
2. Cualquier dato raro que hayas encontrado (sección 5 y los nuevos).
3. Si cambió algún fichero además de los esperados.
4. Una captura del hero de 2 o 3 casos, en desktop y en móvil.
