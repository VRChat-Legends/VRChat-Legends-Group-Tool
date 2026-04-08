<p align="center">
  <img src="https://8upload.com/image/7b4ef792c841520b/group_tool_banner.png" alt="Group Tool Banner" />
</p>

<h1 align="center">VRChat Legends Group Tool</h1>

<p align="center">
  A desktop tool for VRChat group management workflows used by VRChat Legends.
</p>

<p align="center">
  <a href="https://github.com/VRChat-Legends/VRChat-Legends-Group-Tool">GitHub Repository</a>
  ·
  <a href="http://vrchatlegends.com/shop">Official Shop</a>
  ·
  <a href="https://www.patreon.com/VRChatLegends">Patreon</a>
</p>

---

## Important Notice

- This is a **paid tool**.  
- The source code is provided free of charge for transparency and community visibility.  
- You may not resell, redistribute, or repackage paid builds of this tool.  
- Please respect the project and support continued development through the official links:
  - [http://vrchatlegends.com/shop](http://vrchatlegends.com/shop)
  - [https://www.patreon.com/VRChatLegends](https://www.patreon.com/VRChatLegends)

## Quick Start (Official EXE)

If you purchased access to the official build:

1. Download the latest installer or EXE from official VRChat Legends channels.
2. Run the installer (or portable EXE).
3. Open the app and sign in with your VRChat account.
4. Allow the app to check for updates on startup.

## Build It Yourself (Source Build)

If you want to build from source on Windows:

1. Install Python 3.11+ and Node.js 18+.
2. Create your own local build workflow (PowerShell commands or private scripts).
3. Build the frontend and package the Python app for your environment.

> Note: local helper batch files used for private testing are intentionally not part of the GitHub upload.

### Support Policy for Self-Builds

We do **not** provide support for custom/self-built versions of this tool.  
If you build from source, you are responsible for your own build environment, dependencies, and troubleshooting.

## Auto Update Behavior

On app startup, the tool checks this repository for the latest published release:

- Repository: [https://github.com/VRChat-Legends/VRChat-Legends-Group-Tool](https://github.com/VRChat-Legends/VRChat-Legends-Group-Tool)
- If a newer release is available, the app notifies you.
- Frozen/installed builds attempt to download and launch the latest Windows installer automatically when possible.

## Antivirus / False Positive Information

Unsigned or newly built executables are frequently flagged by antivirus scanners as a **false positive**, especially when built with tools such as PyInstaller.

Why this happens:

- The executable is unsigned or has low reputation.
- The binary is newly compiled and not widely distributed.
- Packaging behavior can look similar to malware heuristics.

If your self-built EXE is flagged:

1. Upload the file to VirusTotal and review multi-engine results.
2. Confirm file hash and source code integrity.
3. Add a local AV exclusion only if you trust the source and hash.
4. Prefer official distributed builds when possible.

Reference scan:

- [VirusTotal report](https://www.virustotal.com/gui/file/ed91c263fafb3a5bcbcfdb253d344b5ca8e2caea0d94309ef51df68e8baa2bae)

## Setup and Info Video

A setup and overview video is coming soon.

## Credits

- VRChat Legends team - concept, operations, and maintenance
- Community supporters - testing and feedback
- Open-source ecosystem:
  - Python
  - Flask
  - PyInstaller
  - React / Vite
  - VRChat API SDK

## Star History

<a href="https://www.star-history.com/?repos=VRChat-Legends%2FVRChat-Legends-Group-Tool&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=VRChat-Legends/VRChat-Legends-Group-Tool&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=VRChat-Legends/VRChat-Legends-Group-Tool&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=VRChat-Legends/VRChat-Legends-Group-Tool&type=date&legend=top-left" />
 </picture>
</a>
