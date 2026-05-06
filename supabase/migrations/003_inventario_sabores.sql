-- Inventario opcional por sabor (ejecutar en Supabase si lo usas en el futuro).
-- La UI de ventas usa `ventas` del día + stock en memoria (`sabores`).

CREATE TABLE IF NOT EXISTS public.inventario_sabores (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sabor text UNIQUE NOT NULL,
  stock integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.inventario_sabores DISABLE ROW LEVEL SECURITY;

INSERT INTO public.inventario_sabores (sabor, stock) VALUES
  ('Naranja', 50),
  ('Chinola', 40),
  ('Mango', 40),
  ('Piña', 35),
  ('Zanahoria', 30),
  ('Melón', 30),
  ('Lechoza', 30),
  ('Mix Tropical', 25)
ON CONFLICT (sabor) DO NOTHING;
