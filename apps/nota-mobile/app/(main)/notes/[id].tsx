import type { Json, Note } from '@nota/database-types';
import { isDocContentEqual, NotaMobileEditor } from '@nota/mobile-editor';
import {
  noteSurfaceMaxWidthPx,
  parseNoteEditorSettings,
} from '@nota/note-editor-settings';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { parseNoteLinkPath } from '@nota/internal-note-link';

import { displayNoteTitle } from '../../../lib/note-title';
import { buildNoteEditorBodyCss } from '../../../lib/note-editor-body-css';
import { notaSurfaceFontFamilies } from '../../../lib/nota-fonts';
import { getNote, updateNote } from '../../../lib/notes';
import { useMobileSession } from '../../../lib/session-context';
import { getSupabaseClient } from '../../../lib/supabase-client';
import { useDebouncedCallback } from '../../../lib/use-debounced-callback';
import { colors, sharedStyles, spacing, typography } from '../../../lib/theme';

const EMPTY_DOC: Json = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userId } = useMobileSession();

  const validId = id && parseNoteLinkPath(`/notes/${id}`) === id ? id : null;

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<Json>(EMPTY_DOC);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');

  const lastSavedTitle = useRef('');
  const lastSavedContent = useRef<Json>(EMPTY_DOC);
  const noteIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!validId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const client = getSupabaseClient();
        const row = await getNote(client, validId);
        if (cancelled) {
          return;
        }
        if (!row) {
          setError('This note could not be found.');
          setNote(null);
          return;
        }
        setNote(row);
        setTitle(row.title ?? '');
        setContent((row.content as Json) ?? EMPTY_DOC);
        lastSavedTitle.current = row.title ?? '';
        lastSavedContent.current = (row.content as Json) ?? EMPTY_DOC;
        noteIdRef.current = row.id;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load note.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [validId]);

  const persistNote = useCallback(
    async (nextTitle: string, nextContent: Json) => {
      if (!noteIdRef.current) {
        return;
      }

      const titleChanged = nextTitle !== lastSavedTitle.current;
      const contentChanged = !isDocContentEqual(
        nextContent,
        lastSavedContent.current,
      );

      if (!titleChanged && !contentChanged) {
        return;
      }

      setSaveState('saving');
      try {
        const client = getSupabaseClient();
        const updates: { title?: string; content?: Json } = {};
        if (titleChanged) {
          updates.title = displayNoteTitle(nextTitle);
        }
        if (contentChanged) {
          updates.content = nextContent;
        }
        const saved = await updateNote(client, noteIdRef.current, updates);
        lastSavedTitle.current = saved.title ?? '';
        lastSavedContent.current = (saved.content as Json) ?? EMPTY_DOC;
        setSaveState('saved');
      } catch {
        setSaveState('error');
      }
    },
    [],
  );

  const debouncedPersist = useDebouncedCallback(
    (nextTitle: string, nextContent: Json) => {
      void persistNote(nextTitle, nextContent);
    },
    600,
  );

  const handleTitleChange = (value: string) => {
    setTitle(value);
    debouncedPersist(value, content);
  };

  const handleContentUpdate = (next: unknown) => {
    const nextContent = (next as Json) ?? EMPTY_DOC;
    setContent(nextContent);
    debouncedPersist(title, nextContent);
  };

  const editorSettings = parseNoteEditorSettings(note?.editor_settings);
  const surfaceFonts = notaSurfaceFontFamilies(editorSettings);
  const editorBodyCss = useMemo(
    () => buildNoteEditorBodyCss(surfaceFonts.bodyFontFamily),
    [surfaceFonts.bodyFontFamily],
  );

  if (!validId) {
    return (
      <SafeAreaView style={sharedStyles.screen}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Invalid note link</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={sharedStyles.screen}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !note || !userId) {
    return (
      <SafeAreaView style={sharedStyles.screen}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Note unavailable'}</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>Back to notes</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const saveLabel =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'saved'
        ? 'Saved'
        : saveState === 'error'
          ? 'Save failed'
          : '';

  const contentMaxWidth = noteSurfaceMaxWidthPx(editorSettings);
  const isMonoTheme = editorSettings.font === 'mono';

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={8}
      >
        <View style={styles.toolbar}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.backLink}>Notes</Text>
          </Pressable>
          {saveLabel ? (
            <Text
              style={[
                styles.saveStatus,
                saveState === 'error' && styles.saveStatusError,
              ]}
            >
              {saveLabel}
            </Text>
          ) : null}
        </View>

        <View style={[styles.noteColumn, { maxWidth: contentMaxWidth }]}>
          <TextInput
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Untitled Note"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.titleInput,
              {
                fontFamily: surfaceFonts.titleFontFamily,
                fontSize: isMonoTheme ? 24 : 34,
                fontWeight: isMonoTheme ? '500' : '800',
              },
            ]}
            multiline
          />

          <View style={styles.editor}>
            <NotaMobileEditor
              content={content}
              onUpdate={handleContentUpdate}
              noteId={note.id}
              userId={userId}
              editorBodyCss={editorBodyCss}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backLink: {
    fontSize: 16,
    color: colors.link,
    fontWeight: '500',
  },
  saveStatus: {
    fontSize: 13,
    color: colors.muted,
  },
  saveStatusError: {
    color: colors.destructive,
  },
  noteColumn: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
  },
  titleInput: {
    color: colors.foreground,
    paddingBottom: spacing.sm,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  editor: {
    flex: 1,
    minHeight: 200,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    overflow: 'hidden',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: colors.destructive,
    textAlign: 'center',
  },
});
