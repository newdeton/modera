
-- Admin access is granted only to authenticated users whose
-- Supabase app_metadata.role is explicitly set to 'admin'.

-- Profiles: admins can view applicant profiles.
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Scenarios: admins can view, create, edit, and delete scenarios.
CREATE POLICY "Admins can view all scenarios"
ON public.scenarios
FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can insert scenarios"
ON public.scenarios
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can update scenarios"
ON public.scenarios
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can delete scenarios"
ON public.scenarios
FOR DELETE
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Assessment attempts: admins can review submitted assessments.
CREATE POLICY "Admins can view all assessment attempts"
ON public.assessment_attempts
FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can update assessment attempts"
ON public.assessment_attempts
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Responses: admins can read applicant answers.
CREATE POLICY "Admins can view all assessment responses"
ON public.assessment_responses
FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
