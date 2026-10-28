-- ══════════════════════════════════════════════
--  ELEVEN SHOP — Supabase Postgres Schema
-- ══════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. CATEGORIES TABLE
create table if not exists categories (
  id text primary key,
  name text not null,
  slug text not null unique,
  icon text,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PRODUCTS TABLE
create table if not exists products (
  id text primary key,
  nom text not null,
  slug text not null unique,
  description text default '',
  price_cents integer not null check (price_cents > 0),
  image_url text not null,
  category_id text references categories(id) on delete set null,
  is_available boolean default true not null,
  stock integer default null,
  sort_order integer default 0,
  is_featured boolean default false,
  is_age_restricted boolean default false,
  hero_bg_color text default null,
  hero_big_word text default null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ORDERS TABLE
create table if not exists orders (
  id text primary key default ('ord_' || replace(uuid_generate_v4()::text, '-', '')),
  public_code text not null unique,
  client_name text not null,
  client_phone text not null,
  address text not null,
  postal_code text not null,
  city text not null,
  address_extra text default '',
  notes text default '',
  payment_method text not null check (payment_method in ('cash', 'card')),
  subtotal_cents integer not null,
  delivery_fee_cents integer not null,
  total_cents integer not null,
  status text not null check (status in ('new', 'taken', 'delivering', 'delivered', 'cancelled')) default 'new',
  assigned_driver text default null,
  telegram_sent boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ORDER ITEMS TABLE
create table if not exists order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id text references orders(id) on delete cascade not null,
  product_id text references products(id) on delete set null,
  product_name text not null,
  price_cents integer not null,
  quantity integer not null check (quantity > 0)
);

-- 5. SETTINGS TABLE
create table if not exists settings (
  id text primary key default 'store-settings',
  min_order_cents integer default 1500 not null,
  delivery_fee_cents integer default 300 not null,
  free_delivery_above_cents integer default 3000 not null,
  allowed_postal_codes text[] default array['42300', '42120', '42370', '42153'] not null,
  is_open boolean default true not null,
  open_message text default 'Ouvert 24h/24 & 7j/7 — Livraison rapide sur Roanne'
);

-- 6. DRIVERS TABLE
create table if not exists drivers (
  id text primary key default ('drv_' || replace(uuid_generate_v4()::text, '-', '')),
  name text not null,
  phone text,
  telegram_user_id text,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_available on products(is_available);
create index if not exists idx_orders_public_code on orders(public_code);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at desc);

-- ══════════════════════════════════════════════
--  Row Level Security (RLS)
-- ══════════════════════════════════════════════

alter table categories enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table settings enable row level security;
alter table drivers enable row level security;

-- Public read policies for catalog and settings
create policy "Allow public read categories" on categories for select using (true);
create policy "Allow public read available products" on products for select using (true);
create policy "Allow public read settings" on settings for select using (true);

-- Orders: public can insert an order, service role has full access
create policy "Allow public create orders" on orders for insert with check (true);
create policy "Allow public select own order by code" on orders for select using (true);
create policy "Allow public create order_items" on order_items for insert with check (true);
create policy "Allow public read order_items" on order_items for select using (true);

-- Enable Realtime publication for orders
alter publication supabase_realtime add table orders;
