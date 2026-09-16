import fs from 'fs';
import path from 'path';

// Auto-load .env.local if present
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...vals] = trimmed.split('=');
    if (key && !process.env[key.trim()]) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  }
}

import { loadLocalKnowledgeDocuments } from '../lib/rag/vector-store';
import { chunkMarkdownDocument } from '../lib/rag/chunker';
import { searchKnowledgeBase } from '../lib/rag/retriever';

interface TestCase {
  id: string;
  query: string;
  expectedDoc: string;
  expectedSectionKeyword: string;
  isNegativeTest?: boolean;
}

const TEST_CASES: TestCase[] = [
  {
    id: 'TC-1',
    query: 'What is the order subtotal required to get free domestic ground shipping?',
    expectedDoc: 'shipping-and-delivery',
    expectedSectionKeyword: 'Domestic Shipping Options',
  },
  {
    id: 'TC-2',
    query: 'Can a customer return an item after 35 days, and what fee is deducted from the refund?',
    expectedDoc: 'returns-and-refunds',
    expectedSectionKeyword: '30-Day Return Window',
  },
  {
    id: 'TC-3',
    query: 'How should I wash and dry the AirBreeze Linen Shirt to avoid shrinking?',
    expectedDoc: 'warranty-and-product-care',
    expectedSectionKeyword: 'AirBreeze Linen Shirt',
  },
  {
    id: 'TC-4',
    query: 'Do you ship packages to Canada, Australia, or the UK?',
    expectedDoc: 'shipping-and-delivery',
    expectedSectionKeyword: 'International Shipping',
  },
  {
    id: 'TC-5',
    query: 'What does the 1-year limited warranty cover for AeroSport Wireless Earbuds?',
    expectedDoc: 'warranty-and-product-care',
    expectedSectionKeyword: 'One-Year Limited Manufacturer Warranty',
  },
  {
    id: 'TC-6',
    query: 'What payment methods and digital wallets do you accept at checkout?',
    expectedDoc: 'faq-and-support',
    expectedSectionKeyword: 'Payment Methods',
  },
  {
    id: 'TC-7',
    query: 'What is the store policy on rescuing exotic stray reptiles?',
    expectedDoc: 'none',
    expectedSectionKeyword: 'none',
    isNegativeTest: true, // Should fail to find high similarity
  },
];

async function runRAGEvals() {
  console.log('='.repeat(80));
  console.log('🚀 RUNNING RAG RETRIEVAL & GROUNDING EVALUATION');
  console.log('='.repeat(80));

  // 1. Ingestion & Chunking stats
  const docs = loadLocalKnowledgeDocuments();
  console.log(`\n📚 Ingested ${docs.length} Knowledge Base Documents:`);
  let totalChunks = 0;
  for (const doc of docs) {
    const chunks = chunkMarkdownDocument(doc);
    totalChunks += chunks.length;
    console.log(`  - [${doc.id}.md] "${doc.title}" -> ${chunks.length} chunks`);
  }
  console.log(`📊 Total Chunks Generated: ${totalChunks}\n`);

  // 2. Query Evaluation Suite
  let passedCount = 0;

  for (const tc of TEST_CASES) {
    console.log('-'.repeat(80));
    console.log(`🧪 [${tc.id}] Query: "${tc.query}"`);

    const startTime = Date.now();
    const result = await searchKnowledgeBase(tc.query, { topK: 3, minSimilarity: 0.55 });
    const duration = Date.now() - startTime;

    if (tc.isNegativeTest) {
      // For negative test, either 0 results or top similarity is low
      const topSim = result.results[0]?.similarity ?? 0;
      const pass = result.results.length === 0 || topSim < 0.60;
      if (pass) {
        console.log(`  ✅ PASSED (Negative Test): Correctly returned no high-confidence match (Top sim: ${(topSim * 100).toFixed(1)}%).`);
        passedCount += 1;
      } else {
        console.log(`  ❌ FAILED (Negative Test): Unexpectedly matched chunk "${result.results[0]?.citation}" with ${(topSim * 100).toFixed(1)}% similarity.`);
      }
    } else {
      const topMatch = result.results[0];
      if (!topMatch) {
        console.log(`  ❌ FAILED: No chunks retrieved above threshold.`);
        continue;
      }

      const matchDoc = topMatch.chunk.docId;
      const matchSection = topMatch.chunk.section;
      const simPercent = (topMatch.similarity * 100).toFixed(1);

      const docMatches = matchDoc.includes(tc.expectedDoc);
      const sectionMatches = matchSection.toLowerCase().includes(tc.expectedSectionKeyword.toLowerCase());

      console.log(`  🎯 Top Result: ${topMatch.citation} [Match: ${simPercent}%, Latency: ${duration}ms]`);

      if (docMatches && sectionMatches) {
        console.log(`  ✅ PASSED: Correct document and section retrieved.`);
        passedCount += 1;
      } else if (docMatches) {
        console.log(`  ⚠️ PARTIAL: Document matched (${matchDoc}), but section was "${matchSection}".`);
        passedCount += 1;
      } else {
        console.log(`  ❌ FAILED: Expected doc "${tc.expectedDoc}", got "${matchDoc}".`);
      }
    }
  }

  console.log('='.repeat(80));
  console.log(`🏁 EVALUATION SUMMARY: ${passedCount} / ${TEST_CASES.length} Tests Passed (${Math.round((passedCount / TEST_CASES.length) * 100)}%)`);
  console.log('='.repeat(80));
}

runRAGEvals().catch((err) => {
  console.error('Fatal eval error:', err);
  process.exit(1);
});
