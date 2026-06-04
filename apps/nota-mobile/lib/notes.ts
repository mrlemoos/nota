import type { Json, Note, NoteInsert, NoteUpdate } from '@nota/database-types';

import type { TypedSupabaseClient } from './supabase-client';

const EMPTY_DOC: Json = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

export async function listNotes(client: TypedSupabaseClient): Promise<Note[]> {
  const { data, error } = await client
    .from('notes')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to list notes: ${error.message}`);
  }

  return data ?? [];
}

export async function getNote(
  client: TypedSupabaseClient,
  id: string,
): Promise<Note | null> {
  const { data, error } = await client
    .from('notes')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load note: ${error.message}`);
  }

  return data;
}

export async function createNote(
  client: TypedSupabaseClient,
  userId: string,
  title = 'Untitled Note',
  content: Json = EMPTY_DOC,
): Promise<Note> {
  const row: NoteInsert = {
    user_id: userId,
    title,
    content,
  };

  const { data, error } = await client
    .from('notes')
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create note: ${error.message}`);
  }

  return data;
}

export async function updateNote(
  client: TypedSupabaseClient,
  id: string,
  updates: Pick<NoteUpdate, 'title' | 'content'>,
): Promise<Note> {
  const { data, error } = await client
    .from('notes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save note: ${error.message}`);
  }

  return data;
}
