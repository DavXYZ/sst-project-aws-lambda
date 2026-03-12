type StatusBannerProps = {
  message?: string;
  error?: string;
};

export function StatusBanner({ message, error }: StatusBannerProps) {
  if (!message && !error) {
    return null;
  }

  return (
    <section className="status-stack" aria-live="polite">
      {message ? <p className="status-banner success">{message}</p> : null}
      {error ? <p className="status-banner error">{error}</p> : null}
    </section>
  );
}

