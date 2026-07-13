import { BaseCollector, CrawledProduct } from './base';

export class PDDCollector extends BaseCollector {
  platform = 'pdd' as const;

  async search(keyword: string, page: number = 1): Promise<CrawledProduct[]> {
    try {
      // 使用拼多多移动端搜索页面
      const url = `https://mobile.yangkeduo.com/search_result.html?search_key=${encodeURIComponent(keyword)}&page=${page}`;
      const res = await this.fetchWithRetry(url);
      const html = await res.text();
      return this.parseHTML(html);
    } catch (err) {
      console.error('PDD search failed:', err);
      return [];
    }
  }

  private parseHTML(html: string): CrawledProduct[] {
    const products: CrawledProduct[] = [];

    // 尝试从页面中提取 JSON 数据
    const jsonMatch = html.match(/window\.rawData\s*=\s*(\{[\s\S]*?\});/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const items = data?.store?.goods || [];
        for (const item of items) {
          const price = item.min_group_price / 100 || item.min_normal_price / 100 || 0;
          if (price > 0) {
            const shopName = item.mall_name || null;
            products.push({
              title: item.goods_name || '',
              image_url: item.hd_thumb_url || item.thumb_url || null,
              price,
              original_price: item.market_price ? item.market_price / 100 : null,
              coupon_price: null,
              source_id: item.goods_id || '',
              source_url: `https://mobile.yangkeduo.com/goods.html?goods_id=${item.goods_id}`,
              brand: null,
              shop_name: shopName,
              shop_url: null,
              is_official: this.isOfficialShop(shopName),
              sales_count: item.sales_tip ? this.parseSalesCount(item.sales_tip) : 0,
            });
          }
        }
      } catch {
        // JSON 解析失败
      }
    }

    // 备用：正则匹配
    if (products.length === 0) {
      const itemRegex = /goods_id["\s:=]+(\d+)[\s\S]*?goods_name["\s:=]+"([^"]+)"[\s\S]*?(?:min_group_price|price)["\s:=]+(\d+)/g;
      let match;
      while ((match = itemRegex.exec(html)) !== null) {
        const [, sourceId, title, priceCent] = match;
        const price = parseInt(priceCent) / 100;
        if (price > 0) {
          products.push({
            title,
            image_url: null,
            price,
            original_price: null,
            coupon_price: null,
            source_id: sourceId,
            source_url: `https://mobile.yangkeduo.com/goods.html?goods_id=${sourceId}`,
            brand: null,
            shop_name: null,
            shop_url: null,
            is_official: false,
            sales_count: 0,
          });
        }
      }
    }

    return products;
  }
}
