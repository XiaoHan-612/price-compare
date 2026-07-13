export interface Product {
  id: string;
  title: string;
  image_url: string | null;
  category: string | null;
  brand: string | null;
  normalized_name: string | null;
  source_platform: Platform;
  source_id: string;
  source_url: string | null;
  current_price: number | null;
  original_price: number | null;
  coupon_price: number | null;
  lowest_price: number | null;
  highest_price: number | null;
  price_update_at: string | null;
  created_at: string;
  updated_at: string;
}

export type Platform = 'jd' | 'taobao' | 'tmall' | 'pdd' | 'suning';

export interface PlatformPrice {
  platform: Platform;
  platform_name: string;
  price: number;
  original_price: number | null;
  coupon_price: number | null;
  url: string;
  lowest_price_30d: number | null;
}

export interface PriceHistory {
  id: string;
  product_id: string;
  price: number;
  original_price: number | null;
  coupon_price: number | null;
  recorded_at: string;
}

export interface SearchResult {
  total: number;
  items: Product[];
}

export interface TrendData {
  dates: string[];
  prices: { platform: Platform; platform_name: string; data: (number | null)[] }[];
}

export const PLATFORM_NAMES: Record<Platform, string> = {
  jd: '京东',
  taobao: '淘宝',
  tmall: '天猫',
  pdd: '拼多多',
  suning: '苏宁',
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  jd: '#e4393c',
  taobao: '#ff5000',
  tmall: '#ff0036',
  pdd: '#e02e24',
  suning: '#f28b00',
};
