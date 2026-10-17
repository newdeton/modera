
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createScenario,
  updateScenario,
  toggleScenarioPublished,
  deleteScenario,
  logout,
} from "@/app/auth/actions";

type Props = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

export default async function AdminScenariosPage({ searchParams }: Props) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (user.app_metadata?.role !== "admin") redirect("/dashboard");

  const params = await searchParams;

  const { data: scenarios, error } = await supabase
    .from("scenarios")
    .select(
      "id, scenario_number, title, prompt, evaluation_criteria, is_published"
    )
    .order("scenario_number", { ascending: true });

  if (error) {
    return (
      <main className="admin-page">
        <h1>Scenario Management</h1>
        <p>Unable to load scenarios. Please try again.</p>
        <Link href="/admin">Back to dashboard</Link>
      </main>
    );
  }

  const publishedCount = scenarios.filter((s) => s.is_published).length;
  const usedNumbers = new Set(scenarios.map((s) => s.scenario_number));
  const nextNumber = Array.from({ length: 20 }, (_, i) => i + 1).find(
    (n) => !usedNumbers.has(n)
  );

  const messages: Record<string, string> = {
    invalid: "Check the scenario number and make sure all fields are completed.",
    save: "Unable to save the scenario. Check for duplicate scenario numbers.",
    delete: "This scenario could not be deleted. It may already have assessment responses.",
  };

  return (
    <main className="admin-page">
      <header className="scenario-header">
        <div>
          <p className="admin-eyebrow">ADMINISTRATION</p>
          <h1>Scenario Management</h1>
          <p>Create and manage the 20 Modera assessment scenarios.</p>
        </div>
        <Link className="scenario-back" href="/admin">
          Back to dashboard
        </Link>
      </header>

      <section className="scenario-progress">
        <strong>{publishedCount} / 20 published</strong>
        <div className="scenario-progress-track">
          <div
            className="scenario-progress-fill"
            style={{ width: `${(publishedCount / 20) * 100}%` }}
          />
        </div>
        <p>
          Applicants can access published scenarios. Aim to publish all 20
          before opening the assessment.
        </p>
      </section>

      {params.error && (
        <p className="scenario-message scenario-error" role="alert">
          {messages[params.error] ?? "Something went wrong. Please try again."}
        </p>
      )}

      {params.success && (
        <p className="scenario-message scenario-success" role="status">
          {params.success === "created"
            ? "Scenario created successfully."
            : params.success === "deleted"
              ? "Scenario deleted."
              : "Scenario updated successfully."}
        </p>
      )}

      <section className="scenario-create">
        <h2>Add a scenario</h2>
        {nextNumber ? (
          <form action={createScenario} className="scenario-form">
            <label>
              Scenario number
              <input
                type="number"
                name="scenarioNumber"
                min="1"
                max="20"
                defaultValue={nextNumber}
                required
              />
            </label>

            <label>
              Scenario title
              <input
                name="title"
                placeholder="e.g. Handling an abusive client"
                maxLength={160}
                required
              />
            </label>

            <label>
              Scenario question
              <textarea
                name="prompt"
                placeholder="Describe the situation and ask the applicant what they would do."
                rows={4}
                required
              />
            </label>

            <label>
              Evaluation criteria (for admins)
              <textarea
                name="evaluationCriteria"
                placeholder="Describe what a strong answer should demonstrate."
                rows={3}
                required
              />
            </label>

            <button type="submit">Create scenario</button>
          </form>
        ) : (
          <p>All 20 scenario numbers are already in use.</p>
        )}
      </section>

      <section className="scenario-list">
        <h2>Existing scenarios ({scenarios.length})</h2>

        {scenarios.length === 0 && (
          <p>No scenarios yet. Add your first scenario above.</p>
        )}

        {scenarios.map((scenario) => (
          <article className="scenario-card" key={scenario.id}>
            <div className="scenario-card-heading">
              <div>
                <span className="scenario-number">
                  Scenario {scenario.scenario_number}
                </span>
                <h3>{scenario.title}</h3>
              </div>
              <span
                className={
                  scenario.is_published
                    ? "scenario-status is-published"
                    : "scenario-status"
                }
              >
                {scenario.is_published ? "Published" : "Draft"}
              </span>
            </div>

            <form action={updateScenario} className="scenario-form">
              <input type="hidden" name="id" value={scenario.id} />

              <label>
                Scenario number
                <input
                  type="number"
                  name="scenarioNumber"
                  min="1"
                  max="20"
                  defaultValue={scenario.scenario_number}
                  required
                />
              </label>

              <label>
                Title
                <input
                  name="title"
                  defaultValue={scenario.title}
                  maxLength={160}
                  required
                />
              </label>

              <label>
                Question
                <textarea
                  name="prompt"
                  defaultValue={scenario.prompt}
                  rows={4}
                  required
                />
              </label>

              <label>
                Evaluation criteria
                <textarea
                  name="evaluationCriteria"
                  defaultValue={scenario.evaluation_criteria}
                  rows={3}
                  required
                />
              </label>

              <button type="submit">Save changes</button>
            </form>

            <div className="scenario-card-actions">
              <form action={toggleScenarioPublished}>
                <input type="hidden" name="id" value={scenario.id} />
                <button type="submit" className="scenario-secondary">
                  {scenario.is_published ? "Unpublish" : "Publish"}
                </button>
              </form>

              <form action={deleteScenario}>
                <input type="hidden" name="id" value={scenario.id} />
                <button type="submit" className="scenario-delete">
                  Delete scenario
                </button>
              </form>
            </div>
          </article>
        ))}
      </section>

      <footer className="scenario-footer">
        <Link href="/admin">Return to admin dashboard</Link>
        <form action={logout}>
          <button type="submit" className="scenario-secondary">
            Sign out
          </button>
        </form>
      </footer>
    </main>
  );
}
