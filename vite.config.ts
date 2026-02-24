import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

const isDebug = process.env.DEBUG_BUILD === "1"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "./",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    ...(isDebug && { minify: false, sourcemap: true }),
  },
})
