import { useCommandState } from 'cmdk';
import { useEffect, useRef, useState } from 'react';

import { postSemanticSearch } from '../lib/nota-server-client';

const DEBOUNCE_MS = 320;

type SemanticSearchJson = {
  results?: Array<{ noteId: string }>;
};

/**
 * Must render under `cmdk` `Command`. Debounces palette input and updates semantic note ordering.
 */
export function CommandPaletteSemanticSync(options: {
  enabled: boolean;
  onSemanticOrderedIds: (ids: string[] | null) => void;
  onLoadingChange: (loading: boolean) => void;
}): null {
  const { enabled, onSemanticOrderedIds, onLoadingChange } = options;
  const search = useCommandState((s) => s.search);
  const [debounced, setDebounced] = useState('');
  const cancelledRef = useRef(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebounced(search);
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(t);
    };
  }, [search]);

  useEffect(() => {
    if (!enabled) {
      onSemanticOrderedIds(null);
      onLoadingChange(false);
      return;
    }

    const q = debounced.trim();
    if (q.length === 0) {
      onSemanticOrderedIds(null);
      onLoadingChange(false);
      return;
    }

    cancelledRef.current = false;
    onLoadingChange(true);

    void (async () => {
      try {
        const res = await postSemanticSearch({ query: debounced });
        if (cancelledRef.current) {
          return;
        }
        if (!res.ok) {
          onSemanticOrderedIds(null);
          return;
        }
        const json = (await res.json()) as SemanticSearchJson;
        const ids = json.results?.map((r) => r.noteId).filter(Boolean) ?? [];
        onSemanticOrderedIds(ids);
      } catch {
        if (!cancelledRef.current) {
          onSemanticOrderedIds(null);
        }
      } finally {
        if (!cancelledRef.current) {
          onLoadingChange(false);
        }
      }
    })();

    return () => {
      cancelledRef.current = true;
    };
  }, [debounced, enabled, onLoadingChange, onSemanticOrderedIds]);

  return null;
}
