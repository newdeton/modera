
-- Remove the broad admin update policy.
-- Reviews should use the guarded database function.
DROP POLICY IF EXISTS "Admins can update assessment attempts"
ON public.assessment_attempts;
