'use client';

import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>比价猫 - 全网比价 · 历史最低</title>
        <meta name="description" content="支持京东、淘宝、拼多多多平台比价，查看历史价格走势，找到全网最低价" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ConfigProvider
          locale={zhCN}
          theme={{
            token: {
              colorPrimary: '#2563eb',
              borderRadius: 12,
              fontFamily: "'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif",
            },
          }}
        >
          <div className="app-container">
            <header className="app-header">
              <div className="header-inner">
                <a href="/" className="logo">
                  <span className="logo-icon">🐱</span>
                  <span className="logo-text">比价猫</span>
                </a>
                <div className="header-meta">
                  <span className="platform-badges">
                    <span className="platform-tag jd">京东</span>
                    <span className="platform-tag taobao">淘宝</span>
                    <span className="platform-tag pdd">拼多多</span>
                  </span>
                </div>
              </div>
            </header>
            <main className="app-main">
              {children}
            </main>
            <footer className="app-footer">
              <p>比价猫 — 数据来源于公开渠道，仅供参考</p>
              <p className="footer-sub">© 2024 PriceCompare · 全网比价 · 历史最低</p>
            </footer>
          </div>
        </ConfigProvider>
      </body>
    </html>
  );
}
