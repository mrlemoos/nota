-- Account-wide toggle for TipTap smiley → emoji input rules (default: enabled).
ALTER TABLE user_preferences
    ADD COLUMN IF NOT EXISTS emoji_replacer_enabled BOOLEAN NOT NULL DEFAULT true;
