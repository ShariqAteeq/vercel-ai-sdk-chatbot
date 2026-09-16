import { generateEmbedding } from './embeddings';
import { RAGQueryResponse, RAGSearchOptions } from './types';
import { searchVectorStore } from './vector-store';

/**
 * High-Level RAG Retriever:
 * Embeds the user query, performs semantic vector search, formats the retrieved context,
 * and attaches verified source citations.
 */
export async function searchKnowledgeBase(
  query: string,
  options: RAGSearchOptions = {}
): Promise<RAGQueryResponse> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return {
      query,
      retrievedCount: 0,
      results: [],
      formattedContext: 'No query provided.',
    };
  }

  // 1. Generate query embedding (1536 dimensions)
  const queryEmbedding = await generateEmbedding(trimmedQuery);

  // 2. Perform vector cosine similarity search
  const results = await searchVectorStore(queryEmbedding, options);

  // 3. Format citations and context block
  if (results.length === 0) {
    return {
      query: trimmedQuery,
      retrievedCount: 0,
      results: [],
      formattedContext:
        'No matching knowledge base documentation found. Do not invent policies; state that this information is not documented in the official store knowledge base.',
    };
  }

  const formattedContext = results
    .map((res, index) => {
      const matchPct = Math.round(res.similarity * 100);
      return `--- Excerpt ${index + 1} (${matchPct}% Match) ---\nCitation: ${res.citation}\n${res.chunk.content}\n`;
    })
    .join('\n');

  return {
    query: trimmedQuery,
    retrievedCount: results.length,
    results,
    formattedContext,
  };
}
