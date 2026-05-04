import { NotaButton } from '@nota/web-design/button';
import { cn } from '@/lib/utils';
import { useIsElectron } from '@/lib/use-is-electron';
import { useEffect, type JSX } from 'react';
import { createPortal } from 'react-dom';

export type NoteImageLightboxImage = {
  src: string;
  alt: string;
  filename: string;
};

type NoteImageLightboxProps = {
  open: boolean;
  image: NoteImageLightboxImage | null;
  onClose: () => void;
};

export function NoteImageLightbox({
  open,
  image,
  onClose,
}: NoteImageLightboxProps): JSX.Element | null {
  const isElectron = useIsElectron();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose, open]);

  if (!open || !image || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-70 bg-background/90 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={`Image preview for ${image.filename}`}
      data-testid="note-image-lightbox-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex h-full min-h-0 flex-col">
        <header
          className={cn(
            'flex items-center justify-between gap-3 px-4 py-3 sm:px-6',
            isElectron
              ? 'pt-[max(0.75rem,env(safe-area-inset-top))] pl-20'
              : 'pt-[max(0.75rem,env(safe-area-inset-top))]',
          )}
        >
          <p className="min-w-0 truncate text-sm text-muted-foreground">
            {image.filename}
          </p>
          <NotaButton
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={onClose}
            aria-label="Close image view"
          >
            Close
          </NotaButton>
        </header>

        <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-8">
          <img
            src={image.src}
            alt={image.alt}
            className={cn(
              'max-h-full w-auto max-w-full rounded-xl object-contain shadow-2xl',
              'motion-safe:transition motion-safe:duration-300 motion-safe:ease-out',
            )}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
