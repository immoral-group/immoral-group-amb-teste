# DESIGN-REFERENCE.md — Referencia de diseño del espacio de cliente

> Descargado desde `immoral-group/entregas-immoral/docs/DESIGN-REFERENCE.md` el 2026-07-30.
> Fuente original: extraído del prototipo HTML `correos-express-landing/index.html`, usado como referencia visual para SPEC-08/SPEC-09 de ese proyecto.
> Aquí se usa como referencia de tokens/patrones de dashboard para el panel interno de este proyecto (`admin.html`, `roles.html` — SPEC-08 de este repo).

---

## 1. Tema visual general

**Diseño híbrido dark/light:**
- Header y hero → **dark** (`#0D0D0D`, `#141414`, `#1C1C1C`)
- Área de contenido principal → **light** (`#F4F6F8` fondo, cards blancas `#ffffff`)
- Footer → dark

**No usar el tema light/dark de Tailwind por defecto.** El espacio de cliente tiene su propio sistema de colores.

---

## 2. Variables CSS del sistema

```css
/* Negros (header, hero, lightbox) */
--black:    #0D0D0D
--black2:   #141414
--black3:   #1C1C1C
--black4:   #242424
--black5:   #2E2E2E

/* Blancos y grises */
--white:    #F5F5F5
--white2:   #E0E0E0
--gray:     #8A8A8A
--gray2:    #5A5A5A

/* Acento verde (aprobación) */
--green:    #22C55E
--green-bg: rgba(34,197,94,0.12)

/* Border radius */
--radius:    14px  ← cards
--radius-sm: 8px   ← elementos pequeños
```

**Colores de cliente** (se inyectan dinámicamente desde `clients.color` y `clients.secondary_color`):
- El color primario del cliente se usa como fondo del hero
- El color secundario se usa para accents, badges y CTAs

---

## 3. Estructura del espacio de cliente (SPEC-08 de entregas-immoral)

### Header (sticky, dark, blur)
- Logo immoral (izquierda)
- Separador vertical
- Nombre de la plataforma: "Plataforma de Validación de Contenidos"
- Progress pill (derecha): anillo circular SVG + contador "X / Y aprobados"

### Hero (color primario del cliente como fondo)
- Logo del cliente (grande, arriba a la izquierda)
- Eyebrow: "immoral group × [nombre cliente]"
- Título: "Contenidos [Mes Año]" con énfasis en color accent
- Descripción: "Revisa cada pieza, aprueba o deja feedback."
- Stats boxes (derecha): 4 cajas con números grandes — Aprobados (verde), Ajustes (rojo), Pendientes (gris), Total (blanco)

### Barra de instrucciones (dark)
- Fondo ligeramente distinto al hero
- Texto de ayuda sobre cómo usar la plataforma

### Área de contenido (light, `#F4F6F8`)
- Calendario mensual (ver sección 5)
- Bloques por plataforma (Instagram, TikTok, LinkedIn...) con cabecera dark de gradiente
- Cada plataforma tiene subsecciones (Carruseles, Posts, Historias, Vídeos)
- Grid de cards dentro de cada subsección

### Floating stats (sidebar flotante derecha)
- Aparece cuando el hero sale del viewport
- Muestra los mismos 4 contadores
- Background: color primario del cliente

### Footer (dark)
- "Preparado por Immoral Group para [cliente] · [Mes Año]"

---

## 4. Sistema de cards

### Estructura de una card
```
┌─────────────────────────┐
│  THUMBNAIL              │
│  (aspect ratio dinámico)│
│  [badge "✓ aprobado"]   │
├─────────────────────────┤
│  Título                 │
│  Descripción            │
├─────────────────────────┤
│ [badge tipo] [chip copy]│
│              [btn ✓]    │
└─────────────────────────┘
```

### Aspect ratios por tipo de contenido
| content_type | Aspect ratio | Uso |
|---|---|---|
| `carousel` | 3/4 (portrait) | Instagram carrusel, LinkedIn carrusel |
| `post` | 3/4 (portrait) | Instagram post, LinkedIn post |
| `story` | 9/16 | Instagram historia |
| `video` | 9/16 | TikTok vídeo |
| `wide` | 16/9 | Contenido horizontal |
| `square` | 1/1 | Posts cuadrados |

### Estados de card
- **Normal**: borde gris `#E5E7EB`
- **Approved**: borde verde `--green` + box-shadow verde + badge "✓ aprobado"
- **Hover**: translateY(-3px) + shadow intensificada

### Botones en footer de card
1. **Badge de tipo**: etiqueta con color de plataforma (ej: rosa Instagram, cyan TikTok, azul LinkedIn)
2. **Copy chip** (si tiene copy): botón "Copy" con ✓ — aprueba solo el texto
3. **Approve button**: círculo con ✓ — aprueba el visual/diseño

---

## 5. Calendario mensual

- Grid 7 columnas (Lun–Dom)
- Chips de color por plataforma (chip sólido, color = color de la plataforma)
- Click en día → scroll animado a la primera card de ese día
- Días pasados con opacidad reducida
- Hoy con fondo `#111827` en el número

### Colores de chips en calendario
| Plataforma | Color chip |
|---|---|
| Instagram | `#E1306C` |
| TikTok | `#2AB8C0` |
| LinkedIn | `#0A66C2` |

---

## 6. Lightbox (vista detalle de creatividad)

### Layout: dos columnas
- **Izquierda (flex: 1)**: preview de media (imagen/video) + dots de carrusel + navegación ‹ ›
- **Derecha (340px fijo)**: info + copy + aprobación diseño + feedback + strip de thumbnails

### Panel derecho (de arriba a abajo)
1. Título + descripción
2. **Sección Copy** (solo si hay copy):
   - Texto del copy
   - Botón "Aprobar copy" (independiente)
3. **Sección Diseño gráfico**:
   - Botón "Aprobar diseño" (independiente)
4. **Input de feedback**:
   - Campo de texto + botón "Guardar"
5. **Strip de thumbnails**: miniaturas del resto de piezas de esa sección

### Header del lightbox
- Breadcrumb: "Plataforma · Tipo"
- Contador: "1 / 4"
- Botón "Aprobar" global (aprueba todo si se hace desde aquí)
- Botón cerrar ×

---

## 7. Flujo de aprobación (impacta SPEC-09 de entregas-immoral)

### Estados de una creatividad desde perspectiva del cliente

| Estado | Condición | Color |
|---|---|---|
| **Aprobada** | `copy_approved AND design_approved` → `status = approved` | Verde |
| **Ajustes** | Tiene feedback escrito pero no está aprobada | Rojo/naranja |
| **Pendiente** | Sin feedback, sin aprobación | Gris |

---

## 8. Tipos de contenido

El HTML muestra que las creatividades tienen un `content_type` que determina el aspect ratio del thumbnail y la subsección donde aparecen.

---

## 9. Keyboard shortcuts del cliente
- `←` / `→`: navegar entre piezas en el lightbox
- `Esc`: cerrar lightbox
- `Enter`: aprobar la pieza actual

---

## 10. Animaciones
- Hero: fade-in-up/down escalonado (0.05s → 0.5s delay)
- Sections: scroll-triggered fade-in-up (`IntersectionObserver`)
- Cards: staggered dentro de cada grid (0.055s × índice, máx 8)
- Counter: pop animation (`scale 1 → 1.18 → 1`) al actualizar números
- Lightbox: `scaleIn` al abrir

---

*Archivo original generado para `entregas-immoral` a partir del prototipo HTML de Correos Express (SPEC-08/SPEC-09 de ese proyecto). Reutilizado aquí como referencia de tokens de dashboard — no existe un "design.md" propio de este proyecto, este es el equivalente real más cercano en el ecosistema Immoral.*
