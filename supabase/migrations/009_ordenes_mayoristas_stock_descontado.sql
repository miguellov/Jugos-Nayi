-- Evita doble descuento de inventario si la orden vuelve a pendiente y luego a entregado
alter table public.ordenes_mayoristas
add column if not exists stock_descontado boolean not null default false;

update public.ordenes_mayoristas
set stock_descontado = true
where estado = 'entregado' and stock_descontado = false;
