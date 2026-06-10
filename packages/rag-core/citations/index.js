export function buildCitations(chunks) {
  const citations = [];
  const seen = new Set();

  for (const chunk of chunks) {
    if (!chunk?.chunkId || seen.has(chunk.chunkId)) {
      continue;
    }

    seen.add(chunk.chunkId);
    citations.push({
      index: citations.length + 1,
      chunkId: chunk.chunkId,
      documentId: chunk.documentId,
      sourceType: chunk.metadata?.sourceType ?? chunk.metadata?.source_type ?? "analysis",
      title: chunk.metadata?.title ?? chunk.metadata?.source_name ?? "Untitled document",
      sourceName: chunk.metadata?.source_name ?? chunk.metadata?.title ?? "Untitled document",
      url: chunk.metadata?.url ?? chunk.metadata?.source_url ?? null,
      sourceUrl: chunk.metadata?.source_url ?? chunk.metadata?.url ?? null,
      publishedAt: chunk.metadata?.publishedAt ?? chunk.metadata?.published_at ?? null,
      reliability: chunk.metadata?.reliability ?? null,
      language: chunk.metadata?.language ?? null,
      page: chunk.metadata?.page ?? null,
      metadata: chunk.metadata
    });
  }

  return citations;
}
