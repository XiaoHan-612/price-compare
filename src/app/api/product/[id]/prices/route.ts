import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get('days') || '30');

  if (supabaseAdmin) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const { data } = await supabaseAdmin
      .from('price_history')
      .select('*')
      .eq('product_id', id)
      .gte('recorded_at', cutoff.toISOString())
      .order('recorded_at', { ascending: true });

    return NextResponse.json({ items: data || [] });
  }

  // 模拟数据
  const items = Array.from({ length: days }, (_, i) => ({
    id: `ph_${i}`,
    product_id: id,
    price: Math.round(Math.random() * 500 + 200),
    original_price: null,
    coupon_price: null,
    recorded_at: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000).toISOString(),
  }));

  return NextResponse.json({ items });
}
