'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  Check,
  AlertTriangle,
  Tag,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ProductRecord, OrderRecord } from '@/lib/db';

interface EcommerceCatalogProps {
  onOpenAssistant: () => void;
  refreshTrigger: number;
}

export function EcommerceCatalog({ onOpenAssistant, refreshTrigger }: EcommerceCatalogProps) {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isOrdering, setIsOrdering] = useState<number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchCatalogAndOrders = async () => {
    try {
      const [prodRes, orderRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders'),
      ]);
      const prodData = await prodRes.json();
      const orderData = await orderRes.json();
      if (prodData.products) setProducts(prodData.products);
      if (orderData.orders) setOrders(orderData.orders);
    } catch (err) {
      console.error('Failed to load catalog data:', err);
    }
  };

  useEffect(() => {
    fetchCatalogAndOrders();
  }, [refreshTrigger]);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const handlePlaceOrder = async (product: ProductRecord) => {
    if (product.stock_quantity <= 0) return;
    setIsOrdering(product.id);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Demo Customer',
          customerEmail: 'customer@example.com',
          items: [{ productId: product.id, quantity: 1 }],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');

      setNotification(`Ordered 1x "${product.title}" successfully! Stock updated.`);
      setTimeout(() => setNotification(null), 4000);
      await fetchCatalogAndOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error placing order';
      alert(`Order Failed: ${msg}`);
    } finally {
      setIsOrdering(null);
    }
  };

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((acc, o) => acc + Number(o.total_amount), 0);
  const outOfStockCount = products.filter((p) => p.stock_quantity === 0).length;
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* STORE OVERVIEW METRICS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <div className="rounded-2xl border border-[#dfe3dd] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#718079]">
            <span>TOTAL REVENUE</span>
            <Tag className="h-4 w-4 text-[#173c32]" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#1f312b]">
            ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-[#287245]">Live from Orders</span>
        </div>

        <div className="rounded-2xl border border-[#dfe3dd] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#718079]">
            <span>PENDING ORDERS</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#1f312b]">{pendingOrdersCount}</p>
          <span className="text-[11px] text-amber-600">Requires Fulfillment</span>
        </div>

        <div className="rounded-2xl border border-[#dfe3dd] bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#718079]">
            <span>OUT OF STOCK</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[#1f312b]">{outOfStockCount}</p>
          <span className="text-[11px] text-rose-600">Needs Replenishment</span>
        </div>

        <div className="rounded-2xl border border-[#dfe3dd] bg-[#173c32] p-4 text-white shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-[#a8c3ba]">
            <span>AI ASSISTANT</span>
            <Sparkles className="h-4 w-4 text-[#dfff62]" />
          </div>
          <p className="mt-2 text-base font-bold text-white">Roco Connected</p>
          <button
            onClick={onOpenAssistant}
            className="mt-1 text-xs font-semibold text-[#dfff62] hover:underline flex items-center gap-1"
          >
            Launch Copilot Drawer →
          </button>
        </div>
      </div>

      {/* NOTIFICATION BANNER */}
      {notification && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB NAVIGATION & CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dfe3dd] pb-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'catalog'
                ? 'bg-[#173c32] text-white shadow-xs'
                : 'bg-white text-[#52635c] border border-[#dfe3dd] hover:bg-[#f3f5f2]'
            }`}
          >
            <Package className="h-4 w-4" />
            Product Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === 'orders'
                ? 'bg-[#173c32] text-white shadow-xs'
                : 'bg-white text-[#52635c] border border-[#dfe3dd] hover:bg-[#f3f5f2]'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            Orders Ledger ({orders.length})
          </button>
        </div>

        {activeTab === 'catalog' && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-[#718079] mr-1">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-[#173c32] text-white'
                    : 'bg-white text-[#52635c] border border-[#dfe3dd] hover:bg-[#f3f5f2]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* VIEW 1: CATALOG GRID */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const isOut = product.stock_quantity === 0;
            const isLow = product.stock_quantity > 0 && product.stock_quantity <= 5;

            return (
              <div
                key={product.id}
                id={`product-${product.id}`}
                className="scroll-mt-24 flex flex-col justify-between rounded-2xl border border-[#dfe3dd] bg-white p-5 shadow-xs hover:border-[#b8c5bc] hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-md bg-[#f1f4f0] px-2 py-0.5 text-[11px] font-semibold text-[#52635c]">
                      {product.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isOut
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isLow
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isOut ? 'bg-rose-600' : isLow ? 'bg-amber-600' : 'bg-emerald-600'
                        }`}
                      />
                      {isOut ? 'Out of Stock' : isLow ? `${product.stock_quantity} left` : 'In Stock'}
                    </span>
                  </div>

                  <Link href={`/products/${product.id}`} className="group block">
                    <h3 className="mt-3 text-base font-bold text-[#1f312b] line-clamp-1 group-hover:text-[#287245] transition">
                      {product.title}
                    </h3>
                  </Link>
                  <p className="mt-1 text-xs text-[#718079] leading-relaxed line-clamp-2">
                    {product.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#f0f2ee] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#8a9690] block">Price</span>
                    <span className="text-lg font-bold text-[#1f312b]">${product.price.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={() => handlePlaceOrder(product)}
                    disabled={isOut || isOrdering === product.id}
                    className="flex items-center gap-1.5 rounded-xl bg-[#173c32] px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#245244] disabled:cursor-not-allowed disabled:bg-[#d5ded7] transition"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>{isOrdering === product.id ? 'Ordering...' : isOut ? 'Unavailable' : 'Buy 1x'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: ORDERS LEDGER TAB */}
      {activeTab === 'orders' && (
        <div className="overflow-hidden rounded-2xl border border-[#dfe3dd] bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#f8f9f6] text-[#6d7e77] border-b border-[#dfe3dd] font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Order ID</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Items Purchased</th>
                  <th className="px-5 py-3.5">Total Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0ec] text-[#2c3d35]">
                {orders.map((order) => {
                  const isPending = order.status === 'pending';
                  const isDelivered = order.status === 'delivered';
                  const isShipped = order.status === 'shipped';
                  const isCancelled = order.status === 'cancelled';

                  return (
                    <tr key={order.id} className="hover:bg-[#fbfcfb] transition">
                      <td className="px-5 py-4 font-mono font-bold text-[#173c32]">
                        #{order.id}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{order.customer_name}</p>
                        <p className="text-xs text-[#718079]">{order.customer_email}</p>
                      </td>
                      <td className="px-5 py-4">
                        {order.items && order.items.length > 0 ? (
                          <div className="space-y-1">
                            {order.items.map((item, i) => (
                              <p key={i} className="text-xs text-[#52635c]">
                                <span className="font-semibold">{item.quantity}x</span> {item.title} ($
                                {item.unit_price})
                              </p>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-[#8a9690]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-bold text-[#1f312b]">
                        ${Number(order.total_amount).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            isPending
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : isShipped
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : isDelivered
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isPending && <Clock className="h-3 w-3" />}
                          {isShipped && <Truck className="h-3 w-3" />}
                          {isDelivered && <Check className="h-3 w-3" />}
                          {isCancelled && <XCircle className="h-3 w-3" />}
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-[#718079]">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
