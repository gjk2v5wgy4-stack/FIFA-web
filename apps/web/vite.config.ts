import { defineConfig, loadEnv, type ProxyOptions } from "vite";

const defaultApiProxyTarget = "http://122.51.196.183:8000";

function createApiProxy(target: string): Record<string, ProxyOptions> {
  return {
    "/api": {
      target,
      changeOrigin: true,
      secure: false,
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || defaultApiProxyTarget;

  return {
    server: {
      proxy: createApiProxy(apiProxyTarget),
    },
    preview: {
      proxy: createApiProxy(apiProxyTarget),
    },
  };
});
