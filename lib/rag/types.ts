/**
 * Core types for the RAG (Retrieval-Augmented Generation) pipeline.
 */

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: string;
  filePath: string;
  rawContent: string;
  updatedAt: string;
}

export interface KnowledgeChunk {
  id: string;
  docId: string;
  docTitle: string;
  section: string;
  content: string;
  tokenCount: number;
  embedding?: number[];
}

export interface RetrievalResult {
  chunk: KnowledgeChunk;
  similarity: number; // 0.0 to 1.0
  citation: string;   // e.g. "[Shipping Policy > Domestic Shipping Options & Rates]"
}

export interface RAGSearchOptions {
  topK?: number;           // Number of chunks to retrieve (default: 3)
  minSimilarity?: number;  // Similarity score threshold (default: 0.60)
  filterCategory?: string; // Optional category filter
}

export interface RAGQueryResponse {
  query: string;
  retrievedCount: number;
  results: RetrievalResult[];
  formattedContext: string;
}
