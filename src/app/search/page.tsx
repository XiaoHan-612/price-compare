'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MatchGroup, Platform, PLATFORM_NAMES, Product } from '@/types';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [keyword, setKeyword] = useState(query);
  const [matchGroups, setMatchGroups] = useState<MatchGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      setKeyword(query);
      searchProducts(query);
    } else {
      // 没有搜索词时显示所有商品
      searchProducts('');
    }
  }, [query]);

  const searchProducts = async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setMatchGroups(data.items || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (keyword.trim()) {
      router.push(`/search?q=${encodeURIComponent(keyword.trim())}`);
    } else {
      router.push('/search');
    }
  };

  const formatSales = (count: number) => {
    if (count > 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count > 1000) return `${(count / 1000).toFixed(1)}千`;
    return count.toString();
  };

  const renderShopItem = (product: Product, isOfficial: boolean) => (
    <div
      key={product.id}
      className={`shop-item ${isOfficial ? 'official' : ''}`}
      onClick={() => router.push(`/product/${product.id}`)}
    >
      <div className="shop-name">
        {isOfficial && <span className="star">⭐</span>}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.shop_name || '未知店铺'}
        </span>
        {product.sales_count > 0 && (
          <span className="shop-sales">月销{formatSales(product.sales_count)}</span>
        )}
      </div>
      <div className="shop-price">
        <div className="shop-price-main">¥{product.coupon_price || product.current_price || '--'}</div>
        {product.coupon_price && product.current_price && product.current_price > product.coupon_price && (
          <div className="shop-price-original">¥{product.current_price}</div>
        )}
      </div>
    </div>
  );

  const renderPlatformSection = (platform: Platform, data: { official: Product[]; others: Product[] }) => {
    const hasData = data.official.length > 0 || data.others.length > 0;
    if (!hasData) return null;

    return (
      <div className="platform-section" key={platform}>
        <div className="platform-header">
          <span className={`platform-dot ${platform}`}></span>
          <span className="platform-name">{PLATFORM_NAMES[platform]}</span>
          <span className="platform-count">{data.official.length + data.others.length}家</span>
        </div>
        {data.official.map((p) => renderShopItem(p, true))}
        {data.others.slice(0, 3).map((p) => renderShopItem(p, false))}
        {data.others.length > 3 && (
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
            +{data.others.length - 3} 家店铺
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Search */}
      <div style={{ marginBottom: 32 }}>
        <div className="search-container">
          <input
            className="search-input"
            placeholder="输入商品名称..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="search-btn" onClick={handleSearch}>
            🔍 搜索
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="results-header">
        <div className="results-title">
          搜索结果
          {query && <span className="query-tag">{query}</span>}
        </div>
        <span className="results-count">共 {matchGroups.length} 个商品</span>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">正在搜索全网价格...</div>
        </div>
      ) : matchGroups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-text">暂无搜索结果，换个关键词试试</div>
        </div>
      ) : (
        matchGroups.map((group, idx) => (
          <div className="product-card" key={group.spu_key} style={{ animationDelay: `${idx * 50}ms` }}>
            <div className="product-card-header">
              {group.image_url && (
                <img
                  className="product-thumb"
                  src={group.image_url}
                  alt=""
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div className="product-info">
                <div className="product-title">{group.title}</div>
              </div>
              <div className="product-best-price">
                <div className="best-price-label">全网最低价</div>
                <div className="best-price-value">
                  ¥{group.best_price.coupon_price || group.best_price.current_price}
                </div>
              </div>
            </div>
            <div className="platforms-grid">
              {(['jd', 'taobao', 'pdd'] as Platform[]).map((platform) =>
                renderPlatformSection(platform, group.platforms[platform])
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
