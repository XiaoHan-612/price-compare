import { Platform } from '@/types';

export interface CrawledProduct {
  title: string;
  image_url: string | null;
  price: number;
  original_price: number | null;
  coupon_price: number | null;
  source_id: string;
  source_url: string;
  brand: string | null;
  // 店铺信息
  shop_name: string | null;
  shop_url: string | null;
  is_official: boolean;
  sales_count: number;
}

export abstract class BaseCollector {
  abstract platform: Platform;

  abstract search(keyword: string, page?: number): Promise<CrawledProduct[]>;

  protected parseSalesCount(text: string): number {
    if (!text) return 0;
    const clean = text.replace(/[^0-9.万+]/g, '');
    if (clean.includes('万')) {
      return Math.round(parseFloat(clean) * 10000);
    }
    return parseInt(clean) || 0;
  }

  protected isOfficialShop(shopName: string | null): boolean {
    if (!shopName) return false;
    const officialKeywords = [
      '官方旗舰店', '自营', '直营', '官方', '旗舰',
      'Apple', '华为', '小米', 'OPPO', 'vivo',
    ];
    return officialKeywords.some((k) => shopName.includes(k));
  }

  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retries = 3
  ): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, {
          ...options,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ...options.headers,
          },
        });
        if (res.ok) return res;
        if (i === retries - 1) throw new Error(`HTTP ${res.status}`);
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      }
    }
    throw new Error('Max retries reached');
  }
}
