alter table public.inventory_products
  add column if not exists brand_name text,
  add column if not exists generic_name text,
  add column if not exists dosage text;

update public.inventory_products
set brand_name = coalesce(brand_name, name)
where brand_name is null;

create index if not exists inventory_products_brand_name_idx
  on public.inventory_products (brand_name);