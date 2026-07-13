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
      </head>
      <body>
        <ConfigProvider
          locale={zhCN}
          theme={{
            token: {
              colorPrimary: '#1890ff',
              borderRadius: 6,
            },
          }}
        >
          <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            <header
              style={{
                background: '#fff',
                borderBottom: '1px solid #e8e8e8',
                padding: '12px 16px',
                position: 'sticky',
                top: 0,
                zIndex: 100,
              }}
            >
              <div
                style={{
                  maxWidth: 1200,
                  margin: '0 auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <a
                  href="/"
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#1890ff',
                    textDecoration: 'none',
                  }}
                >
                  🐱 比价猫
                </a>
                <span style={{ color: '#999', fontSize: 12 }}>
                  全网比价 · 历史最低
                </span>
              </div>
            </header>
            <main
              style={{
                maxWidth: 1200,
                margin: '0 auto',
                padding: '16px',
              }}
            >
              {children}
            </main>
            <footer
              style={{
                textAlign: 'center',
                padding: '16px',
                color: '#999',
                borderTop: '1px solid #e8e8e8',
                background: '#fff',
                fontSize: 12,
              }}
            >
              <p style={{ margin: '4px 0' }}>比价猫 - 数据来源于公开渠道，仅供参考</p>
              <p style={{ margin: '4px 0' }}>支持平台：京东 · 淘宝 · 拼多多</p>
              <p style={{ margin: '4px 0' }}>© 2024 PriceCompare</p>
            </footer>
          </div>
        </ConfigProvider>
      </body>
    </html>
  );
}
