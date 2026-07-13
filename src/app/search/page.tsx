'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Tag, Spin, Empty, Input, Typography, Space, Badge } from 'antd';
import { ShopOutlined, StarFilled, ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import { MatchGroup, Platform, PLATFORM_NAMES, PLATFORM_COLORS, Product } from '@/types';

const { Title, Text, Paragraph } = Typography;

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
        <Space size={4}>
          {isOfficial && <StarFilled style={{ color: '#faad14' }} />}
          <Text ellipsis style={{ fontSize: 13, fontWeight: isOfficial ? 600 : 400 }}>
            {product.shop_name || '未知店铺'}
          </Text>
        </Space>
        {product.sales_count > 0 && (
          <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
            月销 {product.sales_count > 10000 ? `${(product.sales_count / 10000).toFixed(1)}万` : product.sales_count}
          </Text>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ color: '#f5222d', fontWeight: 600, fontSize: 15 }}>
          ¥{product.coupon_price || product.current_price || '--'}
        </div>
        {product.coupon_price && product.current_price && product.current_price > product.coupon_price && (
          <Text delete type="secondary" style={{ fontSize: 12 }}>
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
      <div key={platform} style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 8 }}>
          <Badge color={PLATFORM_COLORS[platform]} />
          <Text strong>{PLATFORM_NAMES[platform]}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            ({data.official.length + data.others.length}家店铺)
          </Text>
        </Space>
        <div>
          {data.official.map((p) => renderShopItem(p, true))}
          {data.others.slice(0, 3).map((p) => renderShopItem(p, false))}
          {data.others.length > 3 && (
            <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'center', marginTop: 4 }}>
              还有 {data.others.length - 3} 家店铺...
            </Text>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '24px 0' }}>
      {/* 搜索栏 */}
      <Card style={{ marginBottom: 24 }}>
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
          <Space>
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
                <Space>
                  {group.image_url && (
                    <img
                      src={group.image_url}
                      alt=""
                      style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 4 }}
                    />
                  )}
                  <Text ellipsis style={{ maxWidth: 500 }}>
                    {group.title}
                  </Text>
                </Space>
              }
              extra={
                <Space>
                  <Text type="secondary">最低价</Text>
                  <Text strong style={{ color: '#52c41a', fontSize: 18 }}>
                    ¥{group.best_price.coupon_price || group.best_price.current_price}
                  </Text>
                </Space>
              }
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
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
