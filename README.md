# Dispatch Management System

Internal keyboard-first dispatch/loading sheet application for a cattle feed manufacturing company.

## Stack

- Angular 20 standalone frontend with Angular Material, CDK drag/drop, RxJS, signals, SCSS, strict TypeScript
- Node.js, Express.js, TypeScript backend
- SQLite database stored as a local file
- Netlify frontend deployment
- Railway backend deployment with a persistent volume for SQLite

## Quick Start

1. Create local environment files.

```bash
npm run setup:env
```

2. Install dependencies.

```bash
npm run install:all
```

3. Initialize and seed SQLite.

```bash
npm run db:init
npm run db:seed
```

4. Run the app.

```bash
npm run dev:backend
npm run dev:frontend
```

Frontend: `http://localhost:4200`

Backend: `http://localhost:8080/api/health`

Angular 20 requires Node `20.19+`, `22.12+`, or `24+`. The frontend scripts run Angular through Node `22.12.0` automatically so they work even if your installed Node is `22.11.0`.

SQLite is created automatically at `backend/data/dispatch.sqlite` by default. For deployment, point `SQLITE_DATABASE_PATH` at a persistent disk or volume path.

## Keyboard Flow

- `Enter`: move to the next field or accept autocomplete product
- `Shift+Enter`: move to previous field
- `Ctrl+Enter`: create a new group
- `Ctrl+S`: save
- `Ctrl+P`: print receipt

## Printing

The print view targets a receipt sheet of `10.5cm x 30cm`. Before printing, the frontend measures rendered content and applies proportional scaling so a dispatch fits on one page.

## Deployment

See [docs/deployment.md](docs/deployment.md).
