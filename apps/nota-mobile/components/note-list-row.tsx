import type { Note } from '@nota/database-types';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatNoteUpdatedAt } from '../lib/format-note-date';
import { displayNoteTitle } from '../lib/note-title';
import { colors, typography } from '../lib/theme';

export interface NoteListRowProps {
  note: Note;
  onPress: () => void;
}

export function NoteListRow({ note, onPress }: NoteListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {displayNoteTitle(note.title)}
        </Text>
        <Text style={styles.meta}>{formatNoteUpdatedAt(note.updated_at)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    backgroundColor: '#f3f3f3',
  },
  textBlock: {
    gap: 4,
  },
  title: {
    ...typography.heading,
    fontSize: 16,
  },
  meta: {
    ...typography.caption,
    fontSize: 12,
  },
});
