/**
 * Shared type definitions for store-related interfaces
 */

export interface Category {
  id: number;
  name: string;
  slug?: string;
  [key: string]: any;
}

export interface Store {
  id: number;
  slug?: string;
  name?: string;
  theme?: string;
  [key: string]: any;
}

export interface Product {
  id: number;
  name: string;
  slug?: string;
  price: number;
  sale_price?: number | null;
  cover_image?: string;
  image?: string;
  images?: string;
  description?: string;
  stock?: number;
  is_active?: boolean;
  category?: Category;
  rating?: number;
  reviews_count?: number;
  average_rating?: number;
  total_reviews?: number;
  variants?: { [key: string]: any };
  reviews?: any[];
  [key: string]: any;
}

export interface CartItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  variants?: { [key: string]: string };
  selected_variants?: { [key: string]: string };
  image: string;
  cover_image?: string;
  sale_price?: number | null;
  stock?: number;
  category?: Category;
  total: number;
  [key: string]: any;
}

export interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  price: number | string;
  quantity: number;
  total?: number;
  cover_image?: string;
  image?: string;
  product?: Product;
  variants?: { [key: string]: string };
  [key: string]: any;
}

export interface Address {
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  [key: string]: any;
}

export interface Order {
  id: number | string;
  order_number?: string;
  date?: string;
  status?: string;
  subtotal?: number;
  discount?: number;
  shipping?: number;
  tax?: number;
  total?: number;
  coupon_code?: string | null;
  items?: OrderItem[];
  shipping_address?: Address;
  billing_address?: Address;
  payment_method?: string;
  shipping_method?: string;
  [key: string]: any;
}

export interface WishlistItem {
  id: number;
  product_id: number;
  name: string;
  price: number;
  sale_price?: number;
  cover_image?: string;
  featured_image?: string;
  image?: string;
  stock?: number;
  is_active?: boolean;
  category?: Category;
  slug?: string;
  variants?: { [key: string]: any };
  [key: string]: any;
}

export interface Shipping {
  id?: number;
  name?: string;
  cost: number | string;
  handling_fee?: number | string | null;
  [key: string]: any;
}

export interface StoreSettings {
  decimalSeparator?: string;
  thousandsSeparator?: string;
  currencySymbol?: string;
  currencySymbolPosition?: string;
  [key: string]: any;
}

export interface StoreCurrency {
  code: string;
  symbol: string;
  name?: string;
  position?: string;
  decimals?: number;
  decimal_separator?: string;
  thousands_separator?: string;
}

