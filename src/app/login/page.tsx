import Link from "next/link";
import { login } from "@/app/auth/actions";

type Props = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link href="/" className="auth-brand">
          modera<span>.</span>
        </Link>

        <p className="auth-eyebrow">WELCOME BACK</p>
        <h1>Sign in to Modera.</h1>
        <p className="auth-description">
          Access your account and continue where you left off.
        </p>

        {params.error && (
          <p className="auth-message auth-error" role="alert">
            {params.error === "confirmation"
              ? "We couldn't confirm your email. Try the confirmation link again or request a new one."
              : params.error === "invalid"
                ? "Enter your email address and password."
                : "Sign-in failed. Check your email and password, then try again."}
          </p>
        )}

        <form action={login} className="auth-form">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Your password"
          />

          <button className="auth-submit" type="submit">
            Sign in <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="auth-switch">
          New to Modera? <Link href="/register">Create an account</Link>
        </p>

        <Link href="/" className="auth-back">
          ← Back to Modera
        </Link>
      </section>
    </main>
  );
}