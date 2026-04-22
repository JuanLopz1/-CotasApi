import BrandLogo from "./BrandLogo";

function EntryScreen({ isLoading, error, onRetry }) {
  return (
    <main className="entry-screen" id="entry-main" tabIndex={-1}>
      <a href="#entry-main" className="skip-link">
        Skip to main content
      </a>
      <div className="entry-card" role="status" aria-live="polite" aria-busy={isLoading}>
        <BrandLogo className="entry-logo" alt="+cotas logo" />
        <h1 className="entry-screen-title">+cotas</h1>

        {isLoading ? (
          <>
            <p className="entry-screen-status">Gathering the latest listings for you…</p>
            <div className="entry-progress" aria-hidden="true">
              <span />
            </div>
            <p className="entry-hint">This only takes a moment.</p>
          </>
        ) : null}

        {error ? (
          <>
            <p className="entry-error">We could not reach the server. Check that the API is running and try again.</p>
            <button type="button" className="btn btn-primary entry-retry" onClick={onRetry}>
              Retry
            </button>
          </>
        ) : null}
      </div>
    </main>
  );
}

export default EntryScreen;
