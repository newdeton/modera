import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const fullName =
    user.user_metadata?.full_name || user.email || "Applicant";

  return (
    <main className="auth-shell">
      <section className="auth-card dashboard-card">
        <Link href="/" className="auth-brand">
          modera<span>.</span>
        </Link>

        <p className="auth-eyebrow">APPLICANT DASHBOARD</p>
        <h1>Welcome, {fullName}.</h1>
        <p className="auth-description">
          You're signed in. This is your starting point for the Modera
          assessment journey.
        </p>

        <div className="dashboard-panel">
          <span className="dashboard-label">ACCOUNT EMAIL</span>
          <strong>{user.email}</strong>

          <span className="dashboard-label">ASSESSMENT STATUS</span>
          <strong>Not started</strong>

          <p>
            The 20-scenario assessment and scoring system have not yet
            been connected.
          </p>
        </div>

        <form action={logout}>
          <button className="auth-submit" type="submit">
            Sign out
          </button>
        </form>

        <Link href="/" className="auth-back">
          ← Back to Modera homepage
        </Link>
      </section>
    </main>
  );
}