import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { matchProducts } from '@/lib/matcher';
import { Product, Platform } from '@/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';

  // 从 Supabase 获取商品
  let allProducts: Product[] = [];

  if (supabaseAdmin) {
    try {
      let queryBuilder = supabaseAdmin.from('products').select('*');

      // 如果有搜索关键词，按标题搜索
      if (query) {
        queryBuilder = queryBuilder.ilike('title', `%${query}%`);
      }

      // 获取所有商品（最多 100 条）
      const { data, error } = await queryBuilder.limit(100);

      if (data && !error) {
        allProducts = data.map((item: any) => ({
          id: item.id,
          title: item.title,
          image_url: item.image_url,
          brand: item.brand,
          normalized_name: item.normalized_name || item.title.toLowerCase(),
          source_platform: item.source_platform as Platform,
          source_id: item.source_id,
          source_url: item.source_url,
          shop_name: item.shop_name,
          shop_url: item.shop_url,
          is_official: item.is_official || false,
          sales_count: item.sales_count || 0,
          current_price: item.current_price,
          original_price: item.original_price,
          coupon_price: item.coupon_price,
          lowest_price: item.lowest_price || item.current_price,
          highest_price: item.highest_price || item.current_price,
          price_update_at: item.price_update_at,
          created_at: item.created_at,
          updated_at: item.updated_at,
          category: item.category,
        }));
      }
    } catch (err) {
      console.error('Supabase search failed:', err);
    }
  }

  // 按平台分组
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

  // 跨平台匹配
  const matchGroups = matchProducts(resultsMap);

  return NextResponse.json({ total: matchGroups.length, items: matchGroups, cached: false });
}
