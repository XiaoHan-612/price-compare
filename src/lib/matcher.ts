import { Platform, MatchGroup, Product } from '@/types';

interface SearchItem {
  title: string;
  image_url: string | null;
  price: number;
  original_price: number | null;
  coupon_price: number | null;
  source_id: string;
  source_url: string;
  brand: string | null;
  shop_name: string | null;
  shop_url: string | null;
  is_official: boolean;
  sales_count: number;
}

export function matchProducts(allProducts: Map<Platform, SearchItem[]>): MatchGroup[] {
  const productsWithKey: { key: string; product: SearchItem; platform: Platform }[] = [];

  for (const [platform, items] of Array.from(allProducts.entries())) {
    for (const item of items) {
      const key = generateSPUKey(item.title, item.brand);
      productsWithKey.push({ key, product: item, platform });
    }
  }

  const groups = new Map<string, { platform: Platform; product: SearchItem }[]>();
  for (const item of productsWithKey) {
    const existing = groups.get(item.key) || [];
    existing.push({ platform: item.platform, product: item.product });
    groups.set(item.key, existing);
  }

  const matchGroups: MatchGroup[] = [];

  for (const [spuKey, items] of Array.from(groups.entries())) {
    const platforms: Record<Platform, { official: Product[]; others: Product[] }> = {
      jd: { official: [], others: [] },
      taobao: { official: [], others: [] },
      tmall: { official: [], others: [] },
      pdd: { official: [], others: [] },
    };

    let bestPriceProduct: Product | null = null;
    let bestPrice = Infinity;

    for (const { platform, product } of items) {
      const productData: Product = {
        id: `${platform}_${product.source_id}`,
        title: product.title,
        image_url: product.image_url,
        brand: product.brand,
        normalized_name: product.title,
        source_platform: platform,
        source_id: product.source_id,
        source_url: product.source_url,
        shop_name: product.shop_name,
        shop_url: product.shop_url,
        is_official: product.is_official,
        sales_count: product.sales_count,
        current_price: product.price,
        original_price: product.original_price,
        coupon_price: product.coupon_price,
        lowest_price: product.price,
        highest_price: product.original_price || product.price,
        price_update_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: null,
      };

      if (product.is_official) {
        platforms[platform].official.push(productData);
      } else {
        platforms[platform].others.push(productData);
      }

      const price = product.coupon_price || product.price;
      if (price < bestPrice) {
        bestPrice = price;
        bestPriceProduct = productData;
      }
    }

    for (const platform of Object.keys(platforms) as Platform[]) {
      platforms[platform].official.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
      platforms[platform].others.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
    }

    if (bestPriceProduct) {
      matchGroups.push({
        spu_key: spuKey,
        title: bestPriceProduct.title,
        image_url: bestPriceProduct.image_url,
        platforms,
        best_price: bestPriceProduct,
      });
    }
  }

  matchGroups.sort((a, b) => {
    const aCount = Object.values(a.platforms).filter((p) => p.official.length + p.others.length > 0).length;
    const bCount = Object.values(b.platforms).filter((p) => p.official.length + p.others.length > 0).length;
    if (aCount !== bCount) return bCount - aCount;
    return (a.best_price.current_price || 0) - (b.best_price.current_price || 0);
  });

  return matchGroups;
}

function generateSPUKey(title: string, brand: string | null): string {
  let clean = title
    .replace(/【.*?】/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  const brandPart = brand?.toLowerCase() || '';
  const specMatch = clean.match(/(\d+[a-z]*(?:\s*(?:gb|tb|ml|l|g|寸|英寸|mm|cm))+)/i);
  const spec = specMatch?.[1] || '';

  return `${brandPart}_${spec}_${clean.slice(0, 30)}`;
}
