-- plan_diario: semana = fecha del lunes (DATE), cierre de semana, 7 días L–D
-- Ejecutar en SQL Editor si ya tenías plan_diario con semana TEXT.

alter table public.plan_diario add column if not exists cerrada boolean not null default false;

-- Si semana sigue siendo text y guardabas 'YYYY-MM-DD', convierte:
-- alter table public.plan_diario alter column semana type date using semana::date;

-- Si semana ya es date, no hace falta el USING.
