import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './button.js';
import { Icon } from './icon.js';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFloatingActions,
  SheetFloatingTitle,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet.js';

const meta = {
  title: 'Design/Sheet',
  component: Sheet,
  argTypes: {
    side: {
      control: 'inline-radio',
      options: ['top', 'right', 'bottom', 'left'],
    },
  },
} satisfies Meta<typeof Sheet>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Drag the sheet towards its edge to dismiss it; a flick keeps its velocity. */
export const Default: Story = {
  args: { side: 'right' },
  render: (args) => (
    <Sheet {...args}>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        Open attachment
      </SheetTrigger>
      <SheetContent showCloseButton={false}>
        <SheetHeader>
          <div className="min-w-0 flex-1">
            <SheetTitle>Quarterly review.pdf</SheetTitle>
            <SheetDescription>12 pages · 2.4 MB</SheetDescription>
          </div>
          <SheetClose render={<Button variant="ghost" size="sm" />}>
            Close
          </SheetClose>
        </SheetHeader>
        <SheetBody className="space-y-4 p-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="aspect-[8.5/11] rounded-md bg-muted/60 p-4 text-sm text-muted-foreground"
            >
              Page {index + 1}
            </div>
          ))}
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" size="sm">
            Download
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

/** Full-bleed surface: title and controls float over the content, no header band. */
export const FullBleed: Story = {
  args: { side: 'right' },
  render: (args) => (
    <Sheet {...args}>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        Open image
      </SheetTrigger>
      <SheetContent className="w-[min(64rem,94vw)]" showCloseButton={false}>
        <SheetFloatingTitle>Coastline at dusk.webp</SheetFloatingTitle>
        <SheetFloatingActions>
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            aria-label="Fill the window"
          >
            <Icon name="maximize" size={14} />
          </Button>
          <SheetClose
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                aria-label="Close"
              />
            }
          >
            <Icon name="x" size={14} />
          </SheetClose>
        </SheetFloatingActions>
        <SheetBody className="flex items-center justify-center p-6">
          <div className="aspect-[3/2] w-full rounded-xl bg-muted/60" />
        </SheetBody>
      </SheetContent>
    </Sheet>
  ),
};

/** Touch-first bottom sheet — the one place the grab handle earns its keep. */
export const BottomWithHandle: Story = {
  args: { side: 'bottom' },
  render: (args) => (
    <Sheet {...args}>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        Open capture
      </SheetTrigger>
      <SheetContent showHandle showCloseButton={false} className="max-w-2xl">
        <SheetHeader className="pt-6">
          <SheetTitle>Capture</SheetTitle>
        </SheetHeader>
        <SheetBody className="p-4">Recording controls go here.</SheetBody>
      </SheetContent>
    </Sheet>
  ),
};
