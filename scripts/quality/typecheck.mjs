import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const declarationExpectations = new Map([
  [
    "packages/shared/rag-types.d.ts",
    ["interface DocumentChunkMetadata", "interface VectorStoreAdapter", "interface RagUsage"]
  ],
  [
    "packages/rag-core/index.d.ts",
    ["declare function retrieveContext", "declare function askWithRag", "declare class MemoryVectorStoreAdapter"]
  ]
]);

for (const [declarationFile, requiredDeclarationSnippets] of declarationExpectations.entries()) {
  const path = join(root, declarationFile);
  assert(existsSync(path), `missing declaration file: ${declarationFile}`);
  const content = readFileSync(path, "utf8");
  for (const snippet of requiredDeclarationSnippets) {
    assert(content.includes(snippet), `missing declaration snippet "${snippet}" in ${declarationFile}`);
  }
}

const runtimeFiles = [
  ...collectFiles(join(root, "packages/rag-core")),
  ...collectFiles(join(root, "packages/shared")),
  ...collectFiles(join(root, "scripts"))
].filter((file) => /\.(js|mjs)$/.test(file));

for (const file of runtimeFiles) {
  const result = spawnSync("node", ["--check", file], {
    cwd: root,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.stderr.write(result.stdout);
    throw new Error(`syntax check failed: ${file}`);
  }
}

console.log(`typecheck ok: checked ${declarationExpectations.size} declarations and ${runtimeFiles.length} runtime files`);

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
