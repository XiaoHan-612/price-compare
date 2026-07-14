const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const { scrapeJD, scrapeTaobao, scrapePDD } = require('./scrapers');

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 热门搜索词
const KEYWORDS = ['iPhone 15', '茅台', '戴森', 'MacBook', 'AirPods', 'Switch', '显卡', '机械键盘'];

async function main() {
  console.log('=== 开始爬取 ===');
  console.log('时间:', new Date().toISOString());

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const allProducts = [];

  for (const keyword of KEYWORDS) {
    console.log(`\n搜索: ${keyword}`);

    // 并行爬取三个平台
    const page = await browser.newPage();
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    try {
      const jdPage = await context.newPage();
      const taobaoPage = await context.newPage();
      const pddPage = await context.newPage();

      const [jdResults, taobaoResults, pddResults] = await Promise.allSettled([
        scrapeJD(keyword, jdPage),
        scrapeTaobao(keyword, taobaoPage),
        scrapePDD(keyword, pddPage),
      ]);

      const jd = jdResults.status === 'fulfilled' ? jdResults.value : [];
      const taobao = taobaoResults.status === 'fulfilled' ? taobaoResults.value : [];
      const pdd = pddResults.status === 'fulfilled' ? pddResults.value : [];

      console.log(`  京东: ${jd.length} 条`);
      console.log(`  淘宝: ${taobao.length} 条`);
      console.log(`  拼多多: ${pdd.length} 条`);

      allProducts.push(...jd, ...taobao, ...pdd);
    } catch (err) {
      console.error(`  搜索 ${keyword} 失败:`, err.message);
    } finally {
      await context.close();
    }

    // 间隔 2 秒，避免被封
    await new Promise((r) => setTimeout(r, 2000));
  }

  await browser.close();

  console.log(`\n=== 爬取完成，共 ${allProducts.length} 条数据 ===`);

  // 保存到 Supabase
  if (allProducts.length > 0) {
    // 先清空旧数据
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 插入新数据
    const { data, error } = await supabase.from('products').insert(
      allProducts.map((p) => ({
        title: p.title,
        image_url: p.image,
        source_platform: p.platform,
        source_id: p.source_id,
        source_url: p.source_url,
        shop_name: p.shop_name,
        is_official: p.is_official,
        sales_count: p.sales_count,
        current_price: p.price,
        normalized_name: p.title.toLowerCase(),
        price_update_at: new Date().toISOString(),
      }))
    );

    if (error) {
      console.error('保存到 Supabase 失败:', error);
    } else {
      console.log('数据已保存到 Supabase');
    }
  }
}

main().catch(console.error);
