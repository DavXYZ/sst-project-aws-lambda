import type { FormEvent } from "react";

type CreateItemCardProps = {
  name: string;
  description: string;
  busy: boolean;
  disabled?: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
};

export function CreateItemCard({
  name,
  description,
  busy,
  disabled = false,
  onNameChange,
  onDescriptionChange,
  onCreate,
}: CreateItemCardProps) {
  const formDisabled = busy || disabled;

  return (
    <section className="card">
      <h2>Create item</h2>
      {disabled ? (
        <p className="muted">An active subscription is required to create items.</p>
      ) : null}
      <form className="form-grid" onSubmit={onCreate}>
        <input
          placeholder="Item name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          required
          disabled={formDisabled}
        />
        <input
          placeholder="Item description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          disabled={formDisabled}
        />
        <button type="submit" disabled={formDisabled}>
          {busy ? "Creating..." : "Create"}
        </button>
      </form>
    </section>
  );
}

