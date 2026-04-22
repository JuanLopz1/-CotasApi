import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPetPostStats } from "../api/petPostsApi";
import { useToast } from "../context/ToastContext";

export default function AboutPage() {
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadStats(withSpinner = false) {
      if (withSpinner) {
        setStatsLoading(true);
      }
      try {
        const data = await getPetPostStats();
        if (!cancelled) {
          setStats(data);
        }
      } catch {
        if (!cancelled) {
          setStats(null);
          showToast("Could not refresh trust stats right now.", "info");
        }
      } finally {
        if (!cancelled && withSpinner) {
          setStatsLoading(false);
        }
      }
    }

    loadStats(true);
    const timer = window.setInterval(() => loadStats(false), 45000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [showToast]);

  return (
    <div className="about-page section-reveal">
      <header className="about-hero panel-soft">
        <p className="about-kicker">About +cotas</p>
        <h1 className="about-title">A gentle place for pets and the people who care for them</h1>
        <p className="about-lead">
          +cotas is a small, focused platform for adoption, lost-pet alerts, and found-pet reunions — designed to be
          clear, kind, and easy to use.
        </p>
        <div className="about-hero-cta-row">
          <Link className="btn btn-primary" to="/">
            Browse pets
          </Link>
          <Link className="btn btn-secondary" to="/login?from=%2F">
            Sign in
          </Link>
        </div>
      </header>

      <section className="panel about-block" aria-labelledby="what-heading">
        <h2 id="what-heading">What is +cotas?</h2>
        <p>
          +cotas brings together listings for pets who need a home, pets who are missing, and pets who have been found
          but still need their family. Each post is a starting point for a real conversation — by email, phone, or a
          simple private message thread in the app.
        </p>
      </section>

      <section className="panel about-block" aria-labelledby="problem-heading">
        <h2 id="problem-heading">The problem we help with</h2>
        <p>
          Important pet information often gets scattered across social feeds and group chats. It can be hard to know
          what&apos;s still current, who to contact, or how to help. +cotas keeps listings in one calm place with
          filters, clear contact options, and room for community notes — so the next step is always obvious.
        </p>
      </section>

      <section className="panel about-block about-stats" aria-labelledby="stats-heading">
        <h2 id="stats-heading">Live trust stats</h2>
        <p className="muted about-stats-lead">
          Updated from the current database to keep community progress transparent.
        </p>
        {statsLoading ? (
          <div className="about-stats-grid" aria-busy="true" aria-label="Loading statistics">
            <div className="about-stat-card about-stat-card--loading" />
            <div className="about-stat-card about-stat-card--loading" />
            <div className="about-stat-card about-stat-card--loading" />
          </div>
        ) : (
          <div className="about-stats-grid">
            <article className="about-stat-card">
              <p className="about-stat-value">{stats?.reunitedPets ?? 0}</p>
              <p className="about-stat-label">Pets reunited</p>
            </article>
            <article className="about-stat-card">
              <p className="about-stat-value">{stats?.activeListings ?? 0}</p>
              <p className="about-stat-label">Active listings</p>
            </article>
            <article className="about-stat-card">
              <p className="about-stat-value">{stats?.totalListings ?? 0}</p>
              <p className="about-stat-label">Total community posts</p>
            </article>
          </div>
        )}
      </section>

      <section className="panel about-block" aria-labelledby="flows-heading">
        <h2 id="flows-heading">Adoption, lost &amp; found</h2>
        <ul className="about-flow-list">
          <li>
            <strong>Adoption</strong> — Meet pets looking for a forever home. Save posts you love and reach out to the
            poster when you&apos;re ready.
          </li>
          <li>
            <strong>Lost</strong> — Share sightings and details so neighbors can help bring a missing pet home.
          </li>
          <li>
            <strong>Found</strong> — Connect with someone searching for a pet that matches what you&apos;ve found — safely
            and respectfully.
          </li>
        </ul>
      </section>

      <section className="panel about-block" aria-labelledby="do-heading">
        <h2 id="do-heading">What you can do here</h2>
        <ul className="about-checklist">
          <li>Browse and filter listings by category and type</li>
          <li>Open any post for full details and contact options</li>
          <li>Sign in to create listings, comment, message, and save adoption hearts</li>
          <li>Staff can review pending posts and keep the board safe</li>
        </ul>
      </section>

      <section className="panel about-block about-how" aria-labelledby="how-heading">
        <h2 id="how-heading">How it works</h2>
        <ol className="about-how-list">
          <li>
            <strong>Browse or search</strong> — Filter by adoption, lost, or found. Each card opens into a full page with
            photos and context.
          </li>
          <li>
            <strong>Reach out kindly</strong> — Use the action that fits the post: contact for adoption, a sighting for
            lost pets, or a match conversation for found animals. Add your phone or email only where you feel
            comfortable.
          </li>
          <li>
            <strong>Stay in the thread</strong> — Signed-in users can use private chat for back-and-forth, leave public
            notes, and save adoption posts they are considering.
          </li>
        </ol>
      </section>

      <section className="about-mission panel-soft" aria-labelledby="mission-heading">
        <h2 id="mission-heading">Our mission</h2>
        <p>
          We believe every pet deserves care, clarity, and a path home. +cotas exists to make those connections a little
          easier — one listing, one message, one reunion at a time.
        </p>
      </section>

      <div className="about-cta-band panel-soft">
        <p className="about-cta-band-lead">Ready to help a pet or find your next companion?</p>
        <div className="about-cta-row about-cta-row--band">
          <Link className="btn btn-primary about-cta-primary" to="/">
            Browse pets
          </Link>
          <Link className="btn btn-secondary about-cta-secondary" to="/login?from=%2Fcreate">
            Sign in
          </Link>
          <Link className="btn about-cta-tertiary" to="/register?from=%2Fcreate">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
