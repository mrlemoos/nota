CREATE POLICY "Users can update own note attachments"
    ON note_attachments FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM notes
            WHERE notes.id = note_attachments.note_id
            AND notes.user_id = auth.uid()
        )
    )
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM notes
            WHERE notes.id = note_attachments.note_id
            AND notes.user_id = auth.uid()
        )
    );
