FROM python:3.12-alpine AS api-dev
WORKDIR /app
COPY infra/docker/api/health_server.py /app/health_server.py
ENV API_HOST=0.0.0.0
ENV API_PORT=8000
EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=6 CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/healthz', timeout=2).read()"
CMD ["python", "/app/health_server.py"]

FROM python:3.12-alpine AS api-prod
WORKDIR /app
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/apps/api:/app/packages/football-models/src:/app/packages/rag-core/python
ENV PIP_INDEX_URL=https://mirrors.cloud.tencent.com/pypi/simple
ENV PIP_DEFAULT_TIMEOUT=120
COPY apps/api /app/apps/api
COPY packages/football-models /app/packages/football-models
COPY packages/rag-core/python /app/packages/rag-core/python
RUN pip install --no-cache-dir \
  -e /app/packages/football-models \
  "alembic>=1.16.0" \
  "email-validator>=2.2.0" \
  "fastapi>=0.116.0" \
  "httpx>=0.28.0" \
  "psycopg[binary]>=3.2.0" \
  "pydantic>=2.8.0" \
  "pydantic-settings>=2.10.0" \
  "python-multipart>=0.0.20" \
  "qdrant-client>=1.14.0" \
  "redis>=6.0.0" \
  "sqlalchemy>=2.0.40" \
  "uvicorn>=0.35.0"
EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=8 CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/healthz', timeout=2).read()"
CMD ["uvicorn", "app.main:app", "--app-dir", "/app/apps/api", "--host", "0.0.0.0", "--port", "8000"]

FROM nginx:1.27-alpine AS web-dev
COPY infra/docker/web/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=6 CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1

FROM node:22-alpine AS web-build
WORKDIR /app
COPY apps/web/package.json apps/web/package-lock.json ./
RUN npm ci
COPY apps/web/ ./
RUN npm run build

FROM nginx:1.27-alpine AS web-prod
COPY infra/docker/web/prod.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=6 CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1

