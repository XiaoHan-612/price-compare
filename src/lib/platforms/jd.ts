import CryptoJS from 'crypto-js';

const JD_API_URL = 'https://router.jd.com/api';
const APP_KEY = process.env.JD_APP_KEY || '';
const SECRET_KEY = process.env.JD_SECRET_KEY || '';

function sign(params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  let str = SECRET_KEY;
  for (const key of sortedKeys) {
    str += key + params[key];
  }
  str += SECRET_KEY;
  return CryptoJS.MD5(str).toString().toUpperCase();
}

export interface JDProduct {
  skuId: string;
  skuName: string;
  image: string;
  priceInfo: { price: string; lowestPrice: string };
  shopInfo: { shopName: string; shopId: string };
  brandName: string;
  categoryInfo: { cid1Name: string };
  couponInfo: { couponList: { discount: string }[] } | null;
  inOrderCount30Days: number;
}

export interface SearchResult {
  total: number;
  items: JDProduct[];
}

export async function searchJD(keyword: string, page: number = 1, pageSize: number = 20): Promise<SearchResult> {
  const params: Record<string, string> = {
    method: 'jd.union.open.goods.material.query',
    app_key: APP_KEY,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    format: 'json',
    v: '1.0',
    sign_method: 'md5',
    param_json: JSON.stringify({
      goodsReq: {
        eliteId: 1,
        keyword,
        pageIndex: page,
        pageSize,
        sortName: 'price',
        sort: 'asc',
      },
    }),
  };

  params.sign = sign(params);

  try {
    const url = `${JD_API_URL}?${new URLSearchParams(params).toString()}`;
    const res = await fetch(url);
    const text = await res.text();

    // 尝试解析 JSONP 或 JSON
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('JD API parse error:', text);
      return { total: 0, items: [] };
    }

    const responseKey = 'jd_union_open_goods_material_query_response';
    if (data[responseKey]) {
      const result = JSON.parse(data[responseKey].result);
      return {
        total: result.total || 0,
        items: result.data || [],
      };
    }

    console.error('JD API error:', data);
    return { total: 0, items: [] };
  } catch (err) {
    console.error('JD search failed:', err);
    return { total: 0, items: [] };
  }
}

export function formatJDProduct(item: JDProduct) {
  const price = parseFloat(item.priceInfo?.price || '0');
  const lowestPrice = parseFloat(item.priceInfo?.lowestPrice || price.toString());
  const originalPrice = lowestPrice || price;

  // 处理优惠券
  let couponPrice: number | null = null;
  if (item.couponInfo?.couponList?.length) {
    const discount = parseFloat(item.couponInfo.couponList[0].discount || '0');
    if (discount > 0) {
      couponPrice = price - discount;
    }
  }

  return {
    title: item.skuName,
    image_url: item.image,
    price,
    original_price: originalPrice,
    coupon_price: couponPrice,
    source_id: item.skuId,
    source_url: `https://item.jd.com/${item.skuId}.html`,
    brand: item.brandName || null,
    shop_name: item.shopInfo?.shopName || null,
    shop_url: null,
    is_official: item.shopInfo?.shopName?.includes('自营') || item.shopInfo?.shopName?.includes('官方') || false,
    sales_count: item.inOrderCount30Days || 0,
    category: item.categoryInfo?.cid1Name || null,
  };
}
