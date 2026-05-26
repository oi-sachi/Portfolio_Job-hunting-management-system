import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import { handleExtractImage, handleExtractText, handleHealth, handleJudge } from './server/extract.js'

dotenv.config({ path: '.env.local' })
dotenv.config()

const apiPlugin = () => ({
  name: 'job-hunting-api',
  configureServer(server) {
    server.middlewares.use('/api/health', handleHealth)
    server.middlewares.use('/api/extract-text', handleExtractText)
    server.middlewares.use('/api/extract-image', handleExtractImage)
    server.middlewares.use('/api/judge', handleJudge)
  },
})

export default defineConfig({
  plugins: [react(), apiPlugin()],
})
