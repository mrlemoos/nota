-- Allow study recordings alongside PDFs and images in the private note attachments bucket
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/webm',
    'audio/mp4',
    'audio/ogg',
    'audio/wav',
    'audio/mpeg',
    'audio/mp3',
    'video/webm',
    'audio/x-m4a',
    'audio/m4a'
]::text[]
WHERE id = 'note-pdfs';
