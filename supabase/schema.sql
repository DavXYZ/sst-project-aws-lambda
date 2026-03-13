create extension if not exists pgcrypto;

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_customers (
  user_id uuid primary key,
  stripe_customer_id text unique not null,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_subscriptions (
  user_id uuid primary key,
  stripe_subscription_id text unique not null,
  stripe_customer_id text not null,
  status text not null,
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_subscriptions_status_idx
  on public.billing_subscriptions (status);

create table if not exists public.billing_webhook_events (
  id text primary key,
  type text not null,
  created_at timestamptz not null default now()
);

