#!/usr/bin/env node
/**
 * Deploy built theme to remote server via SSH (rsync).
 * Requires: npm run build:theme (or build + build-theme) to be run first.
 *
 * Usage:
 *   node scripts/deploy-remote.mjs
 *
 * Environment variables:
 *   SSH_HOST  - remote hostname or IP (required)
 *   SSH_USER  - SSH username (required)
 *   SSH_PATH  - remote theme path (default: ~/.config/qBittorrent/themes/applegui)
 *   SSH_PORT  - SSH port (default: 22)
 *   SSH_KEY   - path to SSH private key (optional)
 *
 * Example:
 *   SSH_HOST=myserver.com SSH_USER=john node scripts/deploy-remote.mjs
 */
import { existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { spawnSync } from "child_process"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")
const dist = join(root, "dist")
const publicDir = join(dist, "public")
const privateDir = join(dist, "private")

const host = process.env.SSH_HOST
const user = process.env.SSH_USER
const remotePath =
  process.env.SSH_PATH || "~/.config/qBittorrent/themes/applegui"
const port = process.env.SSH_PORT || "22"
const keyPath = process.env.SSH_KEY

if (!host || !user) {
  console.error("Error: SSH_HOST and SSH_USER are required")
  console.error("")
  console.error("Example:")
  console.error(
    "  SSH_HOST=myserver.com SSH_USER=john node scripts/deploy-remote.mjs"
  )
  console.error("")
  console.error("Optional: SSH_PATH, SSH_PORT, SSH_KEY")
  process.exit(1)
}

if (!existsSync(publicDir) || !existsSync(privateDir)) {
  console.error(
    "Error: dist/public/ and dist/private/ not found. Run 'npm run build:theme' first."
  )
  process.exit(1)
}

const target = `${user}@${host}:${remotePath}`

// Build rsync -e "ssh ..." for port and key
const sshOpts = ["-o", "StrictHostKeyChecking=accept-new"]
const sshArgs = [...sshOpts]
if (keyPath) {
  sshArgs.push("-i", keyPath)
}
if (port !== "22") {
  sshArgs.push("-p", port)
}
const sshCmd = ["ssh", ...sshArgs].join(" ")

function runRsync(localDir, remoteSubdir) {
  const dest = `${target}/${remoteSubdir}/`
  return spawnSync("rsync", ["-avz", "--delete", "-e", sshCmd, localDir + "/", dest], {
    stdio: "inherit",
    shell: false,
  }).status
}

console.log(`Deploying theme to ${user}@${host}:${remotePath}`)
console.log("")

if (runRsync(publicDir, "public") !== 0) {
  console.error("Failed to sync public/")
  process.exit(1)
}

if (runRsync(privateDir, "private") !== 0) {
  console.error("Failed to sync private/")
  process.exit(1)
}

console.log("")
console.log("Theme deployed successfully.")
console.log(`Configure qBittorrent Web UI → Alternative Web UI: ${remotePath}`)
