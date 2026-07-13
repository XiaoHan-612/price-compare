import { NextRequest, NextResponse } from 'next/server';
import { searchAllPlatforms } from '@/lib/collectors';
import { matchProducts } from '@/lib/matcher';
import { getCachedResults, setCachedResults } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  // 1. 检查缓存
  const cached = await getCachedResults(query);
  if (cached) {
    return NextResponse.json({ total: cached.length, items: cached, cached: true });
  }

  // 2. 搜索各平台（京东、淘宝、拼多多）
  const results = await searchAllPlatforms(query, ['jd', 'taobao', 'pdd']);

  // 3. 跨平台匹配
  const matchGroups = matchProducts(results);

  // 4. 缓存结果
  if (matchGroups.length > 0) {
    await setCachedResults(query, matchGroups);
  }

  return NextResponse.json({
    total: matchGroups.length,
    items: matchGroups,
    cached: false,
  });
}
