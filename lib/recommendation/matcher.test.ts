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
