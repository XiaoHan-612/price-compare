'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Card, Tag, Space, Typography } from 'antd';
import { SearchOutlined, ThunderboltOutlined, HistoryOutlined, RiseOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const hotSearches = [
  'iPhone 15', 'MacBook Pro', '茅台', '戴森吹风机', 'AirPods',
  'iPad', 'Switch', '显卡', '机械键盘', '投影仪',
];

export default function HomePage() {
  const [keyword, setKeyword] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    if (keyword.trim()) {
      router.push(`/search?q=${encodeURIComponent(keyword.trim())}`);
    }
  };

  return (
    <div style={{ padding: '40px 0' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <Title level={1} style={{ marginBottom: 16 }}>
          全网比价，一键搞定
        </Title>
        <Paragraph style={{ fontSize: 18, color: '#666', marginBottom: 32 }}>
          支持京东、淘宝、天猫、拼多多等主流平台价格比较
        </Paragraph>

        <Input.Search
          size="large"
          placeholder="输入商品名称或粘贴商品链接..."
          enterButton={
            <span>
              <SearchOutlined /> 搜索比价
            </span>
          }
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={handleSearch}
          style={{ maxWidth: 600 }}
        />
      </div>

      {/* Features */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 48 }}>
        <Card hoverable>
          <div style={{ textAlign: 'center' }}>
            <ThunderboltOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 16 }} />
            <Title level={4}>实时比价</Title>
            <Paragraph type="secondary">多平台价格同步对比，找到最低价</Paragraph>
          </div>
        </Card>
        <Card hoverable>
          <div style={{ textAlign: 'center' }}>
            <HistoryOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 16 }} />
            <Title level={4}>历史价格</Title>
            <Paragraph type="secondary">查看商品历史价格走势，避免买贵</Paragraph>
          </div>
        </Card>
        <Card hoverable>
          <div style={{ textAlign: 'center' }}>
            <RiseOutlined style={{ fontSize: 32, color: '#faad14', marginBottom: 16 }} />
            <Title level={4}>价格趋势</Title>
            <Paragraph type="secondary">智能分析价格波动，把握最佳时机</Paragraph>
          </div>
        </Card>
      </div>

      {/* Hot Searches */}
      <Card title="热门搜索" style={{ marginBottom: 24 }}>
        <Space wrap>
          {hotSearches.map((item) => (
            <Tag
              key={item}
              color="blue"
              style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 14 }}
              onClick={() => router.push(`/search?q=${encodeURIComponent(item)}`)}
            >
              {item}
            </Tag>
          ))}
        </Space>
      </Card>

      {/* Platforms */}
      <Card title="支持平台">
        <Space size="large" wrap>
          {[
            { name: '京东', color: '#e4393c' },
            { name: '淘宝', color: '#ff5000' },
            { name: '天猫', color: '#ff0036' },
            { name: '拼多多', color: '#e02e24' },
            { name: '苏宁', color: '#f28b00' },
          ].map((p) => (
            <Tag key={p.name} color={p.color} style={{ padding: '6px 16px', fontSize: 14 }}>
              {p.name}
            </Tag>
          ))}
        </Space>
      </Card>
    </div>
  );
}
