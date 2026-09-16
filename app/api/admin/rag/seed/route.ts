import { NextResponse } from 'next/server';
import { getVectorStoreStats, initializeVectorStore } from '@/lib/rag/vector-store';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await initializeVectorStore();
    const stats = getVectorStoreStats();
    return NextResponse.json({
      success: true,
      message: 'RAG Knowledge Base is initialized and ready.',
      stats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to initialize RAG store';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
