'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Tag, Spin, Empty, Input, Typography, Space, Badge } from 'antd';
import { StarFilled } from '@ant-design/icons';
import { MatchGroup, Platform, PLATFORM_NAMES, PLATFORM_COLORS, Product } from '@/types';

const { Text } = Typography;

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
    }
  };

  const renderShopItem = (product: Product, isOfficial: boolean) => (
    <div
      key={product.id}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: isOfficial ? '#fffbe6' : '#fafafa',
        borderRadius: 6,
        border: isOfficial ? '1px solid #ffe58f' : '1px solid #f0f0f0',
        marginBottom: 6,
        cursor: 'pointer',
      }}
      onClick={() => router.push(`/product/${product.id}`)}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {isOfficial && <StarFilled style={{ color: '#faad14', fontSize: 12 }} />}
          <Text ellipsis style={{ fontSize: 13, fontWeight: isOfficial ? 600 : 400 }}>
            {product.shop_name || '未知店铺'}
          </Text>
        </div>
        {product.sales_count > 0 && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            月销 {product.sales_count > 10000 ? `${(product.sales_count / 10000).toFixed(1)}万` : product.sales_count}
          </Text>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ color: '#f5222d', fontWeight: 600, fontSize: 15 }}>
          ¥{product.coupon_price || product.current_price || '--'}
        </div>
        {product.coupon_price && product.current_price && product.current_price > product.coupon_price && (
          <Text delete type="secondary" style={{ fontSize: 11 }}>
            ¥{product.current_price}
          </Text>
        )}
      </div>
    </div>
  );

  const renderPlatformSection = (platform: Platform, data: { official: Product[]; others: Product[] }) => {
    const hasData = data.official.length > 0 || data.others.length > 0;
    if (!hasData) return null;

    return (
      <div key={platform} style={{ marginBottom: 12 }}>
        <Space style={{ marginBottom: 6 }} size={4}>
          <Badge color={PLATFORM_COLORS[platform]} />
          <Text strong style={{ fontSize: 13 }}>{PLATFORM_NAMES[platform]}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            ({data.official.length + data.others.length}家)
          </Text>
        </Space>
        <div>
          {data.official.map((p) => renderShopItem(p, true))}
          {data.others.slice(0, 2).map((p) => renderShopItem(p, false))}
          {data.others.length > 2 && (
            <Text type="secondary" style={{ fontSize: 11, display: 'block', textAlign: 'center', marginTop: 4 }}>
              +{data.others.length - 2} 家店铺
            </Text>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '12px 0' }}>
      {/* 搜索栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Input.Search
          size="large"
          placeholder="输入商品名称..."
          enterButton="搜索"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={handleSearch}
        />
      </Card>

      {/* 结果 */}
      <Card
        title={
          <Space wrap>
            <span>搜索结果</span>
            {query && <Tag color="blue">{query}</Tag>}
            <Text type="secondary">共 {matchGroups.length} 个商品</Text>
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" tip="正在搜索全网价格..." />
          </div>
        ) : matchGroups.length === 0 ? (
          <Empty description="暂无搜索结果，换个关键词试试" />
        ) : (
          matchGroups.map((group) => (
            <Card
              key={group.spu_key}
              type="inner"
              style={{ marginBottom: 16 }}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  {group.image_url && (
                    <img
                      src={group.image_url}
                      alt=""
                      style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }}
                    />
                  )}
                  <Text ellipsis style={{ fontSize: 14 }}>
                    {group.title}
                  </Text>
                </div>
              }
              extra={
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>最低价</Text>
                  <div style={{ color: '#52c41a', fontWeight: 600, fontSize: 16 }}>
                    ¥{group.best_price.coupon_price || group.best_price.current_price}
                  </div>
                </div>
              }
            >
              {/* 桌面端：3列网格 */}
              <div className="search-grid">
                {(['jd', 'taobao', 'pdd'] as Platform[]).map((platform) =>
                  renderPlatformSection(platform, group.platforms[platform])
                )}
              </div>
            </Card>
          ))
        )}
      </Card>
    </div>
  );
}
