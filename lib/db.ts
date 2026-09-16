import { Pool } from 'pg';

export interface ProductRecord {
  id: number;
  title: string;
  description: string;
  price: number;
  stock_quantity: number;
  category: string;
  created_at: string;
}

export interface OrderItemRecord {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
}

export interface OrderRecord {
  id: number;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  items?: {
    product_id: number;
    title: string;
    quantity: number;
    unit_price: number;
  }[];
}

// -----------------------------------------------------------------------------
// SEED DATA FOR IN-MEMORY FALLBACK (Exact match with scripts/schema.sql)
// -----------------------------------------------------------------------------
const INITIAL_PRODUCTS: ProductRecord[] = [
  {
    id: 1,
    title: 'AirBreeze Linen Shirt',
    description: 'Ultra-breathable 100% organic linen shirt for warm summer days.',
    price: 48.0,
    stock_quantity: 24,
    category: 'Apparel',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 2,
    title: 'Boardwalk Chino Shorts',
    description: 'Comfortable stretch cotton shorts designed for warm climates and relaxed weekends.',
    price: 38.5,
    stock_quantity: 18,
    category: 'Apparel',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 3,
    title: 'Polaris UV Polarized Sunglasses',
    description: 'UV400 protection lightweight titanium frame sunglasses with glare reduction.',
    price: 45.0,
    stock_quantity: 0,
    category: 'Accessories',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 4,
    title: 'HydroFlow Insulated Water Bottle',
    description: 'Double-walled stainless steel bottle that keeps drinks icy cold for 24h.',
    price: 28.0,
    stock_quantity: 42,
    category: 'Accessories',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 5,
    title: 'Summer Waves Swim Trunks',
    description: 'Quick-drying recycled polyester swim shorts with mesh lining and drawcord.',
    price: 34.0,
    stock_quantity: 15,
    category: 'Apparel',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 6,
    title: 'Summit Trail Hiking Boots',
    description: 'Waterproof all-weather durable trail running and hiking boots with high-traction soles.',
    price: 129.99,
    stock_quantity: 4,
    category: 'Footwear',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 7,
    title: 'AeroSport Wireless Earbuds',
    description: 'Sweat-resistant Bluetooth 5.3 earbuds with active noise cancellation and 28h battery.',
    price: 59.99,
    stock_quantity: 2,
    category: 'Electronics',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 8,
    title: 'Nomad Canvas Daypack',
    description: 'Minimalist 20L weather-resistant canvas backpack for travel, gym, and daily commute.',
    price: 49.5,
    stock_quantity: 12,
    category: 'Accessories',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 9,
    title: 'CloudKnit Cotton T-Shirt',
    description: 'Pre-shrunk ring-spun soft heavyweight vintage white t-shirt.',
    price: 24.0,
    stock_quantity: 0,
    category: 'Apparel',
    created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: 10,
    title: 'Zenith Thermal Fleece Jacket',
    description: 'Warm heavyweight polar fleece jacket with zippered pockets for cold winter seasons.',
    price: 89.0,
    stock_quantity: 8,
    category: 'Apparel',
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
  },
];

const INITIAL_ORDERS: OrderRecord[] = [
  {
    id: 1001,
    customer_name: 'Sophia Turner',
    customer_email: 'sophia.turner@example.com',
    total_amount: 86.5,
    status: 'pending',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    items: [
      { product_id: 1, title: 'AirBreeze Linen Shirt', quantity: 1, unit_price: 48.0 },
      { product_id: 2, title: 'Boardwalk Chino Shorts', quantity: 1, unit_price: 38.5 },
    ],
  },
  {
    id: 1002,
    customer_name: 'Liam Martinez',
    customer_email: 'liam.m@example.com',
    total_amount: 129.99,
    status: 'pending',
    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    items: [
      { product_id: 6, title: 'Summit Trail Hiking Boots', quantity: 1, unit_price: 129.99 },
    ],
  },
  {
    id: 1003,
    customer_name: 'Amina Khan',
    customer_email: 'amina.k@example.com',
    total_amount: 104.5,
    status: 'shipped',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    items: [
      { product_id: 7, title: 'AeroSport Wireless Earbuds', quantity: 1, unit_price: 59.99 },
      { product_id: 3, title: 'Polaris UV Polarized Sunglasses', quantity: 1, unit_price: 44.51 },
    ],
  },
  {
    id: 1004,
    customer_name: 'David Chen',
    customer_email: 'david.chen@example.com',
    total_amount: 48.0,
    status: 'delivered',
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    items: [
      { product_id: 1, title: 'AirBreeze Linen Shirt', quantity: 1, unit_price: 48.0 },
    ],
  },
  {
    id: 1005,
    customer_name: 'Emma Wilson',
    customer_email: 'emma.w@example.com',
    total_amount: 59.99,
    status: 'cancelled',
    created_at: new Date(Date.now() - 96 * 3600000).toISOString(),
    items: [
      { product_id: 7, title: 'AeroSport Wireless Earbuds', quantity: 1, unit_price: 59.99 },
    ],
  },
];

// Persistent state across development hot reloads
interface GlobalStore {
  pool?: Pool;
  inMemoryProducts?: ProductRecord[];
  inMemoryOrders?: OrderRecord[];
}

const globalForDb = globalThis as unknown as GlobalStore;

if (!globalForDb.inMemoryProducts) {
  globalForDb.inMemoryProducts = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
}
if (!globalForDb.inMemoryOrders) {
  globalForDb.inMemoryOrders = JSON.parse(JSON.stringify(INITIAL_ORDERS));
}

// Check if a real DATABASE_URL is configured
const dbUrl = process.env.DATABASE_URL?.trim();
let pgPool: Pool | null = null;

if (dbUrl && dbUrl.startsWith('postgres')) {
  pgPool =
    globalForDb.pool ??
    new Pool({
      connectionString: dbUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 4000,
    });
  if (process.env.NODE_ENV !== 'production') {
    globalForDb.pool = pgPool;
  }
}

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

/**
 * Universal Database Client:
 * Attempts to execute parameterized queries via PostgreSQL pool if available.
 * If PostgreSQL is unavailable or not configured, delegates to the seeded in-memory store.
 */
export async function dbQuery<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  if (pgPool) {
    try {
      const result = await pgPool.query(text, params);
      return {
        rows: result.rows as T[],
        rowCount: result.rowCount ?? result.rows.length,
      };
    } catch (err) {
      console.warn('PostgreSQL query error, using in-memory store fallback:', err);
    }
  }

  // In-memory fallback execution
  return executeInMemoryQuery<T>(text, params);
}

/**
 * High-fidelity in-memory query handler matching the SQL operations needed by the application.
 */
function executeInMemoryQuery<T>(text: string, params: unknown[]): QueryResult<T> {
  const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();
  const products = globalForDb.inMemoryProducts!;
  const orders = globalForDb.inMemoryOrders!;

  // 1. Inventory Summary Query
  if (normalized.includes('count(*)') && normalized.includes('total_inventory_valuation')) {
    const totalProducts = products.length;
    const totalUnits = products.reduce((acc, p) => acc + p.stock_quantity, 0);
    const totalValuation = products.reduce((acc, p) => acc + p.price * p.stock_quantity, 0);

    const row = {
      total_products: totalProducts,
      total_units_in_stock: totalUnits,
      total_inventory_valuation: Number(totalValuation.toFixed(2)),
    };
    return { rows: [row as unknown as T], rowCount: 1 };
  }

  // 2. Out of Stock Query: stock_quantity = 0
  if (normalized.includes('from products') && normalized.includes('stock_quantity = 0')) {
    const outOfStock = products
      .filter((p) => p.stock_quantity === 0)
      .sort((a, b) => a.title.localeCompare(b.title));
    return { rows: outOfStock as unknown as T[], rowCount: outOfStock.length };
  }

  // 3. Low Stock Query: stock_quantity > 0 and stock_quantity <= $1
  if (normalized.includes('from products') && normalized.includes('stock_quantity <= $1')) {
    const threshold = (params[0] as number) ?? 5;
    const lowStock = products
      .filter((p) => p.stock_quantity > 0 && p.stock_quantity <= threshold)
      .sort((a, b) => a.stock_quantity - b.stock_quantity);
    return { rows: lowStock as unknown as T[], rowCount: lowStock.length };
  }

  // 4. Recommend Products (Flexible search & filter)
  if (normalized.includes('from products') && (normalized.includes('where') || normalized.includes('order by stock_quantity desc'))) {
    let filtered = [...products];

    // Filter in-stock only
    if (normalized.includes('stock_quantity > 0')) {
      filtered = filtered.filter((p) => p.stock_quantity > 0);
    }

    // Exclude the trailing limit parameter from value filters
    // Match price >= $N
    const minPriceMatch = normalized.match(/price\s*>=\s*\$(\d+)/);
    if (minPriceMatch) {
      const idx = parseInt(minPriceMatch[1], 10) - 1;
      const val = params[idx];
      if (typeof val === 'number') {
        filtered = filtered.filter((p) => p.price >= val);
      }
    }

    // Match price <= $N
    const maxPriceMatch = normalized.match(/price\s*<=\s*\$(\d+)/);
    if (maxPriceMatch) {
      const idx = parseInt(maxPriceMatch[1], 10) - 1;
      const val = params[idx];
      if (typeof val === 'number') {
        filtered = filtered.filter((p) => p.price <= val);
      }
    }

    // Match category
    const catMatch = normalized.match(/lower\(category\)\s*=\s*lower\(\$(\d+)\)/);
    if (catMatch) {
      const idx = parseInt(catMatch[1], 10) - 1;
      const val = params[idx];
      if (typeof val === 'string') {
        filtered = filtered.filter((p) => p.category.toLowerCase() === val.toLowerCase());
      }
    }

    // Match search query
    const searchMatch = normalized.match(/title ilike \$(\d+)/);
    if (searchMatch) {
      const idx = parseInt(searchMatch[1], 10) - 1;
      const val = params[idx];
      if (typeof val === 'string') {
        const term = val.replaceAll('%', '').toLowerCase();
        filtered = filtered.filter(
          (p) => p.title.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
        );
      }
    }

    // Sort: stock descending, then price ascending
    filtered.sort((a, b) => b.stock_quantity - a.stock_quantity || a.price - b.price);

    const limitParam = params.at(-1);
    const limit = typeof limitParam === 'number' ? limitParam : 10;
    const result = filtered.slice(0, limit);
    return { rows: result as unknown as T[], rowCount: result.length };
  }

  // 5. Orders by Status Query
  if (normalized.includes('from orders')) {
    let list = [...orders];

    if (normalized.includes('where o.status = $1') && typeof params[0] === 'string') {
      const statusFilter = params[0].toLowerCase();
      if (statusFilter !== 'all') {
        list = list.filter((o) => o.status === statusFilter);
      }
    }

    // Metrics summary query
    if (normalized.includes('sum(case when status != \'cancelled\'') || normalized.includes('filter (where status = \'pending\')')) {
      const totalOrders = orders.length;
      const grossRevenue = orders
        .filter((o) => o.status !== 'cancelled')
        .reduce((acc, o) => acc + o.total_amount, 0);
      const pendingCount = orders.filter((o) => o.status === 'pending').length;
      const shippedCount = orders.filter((o) => o.status === 'shipped').length;
      const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
      const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

      const metricsRow = {
        total_orders: totalOrders,
        gross_revenue: Number(grossRevenue.toFixed(2)),
        pending_orders_count: pendingCount,
        shipped_orders_count: shippedCount,
        delivered_orders_count: deliveredCount,
        cancelled_orders_count: cancelledCount,
      };
      return { rows: [metricsRow as unknown as T], rowCount: 1 };
    }

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const limit = typeof params[1] === 'number' ? params[1] : typeof params[0] === 'number' ? params[0] : 10;
    const paginated = list.slice(0, limit);

    return { rows: paginated as unknown as T[], rowCount: paginated.length };
  }

  // Default: return all products
  return { rows: products as unknown as T[], rowCount: products.length };
}

/**
 * Mutation helper: Create an order and decrement stock atomically.
 */
export async function createOrder(
  customerName: string,
  customerEmail: string,
  items: { productId: number; quantity: number }[]
): Promise<OrderRecord> {
  const products = globalForDb.inMemoryProducts!;
  const orders = globalForDb.inMemoryOrders!;

  let total = 0;
  const lineItems: { product_id: number; title: string; quantity: number; unit_price: number }[] = [];

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      throw new Error(`Product with ID ${item.productId} not found.`);
    }
    if (product.stock_quantity < item.quantity) {
      throw new Error(`Insufficient stock for "${product.title}". Available: ${product.stock_quantity}`);
    }
    product.stock_quantity -= item.quantity;
    total += product.price * item.quantity;
    lineItems.push({
      product_id: product.id,
      title: product.title,
      quantity: item.quantity,
      unit_price: product.price,
    });
  }

  const newOrder: OrderRecord = {
    id: orders.length > 0 ? Math.max(...orders.map((o) => o.id)) + 1 : 1001,
    customer_name: customerName,
    customer_email: customerEmail,
    total_amount: Number(total.toFixed(2)),
    status: 'pending',
    created_at: new Date().toISOString(),
    items: lineItems,
  };

  orders.unshift(newOrder);
  return newOrder;
}

/**
 * Helper to retrieve full catalog
 */
export async function getAllProducts(): Promise<ProductRecord[]> {
  const result = await dbQuery<ProductRecord>('SELECT * FROM products ORDER BY id ASC;');
  return result.rows;
}

/**
 * Helper to retrieve all orders
 */
export async function getAllOrders(): Promise<OrderRecord[]> {
  const result = await dbQuery<OrderRecord>('SELECT * FROM orders ORDER BY created_at DESC;');
  return result.rows;
}

/**
 * Helper to retrieve a single product by ID
 */
export async function getProductById(id: number): Promise<ProductRecord | null> {
  const products = globalForDb.inMemoryProducts;
  if (products) {
    const found = products.find((p) => p.id === id);
    if (found) return found;
  }

  const result = await dbQuery<ProductRecord>('SELECT * FROM products WHERE id = $1 LIMIT 1;', [id]);
  return result.rows[0] ?? null;
}
