import { NextRequest, NextResponse } from 'next/server';
import { searchAllPlatforms } from '@/lib/collectors';
import { supabaseAdmin } from '@/lib/supabase';
import { normalizeProductName, extractBrand } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  // 1. 检查缓存
  if (supabaseAdmin) {
    const { data: cached } = await supabaseAdmin
      .from('search_cache')
      .select('results')
      .eq('query', query)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      return NextResponse.json(cached.results);
    }
  }

  // 2. 搜索各平台
  const results = await searchAllPlatforms(query, ['jd', 'taobao']);
  const allProducts: any[] = [];

  for (const [platform, items] of Array.from(results.entries())) {
    for (const item of items) {
      const product = {
        id: `${platform}_${item.source_id}`,
        title: item.title,
        image_url: item.image_url,
        normalized_name: normalizeProductName(item.title),
        source_platform: platform,
        source_id: item.source_id,
        source_url: item.source_url,
        current_price: item.price,
        original_price: item.original_price,
        coupon_price: item.coupon_price,
        lowest_price: item.price,
        highest_price: item.price,
        brand: item.brand || extractBrand(item.title),
        price_update_at: new Date().toISOString(),
      };
      allProducts.push(product);
    }
  }

  const responseData = {
    total: allProducts.length,
    items: allProducts,
  };

  // 3. 缓存结果
  if (supabaseAdmin && allProducts.length > 0) {
    await supabaseAdmin.from('search_cache').insert({
      query,
      results: responseData,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1小时
    });
  }

  return NextResponse.json(responseData);
}
