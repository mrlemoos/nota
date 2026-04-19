-- Add optional banner image to notes (references an existing note_attachment).
ALTER TABLE notes
  ADD COLUMN banner_attachment_id UUID
    REFERENCES note_attachments (id) ON DELETE SET NULL;
