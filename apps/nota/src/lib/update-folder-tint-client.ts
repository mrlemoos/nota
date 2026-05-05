import type { Folder } from '~/types/database.types';
import { getBrowserClient } from './supabase/browser';
import { isLikelyOnline } from './notes-offline';
import { updateFolder } from '../models/folders';
import { folderTintOptionForPersisted } from './folder-tint-presets';

export async function clientUpdateFolderTint(options: {
  folderId: string;
  nextPersistedTint: string | null;
  /** Tint before this change; used to roll back the list on server failure. */
  previousPersistedTint: string | null;
  userId: string;
  notaProEntitled: boolean;
  patchFolderInList: (id: string, patch: Partial<Folder>) => void;
}): Promise<void> {
  const {
    folderId,
    nextPersistedTint,
    previousPersistedTint,
    userId,
    notaProEntitled,
    patchFolderInList,
  } = options;

  if (!userId || !notaProEntitled) {
    return;
  }

  if (!isLikelyOnline()) {
    return;
  }

  patchFolderInList(folderId, { tint: nextPersistedTint });

  try {
    const client = getBrowserClient();
    const row = await updateFolder(client, folderId, {
      tint: nextPersistedTint,
    });
    const normalised = folderTintOptionForPersisted(row.tint);
    patchFolderInList(folderId, { tint: normalised.persistedTint });
  } catch (e) {
    console.error('Failed to update folder tint:', e);
    patchFolderInList(folderId, { tint: previousPersistedTint });
  }
}
