import { NextRequest, NextResponse } from 'next/server';
import { searchJD, formatJDProduct } from '@/lib/platforms/jd';
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

  // 调用京东联盟 API
  let allProducts: Product[] = [];
  try {
    const jdResult = await searchJD(query, 1, 20);
    for (const item of jdResult.items) {
      const formatted = formatJDProduct(item);
      allProducts.push(makeProduct({
        title: formatted.title,
        image_url: formatted.image_url,
        brand: formatted.brand,
        source_platform: 'jd',
        source_id: formatted.source_id,
        source_url: formatted.source_url,
        shop_name: formatted.shop_name,
        shop_url: formatted.shop_url,
        is_official: formatted.is_official,
        sales_count: formatted.sales_count,
        current_price: formatted.price,
        original_price: formatted.original_price,
        coupon_price: formatted.coupon_price,
        lowest_price: formatted.price,
        highest_price: formatted.original_price,
        normalized_name: query.toLowerCase(),
        category: formatted.category,
      }));
    }
  } catch (err) {
    console.error('Search failed:', err);
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
