import type { Note } from '@nota/database-types';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NoteListRow } from '../../components/note-list-row';
import { createNote, listNotes } from '../../lib/notes';
import { useMobileSession } from '../../lib/session-context';
import { getSupabaseClient } from '../../lib/supabase-client';
import { colors, sharedStyles, spacing, typography } from '../../lib/theme';

export default function NotesHomeScreen() {
  const router = useRouter();
  const { user, userId, signOut } = useMobileSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const loadNotes = useCallback(
    async (isRefresh = false) => {
      if (!userId) {
        return;
      }
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const client = getSupabaseClient();
        const rows = await listNotes(client);
        setNotes(rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load notes.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const handleCreateNote = async () => {
    if (!userId || creating) {
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const client = getSupabaseClient();
      const note = await createNote(client, userId);
      router.push(`/notes/${note.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create a note.');
    } finally {
      setCreating(false);
    }
  };

  const renderEmpty = () => {
    if (loading) {
      return null;
    }
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No notes yet</Text>
        <Text style={styles.emptyBody}>
          Capture your first thought. Notes sync with your Nota vault.
        </Text>
        <Pressable
          style={[sharedStyles.primaryButton, styles.emptyButton]}
          onPress={() => void handleCreateNote()}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={sharedStyles.primaryButtonText}>New note</Text>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View>
          <Text style={typography.title}>Nota</Text>
          {user?.email ? (
            <Text style={typography.caption}>{user.email}</Text>
          ) : null}
        </View>
        <Pressable onPress={() => void signOut()} hitSlop={12}>
          <Text style={styles.signOut}>Sign out</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && notes.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoteListRow
              note={item}
              onPress={() => {
                router.push(`/notes/${item.id}`);
              }}
            />
          )}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadNotes(true)}
            />
          }
          contentContainerStyle={
            notes.length === 0 ? styles.listEmptyContainer : undefined
          }
        />
      )}

      {notes.length > 0 ? (
        <Pressable
          style={[styles.fab, creating && sharedStyles.disabled]}
          onPress={() => void handleCreateNote()}
          disabled={creating}
        >
          {creating ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={styles.fabLabel}>+</Text>
          )}
        </Pressable>
      ) : null}

      <SafeAreaView edges={['bottom']} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  signOut: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 8,
  },
  error: {
    color: colors.destructive,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listEmptyContainer: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.heading,
    fontSize: 20,
  },
  emptyBody: {
    ...typography.caption,
    textAlign: 'center',
    fontSize: 15,
  },
  emptyButton: {
    marginTop: spacing.sm,
    minWidth: 160,
  },
  fab: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fabLabel: {
    color: colors.primaryForeground,
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
});
