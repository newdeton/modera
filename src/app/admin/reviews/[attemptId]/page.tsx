
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout, reviewAssessment } from "@/app/auth/actions";

type ReviewPageProps = {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
  searchParams,
}: ReviewPageProps) {
  const { attemptId } = await params;
  const query = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");
  if (user.app_metadata?.role !== "admin") redirect("/dashboard");

  const { data: attempt, error: attemptError } = await supabase
    .from("assessment_attempts")
    .select(
      "id, applicant_id, status, outcome, review_notes, started_at, submitted_at, reviewed_at"
    )
    .eq("id", attemptId)
    .maybeSingle();

  if (attemptError || !attempt) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <Link href="/admin" className="auth-brand">
            modera<span>.</span>
          </Link>
          <h1>Assessment not found</h1>
          <p className="auth-description">
            This assessment could not be loaded. Check the link and try again.
          </p>
          <Link href="/admin" className="auth-back">
            Back to admin dashboard
          </Link>
        </section>
      </main>
    );
  }

  const [
    { data: applicant },
    { data: scenarios, error: scenariosError },
    { data: responses, error: responsesError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", attempt.applicant_id)
      .maybeSingle(),
    supabase
      .from("scenarios")
      .select("id, scenario_number, title, prompt")
      .order("scenario_number", { ascending: true }),
    supabase
      .from("assessment_responses")
      .select("scenario_id, response_text")
      .eq("attempt_id", attempt.id),
  ]);

  const responseByScenario = new Map(
    (responses ?? []).map((response) => [
      response.scenario_id,
      response.response_text,
    ])
  );

  const formatDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Africa/Nairobi",
        }).format(new Date(value))
      : "—";

  const canReview = attempt.status === "submitted";
  const dataError = scenariosError || responsesError;

  return (
    <main className="auth-shell">
      <section className="auth-card review-card">
        <Link href="/admin" className="auth-brand">
          modera<span>.</span>
        </Link>

        <p className="auth-eyebrow">ASSESSMENT REVIEW</p>
        <h1>{applicant?.full_name || "Applicant submission"}</h1>
        <p className="auth-description">
          Read the submitted answers carefully before recording a decision.
        </p>

        <div className="dashboard-panel">
          <span className="dashboard-label">ASSESSMENT STATUS</span>
          <strong>
            {attempt.status === "in_progress"
              ? "In progress"
              : attempt.status === "submitted"
                ? "Awaiting review"
                : "Reviewed"}
          </strong>

          <span className="dashboard-label">SUBMITTED</span>
          <strong>{formatDate(attempt.submitted_at)}</strong>

          {attempt.status === "reviewed" && (
            <>
              <span className="dashboard-label">OUTCOME</span>
              <strong>
                {attempt.outcome === "approved"
                  ? "Approved"
                  : "Rejected"}
              </strong>

              <span className="dashboard-label">REVIEWED</span>
              <strong>{formatDate(attempt.reviewed_at)}</strong>
            </>
          )}
        </div>

        {query.error === "review" && (
          <p className="auth-description" role="alert">
            The review could not be saved. Confirm the assessment is
            submitted and try again.
          </p>
        )}

        {dataError ? (
          <p className="auth-description" role="alert">
            We could not load all answers. Check the admin read permissions
            before making a decision.
          </p>
        ) : (
          <section className="review-answers">
            <h2>Applicant answers</h2>

            {(scenarios ?? []).map((scenario) => (
              <article
                className="review-answer"
                key={scenario.id}
              >
                <p className="auth-eyebrow">
                  SCENARIO {scenario.scenario_number}
                </p>
                <h3>{scenario.title}</h3>
                <p>{scenario.prompt}</p>
                <div className="review-response">
                  <strong>Response</strong>
                  <p>
                    {responseByScenario.get(scenario.id)?.trim() ||
                      "No response recorded."}
                  </p>
                </div>
              </article>
            ))}

            {(scenarios ?? []).length === 0 && (
              <p>No scenarios were found for this assessment.</p>
            )}
          </section>
        )}

        {canReview && !dataError && (
          <section className="admin-section">
            <h2>Record your decision</h2>

            <form action={reviewAssessment} className="review-form">
              <input
                type="hidden"
                name="attemptId"
                value={attempt.id}
              />

              <label htmlFor="reviewNotes">Review notes</label>
              <textarea
                id="reviewNotes"
                name="reviewNotes"
                rows={5}
                maxLength={5000}
                placeholder="Explain the decision and any relevant feedback..."
                required
              />

              <div className="review-actions">
                <button
                  className="auth-submit"
                  type="submit"
                  name="outcome"
                  value="approved"
                >
                  Approve assessment
                </button>

                <button
                  className="auth-submit review-reject"
                  type="submit"
                  name="outcome"
                  value="rejected"
                >
                  Reject assessment
                </button>
              </div>
            </form>
          </section>
        )}

        {attempt.status === "reviewed" && (
          <section className="admin-section">
            <h2>Saved review notes</h2>
            <p>{attempt.review_notes || "No review notes recorded."}</p>
          </section>
        )}

        {!canReview && attempt.status === "in_progress" && (
          <p className="auth-description">
            This assessment has not been submitted yet. You cannot record
            a final decision.
          </p>
        )}

        <div className="review-footer">
          <Link href="/admin" className="auth-back">
            Back to admin dashboard
          </Link>

          <form action={logout}>
            <button type="submit" className="auth-back review-signout">
              Sign out
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
