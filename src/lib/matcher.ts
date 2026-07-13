import { Platform, MatchGroup, Product, PLATFORM_NAMES } from '@/types';
import { CrawledProduct } from './collectors';

export function matchProducts(allProducts: Map<Platform, CrawledProduct[]>): MatchGroup[] {
  // 1. 将所有商品扁平化，并生成匹配键
  const productsWithKey: { key: string; product: CrawledProduct; platform: Platform }[] = [];

  for (const [platform, items] of Array.from(allProducts.entries())) {
    for (const item of items) {
      const key = generateSPUKey(item.title, item.brand);
      productsWithKey.push({ key, product: item, platform });
    }
  }

  // 2. 按匹配键分组
  const groups = new Map<string, { platform: Platform; product: CrawledProduct }[]>();
  for (const item of productsWithKey) {
    const existing = groups.get(item.key) || [];
    existing.push({ platform: item.platform, product: item.product });
    groups.set(item.key, existing);
  }

  // 3. 转换为 MatchGroup 格式
  const matchGroups: MatchGroup[] = [];

  for (const [spuKey, items] of Array.from(groups.entries())) {
    // 按平台分组
    const platforms: Record<Platform, { official: Product[]; others: Product[] }> = {
      jd: { official: [], others: [] },
      taobao: { official: [], others: [] },
      tmall: { official: [], others: [] },
      pdd: { official: [], others: [] },
    };

    let bestPriceProduct: Product | null = null;
    let bestPrice = Infinity;

    for (const { platform, product } of items) {
      const productData = convertToProduct(product, platform);

      // 按官方/非官方分类
      if (product.is_official) {
        platforms[platform].official.push(productData);
      } else {
        platforms[platform].others.push(productData);
      }

      // 找最低价
      const price = product.coupon_price || product.price;
      if (price < bestPrice) {
        bestPrice = price;
        bestPriceProduct = productData;
      }
    }

    // 每个平台内按销量排序
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

  // 4. 排序：按平台数量降序，然后按最低价升序
  matchGroups.sort((a, b) => {
    const aPlatforms = Object.values(a.platforms).filter(
      (p) => p.official.length > 0 || p.others.length > 0
    ).length;
    const bPlatforms = Object.values(b.platforms).filter(
      (p) => p.official.length > 0 || p.others.length > 0
    ).length;
    if (aPlatforms !== bPlatforms) return bPlatforms - aPlatforms;
    return (a.best_price.current_price || 0) - (b.best_price.current_price || 0);
  });

  return matchGroups;
}

function generateSPUKey(title: string, brand: string | null): string {
  // 清洗标题
  let clean = title
    .replace(/【.*?】/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  // 提取关键信息（品牌+型号+规格）
  const brandPart = brand?.toLowerCase() || '';
  const specMatch = clean.match(/(\d+[a-z]*(?:\s*(?:gb|tb|ml|l|g|寸|英寸|mm|cm))+)/i);
  const spec = specMatch?.[1] || '';

  return `${brandPart}_${spec}_${clean.slice(0, 30)}`;
}

function convertToProduct(crawled: CrawledProduct, platform: Platform): Product {
  return {
    id: `${platform}_${crawled.source_id}`,
    title: crawled.title,
    image_url: crawled.image_url,
    category: null,
    brand: crawled.brand,
    normalized_name: crawled.title,
    source_platform: platform,
    source_id: crawled.source_id,
    source_url: crawled.source_url,
    shop_name: crawled.shop_name,
    shop_url: crawled.shop_url,
    is_official: crawled.is_official,
    sales_count: crawled.sales_count,
    current_price: crawled.price,
    original_price: crawled.original_price,
    coupon_price: crawled.coupon_price,
    lowest_price: crawled.price,
    highest_price: crawled.price,
    price_update_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
