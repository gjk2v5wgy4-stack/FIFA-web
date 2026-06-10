const DEFAULT_CHUNK_SIZE = 280;
const DEFAULT_OVERLAP = 40;

export function estimateTokenCount(text) {
  const tokens = tokenize(text);
  return tokens.length;
}

export function tokenize(text) {
  if (!text || typeof text !== "string") {
    return [];
  }

  const normalized = text.trim().replace(/\s+/g, " ");
  if (!normalized) {
    return [];
  }

  return normalized.split(" ");
}

export function chunkDocument(document, options = {}) {
  if (!document || typeof document !== "object") {
    throw new TypeError("document is required");
  }
  if (!document.documentId) {
    throw new TypeError("document.documentId is required");
  }
  if (!document.content || typeof document.content !== "string") {
    throw new TypeError("document.content is required");
  }

  const chunkSize = positiveInteger(options.chunkSize, DEFAULT_CHUNK_SIZE);
  const overlap = Math.min(positiveInteger(options.overlap, DEFAULT_OVERLAP), chunkSize - 1);
  const units = buildChunkUnits(document.content, chunkSize, overlap);

  return units.map((content, chunkIndex) => {
    const chunkId = `${document.documentId}:chunk:${chunkIndex}`;
    const metadata = normalizeChunkMetadata({
      chunkId,
      chunkIndex,
      document,
      metadata: document.metadata ?? {}
    });

    return {
      chunkId,
      documentId: document.documentId,
      chunkIndex,
      content,
      tokenCount: estimateTokenCount(content),
      metadata
    };
  });
}

export function normalizeChunkMetadata({ chunkId, chunkIndex, document, metadata }) {
  const teamId = firstDefined(metadata.teamId, firstArrayValue(metadata.teamIds), firstArrayValue(metadata.team_ids));
  const playerId = firstDefined(
    metadata.playerId,
    firstArrayValue(metadata.playerIds),
    firstArrayValue(metadata.player_ids)
  );
  const matchId = firstDefined(
    metadata.matchId,
    firstArrayValue(metadata.matchIds),
    firstArrayValue(metadata.match_ids)
  );
  const sourceType = firstDefined(metadata.sourceType, metadata.source_type, document.sourceType, "analysis");
  const title = firstDefined(metadata.title, metadata.source_name, document.title, "Untitled document");
  const publishedAt = firstDefined(metadata.publishedAt, metadata.published_at, document.publishedAt, null);
  const url = firstDefined(metadata.url, metadata.source_url, document.url, null);
  const competition = firstDefined(metadata.competition, metadata.tournament_stage, document.competition, null);
  const language = firstDefined(metadata.language, document.language, null);
  const page = firstDefined(metadata.page, metadata.chunk_index, chunkIndex);
  const tags = normalizeStringArray(metadata.tags);

  return {
    ...metadata,
    chunkId,
    documentId: document.documentId,
    sourceType,
    title,
    teamId: teamId ?? null,
    playerId: playerId ?? null,
    matchId: matchId ?? null,
    competition,
    publishedAt,
    url,
    reliability: firstDefined(metadata.reliability, document.reliability, "unknown"),
    language,
    tags,
    page,
    source_type: sourceType,
    source_name: title,
    source_url: url,
    published_at: publishedAt,
    team_ids: normalizeStringArray(firstDefined(metadata.team_ids, metadata.teamIds, teamId ? [teamId] : [])),
    player_ids: normalizeStringArray(
      firstDefined(metadata.player_ids, metadata.playerIds, playerId ? [playerId] : [])
    ),
    match_ids: normalizeStringArray(firstDefined(metadata.match_ids, metadata.matchIds, matchId ? [matchId] : [])),
    tournament_stage: competition,
    chunk_index: chunkIndex,
    checksum: firstDefined(metadata.checksum, document.checksum, null)
  };
}

function buildChunkUnits(content, chunkSize, overlap) {
  const normalized = content.trim().replace(/\s+/g, " ");
  const sentences = splitSentences(normalized);
  if (sentences.length > 1) {
    return packSentences(sentences, chunkSize);
  }

  return chunkTokens(tokenize(normalized), chunkSize, overlap);
}

function splitSentences(text) {
  return (
    text
      .match(/[^.!?。！？]+[.!?。！？]?/gu)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) ?? []
  );
}

function packSentences(sentences, chunkSize) {
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (current && estimateTokenCount(candidate) > chunkSize) {
      chunks.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function chunkTokens(tokens, chunkSize, overlap) {
  if (tokens.length === 0) {
    return [];
  }

  const chunks = [];
  let start = 0;
  while (start < tokens.length) {
    const end = Math.min(start + chunkSize, tokens.length);
    chunks.push(tokens.slice(start, end).join(" "));
    if (end === tokens.length) {
      break;
    }
    start = Math.max(end - overlap, start + 1);
  }

  return chunks;
}

function positiveInteger(value, fallback) {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined);
}

function firstArrayValue(value) {
  return Array.isArray(value) && value.length > 0 ? value[0] : undefined;
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.length > 0);
  }
  if (typeof value === "string" && value.length > 0) {
    return [value];
  }
  return [];
}
