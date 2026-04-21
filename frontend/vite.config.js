import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devPort = Number(env.VITE_PORT || 5173)
  const origin = env.VITE_PUBLIC_ORIGIN
  const hmrHost = env.VITE_HMR_HOST
  const hmrProtocol = env.VITE_HMR_PROTOCOL
  const hmrClientPort = env.VITE_HMR_CLIENT_PORT
    ? Number(env.VITE_HMR_CLIENT_PORT)
    : undefined
  const hmrPort = env.VITE_HMR_PORT ? Number(env.VITE_HMR_PORT) : undefined

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: env.VITE_HOST || '0.0.0.0',
      port: devPort,
      strictPort: true,
      allowedHosts: true,
      origin: origin || undefined,
      hmr: hmrHost
        ? {
            host: hmrHost,
            protocol: hmrProtocol || 'ws',
            clientPort: hmrClientPort || devPort,
            port: hmrPort || devPort,
          }
        : undefined,
    },
  }
})
