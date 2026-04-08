import BrandLogo from "./BrandLogo";

function EntryScreen({ onEnter }) {
  return (
    <main className="entry-screen">
      <div className="entry-card">
        <BrandLogo className="entry-logo" alt="+cotas logo" />
        <h1>+cotas</h1>
        <p>Loading pets, stories, and rescue updates...</p>

        <div className="entry-progress">
          <span />
        </div>

        <button type="button" className="btn btn-primary entry-btn" onClick={onEnter}>
          Enter App
        </button>

        <p className="entry-hint">Admin beta login: admin@example.com / admin123</p>
      </div>
    </main>
  );
}

export default EntryScreen;
