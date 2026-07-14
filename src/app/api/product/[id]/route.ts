import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Product, Platform } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // 尝试从数据库获取
  if (supabaseAdmin) {
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (product) {
      const { data: priceHistory } = await supabaseAdmin
        .from('price_history')
        .select('*')
        .eq('product_id', id)
        .order('recorded_at', { ascending: false })
        .limit(180);

      return NextResponse.json({ product, priceHistory });
    }
  }

  // 根据 ID 解析平台和商品信息
  const [platform, ...sourceIdParts] = id.split('_');
  const sourceId = sourceIdParts.join('_');
  const plat = (platform || 'jd') as Platform;

  // 构造基本商品信息
  const product: Product = {
    id,
    title: `商品 ${sourceId}`,
    image_url: null,
    normalized_name: `商品 ${sourceId}`,
    source_platform: plat,
    source_id: sourceId,
    source_url:
      plat === 'jd'
        ? `https://item.jd.com/${sourceId}.html`
        : plat === 'pdd'
          ? `https://mobile.yangkeduo.com/goods.html?goods_id=${sourceId}`
          : `https://item.taobao.com/item.htm?id=${sourceId}`,
    shop_name: null,
    shop_url: null,
    is_official: false,
    sales_count: 0,
    current_price: null,
    original_price: null,
    coupon_price: null,
    lowest_price: null,
    highest_price: null,
    brand: null,
    category: null,
    price_update_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 生成模拟价格历史（用于展示图表）
  const basePrice = 1000;
  const priceHistory = Array.from({ length: 30 }, (_, i) => ({
    id: `ph_${i}`,
    product_id: id,
    price: basePrice + Math.round((Math.random() - 0.5) * 200),
    original_price: null,
    coupon_price: null,
    recorded_at: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
  }));

  return NextResponse.json({ product, priceHistory });
}
