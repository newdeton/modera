
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout, startAssessment } from "@/app/auth/actions";

type DashboardPageProps = {
  searchParams: Promise<{ message?: string; error?: string }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const [{ data: attempt, error: attemptError }, { count, error: scenarioError }] =
    await Promise.all([
      supabase
        .from("assessment_attempts")
        .select(
          "id, status, outcome, submitted_at, reviewed_at, started_at"
        )
        .eq("applicant_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("scenarios")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true),
    ]);

  const fullName =
    user.user_metadata?.full_name || user.email || "Applicant";

  const assessmentReady = !scenarioError && count === 20;
  const status = attemptError
    ? "Unable to load status"
    : !attempt
      ? "Not started"
      : attempt.status === "in_progress"
        ? "In progress"
        : attempt.status === "submitted"
          ? "Awaiting administrator review"
          : attempt.outcome === "approved"
            ? "Approved"
            : "Not approved";

  const statusDescription = attemptError
    ? "We couldn't load your assessment details. Please refresh the page."
    : !attempt
      ? assessmentReady
        ? "All 20 scenarios are ready. You can begin when you're ready."
        : "The assessment is being prepared. It will become available when all 20 scenarios are published."
      : attempt.status === "in_progress"
        ? "Continue your assessment where you left off."
        : attempt.status === "submitted"
          ? "Your answers have been submitted for administrator review."
          : attempt.outcome === "approved"
            ? "Your assessment has been reviewed and approved."
            : "Your assessment has been reviewed. Contact the administrator if you need clarification.";

  return (
    <main className="auth-shell">
      <section className="auth-card dashboard-card">
        <Link href="/" className="auth-brand">
          modera<span>.</span>
        </Link>

        <p className="auth-eyebrow">APPLICANT DASHBOARD</p>
        <h1>Welcome, {fullName}.</h1>
        <p className="auth-description">
          Manage your Modera assessment journey from here.
        </p>

        <div className="dashboard-panel">
          <span className="dashboard-label">ACCOUNT EMAIL</span>
          <strong>{user.email || "Not available"}</strong>

          <span className="dashboard-label">ASSESSMENT STATUS</span>
          <strong>{status}</strong>

          <p>{statusDescription}</p>

          {attempt?.status === "reviewed" && attempt.outcome && (
            <>
              <span className="dashboard-label">REVIEW OUTCOME</span>
              <strong>
                {attempt.outcome === "approved" ? "Approved" : "Not approved"}
              </strong>
            </>
          )}
        </div>

        {params.message === "already-started" && (
          <p className="auth-description" role="status">
            Your existing assessment has already been submitted or reviewed.
          </p>
        )}

        {params.error === "assessment" && (
          <p className="auth-description" role="alert">
            We couldn't start your assessment. Please try again.
          </p>
        )}

        {!attemptError && attempt?.status === "in_progress" && (
          <Link
            href={`/assessment?attempt=${attempt.id}`}
            className="auth-submit"
            style={{
              display: "block",
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            Continue Assessment
          </Link>
        )}

        {!attemptError && !attempt && (
          <>
            {assessmentReady ? (
              <form action={startAssessment}>
                <button className="auth-submit" type="submit">
                  Start Assessment
                </button>
              </form>
            ) : (
              <button className="auth-submit" type="button" disabled>
                Assessment Coming Soon
              </button>
            )}
          </>
        )}

        <form action={logout}>
          <button className="auth-submit" type="submit">
            Sign out
          </button>
        </form>

        <Link href="/" className="auth-back">
          Back to home
        </Link>
      </section>
    </main>
  );
}
