-- Nested folders: parent_id, per-parent name uniqueness, cycle guard.

ALTER TABLE public.folders
    ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.folders (id) ON DELETE CASCADE;

DROP INDEX IF EXISTS idx_folders_user_name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_folders_user_root_name_lower
    ON public.folders (user_id, lower(name))
    WHERE parent_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_folders_user_parent_name_lower
    ON public.folders (user_id, parent_id, lower(name))
    WHERE parent_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_folders_user_parent
    ON public.folders (user_id, parent_id);

CREATE OR REPLACE FUNCTION public.prevent_folder_parent_cycle()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.parent_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.parent_id = NEW.id THEN
        RAISE EXCEPTION 'folder cannot be its own parent';
    END IF;

    IF TG_OP = 'INSERT' THEN
        RETURN NEW;
    END IF;

    -- UPDATE: parent must not sit under this folder’s existing subtree.
    IF EXISTS (
        WITH RECURSIVE descendants AS (
            SELECT id
            FROM public.folders
            WHERE parent_id = NEW.id
            UNION ALL
            SELECT f.id
            FROM public.folders AS f
            INNER JOIN descendants AS d ON f.parent_id = d.id
        )
        SELECT 1
        FROM descendants
        WHERE id = NEW.parent_id
    ) THEN
        RAISE EXCEPTION 'folder parent_id cannot be a descendant of this folder';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS folders_prevent_parent_cycle ON public.folders;
CREATE TRIGGER folders_prevent_parent_cycle
    BEFORE INSERT OR UPDATE OF parent_id ON public.folders
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_folder_parent_cycle();
