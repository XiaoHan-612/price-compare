'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MatchGroup, Platform, PLATFORM_NAMES, PLATFORM_COLORS, Product } from '@/types';

// CORS 代理服务
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
];

async function fetchWithProxy(url: string): Promise<string> {
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetch(proxy + encodeURIComponent(url));
      if (res.ok) return await res.text();
    } catch (e) {
      continue;
    }
  }
  throw new Error('All proxies failed');
}

// 京东搜索
async function searchJD(keyword: string): Promise<any[]> {
  try {
    const url = `https://api.m.jd.com/client.action?functionId=search&body=${encodeURIComponent(JSON.stringify({ keyword, page: 1, pagesize: 20 }))}&appid=wh5`;
    const text = await fetchWithProxy(url);
    const data = JSON.parse(text);
    if (data?.data?.searchResult) {
      return data.data.searchResult.map((item: any) => ({
        title: item.wname || item.name || '',
        price: parseFloat(item.price || '0'),
        image: item.imageurl || '',
        shop: item.shopName || '',
        source_id: item.wareId || item.skuId || '',
        source_url: `https://item.jd.com/${item.wareId || item.skuId}.html`,
        platform: 'jd',
        is_official: (item.shopName || '').includes('自营') || (item.shopName || '').includes('官方'),
        sales: item.commCount || 0,
      }));
    }
  } catch (e) {
    console.error('JD search failed:', e);
  }
  return [];
}

// 淘宝搜索
async function searchTaobao(keyword: string): Promise<any[]> {
  try {
    const url = `https://s.m.taobao.com/h5?q=${encodeURIComponent(keyword)}`;
    const text = await fetchWithProxy(url);
    const match = text.match(/g_page_config\s*=\s*(\{[\s\S]*?\});/);
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
        platform: 'taobao',
        is_official: (item.nick || '').includes('官方') || (item.nick || '').includes('旗舰'),
        sales: parseInt((item.view_sales || '').replace(/[^0-9]/g, '')) || 0,
      }));
    }
  } catch (e) {
    console.error('Taobao search failed:', e);
  }
  return [];
}

// 拼多多搜索
async function searchPDD(keyword: string): Promise<any[]> {
  try {
    const url = `https://mobile.yangkeduo.com/search_result.html?search_key=${encodeURIComponent(keyword)}`;
    const text = await fetchWithProxy(url);
    const match = text.match(/window\.rawData\s*=\s*(\{[\s\S]*?\});/);
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
        platform: 'pdd',
        is_official: (item.mall_name || '').includes('官方') || (item.mall_name || '').includes('旗舰'),
        sales: parseInt((item.sales_tip || '').replace(/[^0-9]/g, '')) || 0,
      }));
    }
  } catch (e) {
    console.error('PDD search failed:', e);
  }
  return [];
}

export default function SearchPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ jd: 0, taobao: 0, pdd: 0 });

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setResults([]);

    const [jd, taobao, pdd] = await Promise.allSettled([
      searchJD(keyword),
      searchTaobao(keyword),
      searchPDD(keyword),
    ]);

    const jdResults = jd.status === 'fulfilled' ? jd.value : [];
    const taobaoResults = taobao.status === 'fulfilled' ? taobao.value : [];
    const pddResults = pdd.status === 'fulfilled' ? pdd.value : [];

    setStats({ jd: jdResults.length, taobao: taobaoResults.length, pdd: pddResults.length });

    // 合并所有结果
    const all = [...jdResults, ...taobaoResults, ...pddResults];
    setResults(all);
    setLoading(false);
  };

  const formatSales = (count: number) => {
    if (count > 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count > 1000) return `${(count / 1000).toFixed(1)}千`;
    return count.toString();
  };

  return (
    <div style={{ padding: '12px 0' }}>
      {/* 搜索栏 */}
      <div style={{ marginBottom: 24 }}>
        <div className="search-container">
          <input
            className="search-input"
            placeholder="输入商品名称，如 iPhone 15、茅台、戴森..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="search-btn" onClick={handleSearch}>
            🔍 搜索比价
          </button>
        </div>
      </div>

      {/* 搜索统计 */}
      {stats.jd + stats.taobao + stats.pdd > 0 && (
        <div style={{ marginBottom: 16, fontSize: 14, color: '#666' }}>
          搜索结果：京东 {stats.jd} 条 · 淘宝 {stats.taobao} 条 · 拼多多 {stats.pdd} 条
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">正在搜索全网价格...</div>
        </div>
      )}

      {/* 搜索结果 */}
      {!loading && results.length === 0 && keyword && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-text">暂无搜索结果，换个关键词试试</div>
        </div>
      )}

      {/* 商品列表 */}
      <div style={{ display: 'grid', gap: 16 }}>
        {results.map((item, idx) => (
          <div
            key={`${item.platform}_${item.source_id}_${idx}`}
            className="product-card"
            style={{ cursor: 'pointer' }}
            onClick={() => window.open(item.source_url, '_blank')}
          >
            <div style={{ display: 'flex', gap: 16, padding: 16 }}>
              {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: 8, background: '#fafafa' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'white',
                      background: PLATFORM_COLORS[item.platform as Platform] || '#999',
                    }}
                  >
                    {PLATFORM_NAMES[item.platform as Platform] || item.platform}
                  </span>
                  {item.is_official && (
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, background: '#fffbeb', color: '#b45309' }}>
                      ⭐ 官方
                    </span>
                  )}
                  {item.shop && (
                    <span style={{ fontSize: 12, color: '#666' }}>
                      {item.shop}
                    </span>
                  )}
                  {item.sales > 0 && (
                    <span style={{ fontSize: 12, color: '#999' }}>
                      月销{formatSales(item.sales)}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 600, color: '#f5222d' }}>
                  ¥{item.price || '--'}
                </div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  查看详情 →
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
