export default function LoadingScreen() {
  return (
    <div className="loading-screen" role="status" aria-live="polite" aria-label="読み込み中">
      <div className="loading-spinner-wrap">
        <div className="loading-spinner-track" />
        <div className="loading-spinner-ring" />
        <div className="loading-logo" />
      </div>
      <p>読み込み中...</p>
      <div className="loading-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

