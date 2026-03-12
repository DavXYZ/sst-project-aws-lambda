# SST CRUD API + Vite React + Supabase Auth

This project includes:
- API Gateway v2 + 5 Lambda CRUD endpoints
- **API Gateway Lambda Authorizer** for Supabase JWT validation
- Supabase-backed data storage (`items` table)
- Supabase authentication (email/password)
- Vite React frontend deployed as an SST `StaticSite` (CloudFront + S3)

## Architecture

```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────┐
│  React App   │────▶│  API Gateway v2     │────▶│  Lambda      │
│  (CloudFront)│     │                     │     │  Handlers    │
└──────────────┘     │  ┌───────────────┐  │     └──────────────┘
					 │  │  Lambda       │  │            │
					 │  │  Authorizer   │  │            ▼
					 │  │  (validates   │  │     ┌──────────────┐
					 │  │  Supabase JWT)│  │     │  Supabase    │
					 │  └───────────────┘  │     │  (Postgres)  │
					 └─────────────────────┘     └──────────────┘
```

### How Auth Works

1. User logs in via React app using Supabase Auth
2. Supabase returns a JWT access token
3. React app sends requests with `Authorization: Bearer <token>`
4. API Gateway invokes the Lambda Authorizer
5. Authorizer validates token with Supabase and returns user context
6. If valid, request proceeds to the Lambda handler with user info
7. If invalid, API Gateway returns 401 Unauthorized

## Endpoints

- `POST /items`
- `GET /items`
- `GET /items/{id}`
- `PUT /items/{id}`
- `DELETE /items/{id}`

All endpoints require `Authorization: Bearer <supabase_access_token>`.

The Lambda authorizer (`src/authorizer.ts`) validates the token and passes user context (`userId`, `userEmail`) to the route handlers.

## Required Environment Variables

Create `.env` in the project root:

```bash
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

## Supabase Table Setup

Run `supabase/schema.sql` in Supabase SQL editor.

## Local Development

Install root dependencies:

```bash
cd /home/davit/sstproject
npm install
```

Install frontend dependencies:

```bash
cd /home/davit/sstproject/web
npm install
```

Run SST dev:

```bash
cd /home/davit/sstproject
npx sst dev --stage dev
```

In `sst dev`:
- API runs via Lambda/API Gateway
- Static site runs with local Vite dev server

## Deploy Dev Stage (CloudFront)

To deploy the API + static site to AWS (including CloudFront):

```bash
cd /home/davit/sstproject
npx sst deploy --stage dev
```

Outputs include:
- `api` URL
- `web` URL (CloudFront)

## Authenticated CRUD Testing

Use `test.http` in JetBrains HTTP client.

1. Set `@accessToken` to a valid Supabase access token from your logged-in user.
2. Run requests in order.

Or with curl:

```bash
API_URL="https://your-api-id.execute-api.us-east-1.amazonaws.com"
TOKEN="your_supabase_access_token"

curl -i -X GET "$API_URL/items" -H "Authorization: Bearer $TOKEN"
```

## CI/CD with GitHub Actions

This project includes GitHub Actions workflows for automated deployments.

### Environments

| Environment | Branch | Trigger |
|-------------|--------|---------|
| `dev` | `develop` | Auto on push |
| `staging` | - | Manual only |
| `production` | `main` | Auto on push |

### Required GitHub Secrets

Add these in **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

### Manual Deployment

1. Go to **Actions → Deploy SST**
2. Click **Run workflow**
3. Select stage (`dev`, `staging`, `production`)
4. Click **Run workflow**

### Branch Strategy

```
main (production)
  │
  └── develop (dev)
		│
		└── feature/xyz
```

See [.github/DEPLOYMENT.md](.github/DEPLOYMENT.md) for full CI/CD documentation.

