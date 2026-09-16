-- =============================================================================
-- ROCO E-COMMERCE DATABASE SCHEMA & SAMPLE SEED DATA (POSTGRESQL)
-- =============================================================================

-- 1. DROP EXISTING TABLES IF RE-INITIALIZING
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- 2. PRODUCTS TABLE
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_stock ON products(stock_quantity);

-- 3. ORDERS TABLE
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'shipped', 'delivered', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- 4. ORDER ITEMS TABLE
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase NUMERIC(10, 2) NOT NULL
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- 5. REALISTIC SAMPLE SEED DATA
INSERT INTO products (title, description, price, stock_quantity, category) VALUES
('AirBreeze Linen Shirt', 'Ultra-breathable 100% organic linen shirt for warm summer days.', 48.00, 24, 'Apparel'),
('Boardwalk Chino Shorts', 'Comfortable stretch cotton shorts designed for warm climates and relaxed weekends.', 38.50, 18, 'Apparel'),
('Polaris UV Polarized Sunglasses', 'UV400 protection lightweight titanium frame sunglasses with glare reduction.', 45.00, 0, 'Accessories'),
('HydroFlow Insulated Water Bottle', 'Double-walled stainless steel bottle that keeps drinks icy cold for 24h.', 28.00, 42, 'Accessories'),
('Summer Waves Swim Trunks', 'Quick-drying recycled polyester swim shorts with mesh lining and drawcord.', 34.00, 15, 'Apparel'),
('Summit Trail Hiking Boots', 'Waterproof all-weather durable trail running and hiking boots with high-traction soles.', 129.99, 4, 'Footwear'),
('AeroSport Wireless Earbuds', 'Sweat-resistant Bluetooth 5.3 earbuds with active noise cancellation and 28h battery.', 59.99, 2, 'Electronics'),
('Nomad Canvas Daypack', 'Minimalist 20L weather-resistant canvas backpack for travel, gym, and daily commute.', 49.50, 12, 'Accessories'),
('CloudKnit Cotton T-Shirt', 'Pre-shrunk ring-spun soft heavyweight vintage white t-shirt.', 24.00, 0, 'Apparel'),
('Zenith Thermal Fleece Jacket', 'Warm heavyweight polar fleece jacket with zippered pockets for cold winter seasons.', 89.00, 8, 'Apparel');

-- SEED ORDERS & LINE ITEMS
INSERT INTO orders (id, customer_name, customer_email, total_amount, status, created_at) VALUES
(1001, 'Sophia Turner', 'sophia.turner@example.com', 86.50, 'pending', NOW() - INTERVAL '2 hours'),
(1002, 'Liam Martinez', 'liam.m@example.com', 129.99, 'pending', NOW() - INTERVAL '6 hours'),
(1003, 'Amina Khan', 'amina.k@example.com', 104.50, 'shipped', NOW() - INTERVAL '1 day'),
(1004, 'David Chen', 'david.chen@example.com', 48.00, 'delivered', NOW() - INTERVAL '3 days'),
(1005, 'Emma Wilson', 'emma.w@example.com', 59.99, 'cancelled', NOW() - INTERVAL '4 days');

INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES
(1001, 1, 1, 48.00),
(1001, 2, 1, 38.50),
(1002, 6, 1, 129.99),
(1003, 7, 1, 59.99),
(1003, 3, 1, 44.51),
(1004, 1, 1, 48.00),
(1005, 7, 1, 59.99);

SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));

-- =============================================================================
-- 6. RAG KNOWLEDGE BASE TABLE (PGVECTOR EXTENSION)
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id VARCHAR(100) PRIMARY KEY,
    doc_id VARCHAR(100) NOT NULL,
    doc_title VARCHAR(255) NOT NULL,
    section VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    token_count INTEGER NOT NULL DEFAULT 0,
    embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_doc_id ON knowledge_chunks(doc_id);
-- HNSW / IVFFLAT vector index for sub-millisecond approximate nearest neighbor (ANN) search
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding 
ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);
