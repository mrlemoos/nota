import { useEffect, useRef, useState, type JSX } from 'react';
import { Button } from '@getmadrid/design/button';
import { Icon } from '@getmadrid/design/icon';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@getmadrid/design/popover';
import { cn } from '@getmadrid/design/utils';
import { getBrowserClient } from '@getmadrid/data-source/supabase/browser';
import { useNoteEditorTranslator } from './use-note-editor-translator';
import {
  buildShareUrl,
  shareNote,
} from '@getmadrid/data-source/note-share-client';

interface NoteShareButtonProps {
  noteId: string;
  shareToken: string | null;
  disabled?: boolean;
  /** Notify the editor so the note's cached `share_token` updates in place. */
  onShared?: (token: string) => void;
}

export function NoteShareButton({
  noteId,
  shareToken,
  disabled,
  onShared,
}: NoteShareButtonProps): JSX.Element {
  const { t } = useNoteEditorTranslator();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(shareToken);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<'copy' | 'share' | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setToken(shareToken);
  }, [shareToken, noteId]);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  const flashCopied = () => {
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      flashCopied();
      setError(null);
    } catch {
      setError('copy');
    }
  };

  const createLink = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const result = await shareNote(getBrowserClient(), noteId, token);
      setToken(result.token);
      onShared?.(result.token);
      await copy(result.url);
    } catch {
      setError('share');
    } finally {
      setBusy(false);
    }
  };

  const url = token ? buildShareUrl(token) : null;
  const triggerLabel = token ? t('Shared') : t('Share');

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setError(null);
      }}
    >
      <PopoverTrigger
        disabled={disabled}
        aria-label={triggerLabel}
        render={
          <Button
            type="button"
            variant={token ? 'outline' : 'ghost'}
            size="sm"
            className={cn(
              'gap-1.5 text-muted-foreground hover:text-foreground',
              token && 'text-foreground/80',
            )}
          />
        }
      >
        <Icon name="link" size={14} strokeWidth={2} aria-hidden />
        {triggerLabel}
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        aria-label={t('Share')}
        className="w-[min(100vw-2rem,20rem)]"
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <PopoverTitle>{t('Share')}</PopoverTitle>
            <PopoverDescription>
              {t('Anyone with the link can view this note.')}
            </PopoverDescription>
          </div>
          {url ? (
            <div className="space-y-2">
              <input
                readOnly
                value={url}
                aria-label={t('Share')}
                onFocus={(e) => {
                  e.currentTarget.select();
                }}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  void copy(url);
                }}
              >
                {copied ? t('Link copied') : t('Copy link')}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              size="sm"
              className="w-full"
              disabled={busy}
              onClick={() => {
                void createLink();
              }}
            >
              {busy ? t('Sharing…') : t('Create link')}
            </Button>
          )}
          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error === 'copy'
                ? t('Could not copy link. Try again.')
                : t('Could not share link. Try again.')}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
