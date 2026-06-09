import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const requiredDirectories = [
  "packages/rag-core/ingestion",
  "packages/rag-core/chunking",
  "packages/rag-core/embeddings",
  "packages/rag-core/vector-store",
  "packages/rag-core/retrieval",
  "packages/rag-core/reranking",
  "packages/rag-core/prompting",
  "packages/rag-core/citations",
  "packages/rag-core/safety",
  "packages/rag-core/tests"
];
const forbiddenBackendSideEffects = [
  "token_ledger",
  "ai_usage_logs",
  "Stripe",
  "checkout",
  "pending_approval",
  "ACCOUNT_PENDING_APPROVAL"
];

for (const directory of requiredDirectories) {
  assert(existsSync(join(root, directory)), `missing required directory: ${directory}`);
}

const scannedFiles = [
  ...collectFiles(join(root, "packages/rag-core")),
  ...collectFiles(join(root, "packages/shared"))
].filter((file) => /\.(js|d\.ts)$/.test(file));

for (const file of scannedFiles) {
  const content = readFileSync(file, "utf8");
  for (const term of forbiddenBackendSideEffects) {
    assert(!content.includes(term), `backend side-effect term "${term}" found in ${file}`);
  }
}

console.log(`lint ok: checked ${requiredDirectories.length} directories and ${scannedFiles.length} source files`);

function collectFiles(directory) {
  const entries = readdirSync(directory);
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      files.push(...collectFiles(path));
    } else {
      files.push(path);
    }
  }
  return files;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
