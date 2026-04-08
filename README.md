<p align="center">
  <img src="https://8upload.com/image/7b4ef792c841520b/group_tool_banner.png" alt="Group Tool Banner" />
</p>

<h1 align="center">VRChat Legends Group Tool</h1>

<p align="center">
  A Windows desktop companion for VRChat Legends group management, moderation workflows, and local utility tools.
</p>

<p align="center">
  <a href="https://github.com/VRChat-Legends/VRChat-Legends-Group-Tool">GitHub</a>
  ·
  <a href="http://vrchatlegends.com/shop">Official Shop</a>
  ·
  <a href="https://www.patreon.com/VRChatLegends">Patreon</a>
</p>

---

## Overview

This repository contains the source for the **VRChat Legends Group Tool**.
It combines a Python backend with a React/Vite frontend to provide a more polished desktop workflow for VRChat group operations.

### Included areas

- Group and friend data helpers
- Local dashboard and embedded web UI
- Moderation and member-management utilities
- Discord/webhook integration
- Analytics, logging, caching, and backup helpers
- Auto-update and installer support for packaged builds

---

## Important notice

- This is a **paid tool/project** tied to the VRChat Legends ecosystem.
- The source is visible for transparency and community visibility.
- Do **not** resell, repackage, or impersonate official VRChat Legends releases.
- Please support the project through the official links above.

---

## Getting started

### Official build users

1. Download the latest installer or EXE from the official VRChat Legends channels.
2. Run the installer and complete first-time setup.
3. Launch the app and sign in with your VRChat account.
4. Allow update checks on startup for the smoothest experience.

### Build from source (Windows)

**Requirements**

- Python `3.11+`
- Node.js `18+`
- npm

**1) Install Python dependencies**

```powershell
pip install -r requirements.txt
```

**2) Build the frontend**

```powershell
cd frontend
npm install
npm run build
cd ..
```

**3) Start the app**

```powershell
python vrchat_auto_accept.py
```

> Private helper scripts, local planning docs, and compiled binaries are intentionally kept out of the public GitHub repo.

---

## Project layout

| Path | Purpose |
| --- | --- |
| `app/` | Python application logic, auth, updater, Discord, caching, analytics |
| `frontend/` | React/Vite interface |
| `assets/` | Branding, icons, and bundled static resources |
| `data/` | Local runtime data generated on the user's machine |

---

## Privacy and local data

This project is intended to store its working data **locally on the user's machine**.
If you enable third-party integrations, only those services you configure should receive related data.

---

## Support policy

Support is primarily for **official distributed builds**.
If you self-build from source, you are responsible for your environment, packaging flow, and troubleshooting.

---

## Credits

- VRChat Legends team
- Community testers and supporters
- Open-source tools used by the project: Python, Flask, PyInstaller, React, Vite, and `vrchatapi`

---

## Antivirus / false positive notice

Unsigned or newly compiled executables are often flagged by antivirus engines as a **false positive**, particularly when built with PyInstaller.

**Why this happens:**
- The executable is unsigned (no code-signing certificate yet)
- New binaries have no established reputation score
- PyInstaller packaging patterns can trigger heuristic detections

**What to do:**
1. Download only from official VRChat Legends channels
2. Verify the file hash matches the published release
3. Upload the file to VirusTotal to review multi-engine results
4. Add a local AV exclusion only if you trust the source and hash

Reference scan of the official build: [VirusTotal report](https://www.virustotal.com/gui/file/ed91c263fafb3a5bcbcfdb253d344b5ca8e2caea0d94309ef51df68e8baa2bae)

---

## Star history

<a href="https://www.star-history.com/?repos=VRChat-Legends%2FVRChat-Legends-Group-Tool&type=date&legend=top-left">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=VRChat-Legends/VRChat-Legends-Group-Tool&type=date&theme=dark&legend=top-left" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=VRChat-Legends/VRChat-Legends-Group-Tool&type=date&legend=top-left" />
    <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=VRChat-Legends/VRChat-Legends-Group-Tool&type=date&legend=top-left" />
  </picture>
</a>

---

## License

This project is licensed under the **GNU General Public License v3.0**.  
See [`LICENSE`](LICENSE) for the full license text.

---

> **Not affiliated with, endorsed by, or in any way officially connected to VRChat Inc.**  
> VRChat is a trademark of VRChat Inc. All VRChat-related trademarks and content belong to their respective owners.
