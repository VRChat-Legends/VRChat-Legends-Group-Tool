# VRChat Legends Group Tool – Project Specification

## CORE PRINCIPLE (CRITICAL – DO NOT BREAK ANYTHING)

⚠️ **Do NOT break existing working functionality.**

- Do not remove functional systems unless explicitly instructed.
- Do not rewrite stable backend logic unnecessarily.
- Maintain backward compatibility with:
  - Saved data
  - Configurations
  - Queue logic
  - Commands
  - Logs
  - MOTD
  - Role locks
  - Cooldowns
- Improvements must layer on top.
- No regressions.
- Preserve current architecture and enhance it.
- Improve stability without disrupting existing behavior.

---

## 1. CORE APPLICATION DIRECTION

Transform the VRChat Group Tool into a polished Windows desktop PC application with:

- Embedded web-based UI
- No external browser required
- No manual IP access
- Auto-load internal interface
- Pull data from web backend internally
- Fully responsive layout
- Modern animations
- Smooth transitions
- Professional design language
- Production-level polish

This must feel like a commercial moderation suite.

---

## 2. INSTALLER & EXE SYSTEM

### Single EXE Distribution

The distributed **.exe** must:

- Not open a console window
- Be GUI-only
- Have embedded application icon
- Not rely on external **.ico** path
- Embed images, assets, and MP4 intro
- Work when sent to other users
- Require no missing file dependencies

### First-Run Installer Behavior

When launched for the first time:

1. Act as installer
2. Prompt for installation path (default: `%APPDATA%\VRChatGroupTool`)
3. Allow custom path selection
4. Ask: Create Desktop Shortcut? (Yes/No), Create Start Menu Shortcut? (Yes/No)
5. Extract all necessary files
6. Copy executable into install directory
7. Desktop shortcut must point to installed EXE
8. Installed EXE skips installer stage on future runs

### File Dump Behavior

- Installer copies main EXE to install directory
- Shortcuts launch installed EXE
- Installer does not run again once installed

### Uninstall System

Inside **Settings → Advanced / Dangerous → Danger Zone**:

- Uninstall Button
- Mandatory confirmation popup
- Remove: Installed files, Local data, Shortcuts

### build.bat

- Builds production release EXE
- Embeds icon
- Embeds assets
- Disables console window
- Packages everything cleanly

---

## 3. RUNTIME DETECTION SYSTEM

On first launch:

If Python or Node.js is missing:

- Show clean in-app dialog
- Provide official download links
- Allow re-check after installation
- If a needed addon (e.g. Node.js) is missing: prompt with ability to **auto-download** and add to PATH; once done, close the app and have the user reopen it.

Must guide non-technical users.

---

## 4. UI & UX IMPROVEMENTS

**Global:** Remove excessive blank space, improve layout density, modern dark theme, smooth animations, clean typography, subtle transitions, fully resizable panels, resizable tabs, cohesive layout, professional polish.

**Remove:**

- Non-functional Warning button
- Orange banner
- Old MOTD section location
- EDIT bio button

**Chat:** “Magic Chat Box” style: option to shrink the background of the chat box while keeping text the same; add a toggle to turn this on/off.

---

## 5. NAVIGATION STRUCTURE (SIMPLIFIED)

Combine into:

- **Dashboard**
- **Members**
- **Moderation**
- **Discord**
- **Settings**

Reduce tab clutter.

---

## 6. DASHBOARD

Display: Bot uptime, Current VRChat world, Queue size, Time until next queue switch, Active %motd%, AI status widget (AI Online/Offline, Memory enabled/disabled, Discord connected/disconnected).

Add: Restart Button (confirmation required), Resizable panels.

---

## 7. PROFILE SYSTEM

Redesign profile cards: modern layout, clean spacing, 3-line hamburger menu, status badges (Online, Left Lobby, In Queue).

Fix: Robot avatar bug; ensure correct VRChat skin/avatar.

Add avatar link to: Logs, Profile view.

---

## 8. MEMBERS SECTION

Include: Friends, Lobby users, Blocked users.

Add: Block Button (confirmation required), Persistent saving.

---

## 9. LOGGING SYSTEM

Logs must include: Username, Avatar/skin link, Join/leave status, Current world, Queue activity, Role lock events, Cooldown violations, AI actions, AI file access events. All dangerous actions require confirmation popup.

---

## 10. DISCORD INTEGRATION

Structured Discord configuration tab. Token fields: Discord Bot Token, OpenAI API Key; encrypted local storage.

---

## 11. CUSTOM COMMAND SYSTEM

**Prefix commands** (e.g. `!command`): Message-based handler, role lock, time cooldown per user, character limit control.

**Slash commands** (e.g. `/uptime`): Auto-sync with Discord, command tree, register on startup.

---

## 12. %MOTD% SYSTEM

Display %motd% on dashboard. Discord: `/motd_add "message"`. Features: character limit, role lock, per-user cooldown, show current queue, show time until next switch, persistent saving, survives restart.

---

## 13. DISCORD WELCOME SYSTEM

**Discord → Welcome System**

- Welcome Channel Selection (dropdown, validate bot permissions)
- Welcome Message: Enable/Disable, Plain message mode, Embed mode
- **Embed Builder (full UI):** Embed Title, Description, Color, Thumbnail/Image URL, Footer text & icon, Author name & icon, Timestamp toggle, multiple custom fields (Name, Value, Inline)
- **Variables:** `{user}`, `{username}`, `{server}`, `{memberCount}`, `{joinDate}`
- **Preview** panel in app
- **Safety:** AI must NEVER modify welcome messages unless explicitly allowed

---

## 14. UNIFIED AI SYSTEM (DESKTOP + DISCORD)

AI in Desktop app and Discord (channels + optional DMs). Single unified AI system.

**Desktop:** New tab 🤖 AI Assistant – chat interface, scrollable history, timestamps, clear conversation, export, memory/token usage indicator, AI status.

**Discord:** Respond in channels (toggle), in DMs (toggle), when pinged, via prefix `!ai`, optional fully automatic mode.

**Shared Memory Toggle:** ON = unified memory; OFF = separate stores. Persistent across restarts.

**Permission toggles:** Enable AI in Desktop/Discord, read all channels, respond in DMs, moderate, execute commands, auto-respond, share memory, memory depth limit, context limit.

**Advanced AI Access (Dangerous, default OFF):** Allow AI to read application logs and local files. If enabled: confirmation, read-only, logged, sandboxed to install directory. Sub-toggles: Read Logs, Read Config, Read Exported Data, Read Queue History. AI must NEVER modify/delete files, execute OS commands, or access outside install directory.

**CRITICAL AI MENTION RESTRICTION:** AI must NEVER mention @everyone, @here, any @roleID, output raw role IDs, or trigger mass notifications. If requested, AI must refuse. Applies to Desktop, Discord, DMs, Welcome system, any generated content.

---

## 15. DATA MANAGEMENT

Persistent saving for: Queue, MOTD, Commands, Blocked users, Role locks, Cooldowns, AI memory, Welcome settings, Embed configs, Logs, Settings. Auto-save required.

**Export:** “Export All Data” – organized JSON (Settings, Logs, Users, AI memory, Queue, Commands, Welcome config).

---

## 16. LOGIN SYSTEM

Remember Me checkbox; store encrypted email/password locally; auto-fill next launch; encrypted file storage.

---

## 17. OPEN FILE LOCATION BUTTON

**Settings → General:** Button “Open File Location” – opens install directory in file explorer, highlight main EXE if possible; work with custom paths.

---

## 18. STARTUP EXPERIENCE

Embedded MP4 intro; skippable; disable toggle in settings; smooth fade into dashboard.

---

## 19. PERFORMANCE & SAFETY

Crash recovery, auto-backups, safe mode launch, startup validation, async AI operations, API health indicators (VRChat, Discord, OpenAI).

---

## 20. ABOUT SECTION

MIT License, Terms of Service, Privacy Policy. Clearly state: **We do NOT collect any data. All data is stored locally on the user’s machine and is never transmitted to us.**

---

## ADDITIONAL REQUIREMENTS (FROM USER)

- **Remove** the OG UI that lingered in the code before Node.js was installed.
- If a **needed addon** (e.g. Node.js) is not found: prompt with ability to **auto-download** and add to PATH; then close the app and have the user reopen it.
- **Chat:** “Magic Chat Box” style – shrink background of chat box but keep text the same; add toggle on/off.
- **Remove** audio and playlist features entirely.
- **Fix** Friends tab: dividers, categories, filters, favorites (some not working).
- Let users **add friends to favorites** for both VRChat (via API) and for the app itself; put in its own divider, category, and filter.
- **VRChat API:** Add button to **refresh** VRChat API and button to **toggle** its use completely; when OFF the app must not make ANY API calls to any API until turned back on.
- **VRChat Status:** Use [VRChat Status](https://status.vrchat.com/) – add a tab or sub-tab for **live updates** (API: `https://status.vrchat.com/api/v2/summary.json`).

---

## FINAL EXPECTATION

Commercial-grade, stable, secure, modular, non-destructive, backward compatible, visually modern, cohesive, production-ready, intelligent, professionally engineered.
