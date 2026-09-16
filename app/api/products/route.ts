import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const products = await getAllProducts();
    return NextResponse.json({ products });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch products';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
