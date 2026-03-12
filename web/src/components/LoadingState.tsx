type LoadingStateProps = {
  title: string;
  subtitle?: string;
  fullscreen?: boolean;
};

export function LoadingState({ title, subtitle, fullscreen = false }: LoadingStateProps) {
  return (
    <div className={fullscreen ? "loading-wrap fullscreen" : "loading-wrap"}>
      <span className="spinner" aria-hidden="true" />
      <p className="loading-title">{title}</p>
      {subtitle ? <p className="loading-subtitle">{subtitle}</p> : null}
    </div>
  );
}

