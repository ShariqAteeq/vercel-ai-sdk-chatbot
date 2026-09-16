import { NextResponse } from 'next/server';
import { getAllOrders, createOrder } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const orders = await getAllOrders();
    return NextResponse.json({ orders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch orders';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { customerName, customerEmail, items } = body;

    if (!customerName || !customerEmail || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'customerName, customerEmail, and items array are required.' },
        { status: 400 }
      );
    }

    const newOrder = await createOrder(customerName, customerEmail, items);
    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create order';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
