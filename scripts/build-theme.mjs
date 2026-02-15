#!/usr/bin/env node
/**
 * Reorganize dist/ into qBittorrent public/private structure.
 * Run after: npm run build
 */
import { cpSync, mkdirSync, rmSync, existsSync } from "fs"
import { join, dirname } from "path"
import { homedir } from "os"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const dist = join(root, "dist")
const publicDir = join(dist, "public")
const privateDir = join(dist, "private")

mkdirSync(publicDir, { recursive: true })
mkdirSync(privateDir, { recursive: true })

// Copy dist contents to both public and private
for (const name of ["index.html", "favicon.svg", "assets", "icons"]) {
  const src = join(dist, name)
  if (existsSync(src)) {
    cpSync(src, join(publicDir, name), { recursive: true })
    cpSync(src, join(privateDir, name), { recursive: true })
  }
}

// Workaround: also add login.html in public (qbit-matUI workaround)
const publicIndex = join(publicDir, "index.html")
const publicLogin = join(publicDir, "login.html")
if (existsSync(publicIndex)) {
  cpSync(publicIndex, publicLogin)
}

// Remove root-level files (we only want public/ and private/)
for (const name of ["index.html", "favicon.svg", "assets", "icons"]) {
  const p = join(dist, name)
  if (existsSync(p)) rmSync(p, { recursive: true })
}

if (!process.env.SKIP_DEPLOY) {
  const themePath = join(process.env.HOME || homedir(), ".config", "qBittorrent", "themes", "qbt-maclook")
  mkdirSync(themePath, { recursive: true })
  rmSync(join(themePath, "public"), { recursive: true, force: true })
  rmSync(join(themePath, "private"), { recursive: true, force: true })
  cpSync(publicDir, join(themePath, "public"), { recursive: true })
  cpSync(privateDir, join(themePath, "private"), { recursive: true })
  console.log("Theme built and deployed to:", themePath)
}
console.log("Structure: dist/public/ and dist/private/")
