import { supabaseAdmin } from './supabase';
import { MatchGroup } from '@/types';

interface CacheEntry {
  query: string;
  results: MatchGroup[];
  created_at: string;
  expires_at: string;
}

const memoryCache = new Map<string, CacheEntry>();

export async function getCachedResults(query: string): Promise<MatchGroup[] | null> {
  const cacheKey = query.toLowerCase().trim();

  // 1. 先检查内存缓存
  const memEntry = memoryCache.get(cacheKey);
  if (memEntry && new Date(memEntry.expires_at) > new Date()) {
    return memEntry.results;
  }

  // 2. 检查 Supabase 缓存
  if (supabaseAdmin) {
    try {
      const { data } = await supabaseAdmin
        .from('search_cache')
        .select('results')
        .eq('query', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (data) {
        const results = data.results as MatchGroup[];
        // 写入内存缓存
        memoryCache.set(cacheKey, {
          query: cacheKey,
          results,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        });
        return results;
      }
    } catch (err) {
      console.error('Cache read failed:', err);
    }
  }

  return null;
}

export async function setCachedResults(query: string, results: MatchGroup[]): Promise<void> {
  const cacheKey = query.toLowerCase().trim();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  // 1. 写入内存缓存
  memoryCache.set(cacheKey, {
    query: cacheKey,
    results,
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
  });

  // 2. 写入 Supabase 缓存
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('search_cache').upsert(
        {
          query: cacheKey,
          results,
          expires_at: expiresAt,
        },
        { onConflict: 'query' }
      );
    } catch (err) {
      console.error('Cache write failed:', err);
    }
  }
}
