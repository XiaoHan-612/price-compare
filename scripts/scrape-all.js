const CryptoJS = require('crypto-js');
const { createClient } = require('@supabase/supabase-js');

const JD_API_URL = 'https://router.jd.com/api';
const APP_KEY = process.env.JD_APP_KEY;
const SECRET_KEY = process.env.JD_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!APP_KEY || !SECRET_KEY || !supabaseUrl || !supabaseKey) {
  console.error('缺少环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function sign(params) {
  const sortedKeys = Object.keys(params).sort();
  let str = SECRET_KEY;
  for (const key of sortedKeys) {
    str += key + params[key];
  }
  str += SECRET_KEY;
  return CryptoJS.MD5(str).toString().toUpperCase();
}

async function searchJD(keyword, page = 1) {
  const params = {
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
        pageSize: 10,
      },
    }),
  };
  params.sign = sign(params);

  const url = `${JD_API_URL}?${new URLSearchParams(params).toString()}`;
  const res = await fetch(url);
  const text = await res.text();

  try {
    const data = JSON.parse(text);
    const responseKey = 'jd_union_open_goods_material_query_response';
    if (data[responseKey]) {
      const result = JSON.parse(data[responseKey].result);
      return result.data || [];
    }
  } catch (err) {
    console.error('Parse error:', err.message);
  }
  return [];
}

async function main() {
  console.log('=== 使用京东联盟 API 获取数据 ===');
  console.log('时间:', new Date().toISOString());

  const KEYWORDS = ['iPhone 15', '茅台', '戴森', 'MacBook', 'AirPods', 'Switch', '显卡', '机械键盘'];
  const allProducts = [];

  for (const keyword of KEYWORDS) {
    console.log(`搜索: ${keyword}`);
    try {
      const items = await searchJD(keyword);
      console.log(`  京东: ${items.length} 条`);

      for (const item of items) {
        const price = parseFloat(item.priceInfo?.price || '0');
        const shopName = item.shopInfo?.shopName || '';
        const imageUrl = item.imageInfo?.imageList?.[0]?.url || '';

        if (price > 0) {
          allProducts.push({
            title: item.skuName || '',
            image_url: imageUrl,
            source_platform: 'jd',
            source_id: String(item.skuId || item.itemId || ''),
            source_url: `https://item.jd.com/${item.skuId || item.itemId}.html`,
            shop_name: shopName,
            is_official: shopName.includes('自营') || shopName.includes('官方'),
            sales_count: item.inOrderCount30Days || 0,
            current_price: price,
            normalized_name: (item.skuName || '').toLowerCase(),
            price_update_at: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error(`  失败:`, err.message);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n共获取 ${allProducts.length} 条数据`);

  if (allProducts.length > 0) {
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { error } = await supabase.from('products').insert(allProducts);
    if (error) {
      console.error('保存失败:', error);
    } else {
      console.log(`成功保存 ${allProducts.length} 条数据`);
    }
  }
}

main().catch(console.error);
