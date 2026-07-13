import { BaseCollector, CrawledProduct } from './base';

export class TaobaoCollector extends BaseCollector {
  platform = 'taobao' as const;

  async search(keyword: string, page: number = 1): Promise<CrawledProduct[]> {
    try {
      // 使用淘宝H5搜索接口
      const url = `https://h5api.m.taobao.com/h5/mtop.relationrecommend.wirelessrecommend.recommend/2.0/?data=${encodeURIComponent(JSON.stringify({ keyword, pageNum: page }))}`;
      const res = await this.fetchWithRetry(url);
      const text = await res.text();
      return this.parseResponse(text);
    } catch (err) {
      console.error('Taobao search failed:', err);
      return [];
    }
  }

  private parseResponse(text: string): CrawledProduct[] {
    const products: CrawledProduct[] = [];
    try {
      // 尝试解析 JSONP 或 JSON
      const jsonStr = text.replace(/^[^(]*\(/, '').replace(/\)[^)]*$/, '');
      const data = JSON.parse(jsonStr);

      const items = data?.data?.items || data?.items || [];
      for (const item of items) {
        const price = parseFloat(item.price || item.priceShow?.price || '0');
        if (price > 0) {
          const shopName = item.shopName || item.nick || null;
          const salesText = item.sales || item.sellNum || '';
          const salesCount = this.parseSalesCount(salesText);

          products.push({
            title: item.title || item.titleShow || '',
            image_url: item.pic || item.picUrl || null,
            price,
            original_price: item.originalPrice ? parseFloat(item.originalPrice) : null,
            coupon_price: item.couponPrice ? parseFloat(item.couponPrice) : null,
            source_id: item.nid || item.itemId || '',
            source_url: `https://item.taobao.com/item.htm?id=${item.nid || item.itemId}`,
            brand: item.brand || null,
            shop_name: shopName,
            shop_url: shopName ? `https://shop${item.shopId || ''}.taobao.com` : null,
            is_official: this.isOfficialShop(shopName),
            sales_count: salesCount,
          });
        }
      }
    } catch {
      // 解析失败返回空数组
    }
    return products;
  }
}
