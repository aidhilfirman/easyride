# EasyRider Support Tracker

Internal ops dashboard for tracking rider support tickets. Deployed at https://easyride-beige.vercel.app/

## Tech Stack

- React 18 (loaded via CDN, no build step)
- Tailwind CSS (CDN)
- Babel standalone (in-browser JSX transpilation)
- Firebase Auth (email/password)
- Google Sheets backend via Apps Script
- Static hosting on Vercel

## File Map

```
index.html              — HTML shell, loads all scripts (edit rarely)
js/firebase-config.js   — Firebase project credentials (plain JS)
js/constants.js         — Status list, staff list, Sheet URL, fetch/send with retry
js/utils.js             — Date formatting, duration calc, debounce, ticket ID generator
js/login.js             — LoginPage component (register + sign in via Firebase Auth)
js/components.js        — ErrorBoundary, StatCard, Badge, Toasts, TicketDrawer, CreateTicketModal
js/app.js               — Main App component, Root wrapper, state management, render
```

## How to Edit

- **Change login/register page** → `js/login.js`
- **Change Firebase credentials** → `js/firebase-config.js`
- **Change sheet URL, staff list, or ticket send/fetch** → `js/constants.js`
- **Change date/duration logic** → `js/utils.js`
- **Change a form, modal, drawer, or card** → `js/components.js`
- **Change dashboard layout, filters, table, charts** → `js/app.js`
- **Add new CDN libraries** → `index.html`

## Conventions

- Styling: Tailwind utility classes only, no custom CSS
- All state lives in the App component (js/app.js)
- No build step — files are served as-is by Vercel
- `constants.js` and `utils.js` are plain JS (no JSX)
- `login.js`, `components.js`, and `app.js` use JSX (loaded as `type="text/babel"`)
- Staff names defined in STAFF_LIST constant (js/constants.js)
- Sheet API calls use sheetFetch() with automatic retry (3 attempts, exponential backoff)
- Toast notifications for save/delete feedback
- ErrorBoundary wraps App to prevent white-screen crashes

## Working Style

- User is non-technical — go straight to implementation, minimal explanation
- Keep code simple, efficient, no dead code
- When many edits are scattered across a file, rewrite the whole file instead of many small edits
- Modals must appear at top of screen (items-start), not centered
- Don't narrate every step — just deliver
- Start a new conversation when context gets long
- Current stable backup: commit 019c7e3

## UI Architecture

- **Compact table** (desktop): 5 columns — Rider, Issue, Status, Assigned, Duration
- **Mobile cards**: responsive card layout below md breakpoint
- **Drawer**: click any row to open slide-out panel with ALL fields + internal notes
- **SLA indicators**: left border color (rose=critical >3d, amber=warning >2d)
- **Debounced search**: 300ms delay for smooth filtering
