import type { FormEvent } from "react";

type AuthCardProps = {
  email: string;
  password: string;
  busy: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSignIn: (event: FormEvent<HTMLFormElement>) => void;
  onSignUp: () => void;
};

export function AuthCard({
  email,
  password,
  busy,
  onEmailChange,
  onPasswordChange,
  onSignIn,
  onSignUp,
}: AuthCardProps) {
  return (
    <section className="card auth-card">
      <h2>Welcome back</h2>
      <p className="muted">Sign in or create an account to use CRUD endpoints.</p>

      <form onSubmit={onSignIn} className="form-grid">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          required
          disabled={busy}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          required
          disabled={busy}
        />

        <div className="button-row">
          <button type="submit" disabled={busy}>
            {busy ? "Please wait..." : "Login"}
          </button>
          <button type="button" className="ghost" disabled={busy} onClick={onSignUp}>
            Sign Up
          </button>
        </div>
      </form>
    </section>
  );
}

