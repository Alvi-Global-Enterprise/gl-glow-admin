// Comprehensive TypeScript Interfaces for GL Glow Multi-Store Admin

export type StaffRole = 
  | 'store_owner' 
  | 'store_manager' 
  | 'catalog_manager' 
  | 'fulfillment_agent' 
  | 'support_agent';

export interface StaffUser {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  is_platform_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface StoreMembership {
  store_id: number;
  store_code: string;
  store_name: string;
  default_currency: string;
  role: StaffRole;
  is_active: boolean;
}

export interface AdminLoginResponse {
  token: string;
  token_type: 'Bearer';
  staff: StaffUser;
  stores: StoreMembership[];
  can_access_all_stores: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface MediaUploadResponse {
  url: string;
  path: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: number | null;
  sort_order?: number;
  is_active: boolean;
  products_count?: number;
  parent?: Category | null;
  children?: Category[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateCategoryPayload {
  name: string;
  slug: string;
  description?: string;
  parent_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  description?: string;
  parent_id?: number | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface Product {
  id: number;
  category_id?: number;
  category_name?: string;
  name: string;
  slug: string;
  description?: string;
  sku: string;
  price_minor: number;
  compare_at_price_minor?: number;
  price_formatted?: string;
  compare_at_price_formatted?: string;
  stock_quantity: number;
  is_in_stock: boolean;
  is_active: boolean;
  is_featured: boolean;
  image_url?: string;
  images?: string[];
  custom_attributes?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled';

export type PaymentStatus = 
  | 'pending' 
  | 'paid' 
  | 'failed' 
  | 'refunded';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

export interface ShippingAddress {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface OrderItem {
  id?: number;
  product_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price_minor: number;
  subtotal_minor: number;
  image_url?: string;
}

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: string;
  notes?: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_email?: string;
  total_minor: number;
  currency: string;
  total_formatted?: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  items_count: number;
  created_at: string;
  // Detail fields
  subtotal_minor?: number;
  tax_minor?: number;
  shipping_minor?: number;
  customer?: Customer;
  shipping_address?: ShippingAddress;
  items?: OrderItem[];
  timeline?: OrderTimeline[];
  tracking_number?: string;
  carrier?: string;
  fulfillment_notes?: string;
}
