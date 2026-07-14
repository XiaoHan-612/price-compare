import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Product, Platform } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // 从 Supabase 获取商品
  if (supabaseAdmin) {
    try {
      const { data: product, error } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (product && !error) {
        // 获取价格历史
        const { data: priceHistory } = await supabaseAdmin
          .from('price_history')
          .select('*')
          .eq('product_id', id)
          .order('recorded_at', { ascending: false })
          .limit(90);

        return NextResponse.json({
          product: {
            ...product,
            source_platform: product.source_platform as Platform,
          },
          priceHistory: priceHistory || [],
        });
      }
    } catch (err) {
      console.error('Supabase query failed:', err);
    }
  }

  // 数据库没有则返回 404
  return NextResponse.json({ error: '商品不存在' }, { status: 404 });
}
