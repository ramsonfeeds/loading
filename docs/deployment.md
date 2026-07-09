# Deployment

## Backend on Railway

SQLite is deployable on Railway when the database file is stored on a persistent volume. Without a volume, the file may be lost during rebuilds or redeploys.

1. Create a Railway Node service from this repository.
2. Set the root directory to `backend`.
3. Add a Railway volume mounted at `/data`.
4. Add variables:

```text
SQLITE_DATABASE_PATH=/data/dispatch.sqlite
PORT=8080
CORS_ORIGIN=https://YOUR-NETLIFY-SITE.netlify.app
NODE_ENV=production
```

5. Build command:

```bash
npm ci && npm run build
```

6. Start command:

```bash
npm run start:migrate
```

For this internal dispatch app, SQLite is a good fit if you run one backend instance and keep the database on a persistent disk. It becomes a blocker only if you need multiple backend replicas writing at the same time, managed database backups, or external reporting integrations. In that case, move to Railway Postgres or MySQL.

## Frontend on Netlify

1. Set the base directory to `frontend`.
2. Build command:

```bash
npm ci && npm run build
```

3. Publish directory:

```text
dist/frontend/browser
```

4. Add variable:

```text
NG_APP_API_URL=https://YOUR-RAILWAY-BACKEND.up.railway.app/api
```

## Database

The API initializes SQLite tables automatically on startup. The SQL reference migration is in `database/migrations/001_init.sql`.
