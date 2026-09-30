# qBittorrent Apple Theme

Alternative Web UI for qBittorrent-nox with macOS-style design.

## Why This Theme

This theme was created because there were no simple, lightweight alternative themes with native macOS styling for qBittorrent Web UI. The standard Web UI uses a legacy visual language.

## Differences from Standard Web UI

### Appearance

- **macOS 27 Liquid Glass**: Capsule controls in a medium glass material, specular edges, and a press response. Sheets, menus, and the inspector use the regular (more opaque) variant so text stays readable
- **Light and dark themes**: Follow the system appearance, with solid fallbacks when Reduce Transparency is on
- **Content layer**: Taller rows, title-case column titles, and a system-blue selection. Grouped settings stay on a standard material instead of glass
- **Concentric corners**: Sheets use a 28px radius; nested groups and menu items sit inside that curve
- **Unified toolbar**: Related actions share one glass capsule; search is its own capsule. Scroll content fades under the bar
- **Responsive layout**: Mobile-first with tablet and desktop optimizations; unified padding and font sizes across breakpoints

### Functionality

- Same qBittorrent API — all standard features (add, delete, pause, resume, search, settings)
- Detail panel for selected torrents (files, trackers, peers)
- Settings grouped by category (Appearance, Downloads, Connection, Speed, BitTorrent, Web UI)
- Password change in Web UI settings

## Installation

1. Build and deploy the theme (Node.js 18.19 or newer):
   ```bash
   cd ~/qbt-applegui
   npm install
   npm run build:theme
   ```

2. In qBittorrent, set **Tools → Preferences → Web UI → Alternative Web UI** to:
   ```
   ~/.config/qBittorrent/themes/applegui
   ```
   (or the full path: `/home/YOUR_USER/.config/qBittorrent/themes/applegui`)

3. Restart qBittorrent and access the Web UI.

## Build Commands

- `npm run build:theme` — build Vite project and deploy to `~/.config/qBittorrent/themes/applegui`
- `npm run deploy:remote` — deploy built theme to remote server via SSH (requires `build:theme` first)
- `npm run clean` — remove `dist/` and `.vite/`
- `npm run build` — build only (output in `dist/`, no deploy)
- `npm run dev` — development server with HMR

## Remote Installation (SSH)

1. Build the theme: `npm run build:theme`
2. Deploy to remote server:
   ```bash
   SSH_HOST=myserver.com SSH_USER=john npm run deploy:remote
   ```
3. Optional env vars: `SSH_PATH` (default: `~/.config/qBittorrent/themes/applegui`), `SSH_PORT`, `SSH_KEY`

## Structure

qBittorrent expects a folder with `public/` (login) and `private/` (main UI):

```
~/.config/qBittorrent/themes/applegui/
├── public/
│   ├── index.html
│   ├── login.html
│   ├── favicon.svg
│   └── assets/
└── private/
    ├── index.html
    ├── favicon.svg
    └── assets/
```

Source code is in `src/`.

## Credits

Icons are from [Colloid icon theme](https://github.com/vinceliuice/Colloid-icon-theme) by **vinceliuice**. Many thanks for the beautiful macOS-style icons.
