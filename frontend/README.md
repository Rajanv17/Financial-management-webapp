# Finance Manager frontend

Vite 7 + React 19 UI for recording INR income and expenses, monthly budgets, and categories. Auth uses httpOnly cookies; the browser never stores tokens.

## Run locally

1. Start the API from `backend/` (see the repo root README). CORS must allow the Vite origin, usually `http://localhost:5173`.
2. Copy the env file. `VITE_API_URL` must include `/api/v1` and match the API origin:

   ```bash
   cp .env.example .env
   ```

   Default:

   ```
   VITE_API_URL=http://localhost:8000/api/v1
   ```

3. Install and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

   Open `http://localhost:5173`. Login is **username + password** (`POST /user/login`). Requests use `credentials: "include"`. Do not put tokens in `localStorage` or an `Authorization` header.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite development server |
| `npm run build` | Typecheck (`tsc -b`) and production bundle |
| `npm run preview` | Serve the production build |
| `npm run lint` | ESLint |

## Notes

- Recurring, Investments, and Analytics have no backend yet. Those routes stay in the app, show a **Preview – not saved** badge, and do not persist.
- Goals, Transfers, Reports, and Accounts are not in the nav until they exist.
- This UI is built for readable contrast, visible focus, and keyboard use of dialogs. It has **not** been audited against WCAG and is **not** claimed to conform.
