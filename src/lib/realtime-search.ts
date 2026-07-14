// 京东移动端搜索 API
export async function searchJDRealtime(keyword: string, page: number = 1) {
  try {
    const url = `https://api.m.jd.com/client.action?functionId=search&body=${encodeURIComponent(JSON.stringify({ keyword, page, pagesize: 20 }))}&appid=wh5`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Referer': 'https://so.m.jd.com/',
      },
    });
    const data = await res.json();

    if (data?.data?.searchResult) {
      return data.data.searchResult.map((item: any) => ({
        title: item.wname || item.name || '',
        price: parseFloat(item.price || '0'),
        image: item.imageurl || '',
        shop: item.shopName || '',
        source_id: item.wareId || item.skuId || '',
        source_url: `https://item.jd.com/${item.wareId || item.skuId}.html`,
        platform: 'jd' as const,
        is_official: (item.shopName || '').includes('自营') || (item.shopName || '').includes('官方'),
        sales: item.commCount || 0,
      }));
    }
  } catch (err) {
    console.error('JD realtime search error:', err);
  }
  return [];
}

// 淘宝移动端搜索
export async function searchTaobaoRealtime(keyword: string, page: number = 1) {
  try {
    // 使用淘宝 H5 搜索页面解析
    const url = `https://s.m.taobao.com/h5?q=${encodeURIComponent(keyword)}&page=${page}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Referer': 'https://m.taobao.com/',
      },
    });
    const html = await res.text();

    // 从 HTML 中提取 JSON 数据
    const match = html.match(/g_page_config\s*=\s*(\{[\s\S]*?\});/);
    if (match) {
      const config = JSON.parse(match[1]);
      const items = config?.mods?.itemlist?.data?.auctions || [];
      return items.slice(0, 20).map((item: any) => ({
        title: (item.title || '').replace(/<[^>]+>/g, ''),
        price: parseFloat(item.view_price || '0'),
        image: item.pic_url ? `https:${item.pic_url}` : '',
        shop: item.nick || '',
        source_id: item.nid || '',
        source_url: `https://item.taobao.com/item.htm?id=${item.nid}`,
        platform: 'taobao' as const,
        is_official: (item.nick || '').includes('官方') || (item.nick || '').includes('旗舰'),
        sales: parseInt((item.view_sales || '').replace(/[^0-9]/g, '')) || 0,
      }));
    }
  } catch (err) {
    console.error('Taobao realtime search error:', err);
  }
  return [];
}

// 拼多多移动端搜索
export async function searchPDDRealtime(keyword: string, page: number = 1) {
  try {
    const url = `https://mobile.yangkeduo.com/search_result.html?search_key=${encodeURIComponent(keyword)}&page=${page}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        'Referer': 'https://mobile.yangkeduo.com/',
      },
    });
    const html = await res.text();

    // 从页面中提取数据
    const match = html.match(/window\.rawData\s*=\s*(\{[\s\S]*?\});/);
    if (match) {
      const data = JSON.parse(match[1]);
      const items = data?.store?.goods || [];
      return items.slice(0, 20).map((item: any) => ({
        title: item.goods_name || '',
        price: (item.min_group_price || 0) / 100,
        image: item.hd_thumb_url || item.thumb_url || '',
        shop: item.mall_name || '',
        source_id: String(item.goods_id || ''),
        source_url: `https://mobile.yangkeduo.com/goods.html?goods_id=${item.goods_id}`,
        platform: 'pdd' as const,
        is_official: (item.mall_name || '').includes('官方') || (item.mall_name || '').includes('旗舰'),
        sales: parseInt((item.sales_tip || '').replace(/[^0-9]/g, '')) || 0,
      }));
    }
  } catch (err) {
    console.error('PDD realtime search error:', err);
  }
  return [];
}
