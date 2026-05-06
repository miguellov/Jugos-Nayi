-- Pausa por sabor en inventario; meta diaria de jugos en configuración
ALTER TABLE public.inventario_sabores
ADD COLUMN IF NOT EXISTS pausado boolean DEFAULT false;

ALTER TABLE public.configuracion
ADD COLUMN IF NOT EXISTS meta_diaria integer DEFAULT 65;
