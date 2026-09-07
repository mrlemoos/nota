import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import { HeroStage } from '@/hero-stage/hero-stage';

/**
 * `/hero-stage` is the surface the marketing hero video is filmed against.
 *
 * Development only: it exists so `apps/nota-marketing/scripts/record-hero.ts`
 * can drive the real notes UI over an invented vault. Production 404s so the
 * route never ships.
 */
export default function HeroStagePage(): JSX.Element {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  return <HeroStage />;
}
