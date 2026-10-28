/**
 * ══════════════════════════════════════════════
 *  ELEVEN SHOP — Database & Domain Types
 * ══════════════════════════════════════════════
 */

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  sort_order: number;
}

export interface Product {
  id: string;
  nom: string;
  slug: string;
  description: string;
  price_cents: number;
  image_url: string;
  category_id: string;
  is_available: boolean;
  stock: number | null;
  sort_order: number;
  is_featured?: boolean;
  is_age_restricted?: boolean; // 18+ (alcool, tabac)
  hero_bg_color?: string;
  hero_big_word?: string;
}

export type OrderStatus =
  | 'new'
  | 'taken'
  | 'delivering'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'cash' | 'card';

export interface OrderItem {
  id?: string;
  order_id?: string;
  product_id: string;
  product_name: string;
  price_cents: number;
  quantity: number;
}

export interface Order {
  id: string;
  public_code: string; // ex: ELV-9482
  client_name: string;
  client_phone: string;
  address: string;
  postal_code: string;
  city: string;
  address_extra?: string; // étage, digicode, interphone
  notes?: string;
  payment_method: PaymentMethod;
  subtotal_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
  status: OrderStatus;
  assigned_driver?: string | null;
  telegram_sent: boolean;
  created_at: string;
  items?: OrderItem[];
}

export interface Driver {
  id: string;
  name: string;
  phone?: string;
  telegram_user_id?: string;
  is_active: boolean;
}

export interface StoreSettings {
  min_order_cents: number;
  delivery_fee_cents: number;
  free_delivery_above_cents: number;
  allowed_postal_codes: string[];
  is_open: boolean;
  open_message?: string;
}
