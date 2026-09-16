import OpenAI from 'openai';

const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSIONS = 1536;

const queryEmbeddingCache = new Map<string, number[]>();

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

/**
 * Generate a 1536-dimensional vector embedding for a single text query or document.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const normalized = text.replace(/\n+/g, ' ').trim();
  if (!normalized) {
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }

  // Check in-memory cache
  if (queryEmbeddingCache.has(normalized)) {
    return queryEmbeddingCache.get(normalized)!;
  }

  const client = getOpenAIClient();
  if (!client) {
    console.warn('[RAG Embeddings] No OPENAI_API_KEY found, generating fallback vector.');
    return generateDeterministicFallbackVector(normalized);
  }

  try {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: normalized,
      encoding_format: 'float',
    });

    const embedding = response.data[0]?.embedding;
    if (!embedding || embedding.length === 0) {
      throw new Error('OpenAI returned an empty embedding vector.');
    }

    queryEmbeddingCache.set(normalized, embedding);
    return embedding;
  } catch (error) {
    console.error('[RAG Embeddings] Failed to generate OpenAI embedding:', error);
    return generateDeterministicFallbackVector(normalized);
  }
}

/**
 * Batch generate vector embeddings for multiple texts.
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const client = getOpenAIClient();
  if (!client || texts.length === 0) {
    return texts.map((t) => generateDeterministicFallbackVector(t));
  }

  try {
    // OpenAI supports batching up to 2048 inputs per request
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: texts.map((t) => t.replace(/\n+/g, ' ').trim()),
      encoding_format: 'float',
    });

    return response.data.map((item) => item.embedding);
  } catch (error) {
    console.error('[RAG Embeddings] Batch embedding generation error:', error);
    return texts.map((t) => generateDeterministicFallbackVector(t));
  }
}

/**
 * Deterministic pseudo-embedding for local offline development/testing
 * when OpenAI API key is not yet configured or rate-limited.
 */
function generateDeterministicFallbackVector(text: string): number[] {
  const vector = new Array(EMBEDDING_DIMENSIONS).fill(0);
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);

  for (let i = 0; i < words.length; i += 1) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j += 1) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const index = Math.abs(hash) % EMBEDDING_DIMENSIONS;
    vector[index] += 1 / (1 + i * 0.1);
  }

  // Normalize to unit length
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let k = 0; k < vector.length; k += 1) {
      vector[k] /= magnitude;
    }
  }
  return vector;
}
