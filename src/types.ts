export interface Order {
  order_id: string
  customer_id: string
  order_date: string
  channel: string
  store_city: string
  product_id: string
  product_name: string
  category: string
  product_type: string
  quantity: number
  unit_price: number
  line_total: number
  discount_pct: number
}

export interface Customer {
  customer_id: string
  name: string
  email: string
  city: string
  state: string
  country: string
  signup_date: string
  channel_acquired: string
  membership_tier: string
  membership_fee: number
  ltv: number
  total_orders: number
  total_products_bought: number
  total_services_purchased: number
}

export interface AdSpend {
  month: string
  channel: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue_attributed: number
}

export type TimeRange = '30d' | '90d' | 'ytd' | 'all'
export type Channel = 'all' | 'online' | 'in-store'
export type Page = 'overview' | 'products' | 'customers' | 'marketing'

export interface DateRange {
  start: string
  end: string
}
