-- Emoji por fila de inventario (UI "Gestionar sabores")
ALTER TABLE public.inventario_sabores
ADD COLUMN IF NOT EXISTS emoji text NOT NULL DEFAULT '';
