export type PlatformPreviewKind =
  | 'reddit-post'
  | 'reddit-sub'
  | 'youtube-video'
  | 'youtube-channel';

/** Compact hyperlink preview payload (server → editor). */
export type PlatformLinkPreview = {
  kind: PlatformPreviewKind;
  logoUrl: string;
  /** Shown with font-semibold / bold. */
  boldText: string;
  /** Plain text before the bold segment. */
  prefixText: string;
  /** Plain text after the bold segment. */
  suffixText: string;
  /**
   * When set (reddit sub homepage), the visible label is this string
   * instead of prefix/bold/suffix — typically the pasted URL.
   */
  displayText?: string;
  thumbnailUrl?: string;
  channelName?: string;
  channelAvatarUrl?: string;
  subreddit?: string;
  subredditAvatarUrl?: string;
  postTitle?: string;
  op?: string;
  userAvatarUrl?: string;
};

export type OgPreviewWithPlatform = {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  platform: PlatformLinkPreview | null;
};
