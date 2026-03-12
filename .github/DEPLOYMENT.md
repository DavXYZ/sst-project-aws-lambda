# GitHub Actions CI/CD Setup

This project uses GitHub Actions to deploy to multiple environments.

## Environments

| Environment | Branch | Trigger |
|-------------|--------|---------|
| `dev` | `develop` | Push to develop, or manual |
| `staging` | - | Manual only |
| `production` | `main` | Push to main, or manual |

## Required GitHub Secrets

Go to **Settings → Secrets and variables → Actions** and add these secrets:

### Repository Secrets (shared across all environments)

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

### Per-Environment Secrets (optional override)

You can also set environment-specific secrets in **Settings → Environments**.

Create these environments:
- `dev`
- `staging`
- `production`

Each environment can have:
- Its own AWS credentials (different AWS accounts)
- Its own Supabase project credentials
- Protection rules (approvals, wait timers)

### Repository Variables (optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `AWS_REGION` | `us-east-1` | AWS region for deployment |

## Workflows

### Deploy (`deploy.yml`)

**Automatic triggers:**
- Push to `develop` → Deploy to **dev**
- Push to `main` → Deploy to **production**

**Manual trigger:**
1. Go to **Actions → Deploy SST**
2. Click **Run workflow**
3. Select stage: `dev`, `staging`, or `production`
4. Click **Run workflow**

### Remove (`remove.yml`)

**Manual only** (to prevent accidental deletion):
1. Go to **Actions → Remove SST Stack**
2. Click **Run workflow**
3. Select stage to remove
4. Type `REMOVE` to confirm
5. Click **Run workflow**

## AWS IAM Policy

Create an IAM user for GitHub Actions with this minimum policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "s3:*",
        "lambda:*",
        "apigateway:*",
        "iam:*",
        "logs:*",
        "cloudfront:*",
        "route53:*",
        "acm:*",
        "ssm:*",
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

> ⚠️ For production, scope down permissions to specific resources.

## Branch Strategy

```
main (production)
  │
  └── develop (dev)
        │
        └── feature/xyz (local dev)
```

1. Create feature branches from `develop`
2. PR to `develop` → Auto-deploys to dev
3. PR from `develop` to `main` → Auto-deploys to production
4. Use manual workflow for staging tests

## Troubleshooting

### "Locked" error during deploy

If deployment fails with lock error:

```bash
npx sst unlock --stage <stage>
```

Or wait for the previous deployment to finish.

### Missing secrets

Check that all required secrets are configured in GitHub.

### Permission denied

Verify AWS IAM user has sufficient permissions.

