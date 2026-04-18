import { describe, expect, it } from 'bun:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  moneyToUsdDecimal,
  readMarketingGuidePrices,
  usdMinorUnitsToDecimal,
  validateUserBillingPlansAgainstExpectations,
  withinUsdTolerance,
  type BillingPlanLike,
} from './clerk-billing-marketing-expectations.ts';

describe('usdMinorUnitsToDecimal', () => {
  it('converts cents to dollars', () => {
    expect(usdMinorUnitsToDecimal(249)).toBe(2.49);
    expect(usdMinorUnitsToDecimal(1949)).toBe(19.49);
  });
});

describe('moneyToUsdDecimal', () => {
  it('maps USD minor units', () => {
    expect(moneyToUsdDecimal({ amount: 249, currency: 'usd' })).toBe(2.49);
    expect(moneyToUsdDecimal({ amount: 249, currency: 'USD' })).toBe(2.49);
  });

  it('returns null for non-USD', () => {
    expect(moneyToUsdDecimal({ amount: 249, currency: 'eur' })).toBeNull();
  });
});

describe('withinUsdTolerance', () => {
  it('accepts small drift', () => {
    expect(withinUsdTolerance(2.5, 2.49, 0.02)).toBe(true);
    expect(withinUsdTolerance(2.52, 2.49, 0.02)).toBe(false);
  });
});

describe('readMarketingGuidePrices', () => {
  it('reads marketing Astro and matches home vs pricing', () => {
    const g = readMarketingGuidePrices(repoRootFromThisFile());
    expect(g.monthlyUsd).toBe(2.49);
    expect(g.annualUsd).toBe(19.49);
  });
});

/** This spec lives in `apps/nota-server/src/lib/` → monorepo root is four parents up. */
function repoRootFromThisFile(): string {
  return join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
}

describe('validateUserBillingPlansAgainstExpectations', () => {
  const guide = { monthlyUsd: 2.49, annualUsd: 19.49 };

  it('errors when no public user plans', () => {
    const issues = validateUserBillingPlansAgainstExpectations([], guide);
    expect(issues.some((i) => i.code === 'no_public_user_plans')).toBe(true);
  });

  it('passes for a minimal valid catalogue', () => {
    const plans: BillingPlanLike[] = [
      makePlan({
        slug: 'nota-pro',
        isRecurring: true,
        fee: { amount: 249, currency: 'usd' },
        annualFee: { amount: 1949, currency: 'usd' },
        freeTrialEnabled: false,
        freeTrialDays: null,
      }),
      makePlan({
        slug: 'nota-lifetime',
        isRecurring: false,
        publiclyVisible: true,
        fee: { amount: 9999, currency: 'usd' },
        annualFee: null,
        freeTrialEnabled: false,
        isDefault: false,
      }),
    ];
    const issues = validateUserBillingPlansAgainstExpectations(plans, guide);
    const errors = issues.filter((i) => i.level === 'error');
    expect(errors).toEqual([]);
  });

  it('errors on free trial days', () => {
    const plans: BillingPlanLike[] = [
      makePlan({
        slug: 'bad',
        freeTrialEnabled: true,
        freeTrialDays: 14,
        fee: { amount: 249, currency: 'usd' },
        annualFee: { amount: 1949, currency: 'usd' },
      }),
    ];
    const issues = validateUserBillingPlansAgainstExpectations(plans, guide);
    expect(issues.some((i) => i.code === 'free_trial_on_plan')).toBe(true);
  });
});

function makePlan(
  overrides: Partial<BillingPlanLike> & Pick<BillingPlanLike, 'slug'>,
): BillingPlanLike {
  const { slug, ...rest } = overrides;
  return {
    id: 'plan_test',
    name: 'Test',
    forPayerType: 'user',
    publiclyVisible: true,
    isRecurring: true,
    hasBaseFee: true,
    isDefault: false,
    freeTrialEnabled: false,
    freeTrialDays: null,
    fee: { amount: 249, currency: 'usd' },
    annualFee: { amount: 1949, currency: 'usd' },
    annualMonthlyFee: null,
    ...rest,
    slug,
  };
}
