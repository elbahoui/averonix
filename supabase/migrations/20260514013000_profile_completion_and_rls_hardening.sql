-- Tighten organization completion semantics and remove arbitrary uid helper usage.

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false;

UPDATE public.organizations o
SET profile_completed = true
FROM public.companies c
WHERE c.organization_id = o.id
  AND c.onboarding_completed IS TRUE
  AND COALESCE(NULLIF(o.name, ''), '') <> ''
  AND COALESCE(NULLIF(o.sector, ''), '') <> ''
  AND COALESCE(NULLIF(o.size, ''), '') <> ''
  AND COALESCE(NULLIF(o.domain, ''), '') <> ''
  AND COALESCE(NULLIF(o.country, ''), '') <> '';

CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.org_role(org_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.organization_members
  WHERE organization_id = org_id
    AND user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_write_org(org_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.org_role(org_id) IN ('owner', 'admin', 'member');
$$;

DROP POLICY IF EXISTS "member organizations select" ON public.organizations;
CREATE POLICY "member organizations select" ON public.organizations
  FOR SELECT USING (public.is_org_member(id));

DROP POLICY IF EXISTS "owner admin organizations update" ON public.organizations;
CREATE POLICY "owner admin organizations update" ON public.organizations
  FOR UPDATE USING (public.org_role(id) IN ('owner', 'admin'));

DROP POLICY IF EXISTS "member memberships select" ON public.organization_members;
CREATE POLICY "member memberships select" ON public.organization_members
  FOR SELECT USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "owner admin memberships write" ON public.organization_members;
CREATE POLICY "owner admin memberships write" ON public.organization_members
  FOR ALL USING (public.org_role(organization_id) IN ('owner', 'admin'))
  WITH CHECK (public.org_role(organization_id) IN ('owner', 'admin'));

DROP POLICY IF EXISTS "member sessions select" ON public.assessment_sessions;
CREATE POLICY "member sessions select" ON public.assessment_sessions
  FOR SELECT USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "writer sessions write" ON public.assessment_sessions;
CREATE POLICY "writer sessions write" ON public.assessment_sessions
  FOR ALL USING (public.can_write_org(organization_id))
  WITH CHECK (public.can_write_org(organization_id));

DROP POLICY IF EXISTS "member responses select" ON public.assessment_responses;
CREATE POLICY "member responses select" ON public.assessment_responses
  FOR SELECT USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "writer responses write" ON public.assessment_responses;
CREATE POLICY "writer responses write" ON public.assessment_responses
  FOR ALL USING (public.can_write_org(organization_id))
  WITH CHECK (public.can_write_org(organization_id));

DROP POLICY IF EXISTS "member results select" ON public.assessment_results;
CREATE POLICY "member results select" ON public.assessment_results
  FOR SELECT USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "writer results insert" ON public.assessment_results;
CREATE POLICY "writer results insert" ON public.assessment_results
  FOR INSERT WITH CHECK (public.can_write_org(organization_id));

DROP POLICY IF EXISTS "member agent scans select" ON public.agent_scans;
CREATE POLICY "member agent scans select" ON public.agent_scans
  FOR SELECT USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "writer agent scans insert" ON public.agent_scans;
CREATE POLICY "writer agent scans insert" ON public.agent_scans
  FOR INSERT WITH CHECK (public.can_write_org(organization_id));

DROP POLICY IF EXISTS "member reports select" ON public.report_snapshots;
CREATE POLICY "member reports select" ON public.report_snapshots
  FOR SELECT USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "writer reports insert" ON public.report_snapshots;
CREATE POLICY "writer reports insert" ON public.report_snapshots
  FOR INSERT WITH CHECK (public.can_write_org(organization_id));

DROP POLICY IF EXISTS "member audit logs select" ON public.audit_logs;
CREATE POLICY "member audit logs select" ON public.audit_logs
  FOR SELECT USING (public.is_org_member(organization_id));

DO $$
BEGIN
  IF to_regprocedure('public.is_org_member(uuid, uuid)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
  END IF;
  IF to_regprocedure('public.org_role(uuid, uuid)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.org_role(uuid, uuid) FROM PUBLIC, anon, authenticated;
  END IF;
  IF to_regprocedure('public.can_write_org(uuid, uuid)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.can_write_org(uuid, uuid) FROM PUBLIC, anon, authenticated;
  END IF;
END $$;
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.org_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_write_org(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_write_org(uuid) TO authenticated;
