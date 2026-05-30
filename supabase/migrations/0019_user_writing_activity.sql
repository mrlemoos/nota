-- Add writing activity / contribution graph fields to user_preferences (optional, Pro only)
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS show_writing_activity_graph BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS writing_activity_color TEXT NOT NULL DEFAULT 'blue';

ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS writing_activity_days JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.user_preferences.show_writing_activity_graph IS
    'User has opted in to see the writing activity contribution graph in Settings.';
COMMENT ON COLUMN public.user_preferences.writing_activity_color IS
    'Chosen colour family for the graph: blue (default), red, pink, or rose.';
COMMENT ON COLUMN public.user_preferences.writing_activity_days IS
    'Local date (YYYY-MM-DD) -> contribution count. Populated on demand via backfill + live increments.';