# Web Frontend

Vite React app for Supabase auth and CRUD against the SST API.

## Environment

Copy and fill env vars:

```bash
cp .env.example .env
```

Required:
- `VITE_API_URL`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

In SST, this app is deployed as a `StaticSite` (CloudFront + S3).
