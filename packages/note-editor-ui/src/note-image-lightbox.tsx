import { Button } from '@getmadrid/design/button';
import { Icon } from '@getmadrid/design/icon';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFloatingActions,
  SheetFloatingTitle,
} from '@getmadrid/design/sheet';
import {
  Tooltip,
  TooltipPopup,
  TooltipPortal,
  TooltipPositioner,
  TooltipProvider,
  TooltipTrigger,
} from '@getmadrid/design/tooltip';
import { cn } from '@getmadrid/design/utils';
import { formatPinchZoom, usePinchZoom } from '@getmadrid/editor';
import { useRef, useState, type JSX } from 'react';

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

/**
 * Full-height sheet for viewing a note image at size.
 *
 * @remarks
 * The image is the whole surface: the filename and the controls float over it
 * rather than sitting in a header band. "Fill window" widens the sheet to the
 * app window, not the display — no native fullscreen.
 */
export function NoteImageLightbox({
  open,
  image,
  onClose,
}: NoteImageLightboxProps): JSX.Element | null {
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const present = open && image !== null;
  const {
    zoom,
    readoutVisible,
    reset: resetZoom,
  } = usePinchZoom(scrollRef, present);

  // The parent clears `image` as it closes; keep the last one so the exit
  // transition animates a filled sheet rather than an empty one.
  const lastImageRef = useRef<NoteImageLightboxImage | null>(null);
  if (image) {
    lastImageRef.current = image;
  }

  const displayImage = lastImageRef.current;

  if (!displayImage) {
    return null;
  }

  const close = () => {
    setExpanded(false);
    resetZoom();
    onClose();
  };

  return (
    <Sheet
      side="right"
      open={present}
      onOpenChange={(nextOpen, eventDetails) => {
        if (nextOpen) {
          return;
        }
        // macOS order of undo: Escape gives the window back first, and only
        // closes the sheet once it is back at its normal width.
        if (expanded && eventDetails.reason === 'escape-key') {
          eventDetails.cancel();
          setExpanded(false);
          return;
        }
        close();
      }}
    >
      <SheetContent
        className={cn(
          expanded ? 'w-full rounded-none border-l-0' : 'w-[min(64rem,94vw)]',
        )}
        showCloseButton={false}
        data-sheet-expanded={expanded ? '' : undefined}
        data-testid="note-image-lightbox"
      >
        <TooltipProvider>
          <SheetFloatingTitle className="font-normal text-muted-foreground">
            {displayImage.filename}
          </SheetFloatingTitle>

          <SheetFloatingActions>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full"
                    aria-label={
                      expanded
                        ? 'Shrink image view'
                        : 'Fill the window with the image'
                    }
                    onClick={() => {
                      setExpanded((current) => !current);
                    }}
                  >
                    <Icon name={expanded ? 'minimize' : 'maximize'} size={14} />
                  </Button>
                }
              />
              <TooltipPortal>
                <TooltipPositioner side="bottom" sideOffset={6}>
                  <TooltipPopup>
                    {expanded ? 'Shrink' : 'Fill window'}
                  </TooltipPopup>
                </TooltipPositioner>
              </TooltipPortal>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full"
                    aria-label="Close image view"
                    onClick={close}
                  >
                    <Icon name="x" size={14} />
                  </Button>
                }
              />
              <TooltipPortal>
                <TooltipPositioner side="bottom" sideOffset={6}>
                  <TooltipPopup>Close</TooltipPopup>
                </TooltipPositioner>
              </TooltipPortal>
            </Tooltip>
          </SheetFloatingActions>

          <SheetBody ref={scrollRef} className="p-4 sm:p-6">
            {/* Zoom grows the frame in both axes so the body scrolls to the
                edges; the image keeps containing itself inside that frame. */}
            <div
              className="flex min-h-full min-w-full items-center justify-center"
              style={{
                width: formatPinchZoom(zoom),
                height: formatPinchZoom(zoom),
              }}
            >
              <img
                src={displayImage.src}
                alt={displayImage.alt}
                className="max-h-full w-auto max-w-full rounded-xl object-contain shadow-2xl"
              />
            </div>
          </SheetBody>

          <div
            aria-live="polite"
            data-testid="note-image-zoom-readout"
            className={cn(
              'pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2',
              'rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-md',
              'transition-opacity duration-200 ease-out',
              readoutVisible ? 'opacity-100' : 'opacity-0',
            )}
          >
            {formatPinchZoom(zoom)}
          </div>
        </TooltipProvider>
      </SheetContent>
    </Sheet>
  );
}
