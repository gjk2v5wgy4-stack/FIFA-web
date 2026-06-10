import { VectorStoreAdapter } from "./vector-store-adapter.js";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const DEFAULT_COLLECTION_NAME = "worldcup_documents";
const DEFAULT_VECTOR_DIM = 1536;

export class QdrantVectorStoreAdapter extends VectorStoreAdapter {
  constructor(options = {}) {
    super();
    this.name = options.name ?? "qdrant";
    this.pythonCommand = options.pythonCommand ?? process.env.PYTHON ?? "python";
    this.scriptPath =
      options.scriptPath ??
      resolve(dirname(fileURLToPath(import.meta.url)), "../../../scripts/rag/qdrant_adapter_cli.py");
    this.options = {
      collection_name: options.collectionName ?? process.env.QDRANT_COLLECTION ?? DEFAULT_COLLECTION_NAME,
      vector_dim: Number(options.vectorDim ?? process.env.VECTOR_DIM ?? DEFAULT_VECTOR_DIM),
      ...(options.host || process.env.QDRANT_HOST ? { host: options.host ?? process.env.QDRANT_HOST } : {}),
      ...(options.port || process.env.QDRANT_PORT ? { port: Number(options.port ?? process.env.QDRANT_PORT) } : {}),
      ...(options.apiKey || process.env.QDRANT_API_KEY
        ? { api_key: options.apiKey ?? process.env.QDRANT_API_KEY }
        : {}),
      ...(options.location ? { location: options.location } : {}),
      ...(options.preferGrpc !== undefined ? { prefer_grpc: Boolean(options.preferGrpc) } : {})
    };
  }

  async ensureCollection() {
    await this.#callPython("ensure_collection");
  }

  async upsert(chunks) {
    if (!Array.isArray(chunks)) {
      throw new TypeError("chunks must be an array");
    }
    await this.#callPython("upsert", { chunks });
  }

  async search(queryEmbedding, filters = {}, topK = 8) {
    if (!Array.isArray(queryEmbedding)) {
      throw new TypeError("queryEmbedding must be an array");
    }
    const response = await this.#callPython("search", {
      queryEmbedding,
      filters,
      topK
    });
    return response.results ?? [];
  }

  async deleteByDocumentId(documentId) {
    if (!documentId) {
      throw new TypeError("documentId is required");
    }
    const response = await this.#callPython("deleteByDocumentId", { documentId });
    return response.deleted ?? 0;
  }

  async getById(chunkId) {
    if (!chunkId) {
      throw new TypeError("chunkId is required");
    }
    const response = await this.#callPython("getById", { chunkId });
    return response.chunk ?? null;
  }

  async #callPython(operation, payload = {}) {
    const request = {
      operation,
      options: this.options,
      ...payload
    };
    const result = await runPythonJson(this.pythonCommand, this.scriptPath, request);
    if (result?.error) {
      throw new Error(result.error);
    }
    return result;
  }
}

function runPythonJson(pythonCommand, scriptPath, request) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(pythonCommand, [scriptPath], {
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", rejectPromise);
    child.on("close", (code) => {
      if (code !== 0) {
        rejectPromise(
          new Error(
            `Qdrant Python bridge exited with code ${code}${stderr ? `: ${stderr.trim()}` : ""}`
          )
        );
        return;
      }
      try {
        resolvePromise(stdout ? JSON.parse(stdout) : {});
      } catch (error) {
        rejectPromise(
          new Error(
            `Qdrant Python bridge returned invalid JSON${stderr ? `; stderr: ${stderr.trim()}` : ""}: ${
              error.message
            }`
          )
        );
      }
    });
    child.stdin.end(JSON.stringify(request));
  });
}
