-- Optional folder row tint (sidebar accent); null = default appearance.

ALTER TABLE public.folders
    ADD COLUMN IF NOT EXISTS tint text;

ALTER TABLE public.folders
    DROP CONSTRAINT IF EXISTS folders_tint_valid;

ALTER TABLE public.folders
    ADD CONSTRAINT folders_tint_valid
    CHECK (
        tint IS NULL
        OR tint IN (
            'blue',
            'green',
            'red',
            'orange',
            'purple',
            'teal',
            'rose',
            'slate'
        )
    );
