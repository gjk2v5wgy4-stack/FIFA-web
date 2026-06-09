# syntax=docker/dockerfile:1

FROM python:3.12-alpine AS api-dev
WORKDIR /app
COPY infra/docker/api/health_server.py /app/health_server.py
ENV API_HOST=0.0.0.0
ENV API_PORT=8000
EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=6 CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/healthz', timeout=2).read()"
CMD ["python", "/app/health_server.py"]

FROM nginx:1.27-alpine AS web-dev
COPY infra/docker/web/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=6 CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1

