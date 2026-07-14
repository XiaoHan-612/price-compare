import { NextRequest, NextResponse } from 'next/server';
import { searchJDRealtime, searchTaobaoRealtime, searchPDDRealtime } from '@/lib/realtime-search';
import { matchProducts } from '@/lib/matcher';
import { Platform } from '@/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';

  if (!query) {
    return NextResponse.json({ total: 0, items: [], message: '请输入搜索关键词' });
  }

  // 实时搜索三个平台
  const [jdResults, taobaoResults, pddResults] = await Promise.allSettled([
    searchJDRealtime(query),
    searchTaobaoRealtime(query),
    searchPDDRealtime(query),
  ]);

  const jd = jdResults.status === 'fulfilled' ? jdResults.value : [];
  const taobao = taobaoResults.status === 'fulfilled' ? taobaoResults.value : [];
  const pdd = pddResults.status === 'fulfilled' ? pddResults.value : [];

  console.log(`搜索 "${query}": 京东${jd.length}条, 淘宝${taobao.length}条, 拼多多${pdd.length}条`);

  // 合并结果
  const resultsMap = new Map<Platform, any[]>();
  resultsMap.set('jd', jd);
  resultsMap.set('taobao', taobao);
  resultsMap.set('pdd', pdd);

  // 跨平台匹配
  const matchGroups = matchProducts(resultsMap);

  return NextResponse.json({
    total: matchGroups.length,
    items: matchGroups,
    stats: { jd: jd.length, taobao: taobao.length, pdd: pdd.length },
  });
}
