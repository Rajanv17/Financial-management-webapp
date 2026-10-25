# Financial Management Web App

A full-stack personal financial application for tracking income and expenses, setting budgets, and understanding where your money goes, with a dashboard that turns raw transactions into clear visual insight.

![CI](https://github.com/Rajanv17/Financial-management-webapp/actions/workflows/ci.yml/badge.svg)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

**Live demo:** _coming soon_

<!-- ![Dashboard](docs/screenshots/dashboard.png) -->

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Architecture Decisions](#architecture-decisions)
- [Development Workflow](#development-workflow)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Features

- **User authentication**: secure registration and login using JWT.
- **Transactions**: record income and expenses, each tied to a category and an account.
- **Categories**: organize transactions with custom categories.
- **Accounts**: bank, cash, wallet, and credit card balances, with a default Unassigned account for new users.
- **Budgets**: create and track budgets across categories.
- **Dashboard**: overview of income, expenses, and financial health with charts.

---

## Tech Stack

| Layer          | Technology                                       |
| -------------- | ------------------------------------------------ |
| Frontend       | React, TypeScript, Vite, shadcn/ui, Tailwind CSS |
| Backend        | Node.js, Express, TypeScript                     |
| Database       | PostgreSQL, Prisma ORM                           |
| Authentication | JWT (access and refresh tokens)                  |
| CI/CD          | GitHub Actions, auto-deploy on merge to `main`   |

---

## Project Structure

```
Financial-management-webapp/
├── backend/              # Express API (routes, controllers, services, middleware)
│   ├── prisma/           # Prisma schema and migrations
│   ├── .env.example      # Local API env, including DATABASE_URL for finance_dev
│   └── .env.test.example # Test database URL (name must end with _test)
├── frontend/             # React dashboard (shadcn/ui + Tailwind)
│   └── .env.example      # VITE_API_URL
├── docker/
│   ├── postgres.env      # Local Postgres credentials (not for production)
│   └── postgres/init/    # Creates finance_dev and finance_test on first start
├── docker-compose.yml    # Local Postgres 16 only (the app is not containerised)
├── docs/screenshots/     # README screenshots
├── .github/
│   └── workflows/        # CI pipeline (typecheck, lint, and tests on every push and PR)
├── .gitignore
├── LICENSE
├── package.json          # db:up, db:down, db:reset
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20.19 or later (CI runs on Node.js 22)
- npm
- Docker Engine with Compose V2 (for local Postgres). A native PostgreSQL 14+ install also works; see the note under step 2.

### 1. Clone the repository

```bash
git clone https://github.com/Rajanv17/Financial-management-webapp
cd Financial-management-webapp
```

### 2. Start Postgres

From the repository root:

```bash
npm run db:up
```

This starts a PostgreSQL 16 container, publishes it on `127.0.0.1:5433` (Postgres inside the container still uses 5432), and creates `finance_dev` (app) and `finance_test` (tests). Data is stored in a named Docker volume. Host port 5433 avoids clashing with a native Postgres on 5432.

- `npm run db:down` stops the container and **keeps** the volume.
- `npm run db:reset` is **destructive**: it removes the volume (all local Compose Postgres data) and starts a fresh container.

If you skip Compose and use native Postgres, create the databases yourself (`createdb finance_dev` and `createdb finance_test`) and set `DATABASE_URL` to port `5432` with your local credentials.

### 3. Set up the backend

```bash
cd backend
npm install
cp .env.example .env     # then fill in your own values

npm run migrate:dev      # create the tables from the Prisma migrations
npm run seed:categories  # optional: add the default categories

npm run dev
```

### 4. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
cp .env.example .env     # sets VITE_API_URL; skip if you already have .env
npm run dev
```

### 5. Use the app

1. Create an account or log in.
2. Add bank, cash, wallet, or credit card accounts (a default Unassigned account is created for you).
3. Add income and expense transactions.
4. Set up budgets for different categories.
5. Open the dashboard to view your analytics.

---

## Environment Variables

Copy `.env.example` to `.env` in each app folder and fill in the values. Never commit real `.env` files. Integration tests use a separate `backend/.env.test` (see [Testing](#testing)).

### Backend (`backend/.env`)

| Variable                                        | Description                                                                                                                      |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                      | `development` or `production`                                                                                                    |
| `PORT`                                          | Port the API listens on                                                                                                          |
| `DATABASE_URL`                                  | PostgreSQL connection string, e.g. `postgresql://postgres:postgres@localhost:5433/finance_dev` (Compose host port)               |
| `CORS_ORIGIN`                                   | Exact frontend origin allowed by CORS, e.g. `http://localhost:5173`                                                              |
| `ACCESS_TOKEN_SECRET` / `ACCESS_TOKEN_EXPIRY`   | Secret and lifetime for access tokens (e.g. `1d`)                                                                                |
| `REFRESH_TOKEN_SECRET` / `REFRESH_TOKEN_EXPIRY` | Secret and lifetime for refresh tokens (e.g. `7d`)                                                                               |
| `COOKIE_SAMESITE`                               | `lax`, `strict`, or `none`. Used in production; development always uses `lax`                                                    |
| `TRUST_PROXY`                                   | `false`, `true`, or a hop count such as `1` so `req.ip` is the client address behind a reverse proxy                             |
| `AUTH_RATE_LIMIT_MAX`                           | Max login, register, and refresh-token requests per window per IP (default `10`)                                                 |
| `AUTH_RATE_LIMIT_WINDOW_MS`                     | Rate-limit window in milliseconds (default `900000`, 15 minutes)                                                                 |
| `DEMO_USERNAME`                                 | Optional. Username for `npm run seed:demo` (defaults to `demo`). The script looks up an existing user and never creates accounts |
| `DEMO_USERNAME_ALLOW`                           | Optional. Set to allow seeding a username other than `demo`                                                                      |

### Frontend (`frontend/.env`)

| Variable       | Description                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL` | Backend API base URL including `/api/v1`, e.g. `http://localhost:8000/api/v1`. Must match `CORS_ORIGIN` |

---

## Testing

Backend tests run with Vitest. From `backend/`:

```bash
cp .env.test.example .env.test   # first time only; default URL is finance_test
npm test
```

`npm run db:up` already creates `finance_test`. If you use native Postgres instead, create that database yourself (`createdb finance_test`).

Integration tests load `backend/.env.test` (not `.env`). The `DATABASE_URL` in that file must name a database whose name ends with `_test` (for example `finance_test`). The suite refuses to run against any other database.

---

## Architecture Decisions

Short notes on why things are built the way they are. This section grows as the project does.

- **Single repository, separate `backend` and `frontend` folders.** One place to clone, review, and run CI, while keeping the API and the UI independently deployable.
- **PostgreSQL for financial data.** Money data is relational by nature (users, categories, transactions, budgets), and ACID transactions plus foreign key constraints keep balances and references consistent. SQL aggregations power the dashboard totals and budget vs. actual comparisons.
- **Decimal types for money.** Amounts are stored as exact decimals, never floating point, to avoid rounding errors.
- **Stateless auth with JWT.** Keeps the API simple to scale and easy to test.
- **Business logic kept out of route handlers.** Controllers stay thin and logic lives in services, which makes it testable in isolation.

---

## Development Workflow

- **Branches:** `main` is protected and always deployable. New work happens on feature branches (for example `feat/budget-limits`) and merges through a pull request.
- **Commits:** follow [Conventional Commits](https://www.conventionalcommits.org/), using `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, and `chore:`.
- **CI:** every pull request and every push to `main` runs two GitHub Actions jobs. The backend job starts a PostgreSQL 16 service container, typechecks, and runs tests against a dedicated `finance_test` database. The frontend job lints (warnings do not fail the job) and builds with `VITE_API_URL=/api/v1`.
- **Deploy:** not automated yet.

---

## Contributing

Contributions are welcome.

1. Fork the repository and create a feature branch.
2. Follow the existing code style and the commit convention above.
3. Make sure `npm run typecheck` and `npm run build` pass in `backend`, and `npm run lint` and `npm run build` pass in `frontend`.
4. Open a pull request describing what changed and why.

---

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See the [LICENSE](LICENSE) file for details.

---

## Contact

Rajan Vasani: rajanvasani17@gmail.com
