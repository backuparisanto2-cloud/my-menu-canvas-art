REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM anon, authenticated, public;
REVOKE ALL ON FUNCTION public.reorder_menu_pages(uuid[]) FROM anon, public;
REVOKE ALL ON FUNCTION public.bump_site_version() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.reorder_menu_pages(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bump_site_version() TO authenticated;