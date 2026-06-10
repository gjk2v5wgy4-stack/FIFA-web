import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path not in ("/healthz", "/api/healthz", "/"):
            self.send_response(404)
            self.end_headers()
            return

        payload = {
            "status": "ok",
            "service": "api",
            "environment": os.getenv("ENVIRONMENT", "local"),
            "dependencies": {
                "postgresConfigured": bool(os.getenv("DATABASE_URL")),
                "redisConfigured": bool(os.getenv("REDIS_URL")),
                "qdrantConfigured": bool(os.getenv("QDRANT_URL")),
                "qdrantCollection": os.getenv("QDRANT_COLLECTION", ""),
            },
        }
        body = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    HTTPServer((host, port), HealthHandler).serve_forever()
