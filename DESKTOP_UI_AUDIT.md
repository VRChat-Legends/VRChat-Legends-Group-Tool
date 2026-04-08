# Desktop UI quality – audit & backlog

This document implements the **Desktop app UI quality** plan: chosen dimensions, a walkthrough of main routes against that lens, and an ordered backlog (no changes to the plan file itself).

---

## 1. Prioritized dimensions (3)

These are the axes used for the audit below. They map directly to the plan’s checklist (platform fit, interaction, accessibility).

| # | Dimension | Why it matters for this app |
|---|-----------|-----------------------------|
| **D1** | **Keyboard navigation & accessibility** | Desktop users expect Tab/Enter/Esc, visible focus, and dialogs that work with the keyboard and screen readers. pywebview + React is still a desktop shell. |
| **D2** | **Resize, layout reflow & visual hierarchy** | `PROJECT_SPEC.md` calls for a responsive, commercial-grade layout; narrow/tall windows must not clip primary actions or overlap nav/content. |
| **D3** | **Loading states, errors & recoverability** | Heavy VRChat API usage needs clear “working / failed / what next” feedback; aligns with plan §2 and §4. |

---

## 2. Route & shell audit

### 2.1 Global shell

| Item | Finding | Severity |
|------|---------|----------|
| **Skip link** | No “skip to main content” link for keyboard users. | Medium |
| **`<main>` landmark** | [`Layout.jsx`](frontend/src/components/Layout.jsx) uses `<main>` (good). Could add `id="main-content"` for skip target. | Low |
| **Focus visibility** | [`index.css`](frontend/src/index.css) has no global `:focus-visible` ring; focus can be hard to see on dark theme. | Medium |
| **Reduced motion** | No app-level `@media (prefers-reduced-motion: reduce)` for `animate-in`, spinners, `btn-shine`, etc. (Font Awesome CSS includes it for icons only.) | Low |
| **NavBar** | [`NavBar.jsx`](frontend/src/components/NavBar.jsx): good `aria-hidden` on decorative icons; mobile toggle has `aria-label`. Dropdown triggers lack **`aria-expanded` / `aria-controls`**; menus are not roving-tab lists. | Medium |
| **Confirm / alert modal** | [`ConfirmModal.jsx`](frontend/src/components/ConfirmModal.jsx): no **`role="dialog"`**, **`aria-modal`**, **initial focus**, **focus trap**, or **Escape** to dismiss. Backdrop click cancels confirm (good) but parity with Esc is missing. | High |
| **Other modals** | [`FriendUserCard.jsx`](frontend/src/components/FriendUserCard.jsx), [`UserProfileModal.jsx`](frontend/src/components/UserProfileModal.jsx): same dialog pattern gaps; close on overlay click only. | High |
| **HTML shell** | [`index.html`](frontend/index.html): `lang="en"`, viewport, theme-color (good). | — |

### 2.2 `/dashboard` – [`Dashboard.jsx`](frontend/src/pages/Dashboard.jsx)

| Item | Finding | Severity |
|------|---------|----------|
| **Loading** | Initial “Loading…” state (good). After load, 3s polling updates without global “syncing” indicator—acceptable for background refresh. | Low |
| **Primary actions** | Invite / friend / event actions use toasts on success/fail (good). No **disabled/busy** on buttons during in-flight HTTP. | Medium |
| **Profile edit** | Bio/status save has `savingProfile` disable on submit (good). | Low |
| **Information density** | Many stats cards; hierarchy is generally clear; very small viewports may need more vertical stacking (mostly OK with grid). | Low |
| **Tray messaging** | Tray/minimized banner when API exposes flags (good per desktop expectations). | — |

### 2.3 `/people` – [`People.jsx`](frontend/src/pages/People.jsx), [`Members.jsx`](frontend/src/pages/Members.jsx), [`Group.jsx`](frontend/src/pages/Group.jsx)

| Item | Finding | Severity |
|------|---------|----------|
| **Keyboard** | Friend/member tiles are `<button>`s in many places (good). Lobby name opens profile via **double-click**—easy to miss for keyboard-only users; no single-focus equivalent. | Medium |
| **Loading** | Members/Group show loading text; Refresh buttons lack explicit pending state. | Low |
| **Resize** | Grids use responsive column counts; overflow scroll regions present (good). | Low |

### 2.4 `/settings` – [`Settings.jsx`](frontend/src/pages/Settings.jsx)

| Item | Finding | Severity |
|------|---------|----------|
| **Save feedback** | Toasts on save (good). | Low |
| **Busy state** | Long operations (export, uninstall) don’t disable repeat clicks globally. | Low |
| **Grouping** | Bento/grid cards give clear sections (good hierarchy). | Low |
| **Trust copy** | Danger zone + uninstall copy is explicit (good for plan §6). | — |

### 2.5 `/integrations` – [`Integrations.jsx`](frontend/src/pages/Integrations.jsx), [`Chatbox.jsx`](frontend/src/pages/Chatbox.jsx), [`AI.jsx`](frontend/src/pages/AI.jsx), [`Discord.jsx`](frontend/src/pages/Discord.jsx)

| Item | Finding | Severity |
|------|---------|----------|
| **Chatbox** | Tag buttons and preview (good discoverability). | Low |
| **API errors** | Failures surface via toast + generic `Error` from client in many paths. | Medium |

### 2.6 API client – [`client.js`](frontend/src/api/client.js)

| Item | Finding | Severity |
|------|---------|----------|
| **Error payload** | Uses `err.error || res.statusText || 'Request failed'`—no structured **code**, **hint**, or **retry** guidance from backend in the UI layer. | Medium |
| **401** | Redirect to `/login` (good). | — |

### 2.7 Backend (brief)

| Item | Finding | Severity |
|------|---------|----------|
| **JSON errors** | Flask routes generally return `{"error": "..."}`; enriching with optional `hint` / `code` would unlock better desktop-grade messages without breaking clients. | Low (enhancement) |

---

## 3. Ordered backlog (scoped to D1–D3)

Work items are ordered: **foundational a11y → dialogs → feedback → polish**. Respect [`PROJECT_SPEC.md`](PROJECT_SPEC.md) (no regressions; layer improvements).

### P0 – Highest impact

1. **Modal accessibility kit** – Add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (or label), focus trap, initial focus on primary or first control, **Escape** to dismiss (confirm: map to Cancel). Apply to [`ConfirmModal.jsx`](frontend/src/components/ConfirmModal.jsx), then mirror pattern in [`FriendUserCard`](frontend/src/components/FriendUserCard.jsx) and [`UserProfileModal`](frontend/src/components/UserProfileModal.jsx).
2. **Global focus-visible** – In [`index.css`](frontend/src/index.css), add `:focus-visible` outlines/rings that meet contrast on `#0a0a0a` (avoid removing focus for mouse users).
3. **Skip link** – In [`Layout.jsx`](frontend/src/components/Layout.jsx) (or `App.jsx`), add visually hidden “Skip to main content” link targeting `<main id="main-content">`.

### P1 – Strong desktop fit

4. **Nav dropdown ARIA** – On [`NavBar.jsx`](frontend/src/components/NavBar.jsx), set `aria-expanded`, optional `aria-controls` + `id` on menu panels; consider Escape to close desktop dropdowns.
5. **Action buttons busy state** – Dashboard (and similar) primary POST actions: disable + `aria-busy` while `handle()` promise pending.
6. **API error hints** – Extend selected Flask error JSON with optional `hint` (string); in [`client.js`](frontend/src/api/client.js), append hint to `Error.message` or pass to toast helper.

### P2 – Polish

7. **prefers-reduced-motion** – In [`index.css`](frontend/src/index.css), reduce/disable `animate-in`, long transitions, and shine animations when `prefers-reduced-motion: reduce`.
8. **Lobby keyboard path** – In [`Members.jsx`](frontend/src/pages/Members.jsx), offer single **Enter** to open profile (or explicit “View profile” control) in addition to double-click.
9. **Settings / export** – Disable or spin primary button during long async actions to prevent double-submit.

---

## 4. Completion checklist (plan todos)

| Plan todo | Status |
|-----------|--------|
| Choose 2–3 dimensions | Done – **D1, D2, D3** in §1 |
| Walk main routes; note gaps & quick wins | Done – §2 |
| Ordered backlog | Done – §3 |

---

*Reference framework: desktop platform fit, performance perception, visual hierarchy, interaction design, accessibility, security/trust, and docs—as in the attached plan.*
