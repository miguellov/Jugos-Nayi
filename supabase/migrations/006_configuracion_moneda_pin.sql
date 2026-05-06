-- Personalización: moneda, vendedor/turno, PIN de ajustes
ALTER TABLE public.configuracion
ADD COLUMN IF NOT EXISTS moneda text DEFAULT 'RD$';

ALTER TABLE public.configuracion
ADD COLUMN IF NOT EXISTS nombre_vendedor text DEFAULT '';

ALTER TABLE public.configuracion
ADD COLUMN IF NOT EXISTS pin text DEFAULT '';

ALTER TABLE public.configuracion
ADD COLUMN IF NOT EXISTS pin_activo boolean DEFAULT false;
