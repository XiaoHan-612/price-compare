'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, List, Tag, Spin, Empty, Input, Radio, Space, Typography } from 'antd';
import { ShoppingOutlined, ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import { Product, PLATFORM_NAMES, PLATFORM_COLORS, Platform } from '@/types';

const { Title, Text } = Typography;

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const [keyword, setKeyword] = useState(query);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<string>('price_asc');

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
      setProducts(data.items || []);
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

  // 按平台聚合商品（模拟多平台比价）
  const groupedProducts = products.reduce((acc, product) => {
    const key = product.normalized_name || product.title;
    if (!acc[key]) {
      acc[key] = {
        ...product,
        platforms: [],
      };
    }
    acc[key].platforms.push({
      platform: product.source_platform,
      price: product.current_price,
      coupon_price: product.coupon_price,
      url: product.source_url,
    });
    return acc;
  }, {} as Record<string, any>);

  let displayProducts = Object.values(groupedProducts);

  // 排序
  if (sort === 'price_asc') {
    displayProducts.sort((a: any, b: any) => (a.current_price || 99999) - (b.current_price || 99999));
  } else if (sort === 'price_desc') {
    displayProducts.sort((a: any, b: any) => (b.current_price || 0) - (a.current_price || 0));
  }

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
            <Text type="secondary">共 {displayProducts.length} 件商品</Text>
          </Space>
        }
        extra={
          <Radio.Group value={sort} onChange={(e) => setSort(e.target.value)} size="small">
            <Radio.Button value="price_asc">价格低→高</Radio.Button>
            <Radio.Button value="price_desc">价格高→低</Radio.Button>
          </Radio.Group>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" tip="正在搜索全网价格..." />
          </div>
        ) : displayProducts.length === 0 ? (
          <Empty description="暂无搜索结果，换个关键词试试" />
        ) : (
          <List
            dataSource={displayProducts}
            renderItem={(item: any) => (
              <List.Item
                key={item.id}
                style={{ padding: '16px 0', cursor: 'pointer' }}
                onClick={() => router.push(`/product/${item.id}`)}
              >
                <List.Item.Meta
                  avatar={
                    <img
                      src={item.image_url || '/placeholder.png'}
                      alt={item.title}
                      style={{ width: 80, height: 80, objectFit: 'contain', background: '#fafafa', borderRadius: 4 }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MCIgaGVpZ2h0PSI4MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjY2NjIiBmb250LXNpemU9IjE0Ij7mm7Tloavog7w8L3RleHQ+PC9zdmc+';
                      }}
                    />
                  }
                  title={
                    <Text ellipsis style={{ fontSize: 16 }}>
                      {item.title}
                    </Text>
                  }
                  description={
                    <Space direction="vertical" size={4}>
                      {/* 多平台价格 */}
                      <Space wrap size={8}>
                        {item.platforms?.map((p: any) => (
                          <Tag
                            key={p.platform}
                            color={p.platform === item.platforms[0]?.platform ? 'red' : 'default'}
                            style={{ padding: '2px 8px' }}
                          >
                            {PLATFORM_NAMES[p.platform as Platform]}: ¥{p.price}
                          </Tag>
                        ))}
                      </Space>
                      {/* 标签 */}
                      <Space size={4}>
                        {item.coupon_price && <span className="price-coupon">券后价</span>}
                        {item.lowest_price && (
                          <Tag color="green" style={{ margin: 0 }}>
                            历史低价 ¥{item.lowest_price}
                          </Tag>
                        )}
                      </Space>
                    </Space>
                  }
                />
                <div style={{ textAlign: 'right' }}>
                  <div className="price-current">
                    ¥{item.current_price || '--'}
                  </div>
                  {item.original_price && item.original_price > (item.current_price || 0) && (
                    <div className="price-original">¥{item.original_price}</div>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: '#1890ff', fontSize: 13 }}
                    >
                      <ShoppingOutlined /> 去购买
                    </a>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
