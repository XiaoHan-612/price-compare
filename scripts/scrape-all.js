const CryptoJS = require('crypto-js');
const { createClient } = require('@supabase/supabase-js');

const JD_API_URL = 'https://router.jd.com/api';
const APP_KEY = process.env.JD_APP_KEY;
const SECRET_KEY = process.env.JD_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('APP_KEY:', APP_KEY ? '已设置' : '未设置');
console.log('SECRET_KEY:', SECRET_KEY ? '已设置' : '未设置');
console.log('SUPABASE_URL:', supabaseUrl ? '已设置' : '未设置');
console.log('SUPABASE_KEY:', supabaseKey ? '已设置' : '未设置');

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

async function fetchProducts(eliteId) {
  const params = {
    method: 'jd.union.open.goods.material.query',
    app_key: APP_KEY,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    format: 'json',
    v: '1.0',
    sign_method: 'md5',
    param_json: JSON.stringify({
      goodsReq: {
        eliteId,
        pageIndex: 1,
        pageSize: 10,
      },
    }),
  };
  params.sign = sign(params);

  const url = `${JD_API_URL}?${new URLSearchParams(params).toString()}`;
  console.log('请求 URL:', url.substring(0, 100) + '...');

  const res = await fetch(url);
  const text = await res.text();
  console.log('响应长度:', text.length);
  console.log('响应前200字符:', text.substring(0, 200));

  try {
    const data = JSON.parse(text);
    const responseKey = 'jd_union_open_goods_material_query_response';
    if (data[responseKey]) {
      const result = JSON.parse(data[responseKey].result);
      console.log('API 返回码:', result.code);
      console.log('API 返回消息:', result.message);
      console.log('商品数量:', result.data?.length || 0);
      return result.data || [];
    } else {
      console.log('未找到响应键:', responseKey);
      console.log('实际键:', Object.keys(data));
    }
  } catch (err) {
    console.error('解析错误:', err.message);
  }
  return [];
}

async function main() {
  console.log('\n=== 使用京东联盟 API 获取商品 ===');

  // 测试一个分类
  console.log('\n测试 eliteId=1...');
  const items = await fetchProducts(1);
  console.log(`获取到 ${items.length} 条数据`);

  if (items.length > 0) {
    console.log('第一条:', JSON.stringify(items[0]).substring(0, 200));
  }
}

main().catch(console.error);
