import type { FormEvent } from "react";

type CreateItemCardProps = {
  name: string;
  description: string;
  busy: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
};

export function CreateItemCard({
  name,
  description,
  busy,
  onNameChange,
  onDescriptionChange,
  onCreate,
}: CreateItemCardProps) {
  return (
    <section className="card">
      <h2>Create item</h2>
      <form className="form-grid" onSubmit={onCreate}>
        <input
          placeholder="Item name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          required
          disabled={busy}
        />
        <input
          placeholder="Item description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          disabled={busy}
        />
        <button type="submit" disabled={busy}>
          {busy ? "Creating..." : "Create"}
        </button>
      </form>
    </section>
  );
}

