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
      <body>
        <ConfigProvider locale={zhCN}>
          <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            <header style={{ 
              background: '#fff', 
              borderBottom: '1px solid #e8e8e8',
              padding: '16px 24px',
              position: 'sticky',
              top: 0,
              zIndex: 100,
            }}>
              <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <a href="/" style={{ fontSize: 24, fontWeight: 700, color: '#1890ff', textDecoration: 'none' }}>
                  比价猫
                </a>
                <span style={{ color: '#999', fontSize: 14 }}>
                  全网比价 · 历史最低
                </span>
              </div>
            </header>
            <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
              {children}
            </main>
            <footer style={{ 
              textAlign: 'center', 
              padding: '24px', 
              color: '#999',
              borderTop: '1px solid #e8e8e8',
              background: '#fff',
            }}>
              <p>比价猫 - 数据来源于公开渠道，仅供参考</p>
              <p style={{ fontSize: 12 }}>© 2024 PriceCompare</p>
            </footer>
          </div>
        </ConfigProvider>
      </body>
    </html>
  );
}
