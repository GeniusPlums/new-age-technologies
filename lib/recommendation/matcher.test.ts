import { describe, expect, it } from 'vitest';
import productsData from '@/data/products.json';
import { matchProducts } from './matcher';
import type { ExtractedContext, Product } from '@/lib/types';

const products = productsData.products as Product[];

function context(overrides: Partial<ExtractedContext> = {}): ExtractedContext {
  return {
    intent: 'search',
    category: 'food',
    budget: { hasConstraint: false },
    dietaryPreferences: {
      vegan: false,
      vegetarian: false,
      glutenFree: false,
      proteinRich: false,
      organic: false,
      lowCalorie: false,
    },
    stylePreferences: {},
    keywords: [],
    originalQuery: 'test',
    ...overrides,
  };
}

describe('matchProducts', () => {
  it('returns vegan snacks under ₹300', () => {
    const results = matchProducts(
      products,
      context({
        budget: { max: 300, hasConstraint: true },
        dietaryPreferences: {
          vegan: true,
          vegetarian: false,
          glutenFree: false,
          proteinRich: false,
          organic: false,
          lowCalorie: false,
        },
        keywords: ['snacks'],
        originalQuery: 'vegan snacks under 300',
      })
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].price).toBeLessThanOrEqual(300);
    expect(results[0].dietary?.isVegan).toBe(true);
    expect(results[0].matchScore).toBeGreaterThanOrEqual(40);
  });

  it('maps kirtan to kurtas and keeps results under budget', () => {
    const results = matchProducts(
      products,
      context({
        category: 'fashion',
        budget: { max: 500, hasConstraint: true },
        keywords: ['kirtan'],
        originalQuery: 'kirtan under 500',
      })
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((product) => product.price <= 500)).toBe(true);
    expect(results.every((product) => /kurta|kurti/i.test(product.name))).toBe(true);
    expect(results.some((product) => product.id === 'fashion-011')).toBe(true);
  });

  it('does not dump unrelated products for an unknown item', () => {
    const results = matchProducts(
      products,
      context({
        category: 'unknown',
        budget: { max: 500, hasConstraint: true },
        keywords: ['xylophone'],
        originalQuery: 'xylophone under 500',
      })
    );

    expect(results).toEqual([]);
  });

  it('hard-filters products over the stated budget', () => {
    const results = matchProducts(
      products,
      context({
        category: 'fashion',
        budget: { max: 500, hasConstraint: true },
        keywords: ['kurta'],
        originalQuery: 'kurta under 500',
      })
    );

    expect(results.every((product) => product.price <= 500)).toBe(true);
    expect(results.some((product) => /kurta/i.test(product.name))).toBe(true);
    expect(results.some((product) => product.price === 1499)).toBe(false);
  });

  it('filters out-of-stock products', () => {
    const withOos = [
      ...products,
      { ...products[0], id: 'oos', inStock: false, name: 'Out of stock vegan snack' },
    ];
    const results = matchProducts(
      withOos,
      context({
        keywords: ['out', 'of', 'stock'],
        dietaryPreferences: {
          vegan: true,
          vegetarian: false,
          glutenFree: false,
          proteinRich: false,
          organic: false,
          lowCalorie: false,
        },
      })
    );
    expect(results.every((p) => p.id !== 'oos')).toBe(true);
  });
});
