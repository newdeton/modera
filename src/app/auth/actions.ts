
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function getText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function register(formData: FormData) {
  const fullName = getText(formData, "fullName");
  const email = getText(formData, "email").toLowerCase();
  const password = getText(formData, "password");

  if (!fullName || !email || password.length < 8) {
    redirect("/register?error=invalid");
  }

  const supabase = await createClient();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    redirect("/register?error=registration");
  }

  if (!data.session) {
    redirect("/register?message=check-email");
  }

  redirect("/dashboard");
}


export async function login(formData: FormData) {
  const email = getText(formData, "email").toLowerCase();
  const password = getText(formData, "password");

  if (!email || !password) {
    redirect("/login?error=invalid");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    redirect("/login?error=credentials");
  }

  if (data.user.app_metadata?.role === "admin") {
    redirect("/admin");
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function startAssessment() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Reuse the applicant's most recent in-progress attempt.
  const { data: existingAttempt, error: attemptError } = await supabase
    .from("assessment_attempts")
    .select("id, status")
    .eq("applicant_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (attemptError) {
    redirect("/dashboard?error=assessment");
  }

  if (existingAttempt?.status === "in_progress") {
    redirect(`/assessment?attempt=${existingAttempt.id}`);
  }

  // Do not allow a second attempt after submission or review.
  if (existingAttempt) {
    redirect("/dashboard?message=already-started");
  }

  // Require exactly 20 published scenarios.
  const { count, error: scenarioError } = await supabase
    .from("scenarios")
    .select("id", { count: "exact", head: true })
    .eq("is_published", true);

  if (scenarioError || count !== 20) {
    redirect("/dashboard?error=assessment");
  }

  const { data: newAttempt, error: insertError } = await supabase
    .from("assessment_attempts")
    .insert({
      applicant_id: user.id,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (insertError || !newAttempt) {
    redirect("/dashboard?error=assessment");
  }

  redirect(`/assessment?attempt=${newAttempt.id}`);
}

export async function saveAssessmentResponse(formData: FormData) {
  const attemptId = getText(formData, "attemptId");
  const scenarioId = getText(formData, "scenarioId");
  const responseText = getText(formData, "responseText");

  if (!attemptId || !scenarioId || !responseText) {
    redirect(`/assessment?attempt=${encodeURIComponent(attemptId)}&error=save`);
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  // Verify the attempt belongs to this applicant and is still active.
  const { data: attempt, error: attemptError } = await supabase
    .from("assessment_attempts")
    .select("id")
    .eq("id", attemptId)
    .eq("applicant_id", user.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (attemptError || !attempt) {
    redirect("/dashboard?error=assessment");
  }

  // Only allow answers to currently published scenarios.
  const { data: scenario, error: scenarioError } = await supabase
    .from("scenarios")
    .select("id")
    .eq("id", scenarioId)
    .eq("is_published", true)
    .maybeSingle();

  if (scenarioError || !scenario) {
    redirect(`/assessment?attempt=${encodeURIComponent(attemptId)}&error=save`);
  }

  const { error: saveError } = await supabase
    .from("assessment_responses")
    .upsert(
      {
        attempt_id: attemptId,
        scenario_id: scenarioId,
        response_text: responseText,
      },
      { onConflict: "attempt_id,scenario_id" }
    );

  if (saveError) {
    redirect(`/assessment?attempt=${encodeURIComponent(attemptId)}&error=save`);
  }

  redirect(
    `/assessment?attempt=${encodeURIComponent(attemptId)}&saved=1#scenario-${encodeURIComponent(
      String(
        (
          await supabase
            .from("scenarios")
            .select("scenario_number")
            .eq("id", scenarioId)
            .single()
        ).data?.scenario_number ?? 1
      )
    )}`
  );
}

export async function submitAssessment(formData: FormData) {
  const attemptId = getText(formData, "attemptId");

  if (!attemptId) redirect("/dashboard");

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  // Check ownership before attempting submission.
  const { data: attempt, error: attemptError } = await supabase
    .from("assessment_attempts")
    .select("id")
    .eq("id", attemptId)
    .eq("applicant_id", user.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (attemptError || !attempt) {
    redirect("/dashboard?error=assessment");
  }

  // The database function independently validates all 20 answers.
  const { error: submitError } = await supabase.rpc(
    "submit_assessment_attempt",
    { p_attempt_id: attemptId }
  );

  if (submitError) {
    redirect(
      `/assessment?attempt=${encodeURIComponent(attemptId)}&error=submit`
    );
  }

  redirect("/dashboard");
}


export async function reviewAssessment(formData: FormData) {
  const attemptId = getText(formData, "attemptId");
  const outcome = getText(formData, "outcome");
  const reviewNotes = getText(formData, "reviewNotes");

  if (
    !attemptId ||
    !["approved", "rejected"].includes(outcome) ||
    !reviewNotes
  ) {
    redirect("/admin?error=review");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) redirect("/login");

  if (user.app_metadata?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: attempt, error: attemptError } = await supabase
    .from("assessment_attempts")
    .select("id, status")
    .eq("id", attemptId)
    .maybeSingle();

  if (
    attemptError ||
    !attempt ||
    attempt.status !== "submitted"
  ) {
    redirect(`/admin/reviews/${encodeURIComponent(attemptId)}?error=review`);
  }

  const { error: reviewError } = await supabase.rpc(
    "review_assessment_attempt",
    {
      p_attempt_id: attemptId,
      p_outcome: outcome,
      p_review_notes: reviewNotes,
    }
  );

  if (reviewError) {
    redirect(`/admin/reviews/${encodeURIComponent(attemptId)}?error=review`);
  }

  redirect("/admin");
}


async function requireScenarioAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  if (user.app_metadata?.role !== "admin") {
    redirect("/dashboard");
  }

  return supabase;
}

export async function createScenario(formData: FormData) {
  const scenarioNumber = Number(getText(formData, "scenarioNumber"));
  const title = getText(formData, "title");
  const prompt = getText(formData, "prompt");
  const evaluationCriteria = getText(formData, "evaluationCriteria");

  if (
    !Number.isInteger(scenarioNumber) ||
    scenarioNumber < 1 ||
    scenarioNumber > 20 ||
    !title ||
    !prompt ||
    !evaluationCriteria
  ) {
    redirect("/admin/scenarios?error=invalid");
  }

  const supabase = await requireScenarioAdmin();

  const { error } = await supabase.from("scenarios").insert({
    scenario_number: scenarioNumber,
    title,
    prompt,
    evaluation_criteria: evaluationCriteria,
    is_published: false,
  });

  if (error) {
    redirect("/admin/scenarios?error=save");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/scenarios");
  redirect("/admin/scenarios?success=created");
}

export async function updateScenario(formData: FormData) {
  const id = getText(formData, "id");
  const scenarioNumber = Number(getText(formData, "scenarioNumber"));
  const title = getText(formData, "title");
  const prompt = getText(formData, "prompt");
  const evaluationCriteria = getText(formData, "evaluationCriteria");

  if (
    !id ||
    !Number.isInteger(scenarioNumber) ||
    scenarioNumber < 1 ||
    scenarioNumber > 20 ||
    !title ||
    !prompt ||
    !evaluationCriteria
  ) {
    redirect("/admin/scenarios?error=invalid");
  }

  const supabase = await requireScenarioAdmin();

  const { error } = await supabase
    .from("scenarios")
    .update({
      scenario_number: scenarioNumber,
      title,
      prompt,
      evaluation_criteria: evaluationCriteria,
    })
    .eq("id", id);

  if (error) {
    redirect("/admin/scenarios?error=save");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/scenarios");
  revalidatePath("/assessment");
  redirect("/admin/scenarios?success=updated");
}

export async function toggleScenarioPublished(formData: FormData) {
  const id = getText(formData, "id");

  if (!id) redirect("/admin/scenarios?error=invalid");

  const supabase = await requireScenarioAdmin();

  const { data: scenario, error: fetchError } = await supabase
    .from("scenarios")
    .select("id, is_published")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !scenario) {
    redirect("/admin/scenarios?error=save");
  }

  const { error } = await supabase
    .from("scenarios")
    .update({ is_published: !scenario.is_published })
    .eq("id", id);

  if (error) {
    redirect("/admin/scenarios?error=save");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/scenarios");
  revalidatePath("/assessment");
  redirect("/admin/scenarios?success=updated");
}

export async function deleteScenario(formData: FormData) {
  const id = getText(formData, "id");

  if (!id) redirect("/admin/scenarios?error=invalid");

  const supabase = await requireScenarioAdmin();

  const { error } = await supabase
    .from("scenarios")
    .delete()
    .eq("id", id);

  if (error) {
    redirect("/admin/scenarios?error=delete");
  }

  revalidatePath("/admin");
  revalidatePath("/admin/scenarios");
  revalidatePath("/assessment");
  redirect("/admin/scenarios?success=deleted");
}
