import { BaseCollector, CrawledProduct } from './base';

export class JDCollector extends BaseCollector {
  platform = 'jd' as const;

  async search(keyword: string, page: number = 1): Promise<CrawledProduct[]> {
    try {
      const url = `https://search.jd.com/Search?keyword=${encodeURIComponent(keyword)}&page=${page * 2 - 1}&s=${(page - 1) * 30 + 1}`;
      const res = await this.fetchWithRetry(url);
      const html = await res.text();
      return this.parseHTML(html);
    } catch (err) {
      console.error('JD search failed:', err);
      return [];
    }
  }

  private parseHTML(html: string): CrawledProduct[] {
    const products: CrawledProduct[] = [];

    // 匹配商品块
    const itemRegex = /<li class="gl-item"[\s\S]*?<\/li>/g;
    let itemMatch;

    while ((itemMatch = itemRegex.exec(html)) !== null) {
      const item = itemMatch[0];

      // 提取链接
      const urlMatch = item.match(/href="(https?:\/\/item\.jd\.com\/\d+\.html)"/);
      const url = urlMatch?.[1] || '';

      // 提取ID
      const idMatch = url.match(/\/(\d+)\.html/);
      const sourceId = idMatch?.[1] || '';

      // 提取图片
      const imgMatch = item.match(/data-lazy-img="([^"]+)"/);
      const image = imgMatch?.[1] || '';

      // 提取价格
      const priceMatch = item.match(/<strong[^>]*><i>¥<\/i>([\d.]+)<\/strong>/);
      const price = priceMatch ? parseFloat(priceMatch[1]) : 0;

      // 提取标题
      const titleMatch = item.match(/<div class="p-name[^"]*">[\s\S]*?<em>([\s\S]*?)<\/em>/);
      const title = titleMatch?.[1]?.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() || '';

      // 提取店铺名
      const shopMatch = item.match(/<span class="p-shop[^"]*"[^>]*><a[^>]*>([^<]+)<\/a>/);
      const shopName = shopMatch?.[1] || null;

      // 提取销量
      const salesMatch = item.match(/<span class="p-commit[^"]*"><a[^>]*>([^<]+)<\/a>/);
      const salesText = salesMatch?.[1] || '';
      const salesCount = this.parseSalesCount(salesText);

      if (price > 0 && sourceId) {
        products.push({
          title,
          image_url: image ? `https:${image}` : null,
          price,
          original_price: null,
          coupon_price: null,
          source_id: sourceId,
          source_url: url || `https://item.jd.com/${sourceId}.html`,
          brand: null,
          shop_name: shopName,
          shop_url: shopName ? `https://shop.jd.com/` : null,
          is_official: this.isOfficialShop(shopName),
          sales_count: salesCount,
        });
      }
    }

    return products;
  }
}
