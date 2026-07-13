'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product, Platform, PLATFORM_NAMES, PLATFORM_COLORS, PriceHistory } from '@/types';
import ReactECharts from 'echarts-for-react';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('30');

  useEffect(() => {
    if (params.id) {
      loadProduct(params.id as string);
    }
  }, [params.id]);

  const loadProduct = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/product/${id}`);
      const data = await res.json();
      setProduct(data.product);
      setPriceHistory(data.priceHistory || []);
    } catch (err) {
      console.error('Load product failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getChartOption = () => {
    if (!priceHistory.length) return {};
    const days = parseInt(activeTab);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const filtered = priceHistory.filter((p) => new Date(p.recorded_at) >= cutoff);
    const dates = filtered.map((p) =>
      new Date(p.recorded_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    );
    const prices = filtered.map((p) => p.price);
    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}<br/>价格: ¥${p.value}`;
        },
      },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: dates },
      yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
      series: [{
        name: '价格',
        type: 'line',
        smooth: true,
        data: prices,
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37,99,235,0.3)' },
              { offset: 1, color: 'rgba(37,99,235,0.02)' },
            ],
          },
        },
        lineStyle: { color: '#2563eb', width: 2 },
        itemStyle: { color: '#2563eb' },
      }],
    };
  };

  const formatSales = (count: number) => {
    if (count > 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count > 1000) return `${(count / 1000).toFixed(1)}千`;
    return count.toString();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">加载中...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="empty-state">
        <div className="empty-icon">😕</div>
        <div className="empty-text">商品不存在</div>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => router.back()}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent-blue)',
          fontSize: 14,
          cursor: 'pointer',
          marginBottom: 24,
          padding: 0,
        }}
      >
        ← 返回搜索
      </button>

      {/* 商品头部 */}
      <div className="detail-header">
        {product.image_url && (
          <img className="detail-image" src={product.image_url} alt={product.title} />
        )}
        <div className="detail-info">
          <h1 className="detail-title">{product.title}</h1>

          <div className="detail-price-block">
            <span className="detail-price-current">
              ¥{product.coupon_price || product.current_price || '--'}
            </span>
            {product.original_price && product.original_price > (product.current_price || 0) && (
              <span className="detail-price-original">¥{product.original_price}</span>
            )}
            {product.coupon_price && product.current_price && product.current_price > product.coupon_price && (
              <div className="detail-coupon">
                券后省 ¥{(product.current_price - product.coupon_price).toFixed(0)}
              </div>
            )}
          </div>

          <div className="detail-meta">
            <span className="meta-tag">{PLATFORM_NAMES[product.source_platform]}</span>
            {product.brand && <span className="meta-tag">{product.brand}</span>}
            {product.is_official && <span className="meta-tag official">⭐ 官方旗舰店</span>}
            {product.lowest_price && (
              <span className="meta-tag" style={{ color: 'var(--accent-green)' }}>
                历史最低 ¥{product.lowest_price}
              </span>
            )}
          </div>

          <a
            className="buy-btn"
            href={product.source_url || '#'}
            target="_blank"
            rel="noopener noreferrer"
          >
            去 {product.shop_name || PLATFORM_NAMES[product.source_platform]} 购买 →
          </a>
        </div>
      </div>

      {/* 价格走势 */}
      <div className="compare-section" style={{ marginBottom: 24 }}>
        <div className="compare-title">📈 价格走势</div>
        <div style={{ padding: '12px 24px 0', display: 'flex', gap: 8 }}>
          {['7', '30', '90', '180'].map((d) => (
            <button
              key={d}
              onClick={() => setActiveTab(d)}
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid',
                borderColor: activeTab === d ? 'var(--accent-blue)' : 'var(--border-color)',
                background: activeTab === d ? 'var(--accent-blue)' : 'var(--bg-card)',
                color: activeTab === d ? 'white' : 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {d}天
            </button>
          ))}
        </div>
        <div style={{ padding: 16 }}>
          {priceHistory.length > 0 ? (
            <ReactECharts option={getChartOption()} style={{ height: 300 }} />
          ) : (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-text">暂无历史价格数据</div>
            </div>
          )}
        </div>
      </div>

      {/* 店铺信息 */}
      <div className="compare-section">
        <div className="compare-title">🏪 店铺信息</div>
        <div className="compare-platform">
          <div className="compare-platform-header">
            <span className={`platform-dot ${product.source_platform}`}></span>
            {PLATFORM_NAMES[product.source_platform]}
          </div>
          <div className={`compare-shop ${product.is_official ? 'official' : ''}`}>
            <div className="shop-name">
              {product.is_official && <span className="star">⭐</span>}
              {product.shop_name || '未知店铺'}
              {product.sales_count > 0 && (
                <span className="shop-sales">月销{formatSales(product.sales_count)}</span>
              )}
            </div>
            <div className="shop-price">
              <div className="shop-price-main">
                ¥{product.coupon_price || product.current_price}
              </div>
            </div>
            <a
              href={product.source_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="buy-btn"
              style={{ padding: '8px 20px', fontSize: 13 }}
            >
              去购买
            </a>
          </div>
        </div>
      </div>

      {/* 价格历史 */}
      <div className="compare-section" style={{ marginTop: 24 }}>
        <div className="compare-title">📊 价格历史记录</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500 }}>日期</th>
              <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 500 }}>价格</th>
            </tr>
          </thead>
          <tbody>
            {priceHistory.slice(0, 10).map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '12px 24px', fontSize: 14 }}>{new Date(p.recorded_at).toLocaleDateString('zh-CN')}</td>
                <td style={{ padding: '12px 24px', textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, color: 'var(--accent-red)' }}>¥{p.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
