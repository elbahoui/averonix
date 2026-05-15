-- MVP foundation: organization ownership and durable evidence persistence.

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  sector text NOT NULL DEFAULT 'general_sme',
  size text,
  domain text,
  city text,
  country text DEFAULT 'Morocco',
  profile_completed boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

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

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

WITH source_companies AS (
  SELECT *
  FROM public.companies
  WHERE organization_id IS NULL
),
inserted AS (
  INSERT INTO public.organizations (name, slug, sector, size, domain, city, country, profile_completed, created_by)
  SELECT
    COALESCE(NULLIF(name, ''), 'Averonix Workspace'),
    lower(regexp_replace(COALESCE(NULLIF(name, ''), 'averonix-workspace'), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || left(user_id::text, 8),
    COALESCE(NULLIF(sector, ''), 'general_sme'),
    size,
    domain,
    city,
    COALESCE(NULLIF(country, ''), 'Morocco'),
    (
      onboarding_completed IS TRUE
      AND COALESCE(NULLIF(name, ''), '') <> ''
      AND COALESCE(NULLIF(sector, ''), '') <> ''
      AND COALESCE(NULLIF(size, ''), '') <> ''
      AND COALESCE(NULLIF(domain, ''), '') <> ''
      AND COALESCE(NULLIF(country, ''), '') <> ''
    ),
    user_id
  FROM source_companies
  ON CONFLICT (slug) DO UPDATE SET updated_at = now()
  RETURNING id, created_by
)
UPDATE public.companies c
SET organization_id = inserted.id
FROM inserted
WHERE c.user_id = inserted.created_by
  AND c.organization_id IS NULL;

INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT organization_id, user_id, 'owner'
FROM public.companies
WHERE organization_id IS NOT NULL
ON CONFLICT (organization_id, user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.assessment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  framework_id text NOT NULL DEFAULT 'iso27001',
  model_version text NOT NULL DEFAULT 'iso27001-mvp-d1-d9-v1',
  sector text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'stale')),
  question_count int NOT NULL DEFAULT 81,
  answered_count int NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assessment_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  domain_id text NOT NULL,
  maturity_level int NOT NULL CHECK (maturity_level IN (0, 1, 2, 3)),
  evidence_confidence numeric NOT NULL CHECK (evidence_confidence IN (0, 0.3, 0.6, 1)),
  evidence_note text CHECK (char_length(COALESCE(evidence_note, '')) <= 1000),
  answered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  framework_id text,
  model_version text,
  sector text,
  overall_score numeric NOT NULL,
  risk_level text NOT NULL,
  evidence_confidence numeric NOT NULL,
  question_count int NOT NULL,
  answered_count int NOT NULL,
  domain_scores jsonb NOT NULL,
  critical_gaps jsonb NOT NULL,
  weak_evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations jsonb NOT NULL,
  response_hash text,
  source text NOT NULL DEFAULT 'backend',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_domain text NOT NULL,
  normalized_domain text NOT NULL,
  sector text,
  verified_signal_score numeric,
  evidence_confidence numeric,
  agent_readiness_impact numeric,
  risk_interpretation text,
  critical_findings_count int,
  checks jsonb NOT NULL,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  mapped_evidence jsonb,
  domain_coverage jsonb,
  limitations jsonb,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.report_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  assessment_result_id uuid REFERENCES public.assessment_results(id) ON DELETE SET NULL,
  title text,
  report_type text NOT NULL DEFAULT 'readiness_preview',
  framework_id text,
  model_version text,
  snapshot jsonb NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organization_members_user_idx ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS assessment_sessions_org_idx ON public.assessment_sessions(organization_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS assessment_responses_session_idx ON public.assessment_responses(session_id);
CREATE INDEX IF NOT EXISTS assessment_results_org_idx ON public.assessment_results(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_scans_org_idx ON public.agent_scans(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_org_idx ON public.audit_logs(organization_id, created_at DESC);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member organizations select" ON public.organizations;
CREATE POLICY "member organizations select" ON public.organizations
  FOR SELECT USING (public.is_org_member(id));

DROP POLICY IF EXISTS "owner admin organizations update" ON public.organizations;
CREATE POLICY "owner admin organizations update" ON public.organizations
  FOR UPDATE USING (public.org_role(id) IN ('owner', 'admin'));

DROP POLICY IF EXISTS "authenticated organizations insert" ON public.organizations;
CREATE POLICY "authenticated organizations insert" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

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

CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER assessment_sessions_updated_at BEFORE UPDATE ON public.assessment_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.org_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_write_org(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_write_org(uuid) TO authenticated;
