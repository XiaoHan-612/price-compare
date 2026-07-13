import { Platform } from '@/types';
import { BaseCollector, CrawledProduct } from './base';
import { JDCollector } from './jd';
import { TaobaoCollector } from './taobao';

const collectors: Record<Platform, BaseCollector> = {
  jd: new JDCollector(),
  taobao: new TaobaoCollector(),
  tmall: new TaobaoCollector(), // 天猫和淘宝共用
  pdd: new JDCollector(), // TODO: 拼多多采集器
  suning: new JDCollector(), // TODO: 苏宁采集器
};

export async function searchAllPlatforms(
  keyword: string,
  platforms: Platform[] = ['jd', 'taobao']
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
