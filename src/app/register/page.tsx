import Link from "next/link";
import { register } from "@/app/auth/actions";

type Props = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link href="/" className="auth-brand">
          modera<span>.</span>
        </Link>

        <p className="auth-eyebrow">CREATE YOUR ACCOUNT</p>
        <h1>Start with clarity.</h1>
        <p className="auth-description">
          Create your account to access your applicant dashboard.
        </p>

        {params.error && (
          <p className="auth-message auth-error" role="alert">
            {params.error === "invalid"
              ? "Enter your name, a valid email, and a password of at least 8 characters."
              : "We couldn't complete registration. Check your details and try again."}
          </p>
        )}

        {params.message === "check-email" && (
          <p className="auth-message auth-success" role="status">
            Account registration started. Check your email for the
            confirmation link before signing in.
          </p>
        )}

        <form action={register} className="auth-form">
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            minLength={2}
            required
            placeholder="Your full name"
          />

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
            autoComplete="new-password"
            minLength={8}
            required
            placeholder="At least 8 characters"
          />

          <button className="auth-submit" type="submit">
            Create account <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link href="/login">Sign in</Link>
        </p>

        <Link href="/" className="auth-back">
          ← Back to Modera
        </Link>
      </section>
    </main>
  );
}