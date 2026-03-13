import type { Item } from "../lib/api";

type ItemsCardProps = {
  items: Item[];
  loading: boolean;
  busy: boolean;
  mutationsDisabled?: boolean;
  onRefresh: () => void;
  onUpdate: (item: Item) => void;
  onDelete: (id: string) => void;
};

export function ItemsCard({
  items,
  loading,
  busy,
  mutationsDisabled = false,
  onRefresh,
  onUpdate,
  onDelete,
}: ItemsCardProps) {
  return (
    <section className="card">
      <div className="card-header">
        <h2>Items</h2>
        <button className="ghost" onClick={onRefresh} disabled={loading || busy}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="inline-loading">
          <span className="spinner tiny" aria-hidden="true" />
          <span>Loading items...</span>
        </div>
      ) : mutationsDisabled ? (
        <p className="muted">Update and delete actions require an active subscription.</p>
      ) : items.length === 0 ? (
        <p className="muted">No items yet. Create your first item.</p>
      ) : (
        <ul className="item-list">
          {items.map((item) => (
            <li key={item.id} className="item-row">
              <div>
                <p className="item-name">{item.name}</p>
                <p className="muted">{item.description || "No description"}</p>
              </div>
              <div className="button-row">
                <button className="ghost" onClick={() => onUpdate(item)} disabled={busy || mutationsDisabled}>
                  Update
                </button>
                <button className="danger" onClick={() => onDelete(item.id)} disabled={busy || mutationsDisabled}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

