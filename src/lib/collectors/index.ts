import { Platform } from '@/types';
import { BaseCollector, CrawledProduct } from './base';
import { JDCollector } from './jd';
import { TaobaoCollector } from './taobao';
import { PDDCollector } from './pdd';

const collectors: Record<Platform, BaseCollector> = {
  jd: new JDCollector(),
  taobao: new TaobaoCollector(),
  tmall: new TaobaoCollector(),
  pdd: new PDDCollector(),
};

export async function searchAllPlatforms(
  keyword: string,
  platforms: Platform[] = ['jd', 'taobao', 'pdd']
): Promise<Map<Platform, CrawledProduct[]>> {
  const results = new Map<Platform, CrawledProduct[]>();

  const tasks = platforms.map(async (platform) => {
    const collector = collectors[platform];
    if (collector) {
      try {
        const items = await collector.search(keyword);
        results.set(platform, items);
      } catch (err) {
        console.error(`Search failed for ${platform}:`, err);
        results.set(platform, []);
      }
    }
  });

  await Promise.allSettled(tasks);
  return results;
}

export { BaseCollector };
export type { CrawledProduct };
