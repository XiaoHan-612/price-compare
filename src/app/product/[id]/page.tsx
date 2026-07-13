'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Row, Col, Tag, Spin, Empty, Button, Table, Tabs, Typography, Space, Badge } from 'antd';
import { ShoppingOutlined, ArrowLeftOutlined, HistoryOutlined, StarFilled } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { Product, Platform, PLATFORM_NAMES, PLATFORM_COLORS, PriceHistory } from '@/types';

const { Title, Text } = Typography;

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

  const formatSales = (count: number) => {
    if (count > 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count > 1000) return `${(count / 1000).toFixed(1)}千`;
    return count.toString();
  };

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
                    <span style={{ fontSize: 28, color: '#f5222d', fontWeight: 600 }}>
                      ¥{product.current_price || '--'}
                    </span>
                    {product.original_price && product.original_price > (product.current_price || 0) && (
                      <span style={{ textDecoration: 'line-through', color: '#999', marginLeft: 12 }}>
                        ¥{product.original_price}
                      </span>
                    )}
                  </div>
                  {product.coupon_price && (
                    <div>
                      <Text type="secondary">券后价：</Text>
                      <span style={{ fontSize: 28, color: '#52c41a', fontWeight: 600 }}>
                        ¥{product.coupon_price}
                      </span>
                      <Tag color="red" style={{ marginLeft: 8 }}>
                        省 ¥{(product.current_price || 0) - product.coupon_price}
                      </Tag>
                    </div>
                  )}
                  <Space>
                    {product.lowest_price && (
                      <Tag color="green">
                        <HistoryOutlined /> 历史最低 ¥{product.lowest_price}
                      </Tag>
                    )}
                  </Space>
                  <div>
                    <Tag>{PLATFORM_NAMES[product.source_platform]}</Tag>
                    {product.brand && <Tag>{product.brand}</Tag>}
                    {product.is_official && (
                      <Tag color="gold">
                        <StarFilled /> 官方旗舰店
                      </Tag>
                    )}
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingOutlined />}
                    href={product.source_url || '#'}
                    target="_blank"
                  >
                    去 {product.shop_name || PLATFORM_NAMES[product.source_platform]} 购买
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

        {/* 右侧：店铺信息 */}
        <Col span={8}>
          <Card title="店铺信息" style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Badge color={PLATFORM_COLORS[product.source_platform]} />
                <Text strong>{PLATFORM_NAMES[product.source_platform]}</Text>
              </Space>
            </div>

            {/* 官方旗舰店 */}
            {product.is_official && (
              <div
                style={{
                  padding: 12,
                  background: '#fffbe6',
                  border: '1px solid #ffe58f',
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <Space>
                  <StarFilled style={{ color: '#faad14' }} />
                  <Text strong>{product.shop_name}</Text>
                </Space>
                <div style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 20, color: '#f5222d', fontWeight: 600 }}>
                    ¥{product.coupon_price || product.current_price}
                  </Text>
                  {product.sales_count > 0 && (
                    <Text type="secondary" style={{ marginLeft: 12 }}>
                      月销 {formatSales(product.sales_count)}
                    </Text>
                  )}
                </div>
                <Button
                  type="primary"
                  size="small"
                  icon={<ShoppingOutlined />}
                  href={product.source_url || '#'}
                  target="_blank"
                  style={{ marginTop: 8 }}
                >
                  去购买
                </Button>
              </div>
            )}

            {/* 其他店铺 */}
            {!product.is_official && (
              <div
                style={{
                  padding: 12,
                  background: '#fafafa',
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                }}
              >
                <Text>{product.shop_name || '未知店铺'}</Text>
                <div style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 20, color: '#f5222d', fontWeight: 600 }}>
                    ¥{product.coupon_price || product.current_price}
                  </Text>
                  {product.sales_count > 0 && (
                    <Text type="secondary" style={{ marginLeft: 12 }}>
                      月销 {formatSales(product.sales_count)}
                    </Text>
                  )}
                </div>
                <Button
                  size="small"
                  icon={<ShoppingOutlined />}
                  href={product.source_url || '#'}
                  target="_blank"
                  style={{ marginTop: 8 }}
                >
                  去购买
                </Button>
              </div>
            )}
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
                  render: (p: number) => <span style={{ color: '#f5222d', fontWeight: 600 }}>¥{p}</span>,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
