
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export const dynamic = "force-dynamic";

type AttemptStatus = "in_progress" | "submitted" | "reviewed";

type AdminPageProps = {
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function AdminPage({
  searchParams,
}: AdminPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  if (user.app_metadata?.role !== "admin") {
    redirect("/dashboard");
  }

  const params = await searchParams;

  const [
    { data: profiles, error: profilesError },
    { data: attempts, error: attemptsError },
    { data: scenarios, error: scenariosError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, created_at")
      .order("created_at", { ascending: false }),

    supabase
      .from("assessment_attempts")
      .select(
        "id, applicant_id, status, outcome, created_at, submitted_at, reviewed_at"
      )
      .order("created_at", { ascending: false }),

    supabase
      .from("scenarios")
      .select("id, scenario_number, title, is_published")
      .order("scenario_number", { ascending: true }),
  ]);

  const safeProfiles = profiles ?? [];
  const safeAttempts = attempts ?? [];
  const safeScenarios = scenarios ?? [];

  const profileById = new Map(
    safeProfiles.map((profile) => [profile.id, profile])
  );

  const attemptsByApplicant = new Map<
    string,
    (typeof safeAttempts)[number]
  >();

  // Attempts are ordered newest first, so preserve the latest attempt.
  for (const attempt of safeAttempts) {
    if (!attemptsByApplicant.has(attempt.applicant_id)) {
      attemptsByApplicant.set(attempt.applicant_id, attempt);
    }
  }

  const submittedAttempts = safeAttempts.filter(
    (attempt) => attempt.status === "submitted"
  );

  const reviewedCount = safeAttempts.filter(
    (attempt) => attempt.status === "reviewed"
  ).length;

  const inProgressCount = safeAttempts.filter(
    (attempt) => attempt.status === "in_progress"
  ).length;

  const publishedCount = safeScenarios.filter(
    (scenario) => scenario.is_published
  ).length;

  const draftCount = safeScenarios.filter(
    (scenario) => !scenario.is_published
  ).length;

  const missingScenarioNumbers = Array.from(
    { length: 20 },
    (_, index) => index + 1
  ).filter(
    (number) =>
      !safeScenarios.some(
        (scenario) => scenario.scenario_number === number
      )
  );

  const formatDate = (value: string | null) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Africa/Nairobi",
    }).format(date);
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "in_progress":
        return "In progress";
      case "submitted":
        return "Awaiting review";
      case "reviewed":
        return "Reviewed";
      default:
        return status.replaceAll("_", " ");
    }
  };

  const outcomeLabel = (outcome: string | null) => {
    switch (outcome) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return "—";
    }
  };

  return (
    <main className="auth-shell">
      <section
        className="auth-card"
        style={{ width: "100%", maxWidth: 1100 }}
      >
        <header>
          <Link href="/" className="auth-brand">
            modera<span>.</span>
          </Link>

          <p className="auth-eyebrow">ADMINISTRATION</p>

          <h1>Admin dashboard</h1>

          <p className="auth-description">
            Manage applicants, assessment scenarios, and review
            progress from one place.
          </p>
        </header>

        {params.error && (
          <p className="scenario-message scenario-error" role="alert">
            {params.error === "review"
              ? "The assessment could not be reviewed. Check that it is submitted and try again."
              : "Something went wrong. Please check your changes and try again."}
          </p>
        )}

        {params.success && (
          <p
            className="scenario-message scenario-success"
            role="status"
          >
            {params.success === "reviewed"
              ? "Assessment review completed successfully."
              : "Your changes were saved successfully."}
          </p>
        )}

        {(profilesError || attemptsError || scenariosError) && (
          <p role="alert" className="auth-description">
            Some dashboard data could not be loaded. Check the
            administrator database permissions and refresh the page.
            Statistics for unavailable data are shown as dashes.
          </p>
        )}

        <div className="admin-stats">
          <div className="admin-stat">
            <span>Total applicants</span>
            <strong>
              {profilesError ? "—" : safeProfiles.length}
            </strong>
          </div>

          <div className="admin-stat">
            <span>Awaiting review</span>
            <strong>
              {attemptsError ? "—" : submittedAttempts.length}
            </strong>
          </div>

          <div className="admin-stat">
            <span>Reviewed attempts</span>
            <strong>
              {attemptsError ? "—" : reviewedCount}
            </strong>
          </div>

          <div className="admin-stat">
            <span>Published scenarios</span>
            <strong>
              {scenariosError
                ? "—"
                : `${publishedCount} / 20`}
            </strong>
          </div>
        </div>

        <nav
          className="admin-quick-actions"
          aria-label="Admin quick actions"
        >
          <Link
            href="/admin/scenarios"
            className="admin-action-primary"
          >
            <span>Manage scenarios</span>
            <span aria-hidden="true">→</span>
          </Link>

          <a href="#review-queue" className="admin-action-secondary">
            Review queue ({attemptsError ? "—" : submittedAttempts.length})
          </a>

          <a href="#applicants" className="admin-action-secondary">
            View applicants
          </a>
        </nav>

        <section className="admin-section" id="review-queue">
          <h2>Assessment review queue</h2>

          <p className="auth-description">
            Review submitted assessments and record an approval or
            rejection decision.
          </p>

          {attemptsError ? (
            <p>Unable to load assessment attempts.</p>
          ) : submittedAttempts.length === 0 ? (
            <p>No assessments are currently awaiting review.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {submittedAttempts.map((attempt) => {
                    const profile = profileById.get(
                      attempt.applicant_id
                    );

                    return (
                      <tr key={attempt.id}>
                        <td>
                          {profile?.full_name || "Unnamed applicant"}
                        </td>
                        <td>{statusLabel(attempt.status)}</td>
                        <td>{formatDate(attempt.submitted_at)}</td>
                        <td>
                          <Link
                            href={`/admin/reviews/${attempt.id}`}
                          >
                            Review assessment
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-section" id="applicants">
          <h2>Applicants</h2>

          <p className="auth-description">
            View registration dates and the latest assessment status
            for each applicant.
          </p>

          {profilesError ? (
            <p>Unable to load applicants.</p>
          ) : safeProfiles.length === 0 ? (
            <p>No applicant profiles found yet.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Assessment status</th>
                    <th>Decision</th>
                    <th>Registered</th>
                  </tr>
                </thead>

                <tbody>
                  {safeProfiles.map((profile) => {
                    const latestAttempt = attemptsByApplicant.get(
                      profile.id
                    );

                    return (
                      <tr key={profile.id}>
                        <td>
                          {profile.full_name || "Unnamed applicant"}
                        </td>

                        <td>
                          {latestAttempt
                            ? statusLabel(latestAttempt.status)
                            : "Not started"}
                        </td>

                        <td>
                          {outcomeLabel(latestAttempt?.outcome ?? null)}
                        </td>

                        <td>{formatDate(profile.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-section" id="scenarios">
          <div className="admin-section-heading">
            <div>
              <h2>Assessment scenarios</h2>
              <p className="auth-description">
                {scenariosError
                  ? "Scenario statistics are unavailable."
                  : `${publishedCount} of 20 scenarios published · ${draftCount} drafts`}
              </p>
            </div>

            <Link
              href="/admin/scenarios"
              className="admin-action-primary"
            >
              Manage scenarios →
            </Link>
          </div>

          {!scenariosError && (
            <div
              className="scenario-progress-track"
              role="progressbar"
              aria-label="Published assessment scenarios"
              aria-valuemin={0}
              aria-valuemax={20}
              aria-valuenow={publishedCount}
            >
              <div
                className="scenario-progress-fill"
                style={{
                  width: `${(publishedCount / 20) * 100}%`,
                }}
              />
            </div>
          )}

          {scenariosError ? (
            <p>Unable to load scenarios.</p>
          ) : safeScenarios.length === 0 ? (
            <p>
              No scenarios have been added yet. Use Manage scenarios
              to create the assessment questions.
            </p>
          ) : (
            <>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Title</th>
                      <th>Publishing status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {safeScenarios.map((scenario) => (
                      <tr key={scenario.id}>
                        <td>{scenario.scenario_number}</td>
                        <td>{scenario.title}</td>
                        <td>
                          {scenario.is_published
                            ? "Published"
                            : "Draft"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {missingScenarioNumbers.length > 0 && (
                <p className="auth-description">
                  Missing scenario numbers:{" "}
                  {missingScenarioNumbers.join(", ")}.
                </p>
              )}
            </>
          )}
        </section>

        <section className="admin-section">
          <h2>Assessment activity</h2>

          <div className="admin-stats">
            <div className="admin-stat">
              <span>In-progress attempts</span>
              <strong>
                {attemptsError ? "—" : inProgressCount}
              </strong>
            </div>

            <div className="admin-stat">
              <span>Total attempts</span>
              <strong>
                {attemptsError ? "—" : safeAttempts.length}
              </strong>
            </div>
          </div>
        </section>

        <footer className="admin-footer">
          <Link href="/dashboard" className="auth-back">
            Applicant dashboard
          </Link>

          <form action={logout}>
            <button type="submit" className="admin-signout">
              Sign out
            </button>
          </form>
        </footer>
      </section>
    </main>
  );
}
