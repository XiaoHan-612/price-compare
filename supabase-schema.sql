-- 比价猫数据库初始化脚本
-- 在 Supabase SQL Editor 中执行

-- 1. 商品表
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    image_url TEXT,
    category TEXT,
    brand TEXT,
    normalized_name TEXT,
    source_platform TEXT NOT NULL,
    source_id TEXT NOT NULL,
    source_url TEXT,
    shop_name TEXT,
    shop_url TEXT,
    is_official BOOLEAN DEFAULT FALSE,
    sales_count INTEGER DEFAULT 0,
    current_price DECIMAL(10,2),
    original_price DECIMAL(10,2),
    coupon_price DECIMAL(10,2),
    lowest_price DECIMAL(10,2),
    highest_price DECIMAL(10,2),
    price_update_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(source_platform, source_id)
);

-- 2. 价格历史表
CREATE TABLE IF NOT EXISTS price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2),
    coupon_price DECIMAL(10,2),
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id, recorded_at DESC);

-- 3. 搜索缓存表
CREATE TABLE IF NOT EXISTS search_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL UNIQUE,
    results JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '1 hour'
);

CREATE INDEX IF NOT EXISTS idx_search_cache_query ON search_cache(query, expires_at);

-- 4. 启用 RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_cache ENABLE ROW LEVEL SECURITY;

-- 5. 创建访问策略
CREATE POLICY "Allow public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public read price_history" ON price_history FOR SELECT USING (true);
CREATE POLICY "Allow public read search_cache" ON search_cache FOR SELECT USING (true);
CREATE POLICY "Allow service role all products" ON products FOR ALL USING (true);
CREATE POLICY "Allow service role all price_history" ON price_history FOR ALL USING (true);
CREATE POLICY "Allow service role all search_cache" ON search_cache FOR ALL USING (true);

-- 6. 全文搜索索引
CREATE INDEX IF NOT EXISTS idx_products_title ON products USING GIN(to_tsvector('simple', title));
