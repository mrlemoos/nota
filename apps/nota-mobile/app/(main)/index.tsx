import { useMobileSession } from '../../lib/session-context';
import { Link, useRouter } from 'expo-router';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { NotaMobileEditor } from '@nota/mobile-editor';
import { hrefForNote } from '@nota/internal-note-link';

/**
 * Main home / vault entry for entitled Nota Pro users on mobile.
 * Currently a minimal skeleton + editor demo.
 * Future: real notes list from offline-core + sync via nota-server-client.
 */
export default function MainHome() {
  const { user, signOut, refreshEntitlement, notaProEntitled } =
    useMobileSession();
  const router = useRouter();

  const demoNoteId = '00000000-0000-0000-0000-000000000001'; // stable demo uuid for deep link testing

  const handleOpenDemoNote = () => {
    // Demonstrates internal /notes/:uuid deep link route + navigation
    router.push(`/notes/${demoNoteId}`);
  };

  const handleRefreshEntitlement = async () => {
    const entitled = await refreshEntitlement();
    Alert.alert(
      'Entitlement refreshed',
      entitled
        ? 'You are entitled to the full vault.'
        : 'Not entitled (paywall active).',
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Nota</Text>
        <Text style={styles.subtitle}>iPhone • Entitled ✓</Text>
      </View>

      {user && <Text style={styles.user}>{user.email ?? user.id}</Text>}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Editor (TenTap skeleton)</Text>
        <View style={styles.editorWrap}>
          <NotaMobileEditor
            content={{ type: 'doc', content: [] }}
            onUpdate={() => {}}
            noteId={demoNoteId}
            userId={user?.id ?? 'demo'}
          />
        </View>
        <Text style={styles.editorNote}>
          Full custom Nota nodes + hybrid islands coming in editor parity work.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.button} onPress={handleOpenDemoNote}>
          <Text style={styles.buttonText}>Open demo note (deep link test)</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={handleRefreshEntitlement}>
          <Text style={styles.buttonText}>Re-check entitlement</Text>
        </Pressable>

        <Pressable style={[styles.button, styles.danger]} onPress={signOut}>
          <Text style={[styles.buttonText, styles.dangerText]}>Sign out</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>
        Deep links supported: nota://notes/:uuid (and auth callbacks).
        {'\n'}Entitlement: {notaProEntitled ? 'active' : 'inactive'}
      </Text>

      <Link href="/paywall" style={{ marginTop: 20, alignSelf: 'center' }}>
        <Text style={{ color: '#0066cc' }}>View paywall (test)</Text>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 60, gap: 24 },
  header: { alignItems: 'center', marginTop: 12 },
  title: { fontSize: 32, fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#2a9d4e', marginTop: 4 },
  user: { textAlign: 'center', color: '#666', fontSize: 13, marginTop: 8 },
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  editorWrap: {
    minHeight: 180,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    padding: 12,
  },
  editorNote: {
    fontSize: 11,
    color: '#888',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actions: { gap: 12, marginTop: 8 },
  button: {
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '500' },
  danger: { backgroundColor: '#c33' },
  dangerText: { color: '#fff' },
  footer: {
    marginTop: 24,
    fontSize: 12,
    color: '#777',
    textAlign: 'center',
    lineHeight: 18,
  },
});
