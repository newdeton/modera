const features = [
  {
    number: "01",
    icon: "↗",
    title: "Register transparently",
    description:
      "Review the registration fee, assessment rules, and eligibility conditions before you begin.",
  },
  {
    number: "02",
    icon: "◎",
    title: "Complete 20 chat scenarios",
    description:
      "Practice with clearly identified assessment scenarios designed to evaluate communication and moderation skills.",
  },
  {
    number: "03",
    icon: "✓",
    title: "Receive your outcome",
    description:
      "Your application can be reviewed against the published criteria. Registration does not guarantee approval or an award.",
  },
];

const principles = [
  "Clear registration and eligibility terms",
  "Assessment scenarios disclosed in advance",
  "No guaranteed earnings or approval claims",
  "Withdrawals handled under the published policy",
];

export default function Home() {
  return (
    <main>
      <div className="announcement">
        A transparent approach to online chat moderation
      </div>

      <header className="site-header">
        <a className="brand" href="#" aria-label="Modera home">
          <span className="brand-mark">M</span>
          <span>
            modera<span className="brand-period">.</span>
            <small>MODERATION PLATFORM</small>
          </span>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#standards">Our standards</a>
          <a href="#terms">Terms</a>
        </nav>

        <a className="button button-dark header-button" href="#register">
          Get started <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" />
            BUILT AROUND TRANSPARENCY
          </div>

          <h1>
            Better conversations.
            <br />
            <span>Clearer standards.</span>
          </h1>

          <p className="hero-description">
            Explore chat moderation, practice your communication skills, and
            understand the assessment process before you apply.
          </p>

          <div className="hero-actions">
            <a className="button button-dark" href="#register">
              Explore registration <span aria-hidden="true">→</span>
            </a>
            <a className="text-link" href="#how-it-works">
              Discover how it works <span aria-hidden="true">↗</span>
            </a>
          </div>

          <div className="hero-note">
            <span className="note-icon">✓</span>
            <span>Published rules. Clear expectations. Honest outcomes.</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Illustration of a chat moderation workspace">
          <div className="visual-glow" />
          <div className="visual-topline">
            <span>MODERA WORKSPACE</span>
            <span className="workspace-indicator">
              <span className="status-dot" /> DEMO
            </span>
          </div>

          <div className="workspace-card">
            <div className="workspace-heading">
              <div>
                <span className="mini-label">YOUR DEVELOPMENT JOURNEY</span>
                <h2>Build your skills.</h2>
              </div>
              <div className="round-icon">✳</div>
            </div>

            <div className="progress-label">
  <span>ASSESSMENT LIBRARY</span>
  <span>20 SCENARIOS</span>
</div>
<div className="progress-track">
  <div className="progress-fill" />
</div>
<p className="workspace-caption">
  Explore the format before beginning an assessment.
</p>

            <div className="scenario-card">
              <div className="scenario-avatar">M</div>
              <div className="scenario-copy">
                <strong>Communication practice</strong>
                <span>Sample assessment scenario</span>
              </div>
              <span className="scenario-arrow">↗</span>
            </div>

            <div className="scenario-card">
              <div className="scenario-avatar avatar-gold">✓</div>
              <div className="scenario-copy">
                <strong>Review the criteria</strong>
                <span>Understand the published standards</span>
              </div>
              <span className="scenario-arrow">↗</span>
            </div>

            <div className="workspace-foot">
              <span className="foot-symbol">i</span>
              <span>Illustrative preview — not a live assessment or score.</span>
            </div>
          </div>

          <div className="floating-note">
            <span className="floating-check">✓</span>
            <span>
              <strong>Clarity first</strong>
              <small>Know the rules before you apply</small>
            </span>
          </div>
          <div className="visual-orbit orbit-one" />
          <div className="visual-orbit orbit-two" />
        </div>
      </section>

      <section className="metrics" aria-label="Platform overview">
        <div className="metric">
          <strong>20</strong>
          <span>Practice scenarios</span>
        </div>
        <div className="metric">
          <strong>KSh 100</strong>
          <span>Proposed registration fee</span>
        </div>
        <div className="metric">
          <strong>4 days</strong>
          <span>Published withdrawal policy</span>
        </div>
        <div className="metric metric-last">
          <strong>100%</strong>
          <span>Commitment to clear terms</span>
        </div>
      </section>

      <section className="section how-section" id="how-it-works">
        <div className="section-heading">
          <div>
            <div className="eyebrow">A CLEAR PATH FORWARD</div>
            <h2>
              Know what to expect.
              <br />
              <span>At every step.</span>
            </h2>
          </div>
          <p>
            No hidden assessment conditions or promises of guaranteed income.
            Understand the process before making a decision.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <div className="feature-number">{feature.number}</div>
              <div className="feature-decoration">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="standards-section" id="standards">
        <div className="standards-copy">
          <div className="eyebrow eyebrow-light">OUR COMMITMENT</div>
          <h2>
            Trust is built
            <br />
            <span>through clarity.</span>
          </h2>
          <p>
            We believe applicants deserve to know the conditions, the review
            process, and the limits of what a platform can promise.
          </p>
          <a className="button button-light" href="#terms">
            Read our terms <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="standards-list">
          {principles.map((principle) => (
            <div className="standard-item" key={principle}>
              <span className="standard-check">✓</span>
              <span>{principle}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section terms-section" id="terms">
        <div className="eyebrow">BEFORE YOU APPLY</div>
        <h2>Understand the terms.</h2>
        <p className="terms-intro">
          Here is the proposed framework for registration and assessment.
          Final terms must be confirmed before any real payments are accepted.
        </p>

        <div className="terms-grid">
          <article className="term-card" id="register">
            <span className="term-label">REGISTRATION</span>
            <strong className="term-price">KSh 100</strong>
            <p>
              Proposed registration fee. The payment process and verification
              method must be configured before registration goes live.
            </p>
            <a className="button button-dark full-button" href="mailto:support@modera.example?subject=Modera%20registration%20enquiry">
              Enquire about registration <span aria-hidden="true">→</span>
            </a>
          </article>

          <article className="term-card">
            <span className="term-label">ASSESSMENT</span>
            <strong className="term-title">20 scenarios</strong>
            <p>
              Applicants should be told that scenarios may be simulated for
              assessment purposes. Any scoring and approval criteria must be
              published before the assessment begins.
            </p>
          </article>

          <article className="term-card">
            <span className="term-label">AWARDS & WITHDRAWALS</span>
            <strong className="term-title">Clear conditions</strong>
            <p>
              Any proposed KSh 30 award is conditional on the published
              eligibility and approval rules, not guaranteed by registration.
              The proposed withdrawal processing period is four working days,
              subject to the final policy.
            </p>
          </article>
        </div>

        <p className="disclaimer">
          Important: Modera is currently a website prototype. Accounts,
          payment verification, assessment scoring, awards, withdrawals, and
          live activity records are not yet connected. No payment or award
          should be represented as processed until it has actually been
          verified.
        </p>
      </section>

      <section className="closing-cta">
        <div>
          <div className="eyebrow eyebrow-light">START WITH THE FACTS</div>
          <h2>Make an informed decision.</h2>
          <p>Review the process and terms before registering.</p>
        </div>
        <a className="button button-light" href="#register">
          Review registration <span aria-hidden="true">→</span>
        </a>
      </section>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#">
          <span className="brand-mark">M</span>
          <span>
            modera<span className="brand-period">.</span>
            <small>MODERATION PLATFORM</small>
          </span>
        </a>
        <span>© {new Date().getFullYear()} Modera. Prototype version.</span>
        <a href="mailto:support@modera.example">Contact</a>
      </footer>
    </main>
  );
}
