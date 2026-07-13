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
    const itemRegex = /<li class="gl-item"[^>]*>[\s\S]*?<div class="gl-i-wrap">[\s\S]*?<div class="p-img">[\s\S]*?<a[^>]*href="([^"]*)"[^>]*>[\s\S]*?<img[^>]*data-lazy-img="([^"]*)"[^>]*>[\s\S]*?<div class="p-price">[\s\S]*?<strong[^>]*><i>¥<\/i>([\d.]+)<\/strong>/g;

    let match;
    while ((match = itemRegex.exec(html)) !== null) {
      const [, url, img, price] = match;
      const titleMatch = html.substring(match.index).match(/<div class="p-name[^"]*">[\s\S]*?<em>([\s\S]*?)<\/em>/);

      if (price) {
        products.push({
          title: this.cleanHTML(titleMatch?.[1] || ''),
          image_url: img ? `https:${img}` : null,
          price: parseFloat(price),
          original_price: null,
          coupon_price: null,
          source_id: this.extractId(url),
          source_url: url.startsWith('http') ? url : `https:${url}`,
          brand: null,
          shop_name: null,
        });
      }
    }
    return products;
  }

  private cleanHTML(html: string): string {
    return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  }

  private extractId(url: string): string {
    const match = url.match(/\/(\d+)\.html/);
    return match?.[1] || '';
  }
}
