'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  Package,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ProductRecord } from '@/lib/db';
import { AdminAssistantSidebar } from '@/components/admin-assistant-sidebar';

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const productId = parseInt(resolvedParams.id, 10);

  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      if (res.ok && data.product) {
        setProduct(data.product);
      }
    } catch (err) {
      console.error('Failed to load product:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId, refreshTrigger]);

  const handleOrder = async () => {
    if (!product || product.stock_quantity < quantity) return;
    setIsOrdering(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Demo Customer',
          customerEmail: 'customer@example.com',
          items: [{ productId: product.id, quantity }],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');

      setOrderSuccess(`Ordered ${quantity}x "${product.title}"! Live stock decremented.`);
      setQuantity(1);
      setTimeout(() => setOrderSuccess(null), 5000);
      await fetchProduct();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error placing order';
      alert(`Order Failed: ${msg}`);
    } finally {
      setIsOrdering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8f6]">
        <div className="flex items-center gap-3 rounded-2xl border border-[#dfe3dd] bg-white p-6 shadow-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#173c32] border-t-transparent" />
          <span className="text-sm font-semibold text-[#1f312b]">Loading product from PostgreSQL...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7f8f6] px-4">
        <div className="max-w-md rounded-2xl border border-[#dfe3dd] bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-600" />
          <h1 className="mt-4 text-xl font-bold text-[#1f312b]">Product Not Found</h1>
          <p className="mt-2 text-sm text-[#718079]">
            Product #{resolvedParams.id} could not be found in the database.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#173c32] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#235345] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Store Catalog
          </Link>
        </div>
      </div>
    );
  }

  const isOut = product.stock_quantity === 0;
  const isLow = product.stock_quantity > 0 && product.stock_quantity <= 5;

  return (
    <div className="min-h-screen bg-[#f7f8f6] text-[#1d2925] pb-20">
      {/* TOP NAV BAR */}
      <header className="sticky top-0 z-30 border-b border-[#e1e5e0] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-[#dfe3dd] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#52635c] hover:bg-[#f1f4f0] hover:text-[#173c32] transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Catalog
          </Link>
          <span className="font-mono text-xs text-[#8a9690]">
            Database Record #{product.id}
          </span>
        </div>
      </header>

      {/* MAIN PRODUCT CONTAINER */}
      <main className="mx-auto max-w-5xl px-4 pt-10 sm:px-6 lg:px-8">
        {/* SUCCESS BANNER */}
        {orderSuccess && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800 shadow-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span className="font-medium">{orderSuccess}</span>
            </div>
            <button
              onClick={() => setOrderSuccess(null)}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 rounded-3xl border border-[#dfe3dd] bg-white p-6 sm:p-10 shadow-sm">
          {/* LEFT: VISUAL PLACEHOLDER & SPECS */}
          <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl border border-[#e8ece6] bg-[#f8f9f6] p-8">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-[#e8eee9] px-3 py-1 text-xs font-bold text-[#173c32]">
                {product.category}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  isOut
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : isLow
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isOut ? 'bg-rose-600' : isLow ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}
                />
                {isOut ? 'Out of Stock' : isLow ? `${product.stock_quantity} left` : 'In Stock'}
              </span>
            </div>

            <div className="my-14 flex flex-col items-center justify-center text-center">
              <div className="grid h-28 w-28 place-items-center rounded-3xl bg-white text-[#173c32] shadow-sm border border-[#dfe3dd]">
                <Package className="h-14 w-14" />
              </div>
              <p className="mt-4 font-mono text-xs text-[#8a9690]">
                SKU: PROD-00{product.id} · Verified PostgreSQL Row
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-[#e2e7e0] pt-6 text-center text-xs">
              <div className="flex flex-col items-center gap-1">
                <Truck className="h-4 w-4 text-[#52635c]" />
                <span className="text-[11px] text-[#718079]">Fast Dispatch</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-[#52635c]" />
                <span className="text-[11px] text-[#718079]">Verified Stock</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcw className="h-4 w-4 text-[#52635c]" />
                <span className="text-[11px] text-[#718079]">30-Day Returns</span>
              </div>
            </div>
          </div>

          {/* RIGHT: DETAILS & ACTIONS */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-[#1f312b]">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-xs text-[#718079]">USD · In Stock Quantity: {product.stock_quantity}</span>
              </div>

              <h1 className="mt-4 text-2xl font-bold text-[#1f312b] sm:text-3xl">
                {product.title}
              </h1>

              <p className="mt-4 text-sm leading-relaxed text-[#52635c]">
                {product.description}
              </p>

              <div className="mt-6 space-y-3 rounded-2xl bg-[#f8f9f6] p-4 border border-[#e8ece6] text-xs text-[#52635c]">
                <div className="flex justify-between">
                  <span className="text-[#8a9690]">Category:</span>
                  <span className="font-semibold text-[#1f312b]">{product.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a9690]">Inventory Level:</span>
                  <span className="font-semibold text-[#1f312b]">{product.stock_quantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a9690]">Catalog Added:</span>
                  <span className="font-semibold text-[#1f312b]">
                    {new Date(product.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* ORDER ACTIONS */}
            <div className="mt-8 pt-6 border-t border-[#e8ece6]">
              <div className="flex items-center gap-3">
                {!isOut && (
                  <div className="flex items-center rounded-xl border border-[#dfe3dd] bg-white p-1">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || isOrdering}
                      className="h-8 w-8 rounded-lg text-sm font-bold text-[#52635c] hover:bg-[#f1f4f0] disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-semibold text-[#1f312b]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                      disabled={quantity >= product.stock_quantity || isOrdering}
                      className="h-8 w-8 rounded-lg text-sm font-bold text-[#52635c] hover:bg-[#f1f4f0] disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                )}

                <button
                  onClick={handleOrder}
                  disabled={isOut || isOrdering}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#173c32] px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#235345] disabled:cursor-not-allowed disabled:bg-[#d5ded7] transition"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>
                    {isOrdering
                      ? 'Processing Order...'
                      : isOut
                      ? 'Out of Stock'
                      : `Purchase ${quantity}x · $${(product.price * quantity).toFixed(2)}`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ROCO ASSISTANT SIDEBAR ON PRODUCT PAGE */}
      <AdminAssistantSidebar onDataMutated={() => setRefreshTrigger((t) => t + 1)} />
    </div>
  );
}
