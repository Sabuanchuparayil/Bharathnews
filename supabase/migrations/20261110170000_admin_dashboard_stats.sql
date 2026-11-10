-- Grouped reads for the admin dashboard. Counting and grouping stay on indexed columns so
-- the request does not scan article bodies and hit the statement timeout.

CREATE INDEX IF NOT EXISTS idx_articles_language ON public.articles (language);

CREATE OR REPLACE FUNCTION public.admin_article_facets()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'byCategory', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', category, 'count', n) ORDER BY n DESC)
      FROM (
        SELECT coalesce(category, 'uncategorized') AS category, count(*) AS n
        FROM public.articles
        GROUP BY 1
      ) category_counts
    ), '[]'::jsonb),
    'byLanguage', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('name', language, 'count', n) ORDER BY n DESC)
      FROM (
        SELECT coalesce(language, 'en') AS language, count(*) AS n
        FROM public.articles
        GROUP BY 1
      ) language_counts
    ), '[]'::jsonb),
    'pipeline', COALESCE((
      SELECT jsonb_object_agg(status, n)
      FROM (
        SELECT coalesce(status, 'unknown') AS status, count(*) AS n
        FROM public.raw_articles
        GROUP BY 1
      ) pipeline_counts
    ), '{}'::jsonb)
  );
$$;

REVOKE ALL ON FUNCTION public.admin_article_facets() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_article_facets() TO service_role;

DROP FUNCTION IF EXISTS public.admin_dashboard_stats();
