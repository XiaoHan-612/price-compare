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
  // 店铺信息
  shop_name: string | null;
  shop_url: string | null;
  is_official: boolean;
  sales_count: number;
  // 价格信息
  current_price: number | null;
  original_price: number | null;
  coupon_price: number | null;
  lowest_price: number | null;
  highest_price: number | null;
  price_update_at: string | null;
  created_at: string;
  updated_at: string;
}

export type Platform = 'jd' | 'taobao' | 'tmall' | 'pdd';

export interface PlatformShops {
  official: Product[];
  others: Product[];
}

export interface MatchGroup {
  spu_key: string;
  title: string;
  image_url: string | null;
  platforms: Record<Platform, PlatformShops>;
  best_price: Product;
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
  items: MatchGroup[];
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
};

export const PLATFORM_COLORS: Record<Platform, string> = {
  jd: '#e4393c',
  taobao: '#ff5000',
  tmall: '#ff0036',
  pdd: '#e02e24',
};

export function isOfficialShop(shopName: string | null, platform: Platform): boolean {
  if (!shopName) return false;
  const officialPatterns: Record<Platform, string[]> = {
    jd: ['京东自营', '京东官方旗舰店', 'Apple产品京东自营'],
    taobao: ['官方旗舰店', '天猫官方', '品牌直营'],
    tmall: ['官方旗舰店', '天猫官方', '品牌直营'],
    pdd: ['官方旗舰店', '品牌直营', '百亿补贴'],
  };
  const patterns = officialPatterns[platform] || [];
  return patterns.some((p) => shopName.includes(p));
}
