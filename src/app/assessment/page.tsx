
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import {
  saveAssessmentResponse,
  submitAssessment,
} from "@/app/auth/actions";

type AssessmentPageProps = {
  searchParams: Promise<{
    attempt?: string;
    saved?: string;
    error?: string;
  }>;
};

export default async function AssessmentPage({
  searchParams,
}: AssessmentPageProps) {
  const params = await searchParams;
  const attemptId = params.attempt;

  if (!attemptId) redirect("/dashboard");

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  const { data: attempt, error: attemptError } = await supabase
    .from("assessment_attempts")
    .select("id, status, applicant_id")
    .eq("id", attemptId)
    .eq("applicant_id", user.id)
    .maybeSingle();

  if (attemptError || !attempt) redirect("/dashboard");

  const { data: scenarios, error: scenariosError } = await supabase
    .from("scenarios")
    .select("id, scenario_number, title, prompt")
    .eq("is_published", true)
    .order("scenario_number", { ascending: true });

  if (scenariosError || !scenarios || scenarios.length !== 20) {
    return (
      <main className="auth-shell">
        <section className="auth-card dashboard-card">
          <Link href="/" className="auth-brand">
            modera<span>.</span>
          </Link>
          <h1>Assessment temporarily unavailable</h1>
          <p className="auth-description">
            The assessment must contain exactly 20 published scenarios.
            Please return to your dashboard and try again later.
          </p>
          <Link href="/dashboard" className="auth-back">
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  const { data: responses, error: responsesError } = await supabase
    .from("assessment_responses")
    .select("scenario_id, response_text")
    .eq("attempt_id", attemptId);

  if (responsesError) {
    return (
      <main className="auth-shell">
        <section className="auth-card dashboard-card">
          <h1>Couldn't load your answers</h1>
          <p className="auth-description">
            Please refresh the page. Your existing answers have not been
            intentionally changed.
          </p>
          <Link href="/dashboard" className="auth-back">
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  const responseMap = new Map(
    (responses ?? []).map((response) => [
      response.scenario_id,
      response.response_text,
    ])
  );

  const completedCount = scenarios.filter(
    (scenario) => (responseMap.get(scenario.id) ?? "").trim().length > 0
  ).length;

  const isInProgress = attempt.status === "in_progress";

  return (
    <main className="auth-shell">
      <section className="auth-card dashboard-card">
        <Link href="/" className="auth-brand">
          modera<span>.</span>
        </Link>

        <p className="auth-eyebrow">CHAT MODERATION ASSESSMENT</p>
        <h1>Your assessment</h1>
        <p className="auth-description">
          Read each scenario and write the response you would give as a
          moderator. Save your answers as you go.
        </p>

        <div className="dashboard-panel">
          <span className="dashboard-label">PROGRESS</span>
          <strong>{completedCount} of 20 answered</strong>
          <p>
            {isInProgress
              ? "Your answers are saved individually. Complete every scenario before submitting."
              : "This attempt has already been submitted or reviewed and is read-only."}
          </p>
        </div>

        {params.saved === "1" && (
          <p role="status" className="auth-description">
            Answer saved successfully.
          </p>
        )}

        {params.error === "save" && (
          <p role="alert" className="auth-description">
            We couldn't save that answer. Please try again.
          </p>
        )}

        {params.error === "submit" && (
          <p role="alert" className="auth-description">
            Submission failed. Make sure all 20 answers are filled in, then
            try again.
          </p>
        )}

        {scenarios.map((scenario) => (
          <section
            key={scenario.id}
            id={`scenario-${scenario.scenario_number}`}
            className="dashboard-panel"
          >
            <span className="dashboard-label">
              SCENARIO {scenario.scenario_number} OF 20
            </span>
            <h2>{scenario.title}</h2>
            <p>{scenario.prompt}</p>

            <form action={saveAssessmentResponse}>
              <input type="hidden" name="attemptId" value={attemptId} />
              <input
                type="hidden"
                name="scenarioId"
                value={scenario.id}
              />

              <label
                htmlFor={`response-${scenario.id}`}
                className="dashboard-label"
              >
                YOUR RESPONSE
              </label>
              <textarea
                id={`response-${scenario.id}`}
                name="responseText"
                defaultValue={responseMap.get(scenario.id) ?? ""}
                required
                minLength={1}
                maxLength={10000}
                readOnly={!isInProgress}
                rows={5}
                style={{
                  boxSizing: "border-box",
                  width: "100%",
                  marginTop: 10,
                  padding: 12,
                  border: "1px solid #e4e2d9",
                  borderRadius: 8,
                  background: isInProgress ? "#fff" : "#f6f6f0",
                  color: "#202b25",
                  font: "inherit",
                  resize: "vertical",
                }}
              />

              {isInProgress && (
                <button
                  className="auth-submit"
                  type="submit"
                  style={{ marginTop: 12 }}
                >
                  Save answer
                </button>
              )}
            </form>
          </section>
        ))}

        {isInProgress && (
          <form action={submitAssessment}>
            <input type="hidden" name="attemptId" value={attemptId} />
            <button
              className="auth-submit"
              type="submit"
              style={{ marginTop: 12 }}
            >
              Submit assessment
            </button>
          </form>
        )}

        {!isInProgress && (
          <p className="auth-description">
            Your answers can no longer be changed for this attempt.
          </p>
        )}

        <Link href="/dashboard" className="auth-back">
          Back to dashboard
        </Link>

        <form action={logout}>
          <button className="auth-submit" type="submit">
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
