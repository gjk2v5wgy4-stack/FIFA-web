const DEFAULT_DIMENSIONS = 16;

export function embedTextDeterministic(text, options = {}) {
  const dimensions = options.dimensions ?? DEFAULT_DIMENSIONS;
  const vector = Array.from({ length: dimensions }, () => 0);
  const tokens = String(text ?? "")
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  for (const token of tokens) {
    const hash = hashToken(token);
    const index = Math.abs(hash) % dimensions;
    const sign = hash % 2 === 0 ? 1 : -1;
    vector[index] += sign * (1 + Math.min(token.length, 12) / 12);
  }

  return normalizeVector(vector);
}

export const deterministicEmbedder = Object.freeze({
  embedText: (text) => embedTextDeterministic(text),
  embedQuery: (text) => embedTextDeterministic(text)
});

export function cosineSimilarity(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
    return 0;
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftNorm += left[index] * left[index];
    rightNorm += right[index] * right[index];
  }

  if (leftNorm === 0 || rightNorm === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function hashToken(token) {
  let hash = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    hash ^= token.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash | 0;
}

function normalizeVector(vector) {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (norm === 0) {
    return vector;
  }
  return vector.map((value) => Number((value / norm).toFixed(8)));
}
