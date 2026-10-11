# Financial Management Web App

A full-stack personal financial application for tracking income and expenses, setting budgets, and understanding where your money goes, with a dashboard that turns raw transactions into clear visual insight.

![CI](https://github.com/<your-username>/Finance-Management-Webapp/actions/workflows/ci.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

**Live demo:** _coming soon (add the deployed URL here once the app is live)_

<!-- ![Dashboard](docs/screenshots/dashboard.png) -->

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Architecture Decisions](#architecture-decisions)
- [Development Workflow](#development-workflow)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Features

- **User authentication**: secure registration and login using JWT.
- **Transactions**: record income and expenses, each tied to a category.
- **Categories**: organize transactions with custom categories.
- **Budgets**: create and track budgets across categories.
- **Dashboard**: overview of income, expenses, and financial health with charts.

---

## Tech Stack

| Layer          | Technology                                     |
| -------------- | ---------------------------------------------- |
| Frontend       | React, shadcn/ui, Tailwind CSS                 |
| Backend        | Node.js, Express                               |
| Database       | PostgreSQL                                     |
| Authentication | JWT                                            |
| CI/CD          | GitHub Actions, auto-deploy on merge to `main` |

---

## Project Structure

```
Financial-Management-Webapp/
├── Backend/              # Express API (routes, controllers, services, models, middleware)
├── Frontend/             # React dashboard (shadcn/ui + Tailwind)
├── .github/
│   └── workflows/        # CI pipelines (lint + test on every push and PR)
├── .env.example          # Environment variable names (no real values)
├── .gitignore
├── LICENSE
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm
- PostgreSQL 14 or later (local install, Docker, or a hosted instance)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/Financial-Management-Webapp.git
cd Financial-Management-Webapp
```

### 2. Create the database

```bash
createdb finance_app
```

### 3. Set up the backend

```bash
cd Backend
npm install
cp .env.example .env     # then fill in your own values
# run database migrations here (add the command for your setup)
npm run dev
```

### 4. Set up the frontend

Open a second terminal:

```bash
cd Frontend
npm install
npm run dev
```

### 5. Use the app

1. Create an account or log in.
2. Add income and expense transactions.
3. Set up budgets for different categories.
4. Open the dashboard to view your analytics.

---

## Environment Variables

Copy `.env.example` to `.env` in the `Backend` folder and fill in the values. Never commit the real `.env` file.

| Variable         | Description                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------- |
| `PORT`           | Port the API listens on                                                                           |
| `DATABASE_URL`   | PostgreSQL connection string, for example `postgresql://user:password@localhost:5432/finance_app` |
| `JWT_SECRET`     | Secret used to sign access tokens                                                                 |
| `JWT_EXPIRES_IN` | Token lifetime (for example `1d`)                                                                 |
| `CLIENT_URL`     | Frontend origin allowed by CORS                                                                   |

---

## Architecture Decisions

Short notes on why things are built the way they are. This section grows as the project does.

- **Single repository, separate `Backend` and `Frontend` folders.** One place to clone, review, and run CI, while keeping the API and the UI independently deployable.
- **PostgreSQL for financial data.** Money data is relational by nature (users, categories, transactions, budgets), and ACID transactions plus foreign key constraints keep balances and references consistent. SQL aggregations power the dashboard totals and budget vs. actual comparisons.
- **Decimal types for money.** Amounts are stored as exact decimals, never floating point, to avoid rounding errors.
- **Stateless auth with JWT.** Keeps the API simple to scale and easy to test.
- **Business logic kept out of route handlers.** Controllers stay thin and logic lives in services, which makes it testable in isolation.

---

## Development Workflow

- **Branches:** `main` is protected and always deployable. New work happens on feature branches (for example `feat/budget-limits`) and merges through a pull request.
- **Commits:** follow [Conventional Commits](https://www.conventionalcommits.org/), using `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, and `chore:`.
- **CI:** every push and pull request runs linting and tests through GitHub Actions. A change merges only when the checks pass.
- **Deploy:** merging to `main` triggers an automatic deployment of the backend and frontend.

---

## Contributing

Contributions are welcome.

1. Fork the repository and create a feature branch.
2. Follow the existing code style and the commit convention above.
3. Add or update tests for your change.
4. Open a pull request describing what changed and why.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Contact

Rajan Vasani: rajanvasani17@gmail.com
