type UserBarProps = {
  email: string;
  onLogout: () => void;
  busy: boolean;
};

export function UserBar({ email, onLogout, busy }: UserBarProps) {
  return (
    <section className="card user-bar">
      <div>
        <p className="muted">Signed in as</p>
        <p className="user-email">{email}</p>
      </div>
      <button className="ghost" onClick={onLogout} disabled={busy}>
        {busy ? "Logging out..." : "Logout"}
      </button>
    </section>
  );
}

