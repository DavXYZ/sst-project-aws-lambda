import type { SubscriptionStatus } from "../lib/api";

type SubscriptionCardProps = {
  subscription: SubscriptionStatus | null;
  loading: boolean;
  busy: boolean;
  onRefresh: () => void;
  onStartSubscription: () => void;
  onManageBilling: () => void;
};

export function SubscriptionCard({
  subscription,
  loading,
  busy,
  onRefresh,
  onStartSubscription,
  onManageBilling,
}: SubscriptionCardProps) {
  const statusLabel = subscription?.status ?? "not_started";
  const active = Boolean(subscription?.subscribed);

  return (
    <section className="card">
      <div className="card-header">
        <h2>Subscription</h2>
        <button className="ghost" onClick={onRefresh} disabled={loading || busy}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <p className="muted">
        Current status: <span className={`plan-badge ${active ? "active" : "inactive"}`}>{statusLabel}</span>
      </p>

      {subscription?.currentPeriodEnd ? (
        <p className="muted">Current period ends: {new Date(subscription.currentPeriodEnd).toLocaleString()}</p>
      ) : null}

      <div className="button-row">
        {active ? (
          <button onClick={onManageBilling} disabled={busy}>
            {busy ? "Opening..." : "Manage billing"}
          </button>
        ) : (
          <button onClick={onStartSubscription} disabled={busy}>
            {busy ? "Starting..." : "Start subscription"}
          </button>
        )}
      </div>
    </section>
  );
}

