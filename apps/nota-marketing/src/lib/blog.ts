import type { CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>;

/** Published posts for the current environment (drafts hidden in production builds). */
export function isBlogPostPublished(entry: BlogPost): boolean {
  return import.meta.env.PROD ? entry.data.draft !== true : true;
}

export function sortBlogPostsByDate(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}

export function formatBlogDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function blogPostUrl(id: string): string {
  return `/blog/${id}`;
}
