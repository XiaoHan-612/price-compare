import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

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

  // 数据库没有则构造模拟数据
  const [platform, ...sourceIdParts] = id.split('_');
  const sourceId = sourceIdParts.join('_');

  const product = {
    id,
    title: `商品 ${sourceId}`,
    image_url: null,
    normalized_name: `商品 ${sourceId}`,
    source_platform: platform || 'jd',
    source_id: sourceId,
    source_url: platform === 'jd'
      ? `https://item.jd.com/${sourceId}.html`
      : `https://item.taobao.com/item.htm?id=${sourceId}`,
    current_price: Math.round(Math.random() * 5000 + 100),
    original_price: Math.round(Math.random() * 8000 + 500),
    coupon_price: null,
    lowest_price: Math.round(Math.random() * 3000 + 100),
    highest_price: Math.round(Math.random() * 8000 + 500),
    brand: null,
    category: null,
    price_update_at: new Date().toISOString(),
  };

  // 生成模拟价格历史
  const priceHistory = Array.from({ length: 30 }, (_, i) => ({
    id: `ph_${i}`,
    product_id: id,
    price: product.current_price! + Math.round((Math.random() - 0.5) * 200),
    original_price: null,
    coupon_price: null,
    recorded_at: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
  }));

  return NextResponse.json({ product, priceHistory });
}
