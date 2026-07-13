import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Product, Platform } from '@/types';

// 演示商品数据
const demoProducts: Record<string, { product: Product; priceHistory: any[] }> = {
  'jd_10001': {
    product: {
      id: 'jd_10001', title: 'Apple iPhone 15 128GB 黑色', image_url: 'https://img14.360buyimg.com/n1/jfs/t1/217680/15/25045/64317/64f1f1c1F25e1a0a1/c1e8f7c8c8c8c8c8.jpg', brand: 'Apple', source_platform: 'jd', source_id: '10001', source_url: 'https://item.jd.com/10001.html', shop_name: 'Apple产品京东自营旗舰店', shop_url: null, is_official: true, sales_count: 85000, current_price: 5999, original_price: 6999, coupon_price: 5799, lowest_price: 5499, highest_price: 6999, price_update_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), normalized_name: 'iphone 15 128gb', category: '手机',
    },
    priceHistory: Array.from({ length: 30 }, (_, i) => ({
      id: `ph_${i}`, product_id: 'jd_10001', price: 5999 + Math.round((Math.random() - 0.5) * 300), original_price: null, coupon_price: null,
      recorded_at: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
    })),
  },
  'taobao_20001': {
    product: {
      id: 'taobao_20001', title: 'Apple iPhone 15 128GB 官方正品', image_url: 'https://img.alicdn.com/imgextra/i1/2206683633444/O1CN01xxx.jpg', brand: 'Apple', source_platform: 'taobao', source_id: '20001', source_url: 'https://item.taobao.com/item.htm?id=20001', shop_name: 'Apple官方旗舰店', shop_url: null, is_official: true, sales_count: 52000, current_price: 5849, original_price: 6999, coupon_price: 5649, lowest_price: 5399, highest_price: 6999, price_update_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), normalized_name: 'iphone 15 128gb', category: '手机',
    },
    priceHistory: Array.from({ length: 30 }, (_, i) => ({
      id: `ph_${i}`, product_id: 'taobao_20001', price: 5849 + Math.round((Math.random() - 0.5) * 300), original_price: null, coupon_price: null,
      recorded_at: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
    })),
  },
  'pdd_30001': {
    product: {
      id: 'pdd_30001', title: 'Apple iPhone 15 128GB 百亿补贴', image_url: 'https://img.pddpic.com/gaoxiao/xxx.jpg', brand: 'Apple', source_platform: 'pdd', source_id: '30001', source_url: 'https://mobile.yangkeduo.com/goods.html?goods_id=30001', shop_name: 'Apple官方旗舰店', shop_url: null, is_official: true, sales_count: 125000, current_price: 5599, original_price: 6999, coupon_price: 5499, lowest_price: 5299, highest_price: 6999, price_update_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), normalized_name: 'iphone 15 128gb', category: '手机',
    },
    priceHistory: Array.from({ length: 30 }, (_, i) => ({
      id: `ph_${i}`, product_id: 'pdd_30001', price: 5599 + Math.round((Math.random() - 0.5) * 300), original_price: null, coupon_price: null,
      recorded_at: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
    })),
  },
  'jd_10003': {
    product: {
      id: 'jd_10003', title: 'Apple MacBook Pro 14英寸 M3 Pro 18GB', image_url: 'https://img14.360buyimg.com/n1/jfs/t1/macbook.jpg', brand: 'Apple', source_platform: 'jd', source_id: '10003', source_url: 'https://item.jd.com/10003.html', shop_name: 'Apple产品京东自营旗舰店', shop_url: null, is_official: true, sales_count: 15000, current_price: 14999, original_price: 16999, coupon_price: 14499, lowest_price: 13999, highest_price: 16999, price_update_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), normalized_name: 'macbook pro 14 m3 pro', category: '电脑',
    },
    priceHistory: Array.from({ length: 30 }, (_, i) => ({
      id: `ph_${i}`, product_id: 'jd_10003', price: 14999 + Math.round((Math.random() - 0.5) * 500), original_price: null, coupon_price: null,
      recorded_at: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
    })),
  },
  'jd_10004': {
    product: {
      id: 'jd_10004', title: '贵州茅台酒 飞天茅台 53度 500ml', image_url: 'https://img14.360buyimg.com/n1/jfs/t1/maotai.jpg', brand: '茅台', source_platform: 'jd', source_id: '10004', source_url: 'https://item.jd.com/10004.html', shop_name: '京东自营', shop_url: null, is_official: true, sales_count: 45000, current_price: 1499, original_price: 1499, coupon_price: null, lowest_price: 1399, highest_price: 1599, price_update_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), normalized_name: '飞天茅台 53度 500ml', category: '白酒',
    },
    priceHistory: Array.from({ length: 30 }, (_, i) => ({
      id: `ph_${i}`, product_id: 'jd_10004', price: 1499 + Math.round((Math.random() - 0.5) * 100), original_price: null, coupon_price: null,
      recorded_at: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
    })),
  },
  'jd_10005': {
    product: {
      id: 'jd_10005', title: '戴森(Dyson) Supersonic 吹风机 HD15', image_url: 'https://img14.360buyimg.com/n1/jfs/t1/dyson.jpg', brand: '戴森', source_platform: 'jd', source_id: '10005', source_url: 'https://item.jd.com/10005.html', shop_name: 'Dyson京东自营旗舰店', shop_url: null, is_official: true, sales_count: 35000, current_price: 2999, original_price: 3199, coupon_price: 2899, lowest_price: 2799, highest_price: 3199, price_update_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), normalized_name: '戴森 supersonic 吹风机 hd15', category: '个护',
    },
    priceHistory: Array.from({ length: 30 }, (_, i) => ({
      id: `ph_${i}`, product_id: 'jd_10005', price: 2999 + Math.round((Math.random() - 0.5) * 200), original_price: null, coupon_price: null,
      recorded_at: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
    })),
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  // 1. 检查演示数据
  if (demoProducts[id]) {
    return NextResponse.json(demoProducts[id]);
  }

  // 2. 尝试从数据库获取
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

  // 3. 生成随机演示数据
  const [platform, ...sourceIdParts] = id.split('_');
  const sourceId = sourceIdParts.join('_');
  const plat = (platform || 'jd') as Platform;

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
    shop_name: '示例店铺',
    shop_url: null,
    is_official: true,
    sales_count: Math.floor(Math.random() * 100000),
    current_price: Math.round(Math.random() * 5000 + 100),
    original_price: Math.round(Math.random() * 8000 + 500),
    coupon_price: null,
    lowest_price: Math.round(Math.random() * 3000 + 100),
    highest_price: Math.round(Math.random() * 8000 + 500),
    brand: null,
    category: null,
    price_update_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

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
