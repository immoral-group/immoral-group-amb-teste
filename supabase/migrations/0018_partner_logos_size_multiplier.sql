-- Tamaño ajustable por logo en la barra de la home: los logos de clientes
-- varían mucho de peso visual (algunos muy pequeños, otros grandes) y hasta
-- ahora todos se mostraban al mismo tamaño fijo. size_multiplier se aplica
-- como multiplicador de la altura base en src/partnerLogos.js.
-- Ejecutar DESPUÉS de 0006_partner_logos.sql.

alter table public.partner_logos
  add column if not exists size_multiplier numeric not null default 1
  check (size_multiplier in (1, 1.25, 1.5, 1.75, 2, 2.5, 3));
