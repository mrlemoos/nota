import { useLocalSearchParams, Link, useRouter } from 'expo-router';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { NotaMobileEditor } from '@nota/mobile-editor';
import { useMobileSession } from '../../../lib/session-context';
import { parseNoteLinkPath } from '@nota/internal-note-link';

/**
 * Dynamic note route for deep links.
 * Matches nota://notes/:id  (and /notes/:id within app)
 * Uses @nota/internal-note-link helpers (shared with desktop/web).
 */
export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useMobileSession();
  const router = useRouter();

  // Validate via shared parser (defensive)
  const validId = id && parseNoteLinkPath(`/notes/${id}`) === id ? id : null;

  if (!validId) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Invalid note link</Text>
        <Link href="/(main)" style={styles.back}>
          <Text>Back to home</Text>
        </Link>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Note</Text>
        <Text style={styles.id} numberOfLines={1}>
          ID: {validId}
        </Text>
      </View>

      <View style={styles.editorContainer}>
        <NotaMobileEditor
          content={{
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Opened via deep link.' }],
              },
            ],
          }}
          onUpdate={() => {}}
          noteId={validId}
          userId={user?.id ?? 'demo'}
        />
      </View>

      <Text style={styles.note}>
        This route is registered for Clerk OAuth callbacks (indirectly) and
        internal note links (nota://notes/:uuid). Future: load from offline
        store + allow editing + outbox sync.
      </Text>

      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header: { gap: 4 },
  title: { fontSize: 24, fontWeight: '600' },
  id: { fontSize: 12, color: '#888', fontFamily: 'Menlo' },
  editorContainer: {
    minHeight: 220,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  note: { fontSize: 13, color: '#555', lineHeight: 20 },
  error: { color: '#c33', fontSize: 16 },
  back: { color: '#0066cc' },
  backButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 6,
  },
  backButtonText: { fontSize: 15 },
});
