'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Row, Col, Tag, Spin, Empty, Button, Table, Tabs, Typography, Space } from 'antd';
import { ShoppingOutlined, ArrowLeftOutlined, HistoryOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { Product, Platform, PLATFORM_NAMES, PLATFORM_COLORS, PriceHistory } from '@/types';

const { Title, Text, Paragraph } = Typography;

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('7');

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
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
      },
      yAxis: {
        type: 'value',
        axisLabel: { formatter: '¥{value}' },
      },
      series: [
        {
          name: '价格',
          type: 'line',
          smooth: true,
          data: prices,
          areaStyle: { opacity: 0.3 },
          itemStyle: { color: '#1890ff' },
        },
      ],
    };
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!product) {
    return <Empty description="商品不存在" />;
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        style={{ marginBottom: 16, padding: 0 }}
      >
        返回搜索
      </Button>

      <Row gutter={24}>
        {/* 左侧：商品信息 */}
        <Col span={16}>
          <Card>
            <Row gutter={24}>
              <Col span={8}>
                <img
                  src={product.image_url || '/placeholder.png'}
                  alt={product.title}
                  style={{ width: '100%', borderRadius: 8, background: '#fafafa' }}
                />
              </Col>
              <Col span={16}>
                <Title level={3} style={{ marginBottom: 8 }}>
                  {product.title}
                </Title>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary">当前价格：</Text>
                    <span className="price-current" style={{ fontSize: 28 }}>
                      ¥{product.current_price || '--'}
                    </span>
                    {product.original_price && product.original_price > (product.current_price || 0) && (
                      <span className="price-original" style={{ marginLeft: 12 }}>
                        ¥{product.original_price}
                      </span>
                    )}
                  </div>
                  {product.coupon_price && (
                    <div>
                      <Text type="secondary">券后价：</Text>
                      <span className="price-current" style={{ color: '#52c41a' }}>
                        ¥{product.coupon_price}
                      </span>
                      <span className="price-coupon" style={{ marginLeft: 8 }}>
                        省 ¥{(product.current_price || 0) - product.coupon_price}
                      </span>
                    </div>
                  )}
                  <Space>
                    {product.lowest_price && (
                      <Tag color="green">
                        <HistoryOutlined /> 历史最低 ¥{product.lowest_price}
                      </Tag>
                    )}
                    {product.highest_price && (
                      <Tag>
                        历史最高 ¥{product.highest_price}
                      </Tag>
                    )}
                  </Space>
                  <div>
                    <Tag>{PLATFORM_NAMES[product.source_platform]}</Tag>
                    {product.brand && <Tag>{product.brand}</Tag>}
                    {product.category && <Tag>{product.category}</Tag>}
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingOutlined />}
                    href={product.source_url || '#'}
                    target="_blank"
                  >
                    去 {PLATFORM_NAMES[product.source_platform]} 购买
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* 价格走势图 */}
          <Card title="价格走势" style={{ marginTop: 24 }}>
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                { key: '7', label: '7天' },
                { key: '30', label: '30天' },
                { key: '90', label: '90天' },
                { key: '180', label: '180天' },
              ]}
            />
            {priceHistory.length > 0 ? (
              <ReactECharts option={getChartOption()} style={{ height: 300 }} />
            ) : (
              <Empty description="暂无历史价格数据" />
            )}
          </Card>
        </Col>

        {/* 右侧：其他平台价格 */}
        <Col span={8}>
          <Card title="其他平台比价" style={{ marginBottom: 24 }}>
            <Table
              dataSource={[
                { platform: 'jd', price: product.source_platform === 'jd' ? product.current_price : null },
                { platform: 'taobao', price: product.source_platform === 'taobao' ? product.current_price : null },
                { platform: 'pdd', price: product.source_platform === 'pdd' ? product.current_price : null },
                { platform: 'suning', price: product.source_platform === 'suning' ? product.current_price : null },
              ].filter((p) => p.price)}
              rowKey="platform"
              pagination={false}
              size="small"
              columns={[
                {
                  title: '平台',
                  dataIndex: 'platform',
                  render: (p: Platform) => (
                    <Tag color={PLATFORM_COLORS[p]}>{PLATFORM_NAMES[p]}</Tag>
                  ),
                },
                {
                  title: '价格',
                  dataIndex: 'price',
                  render: (price: number | null) => (
                    <span className={price && product.lowest_price === price ? 'price-lowest' : ''}>
                      {price ? `¥${price}` : '--'}
                    </span>
                  ),
                },
              ]}
            />
          </Card>

          <Card title="价格历史记录">
            <Table
              dataSource={priceHistory.slice(0, 10)}
              rowKey="id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: '日期',
                  dataIndex: 'recorded_at',
                  render: (d: string) => new Date(d).toLocaleDateString('zh-CN'),
                },
                {
                  title: '价格',
                  dataIndex: 'price',
                  render: (p: number) => <span className="price-current">¥{p}</span>,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
