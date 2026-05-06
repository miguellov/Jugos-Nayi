CREATE TABLE IF NOT EXISTS public.configuracion (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  precio_grande numeric DEFAULT 100,
  precio_pequeno numeric DEFAULT 65,
  nombre_negocio text DEFAULT 'Mi Negocio de Jugos',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.configuracion DISABLE ROW LEVEL SECURITY;

INSERT INTO public.configuracion (precio_grande, precio_pequeno, nombre_negocio)
SELECT 100, 65, 'Jugos Nayi'
WHERE NOT EXISTS (SELECT 1 FROM public.configuracion LIMIT 1);
