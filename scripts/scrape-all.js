const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('缺少环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const KEYWORDS = ['iPhone 15', '茅台', '戴森', 'MacBook', 'AirPods', 'Switch'];

async function scrapeJD(keyword, page) {
  const products = [];
  try {
    await page.goto(`https://search.jd.com/Search?keyword=${encodeURIComponent(keyword)}&enc=utf-8`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    const items = await page.$$eval('.gl-item', (nodes) => {
      return nodes.slice(0, 8).map((node) => {
        const titleEl = node.querySelector('.p-name a em');
        const priceEl = node.querySelector('.p-price strong i');
        const imgEl = node.querySelector('.p-img img');
        const shopEl = node.querySelector('.p-shop a');
        const linkEl = node.querySelector('.p-name a');

        return {
          title: titleEl?.textContent?.trim() || '',
          price: parseFloat(priceEl?.textContent || '0'),
          image: imgEl?.getAttribute('data-lazy-img') || imgEl?.src || '',
          shop: shopEl?.textContent?.trim() || '',
          url: linkEl?.href || '',
        };
      });
    });

    for (const item of items) {
      if (item.title && item.price > 0) {
        const skuMatch = item.url.match(/\/(\d+)\.html/);
        products.push({
          title: item.title,
          price: item.price,
          image: item.image.startsWith('//') ? `https:${item.image}` : item.image,
          shop_name: item.shop,
          source_id: skuMatch?.[1] || String(Math.random()),
          source_url: item.url || `https://search.jd.com/Search?keyword=${keyword}`,
          platform: 'jd',
          is_official: item.shop.includes('自营') || item.shop.includes('官方'),
        });
      }
    }
  } catch (err) {
    console.error(`JD error for ${keyword}:`, err.message);
  }
  return products;
}

async function main() {
  console.log('=== 开始爬取京东 ===');
  console.log('时间:', new Date().toISOString());

  const browser = await chromium.launch({ headless: true });
  const allProducts = [];

  for (const keyword of KEYWORDS) {
    console.log(`搜索: ${keyword}`);
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    try {
      const results = await scrapeJD(keyword, page);
      console.log(`  京东: ${results.length} 条`);
      allProducts.push(...results);
    } catch (err) {
      console.error(`  失败:`, err.message);
    }

    await context.close();
    await new Promise((r) => setTimeout(r, 2000));
  }

  await browser.close();
  console.log(`\n共爬取 ${allProducts.length} 条数据`);

  if (allProducts.length > 0) {
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { error } = await supabase.from('products').insert(
      allProducts.map((p) => ({
        title: p.title,
        image_url: p.image,
        source_platform: p.platform,
        source_id: p.source_id,
        source_url: p.source_url,
        shop_name: p.shop_name,
        is_official: p.is_official,
        current_price: p.price,
        normalized_name: p.title.toLowerCase(),
        price_update_at: new Date().toISOString(),
      }))
    );

    if (error) {
      console.error('保存失败:', error);
    } else {
      console.log('保存成功');
    }
  }
}

main().catch(console.error);
