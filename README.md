# qBt-MacLook

Alternative Web UI for qBittorrent-nox with macOS-style design.

![Theme screenshot (light)](screenshots/light-Screen%20Shot%202026-02-15%20at%2020.11.00.png)

## Why This Theme

This theme was created because there were no simple, lightweight alternative themes with native macOS styling for qBittorrent Web UI. The standard Web UI uses a legacy visual language.

## Differences from Standard Web UI

### Appearance

- **macOS design language**: Rounded controls (18px radius), elevated shadows, SF-style typography
- **Light and dark themes**: Automatic switching with system preference or manual selection
- **Finder-style table**: Zebra stripes, rounded rows, consistent row height across viewports
- **Unified toolbar**: Compact button groups with dividers, consistent spacing
- **Responsive layout**: Mobile-first with tablet and desktop optimizations; unified padding and font sizes across breakpoints

### Functionality

- Same qBittorrent API — all standard features (add, delete, pause, resume, search, settings)
- Detail panel for selected torrents (files, trackers, peers)
- Settings grouped by category (Appearance, Downloads, Connection, Speed, BitTorrent, Web UI)
- Password change in Web UI settings

## Installation

1. Build and deploy the theme:
   ```bash
   cd ~/qbt-maclook
   npm install
   npm run build:theme
   ```

2. In qBittorrent, set **Tools → Preferences → Web UI → Alternative Web UI** to:
   ```
   ~/.config/qBittorrent/themes/qbt-maclook
   ```
   (or the full path: `/home/YOUR_USER/.config/qBittorrent/themes/qbt-maclook`)

3. Restart qBittorrent and access the Web UI.

## Build Commands

- `npm run build:theme` — build Vite project and deploy to `~/.config/qBittorrent/themes/qbt-maclook`
- `npm run clean` — remove `dist/` and `.vite/`
- `npm run build` — build only (output in `dist/`, no deploy)
- `npm run dev` — development server with HMR

## Structure

qBittorrent expects a folder with `public/` (login) and `private/` (main UI):

```
~/.config/qBittorrent/themes/qbt-maclook/
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
