const { chromium } = require('playwright');

// 京东爬虫
async function scrapeJD(keyword, page) {
  const products = [];
  try {
    await page.goto(`https://search.jd.com/Search?keyword=${encodeURIComponent(keyword)}&enc=utf-8`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForSelector('.gl-item', { timeout: 10000 }).catch(() => {});

    const items = await page.$$eval('.gl-item', (nodes) => {
      return nodes.slice(0, 10).map((node) => {
        const titleEl = node.querySelector('.p-name a em');
        const priceEl = node.querySelector('.p-price strong i');
        const imgEl = node.querySelector('.p-img img');
        const shopEl = node.querySelector('.p-shop a');
        const linkEl = node.querySelector('.p-name a');
        const salesEl = node.querySelector('.p-commit a');

        return {
          title: titleEl?.textContent?.trim() || '',
          price: parseFloat(priceEl?.textContent || '0'),
          image: imgEl?.getAttribute('data-lazy-img') || imgEl?.src || '',
          shop: shopEl?.textContent?.trim() || '',
          url: linkEl?.href || '',
          sales: salesEl?.textContent?.trim() || '',
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
          source_id: skuMatch?.[1] || '',
          source_url: item.url,
          platform: 'jd',
          is_official: item.shop.includes('自营') || item.shop.includes('官方'),
          sales_count: parseSales(item.sales),
        });
      }
    }
  } catch (err) {
    console.error('JD scrape error:', err.message);
  }
  return products;
}

// 淘宝爬虫
async function scrapeTaobao(keyword, page) {
  const products = [];
  try {
    await page.goto(`https://s.taobao.com/search?q=${encodeURIComponent(keyword)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    // 尝试从页面中提取数据
    const data = await page.evaluate(() => {
      // 淘宝搜索结果通常在 g_page_config 变量中
      if (window.g_page_config) {
        const items = window.g_page_config?.mods?.itemlist?.data?.auctions || [];
        return items.slice(0, 10).map((item) => ({
          title: item.title?.replace(/<[^>]+>/g, '') || '',
          price: parseFloat(item.view_price || '0'),
          image: item.pic_url || '',
          shop: item.nick || '',
          url: `https://item.taobao.com/item.htm?id=${item.nid}`,
          sales: item.view_sales || '',
          nid: item.nid || '',
        }));
      }
      return [];
    });

    for (const item of data) {
      if (item.title && item.price > 0) {
        products.push({
          title: item.title,
          price: item.price,
          image: item.image.startsWith('//') ? `https:${item.image}` : item.image,
          shop_name: item.shop,
          source_id: item.nid,
          source_url: item.url,
          platform: 'taobao',
          is_official: item.shop.includes('官方') || item.shop.includes('旗舰'),
          sales_count: parseSales(item.sales),
        });
      }
    }
  } catch (err) {
    console.error('Taobao scrape error:', err.message);
  }
  return products;
}

// 拼多多爬虫
async function scrapePDD(keyword, page) {
  const products = [];
  try {
    await page.goto(`https://mobile.yangkeduo.com/search_result.html?search_key=${encodeURIComponent(keyword)}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    const data = await page.evaluate(() => {
      if (window.rawData) {
        const items = window.rawData?.store?.goods || [];
        return items.slice(0, 10).map((item) => ({
          title: item.goods_name || '',
          price: (item.min_group_price || 0) / 100,
          image: item.hd_thumb_url || item.thumb_url || '',
          shop: item.mall_name || '',
          goods_id: item.goods_id || '',
          sales: item.sales_tip || '',
        }));
      }
      return [];
    });

    for (const item of data) {
      if (item.title && item.price > 0) {
        products.push({
          title: item.title,
          price: item.price,
          image: item.image,
          shop_name: item.shop,
          source_id: String(item.goods_id),
          source_url: `https://mobile.yangkeduo.com/goods.html?goods_id=${item.goods_id}`,
          platform: 'pdd',
          is_official: item.shop.includes('官方') || item.shop.includes('旗舰'),
          sales_count: parseSales(item.sales),
        });
      }
    }
  } catch (err) {
    console.error('PDD scrape error:', err.message);
  }
  return products;
}

function parseSales(text) {
  if (!text) return 0;
  const clean = text.replace(/[^0-9.万+]/g, '');
  if (clean.includes('万')) return Math.round(parseFloat(clean) * 10000);
  return parseInt(clean) || 0;
}

module.exports = { scrapeJD, scrapeTaobao, scrapePDD };
