import { Platform, PLATFORM_NAMES } from '@/types';

export function getPlatformName(platform: Platform): string {
  return PLATFORM_NAMES[platform] || platform;
}

export function formatPrice(price: number | null): string {
  if (price === null) return '--';
  return `¥${price.toFixed(2)}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export function normalizeProductName(title: string): string {
  return title
    .replace(/[【\[](.*?)[】\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function extractBrand(title: string): string | null {
  const brands = [
    'Apple', '华为', '小米', 'OPPO', 'vivo', '三星', '荣耀', '一加',
    '联想', '戴尔', '惠普', '索尼', '佳能', '尼康', '茅台', '五粮液',
  ];
  for (const brand of brands) {
    if (title.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return null;
}
