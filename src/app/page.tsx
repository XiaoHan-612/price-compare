'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <div>
      {/* Hero */}
      <section className="hero">
        <h1>
          全网比价，<span>一键搞定</span>
        </h1>
        <p>支持京东、淘宝、拼多多，多店铺价格实时对比</p>

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
      </section>

      {/* Features */}
      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>实时比价</h3>
          <p>多平台价格同步对比，一眼找到最低价</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📈</div>
          <h3>历史价格</h3>
          <p>查看商品历史价格走势，避开虚高原价</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🏪</div>
          <h3>多店铺对比</h3>
          <p>官方旗舰店优先展示，横向比较各店铺</p>
        </div>
      </section>

      {/* Hot Searches */}
      <section className="hot-section">
        <h3>🔥 热门搜索</h3>
        <div className="hot-tags">
          {hotSearches.map((item) => (
            <a
              key={item}
              className="hot-tag"
              href={`/search?q=${encodeURIComponent(item)}`}
            >
              {item}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
