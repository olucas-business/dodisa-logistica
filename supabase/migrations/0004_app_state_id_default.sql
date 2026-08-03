-- app_state.id was a plain INT PRIMARY KEY with no default, which only worked
-- because the app used to hardcode a single row (id=1). Now that every new
-- company signup inserts its own row, id needs to auto-generate.
CREATE SEQUENCE IF NOT EXISTS public.app_state_id_seq OWNED BY public.app_state.id;
SELECT setval('public.app_state_id_seq', COALESCE((SELECT MAX(id) FROM public.app_state), 0) + 1, false);
ALTER TABLE public.app_state ALTER COLUMN id SET DEFAULT nextval('public.app_state_id_seq');
