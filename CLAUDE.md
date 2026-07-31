# CLAUDE.md

Instrucciones de proyecto para cualquier agente de Claude Code que trabaje en este repositorio (`immoral-group-amb-teste`).

## Regla obligatoria: documentar todo el trabajo

**Toda tarea completada en este repositorio — sin excepción — debe registrarse en [`.claude/TASK-LOG.md`](.claude/TASK-LOG.md) antes de darse por terminada.** Esto aplica igual si el trabajo se hace en una rama nueva, directamente sobre `main`, o vía PR: el registro debe existir antes de mergear, no después.

Al terminar una tarea:

1. Añade una entrada al final de `.claude/TASK-LOG.md` con: fecha, qué se hizo, por qué, y qué ficheros/áreas afectó.
2. Si la tarea introduce una decisión de arquitectura, una convención nueva o deuda técnica conocida, añádela también a `.claude/project-context.md` (no dupliques información — un dato, un sitio).
3. Si la tarea es una SPEC de BrianSpec, el propio flujo de `.brianspec/` ya cubre su registro (`CHANGELOG-SPECS.md`); aun así, añade la entrada breve en `TASK-LOG.md` para que quede un historial cronológico único y fácil de leer sin tener que cruzar varios sistemas.

Esta regla existe para que cualquier persona o agente que retome el proyecto — incluido tras un merge — sepa qué se hizo, cuándo y por qué, sin depender de leer el historial completo de commits o de preguntar.

## Otros contextos de este repo

- [`.claude/project-context.md`](.claude/project-context.md) — estructura del sitio, convenciones de URLs, deuda técnica conocida.
- [`.brianspec/`](.brianspec/) — sistema BrianSpec (agentes, checklist de seguridad, plantillas de spec).
- [`specs/`](specs/) — specs individuales aprobadas (ver `specs/08-panel-admin-equipo.md` para el panel interno de administración).
- [`supabase/README.md`](supabase/README.md) — pasos de configuración manual del proyecto Supabase (Auth Hook, Google OAuth, primer admin).
- [`PROJECT-CONSTITUTION.md`](PROJECT-CONSTITUTION.md) — stack, convenciones y restricciones específicas de este proyecto.
