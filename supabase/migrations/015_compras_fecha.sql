-- Fecha contable por línea de compra (día local en columna date).
ALTER TABLE public.compras
ADD COLUMN IF NOT EXISTS fecha date DEFAULT CURRENT_DATE;

UPDATE public.compras
SET fecha = CURRENT_DATE
WHERE fecha IS NULL;
