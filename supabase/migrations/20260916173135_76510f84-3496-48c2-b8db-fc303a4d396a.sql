CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.menu_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  position integer NOT NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  subtitle text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  storage_path text,
  width integer NOT NULL DEFAULT 1131,
  height integer NOT NULL DEFAULT 1600,
  bytes integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menu_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_pages TO authenticated;
GRANT ALL ON public.menu_pages TO service_role;
ALTER TABLE public.menu_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view menu pages" ON public.menu_pages
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert menu pages" ON public.menu_pages
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update menu pages" ON public.menu_pages
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete menu pages" ON public.menu_pages
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.site_version (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_version TO anon;
GRANT SELECT, UPDATE ON public.site_version TO authenticated;
GRANT ALL ON public.site_version TO service_role;
ALTER TABLE public.site_version ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view version" ON public.site_version
  FOR SELECT USING (true);
CREATE POLICY "Admins can update version" ON public.site_version
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_version (id, version) VALUES (true, 1);

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER menu_pages_touch BEFORE UPDATE ON public.menu_pages
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.reorder_menu_pages(_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.menu_pages mp
     SET position = t.ord
    FROM (SELECT unnest(_ids) AS id, generate_subscripts(_ids, 1) AS ord) t
   WHERE mp.id = t.id;
  UPDATE public.site_version SET version = version + 1, updated_at = now() WHERE id;
END; $$;

REVOKE ALL ON FUNCTION public.reorder_menu_pages(uuid[]) FROM public;
GRANT EXECUTE ON FUNCTION public.reorder_menu_pages(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.bump_site_version()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v integer;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.site_version SET version = version + 1, updated_at = now() WHERE id RETURNING version INTO v;
  RETURN v;
END; $$;

REVOKE ALL ON FUNCTION public.bump_site_version() FROM public;
GRANT EXECUTE ON FUNCTION public.bump_site_version() TO authenticated;