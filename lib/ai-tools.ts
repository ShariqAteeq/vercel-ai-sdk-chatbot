import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { dbQuery, ProductRecord, OrderRecord } from './db';
import { searchKnowledgeBase } from './rag/retriever';

// -----------------------------------------------------------------------------
// 1. OPENAI TOOL SCHEMAS (Strict JSON Schema)
// -----------------------------------------------------------------------------
export const adminAssistantTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_inventory_health',
      description:
        'Retrieves live warehouse inventory health, including out-of-stock items, low-stock items (stock <= threshold), and total inventory valuation. Call this whenever the admin asks about out-of-stock items, stock levels, or inventory health.',
      parameters: {
        type: 'object',
        properties: {
          lowStockThreshold: {
            type: 'number',
            description: 'The quantity threshold below which stock is considered low. Defaults to 5.',
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_orders_by_status',
      description:
        'Fetches real-time customer orders filtered by status, including customer name, total amount, order date, and purchased line items. Call this whenever the user asks about pending, shipped, delivered, or recent orders.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['all', 'pending', 'shipped', 'delivered', 'cancelled'],
            description: 'The status of orders to retrieve.',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of orders to return (default 10).',
          },
        },
        required: ['status'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'recommend_products',
      description:
        'Retrieves products matching specific constraints such as maximum budget, keyword, category, and availability (in-stock). Use this to curate or recommend items for summer, winter, budget ranges, or specific customer requests.',
      parameters: {
        type: 'object',
        properties: {
          minPrice: {
            type: 'number',
            description: 'Minimum unit price for the product (e.g. 35.00) for price range queries.',
          },
          maxPrice: {
            type: 'number',
            description: 'Maximum unit price for the product (e.g. 40.00 or 50.00).',
          },
          category: {
            type: 'string',
            description: 'Specific category filter, e.g. Apparel, Accessories, Footwear, Electronics.',
          },
          searchQuery: {
            type: 'string',
            description: 'Keyword to search inside product title and description (e.g. "summer", "linen", "waterproof").',
          },
          inStockOnly: {
            type: 'boolean',
            description: 'Whether to restrict recommendations strictly to products with stock_quantity > 0. Defaults to true.',
          },
          limit: {
            type: 'number',
            description: 'Number of recommendations to return (default 3).',
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_store_metrics',
      description: 'Calculates high-level store sales KPIs: total gross revenue, order volume, and order status breakdown.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_knowledge_base',
      description:
        'Searches official store policy and documentation (shipping, delivery rates, returns, refunds, warranty, product care, customer support FAQs) using semantic vector retrieval. ALWAYS call this tool when answering policy, shipping, return, warranty, product care, or store FAQ questions.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The natural language query or support question to search for.',
          },
          topK: {
            type: 'number',
            description: 'Number of relevant knowledge chunks to retrieve (default 3).',
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
    },
  },
];

// -----------------------------------------------------------------------------
// 2. LIVE DATABASE QUERY FUNCTIONS
// -----------------------------------------------------------------------------

export async function getInventoryHealth(lowStockThreshold = 5) {
  const outOfStockRes = await dbQuery<ProductRecord>(
    'SELECT id, title, category, price, stock_quantity FROM products WHERE stock_quantity = 0 ORDER BY title ASC;'
  );

  const lowStockRes = await dbQuery<ProductRecord>(
    'SELECT id, title, category, price, stock_quantity FROM products WHERE stock_quantity > 0 AND stock_quantity <= $1 ORDER BY stock_quantity ASC;',
    [lowStockThreshold]
  );

  const summaryRes = await dbQuery<{
    total_products: number;
    total_units_in_stock: number;
    total_inventory_valuation: number;
  }>(
    'SELECT COUNT(*) AS total_products, COALESCE(SUM(stock_quantity), 0) AS total_units_in_stock, COALESCE(SUM(price * stock_quantity), 0) AS total_inventory_valuation FROM products;'
  );

  return {
    summary: {
      totalProductsCount: Number(summaryRes.rows[0]?.total_products || 0),
      totalUnitsInStock: Number(summaryRes.rows[0]?.total_units_in_stock || 0),
      totalInventoryValuation: Number(summaryRes.rows[0]?.total_inventory_valuation || 0),
    },
    outOfStockCount: outOfStockRes.rowCount,
    outOfStockItems: outOfStockRes.rows,
    lowStockThreshold,
    lowStockCount: lowStockRes.rowCount,
    lowStockItems: lowStockRes.rows,
  };
}

export async function getOrdersByStatus(status: string, limit = 10) {
  const isAll = status.toLowerCase() === 'all';
  const query = isAll
    ? 'SELECT * FROM orders ORDER BY created_at DESC LIMIT $1;'
    : 'SELECT * FROM orders WHERE o.status = $1 ORDER BY created_at DESC LIMIT $2;';

  const params = isAll ? [limit] : [status.toLowerCase(), limit];
  const result = await dbQuery<OrderRecord>(query, params);

  return {
    queriedStatus: status,
    totalReturned: result.rowCount,
    orders: result.rows,
  };
}

export async function recommendProducts(args: {
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  searchQuery?: string;
  inStockOnly?: boolean;
  limit?: number;
}) {
  const { minPrice, maxPrice, category, searchQuery, inStockOnly = true, limit = 3 } = args;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (inStockOnly) {
    conditions.push('stock_quantity > 0');
  }

  if (typeof minPrice === 'number') {
    conditions.push(`price >= $${paramIndex}`);
    params.push(minPrice);
    paramIndex += 1;
  }

  if (typeof maxPrice === 'number') {
    conditions.push(`price <= $${paramIndex}`);
    params.push(maxPrice);
    paramIndex += 1;
  }

  if (category && category.trim() !== '') {
    conditions.push(`LOWER(category) = LOWER($${paramIndex})`);
    params.push(category.trim());
    paramIndex += 1;
  }

  if (searchQuery && searchQuery.trim() !== '') {
    conditions.push(`(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
    params.push(`%${searchQuery.trim()}%`);
    paramIndex += 1;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `SELECT id, title, description, price, stock_quantity, category FROM products ${whereClause} ORDER BY stock_quantity DESC LIMIT $${paramIndex};`;
  params.push(limit);

  const result = await dbQuery<ProductRecord>(query, params);

  return {
    criteriaApplied: { minPrice, maxPrice, category, searchQuery, inStockOnly, limit },
    matchCount: result.rowCount,
    products: result.rows,
  };
}

export async function getStoreMetrics() {
  const query = `
    SELECT 
      COUNT(*) AS total_orders,
      COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0) AS gross_revenue,
      COUNT(*) FILTER (WHERE status = 'pending') AS pending_orders_count,
      COUNT(*) FILTER (WHERE status = 'shipped') AS shipped_orders_count,
      COUNT(*) FILTER (WHERE status = 'delivered') AS delivered_orders_count,
      COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_orders_count
    FROM orders;
  `;

  const result = await dbQuery<{
    total_orders: number;
    gross_revenue: number;
    pending_orders_count: number;
    shipped_orders_count: number;
    delivered_orders_count: number;
    cancelled_orders_count: number;
  }>(query);

  const row = result.rows[0];

  return {
    totalOrders: Number(row?.total_orders || 0),
    grossRevenue: Number(row?.gross_revenue || 0),
    statusBreakdown: {
      pending: Number(row?.pending_orders_count || 0),
      shipped: Number(row?.shipped_orders_count || 0),
      delivered: Number(row?.delivered_orders_count || 0),
      cancelled: Number(row?.cancelled_orders_count || 0),
    },
  };
}

// -----------------------------------------------------------------------------
// 3. CENTRAL TOOL EXECUTION DISPATCHER
// -----------------------------------------------------------------------------
export async function executeDatabaseTool(toolName: string, argsJson: string) {
  let parsedArgs: Record<string, unknown> = {};
  try {
    parsedArgs = argsJson ? JSON.parse(argsJson) : {};
  } catch {
    return { error: 'Invalid JSON provided for tool arguments.' };
  }

  try {
    switch (toolName) {
      case 'get_inventory_health': {
        const threshold = typeof parsedArgs.lowStockThreshold === 'number' ? parsedArgs.lowStockThreshold : 5;
        return await getInventoryHealth(threshold);
      }
      case 'get_orders_by_status': {
        const status = typeof parsedArgs.status === 'string' ? parsedArgs.status : 'pending';
        const limit = typeof parsedArgs.limit === 'number' ? parsedArgs.limit : 10;
        return await getOrdersByStatus(status, limit);
      }
      case 'recommend_products': {
        return await recommendProducts({
          minPrice: typeof parsedArgs.minPrice === 'number' ? parsedArgs.minPrice : undefined,
          maxPrice: typeof parsedArgs.maxPrice === 'number' ? parsedArgs.maxPrice : undefined,
          category: typeof parsedArgs.category === 'string' ? parsedArgs.category : undefined,
          searchQuery: typeof parsedArgs.searchQuery === 'string' ? parsedArgs.searchQuery : undefined,
          inStockOnly: typeof parsedArgs.inStockOnly === 'boolean' ? parsedArgs.inStockOnly : true,
          limit: typeof parsedArgs.limit === 'number' ? parsedArgs.limit : 3,
        });
      }
      case 'get_store_metrics': {
        return await getStoreMetrics();
      }
      case 'search_knowledge_base': {
        const query = typeof parsedArgs.query === 'string' ? parsedArgs.query : '';
        const topK = typeof parsedArgs.topK === 'number' ? parsedArgs.topK : 3;
        return await searchKnowledgeBase(query, { topK });
      }
      default:
        return { error: `Tool ${toolName} is not recognized by the database handler.` };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database query failed';
    return { error: `Execution error in ${toolName}: ${message}` };
  }
}
