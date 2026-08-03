-- Multi-tenant: each company gets its own row in app_state, keyed by company_id.
-- The pre-existing row (id=1) is the real Dodisa data; it's pinned to a known
-- constant UUID so the app-side migration step can attach it to the right login.
ALTER TABLE public.app_state ADD COLUMN IF NOT EXISTS company_id UUID;

UPDATE public.app_state
SET company_id = '11111111-1111-1111-1111-111111111111'
WHERE id = 1 AND company_id IS NULL;

UPDATE public.app_state
SET company_id = gen_random_uuid()
WHERE company_id IS NULL;

ALTER TABLE public.app_state ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.app_state ADD CONSTRAINT app_state_company_id_key UNIQUE (company_id);
CREATE INDEX IF NOT EXISTS idx_app_state_company_id ON public.app_state (company_id);
