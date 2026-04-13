# EasyRider Support Tracker

Internal ops dashboard for tracking rider support tickets. Deployed at https://easyride-beige.vercel.app/

## Tech Stack

- React 18 (loaded via CDN, no build step)
- Tailwind CSS (CDN)
- Babel standalone (in-browser JSX transpilation)
- Static hosting on Vercel

## File Map

```
index.html              — HTML shell, loads all scripts (edit rarely)
js/firebase-config.js   — Firebase project credentials (plain JS)
js/constants.js         — Status list, Google Sheet URL, fetch/send functions
js/utils.js             — Date formatting, duration calc, ticket builder
js/login.js             — LoginPage component (register + sign in via Firebase Auth)
js/components.js        — StatCard, Badge, TicketDrawer, CreateTicketModal
js/app.js               — Main App component, Root wrapper, state management, render
```

## How to Edit

- **Change login/register page** → `js/login.js`
- **Change Firebase credentials** → `js/firebase-config.js`
- **Change sheet URL or ticket send/fetch** → `js/constants.js`
- **Change date/duration logic** → `js/utils.js`
- **Change a form, modal, or card** → `js/components.js`
- **Change dashboard layout, filters, charts** → `js/app.js`
- **Add new CDN libraries** → `index.html`

## Conventions

- Styling: Tailwind utility classes only, no custom CSS
- All state lives in the App component (js/app.js)
- No build step — files are served as-is by Vercel
- `constants.js` and `utils.js` are plain JS (no JSX)
- `components.js` and `app.js` use JSX (loaded as `type="text/babel"`)
