import { NextRequest, NextResponse } from 'next/server';
import { searchAllPlatforms } from '@/lib/collectors';
import { matchProducts } from '@/lib/matcher';
import { getCachedResults, setCachedResults } from '@/lib/cache';
import { Product, Platform } from '@/types';

function makeProduct(overrides: Partial<Product>): Product {
  const now = new Date().toISOString();
  return {
    id: '',
    title: '',
    image_url: null,
    brand: null,
    source_platform: 'jd',
    source_id: '',
    source_url: '#',
    shop_name: null,
    shop_url: null,
    is_official: false,
    sales_count: 0,
    current_price: 0,
    original_price: null,
    coupon_price: null,
    lowest_price: null,
    highest_price: null,
    price_update_at: now,
    created_at: now,
    updated_at: now,
    normalized_name: '',
    category: null,
    ...overrides,
  };
}

const demoData: Record<string, Product[]> = {
  'iphone': [
    makeProduct({ id: 'jd_10001', title: 'Apple iPhone 15 128GB 黑色', brand: 'Apple', source_platform: 'jd', source_id: '10001', source_url: 'https://item.jd.com/10001.html', shop_name: 'Apple产品京东自营旗舰店', is_official: true, sales_count: 85000, current_price: 5999, original_price: 6999, coupon_price: 5799, lowest_price: 5499, highest_price: 6999, normalized_name: 'iphone 15 128gb', category: '手机' }),
    makeProduct({ id: 'jd_10002', title: 'Apple iPhone 15 128GB 黑色', brand: 'Apple', source_platform: 'jd', source_id: '10002', source_url: 'https://item.jd.com/10002.html', shop_name: '京东手机旗舰店', is_official: false, sales_count: 32000, current_price: 5899, original_price: 6999, lowest_price: 5499, highest_price: 6999, normalized_name: 'iphone 15 128gb', category: '手机' }),
    makeProduct({ id: 'taobao_20001', title: 'Apple iPhone 15 128GB 官方正品', brand: 'Apple', source_platform: 'taobao', source_id: '20001', source_url: 'https://item.taobao.com/item.htm?id=20001', shop_name: 'Apple官方旗舰店', is_official: true, sales_count: 52000, current_price: 5849, original_price: 6999, coupon_price: 5649, lowest_price: 5399, highest_price: 6999, normalized_name: 'iphone 15 128gb', category: '手机' }),
    makeProduct({ id: 'taobao_20002', title: 'iPhone 15 128GB 全网通', brand: 'Apple', source_platform: 'taobao', source_id: '20002', source_url: 'https://item.taobao.com/item.htm?id=20002', shop_name: '数码专营店', is_official: false, sales_count: 18000, current_price: 5799, original_price: 6999, lowest_price: 5399, highest_price: 6999, normalized_name: 'iphone 15 128gb', category: '手机' }),
    makeProduct({ id: 'pdd_30001', title: 'Apple iPhone 15 128GB 百亿补贴', brand: 'Apple', source_platform: 'pdd', source_id: '30001', source_url: 'https://mobile.yangkeduo.com/goods.html?goods_id=30001', shop_name: 'Apple官方旗舰店', is_official: true, sales_count: 125000, current_price: 5599, original_price: 6999, coupon_price: 5499, lowest_price: 5299, highest_price: 6999, normalized_name: 'iphone 15 128gb', category: '手机' }),
    makeProduct({ id: 'pdd_30002', title: 'iPhone 15 128GB 百亿补贴', brand: 'Apple', source_platform: 'pdd', source_id: '30002', source_url: 'https://mobile.yangkeduo.com/goods.html?goods_id=30002', shop_name: '数码旗舰店', is_official: false, sales_count: 68000, current_price: 5549, original_price: 6999, lowest_price: 5299, highest_price: 6999, normalized_name: 'iphone 15 128gb', category: '手机' }),
  ],
  'macbook': [
    makeProduct({ id: 'jd_10003', title: 'Apple MacBook Pro 14英寸 M3 Pro 18GB', brand: 'Apple', source_platform: 'jd', source_id: '10003', source_url: 'https://item.jd.com/10003.html', shop_name: 'Apple产品京东自营旗舰店', is_official: true, sales_count: 15000, current_price: 14999, original_price: 16999, coupon_price: 14499, lowest_price: 13999, highest_price: 16999, normalized_name: 'macbook pro 14 m3 pro', category: '电脑' }),
    makeProduct({ id: 'taobao_20003', title: 'MacBook Pro 14 M3 Pro 18GB 官方正品', brand: 'Apple', source_platform: 'taobao', source_id: '20003', source_url: 'https://item.taobao.com/item.htm?id=20003', shop_name: 'Apple官方旗舰店', is_official: true, sales_count: 8000, current_price: 14799, original_price: 16999, coupon_price: 14299, lowest_price: 13999, highest_price: 16999, normalized_name: 'macbook pro 14 m3 pro', category: '电脑' }),
    makeProduct({ id: 'pdd_30003', title: 'MacBook Pro 14 M3 Pro 百亿补贴', brand: 'Apple', source_platform: 'pdd', source_id: '30003', source_url: 'https://mobile.yangkeduo.com/goods.html?goods_id=30003', shop_name: 'Apple官方旗舰店', is_official: true, sales_count: 22000, current_price: 13999, original_price: 16999, coupon_price: 13899, lowest_price: 13699, highest_price: 16999, normalized_name: 'macbook pro 14 m3 pro', category: '电脑' }),
  ],
  '茅台': [
    makeProduct({ id: 'jd_10004', title: '贵州茅台酒 飞天茅台 53度 500ml', brand: '茅台', source_platform: 'jd', source_id: '10004', source_url: 'https://item.jd.com/10004.html', shop_name: '京东自营', is_official: true, sales_count: 45000, current_price: 1499, original_price: 1499, lowest_price: 1399, highest_price: 1599, normalized_name: '飞天茅台 53度 500ml', category: '白酒' }),
    makeProduct({ id: 'pdd_30004', title: '贵州茅台 飞天茅台 53度 500ml 百亿补贴', brand: '茅台', source_platform: 'pdd', source_id: '30004', source_url: 'https://mobile.yangkeduo.com/goods.html?goods_id=30004', shop_name: '茅台官方旗舰店', is_official: true, sales_count: 88000, current_price: 1399, original_price: 1499, coupon_price: 1389, lowest_price: 1349, highest_price: 1599, normalized_name: '飞天茅台 53度 500ml', category: '白酒' }),
  ],
  '戴森': [
    makeProduct({ id: 'jd_10005', title: '戴森(Dyson) Supersonic 吹风机 HD15', brand: '戴森', source_platform: 'jd', source_id: '10005', source_url: 'https://item.jd.com/10005.html', shop_name: 'Dyson京东自营旗舰店', is_official: true, sales_count: 35000, current_price: 2999, original_price: 3199, coupon_price: 2899, lowest_price: 2799, highest_price: 3199, normalized_name: '戴森 supersonic 吹风机 hd15', category: '个护' }),
    makeProduct({ id: 'taobao_20005', title: '戴森吹风机 HD15 官方正品', brand: '戴森', source_platform: 'taobao', source_id: '20005', source_url: 'https://item.taobao.com/item.htm?id=20005', shop_name: 'Dyson官方旗舰店', is_official: true, sales_count: 28000, current_price: 2949, original_price: 3199, coupon_price: 2849, lowest_price: 2799, highest_price: 3199, normalized_name: '戴森 supersonic 吹风机 hd15', category: '个护' }),
    makeProduct({ id: 'pdd_30005', title: '戴森 HD15 吹风机 百亿补贴', brand: '戴森', source_platform: 'pdd', source_id: '30005', source_url: 'https://mobile.yangkeduo.com/goods.html?goods_id=30005', shop_name: '戴森官方旗舰店', is_official: true, sales_count: 52000, current_price: 2799, original_price: 3199, coupon_price: 2749, lowest_price: 2699, highest_price: 3199, normalized_name: '戴森 supersonic 吹风机 hd15', category: '个护' }),
  ],
};

function generateDemoResults(query: string): Product[] {
  const lowerQuery = query.toLowerCase();
  for (const [key, products] of Object.entries(demoData)) {
    if (lowerQuery.includes(key)) return products;
  }

  const now = new Date().toISOString();
  const platforms: { platform: Platform; shops: string[] }[] = [
    { platform: 'jd', shops: ['京东自营', '京东官方旗舰店', '数码专营店'] },
    { platform: 'taobao', shops: ['淘宝官方旗舰店', '天猫超市', '数码旗舰店'] },
    { platform: 'pdd', shops: ['拼多多官方旗舰店', '百亿补贴', '数码专营店'] },
  ];
  const products: Product[] = [];
  const basePrice = Math.floor(Math.random() * 5000) + 100;

  for (const { platform, shops } of platforms) {
    for (let i = 0; i < shops.length; i++) {
      const isOfficial = i === 0;
      const priceOffset = isOfficial ? 0 : Math.floor(Math.random() * 200) - 100;
      products.push(makeProduct({
        id: `${platform}_gen_${i}`,
        title: `${query} - ${shops[i]}`,
        source_platform: platform,
        source_id: `gen_${i}`,
        shop_name: shops[i],
        is_official: isOfficial,
        sales_count: Math.floor(Math.random() * 50000) + 5000,
        current_price: basePrice + priceOffset,
        original_price: basePrice + 500,
        coupon_price: isOfficial ? basePrice + priceOffset - 50 : null,
        lowest_price: basePrice - 200,
        highest_price: basePrice + 500,
        normalized_name: query.toLowerCase(),
      }));
    }
  }
  return products;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  const cached = await getCachedResults(query);
  if (cached) {
    return NextResponse.json({ total: cached.length, items: cached, cached: true });
  }

  let allProducts: Product[] = [];
  try {
    const results = await searchAllPlatforms(query, ['jd', 'taobao', 'pdd']);
    for (const [, items] of Array.from(results.entries())) {
      for (const item of items) {
        allProducts.push(makeProduct({
          title: item.title,
          image_url: item.image_url,
          brand: item.brand,
          source_platform: 'jd',
          source_id: item.source_id,
          source_url: item.source_url,
          shop_name: item.shop_name,
          shop_url: item.shop_url,
          is_official: item.is_official,
          sales_count: item.sales_count,
          current_price: item.price,
          original_price: item.original_price,
          coupon_price: item.coupon_price,
          lowest_price: item.price,
          highest_price: item.price,
          normalized_name: query.toLowerCase(),
        }));
      }
    }
  } catch (err) {
    console.error('Search failed:', err);
  }

  if (allProducts.length === 0) {
    allProducts = generateDemoResults(query);
  }

  const resultsMap = new Map<Platform, any[]>();
  for (const product of allProducts) {
    const existing = resultsMap.get(product.source_platform) || [];
    existing.push({
      title: product.title,
      image_url: product.image_url,
      price: product.current_price,
      original_price: product.original_price,
      coupon_price: product.coupon_price,
      source_id: product.source_id,
      source_url: product.source_url,
      brand: product.brand,
      shop_name: product.shop_name,
      shop_url: product.shop_url,
      is_official: product.is_official,
      sales_count: product.sales_count,
    });
    resultsMap.set(product.source_platform, existing);
  }

  const matchGroups = matchProducts(resultsMap);

  if (matchGroups.length > 0) {
    await setCachedResults(query, matchGroups);
  }

  return NextResponse.json({ total: matchGroups.length, items: matchGroups, cached: false });
}
