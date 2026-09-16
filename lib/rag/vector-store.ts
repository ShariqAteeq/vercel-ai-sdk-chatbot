import fs from 'fs';
import path from 'path';
import { dbQuery } from '../db';
import { chunkMarkdownDocument } from './chunker';
import { generateBatchEmbeddings } from './embeddings';
import { KnowledgeChunk, KnowledgeDocument, RetrievalResult, RAGSearchOptions } from './types';

// Global singleton vector store in memory across hot reloads
interface GlobalVectorState {
  chunks: KnowledgeChunk[];
  isInitialized: boolean;
  initPromise: Promise<void> | null;
}

const globalForVector = globalThis as unknown as { __vectorStoreState?: GlobalVectorState };

if (!globalForVector.__vectorStoreState) {
  globalForVector.__vectorStoreState = {
    chunks: [],
    isInitialized: false,
    initPromise: null,
  };
}

const state = globalForVector.__vectorStoreState;

/**
 * Calculates cosine similarity between two unit vectors (dot product).
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i += 1) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

/**
 * Reads local markdown knowledge base documents and returns structured documents.
 */
export function loadLocalKnowledgeDocuments(): KnowledgeDocument[] {
  const docsDir = path.join(process.cwd(), 'docs', 'knowledge-base');
  if (!fs.existsSync(docsDir)) {
    console.warn(`[RAG VectorStore] Documents directory not found at ${docsDir}`);
    return [];
  }

  const files = fs.readdirSync(docsDir).filter((f) => f.endsWith('.md'));
  const docs: KnowledgeDocument[] = [];

  for (const file of files) {
    const filePath = path.join(docsDir, file);
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const firstLine = rawContent.split('\n').find((l) => l.startsWith('# '));
    const title = firstLine ? firstLine.replace('# ', '').trim() : file.replace('.md', '');
    const id = file.replace('.md', '');

    docs.push({
      id,
      title,
      category: id.includes('shipping')
        ? 'shipping'
        : id.includes('returns')
        ? 'returns'
        : id.includes('warranty')
        ? 'warranty'
        : 'general',
      filePath,
      rawContent,
      updatedAt: fs.statSync(filePath).mtime.toISOString(),
    });
  }

  return docs;
}

/**
 * Ensures knowledge base documents are chunked, embedded, and indexed in memory.
 */
export async function initializeVectorStore(): Promise<void> {
  if (state.isInitialized && state.chunks.length > 0) return;

  if (state.initPromise) {
    return state.initPromise;
  }

  state.initPromise = (async () => {
    try {
      console.log('[RAG VectorStore] Initializing vector store from docs/knowledge-base...');
      const docs = loadLocalKnowledgeDocuments();

      const allChunks: KnowledgeChunk[] = [];
      for (const doc of docs) {
        const docChunks = chunkMarkdownDocument(doc);
        allChunks.push(...docChunks);
      }

      console.log(`[RAG VectorStore] Generated ${allChunks.length} semantic chunks across ${docs.length} documents.`);

      // Generate batch embeddings for all chunks
      const textsToEmbed = allChunks.map((c) => `${c.docTitle} - ${c.section}\n${c.content}`);
      const embeddings = await generateBatchEmbeddings(textsToEmbed);

      for (let i = 0; i < allChunks.length; i += 1) {
        allChunks[i].embedding = embeddings[i];
      }

      state.chunks = allChunks;
      state.isInitialized = true;
      console.log('[RAG VectorStore] Knowledge base embeddings successfully initialized in vector store.');

      // Try inserting into PostgreSQL if table exists
      try {
        await trySeedPgVector(allChunks);
      } catch {
        // Ignored if pgvector table is not present
      }
    } catch (err) {
      console.error('[RAG VectorStore] Initialization error:', err);
      state.isInitialized = true; // Avoid infinite retries
    } finally {
      state.initPromise = null;
    }
  })();

  return state.initPromise;
}

/**
 * Optional helper to sync chunks to pgvector if the pgvector table is configured.
 */
async function trySeedPgVector(chunks: KnowledgeChunk[]) {
  const checkRes = await dbQuery<{ exists: boolean }>(
    "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'knowledge_chunks');"
  );
  if (!checkRes.rows[0]?.exists) return;

  for (const chunk of chunks) {
    if (!chunk.embedding) continue;
    const vectorStr = `[${chunk.embedding.join(',')}]`;
    await dbQuery(
      `INSERT INTO knowledge_chunks (id, doc_id, doc_title, section, content, token_count, embedding)
       VALUES ($1, $2, $3, $4, $5, $6, $7::vector)
       ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, embedding = EXCLUDED.embedding;`,
      [chunk.id, chunk.docId, chunk.docTitle, chunk.section, chunk.content, chunk.tokenCount, vectorStr]
    );
  }
}

/**
 * Search the vector store for the most semantically relevant chunks.
 */
export async function searchVectorStore(
  queryEmbedding: number[],
  options: RAGSearchOptions = {}
): Promise<RetrievalResult[]> {
  await initializeVectorStore();

  const { topK = 3, minSimilarity = 0.55 } = options;

  if (state.chunks.length === 0) {
    console.warn('[RAG VectorStore] No chunks indexed in vector store.');
    return [];
  }

  // Calculate similarity scores
  const scoredChunks: RetrievalResult[] = state.chunks
    .filter((chunk) => chunk.embedding && chunk.embedding.length > 0)
    .map((chunk) => {
      const similarity = calculateCosineSimilarity(queryEmbedding, chunk.embedding!);
      return {
        chunk,
        similarity: Number(similarity.toFixed(4)),
        citation: `[Source: ${chunk.docTitle} > ${chunk.section}]`,
      };
    })
    .filter((res) => res.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return scoredChunks;
}

/**
 * Retrieve metadata stats about the current vector store.
 */
export function getVectorStoreStats() {
  return {
    isInitialized: state.isInitialized,
    totalChunks: state.chunks.length,
    documentsCount: new Set(state.chunks.map((c) => c.docId)).size,
    chunks: state.chunks.map((c) => ({
      id: c.id,
      docTitle: c.docTitle,
      section: c.section,
      tokenCount: c.tokenCount,
      hasEmbedding: Boolean(c.embedding && c.embedding.length > 0),
    })),
  };
}
