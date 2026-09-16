import { KnowledgeChunk, KnowledgeDocument } from './types';

/**
 * Semantic Markdown Chunker:
 * Splits documents by markdown sections (## headings) and paragraphs,
 * maintaining context headers so each chunk remains semantically self-contained.
 */

interface ChunkOptions {
  maxChunkSizeChars?: number; // target character length (~250-350 tokens)
  overlapChars?: number;      // sliding overlap
}

export function chunkMarkdownDocument(
  doc: KnowledgeDocument,
  options: ChunkOptions = {}
): KnowledgeChunk[] {
  const { maxChunkSizeChars = 900, overlapChars = 120 } = options;
  const chunks: KnowledgeChunk[] = [];

  const rawLines = doc.rawContent.split('\n');
  let currentSection = 'Overview';
  let sectionLines: string[] = [];

  const processSection = (sectionName: string, lines: string[]) => {
    const text = lines.join('\n').trim();
    if (!text) return;

    // If section fits comfortably within the target size, keep it intact
    if (text.length <= maxChunkSizeChars) {
      chunks.push({
        id: `${doc.id}-${chunks.length + 1}`,
        docId: doc.id,
        docTitle: doc.title,
        section: sectionName,
        content: `Document: ${doc.title}\nSection: ${sectionName}\n\n${text}`,
        tokenCount: Math.round(text.length / 4),
      });
      return;
    }

    // Otherwise split by paragraphs with sliding overlap
    const paragraphs = text.split(/\n\s*\n/);
    let currentBlock = '';

    for (const para of paragraphs) {
      const trimmedPara = para.trim();
      if (!trimmedPara) continue;

      if ((currentBlock + '\n\n' + trimmedPara).length > maxChunkSizeChars && currentBlock.length > 0) {
        chunks.push({
          id: `${doc.id}-${chunks.length + 1}`,
          docId: doc.id,
          docTitle: doc.title,
          section: sectionName,
          content: `Document: ${doc.title}\nSection: ${sectionName}\n\n${currentBlock.trim()}`,
          tokenCount: Math.round(currentBlock.length / 4),
        });

        // Retain sliding window overlap from end of previous block
        const overlap = currentBlock.slice(Math.max(0, currentBlock.length - overlapChars));
        currentBlock = `${overlap}\n\n${trimmedPara}`;
      } else {
        currentBlock = currentBlock ? `${currentBlock}\n\n${trimmedPara}` : trimmedPara;
      }
    }

    if (currentBlock.trim()) {
      chunks.push({
        id: `${doc.id}-${chunks.length + 1}`,
        docId: doc.id,
        docTitle: doc.title,
        section: sectionName,
        content: `Document: ${doc.title}\nSection: ${sectionName}\n\n${currentBlock.trim()}`,
        tokenCount: Math.round(currentBlock.length / 4),
      });
    }
  };

  for (const line of rawLines) {
    // Detect top-level title if not yet set
    if (line.startsWith('# ') && !doc.title) {
      doc.title = line.replace('# ', '').trim();
      continue;
    }

    // Detect section headers (## or ###)
    if (line.startsWith('## ') || line.startsWith('### ')) {
      if (sectionLines.length > 0) {
        processSection(currentSection, sectionLines);
        sectionLines = [];
      }
      currentSection = line.replace(/^#+\s*/, '').trim();
    } else {
      sectionLines.push(line);
    }
  }

  if (sectionLines.length > 0) {
    processSection(currentSection, sectionLines);
  }

  return chunks;
}
