import { generateObject } from 'ai';
import { z } from 'zod';
import type { ExtractedContext } from '@/lib/types';
import { AI_PRESETS, DEFAULT_TEMPERATURE } from './config';

const contextSchema = z.object({
  intent: z.enum([
    'search',
    'recommendation',
    'comparison',
    'greeting',
    'refinement',
    'other',
    'add_to_cart',
    'view_cart',
    'remove_from_cart',
    'checkout',
    'view_orders',
  ]).describe('Detect user intent including cart, checkout, and order history'),
  category: z.enum(['food', 'fashion', 'both', 'unchanged']).describe('Use "unchanged" if user is refining previous search without mentioning category'),
  budget: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    hasConstraint: z.boolean(),
    unchanged: z.boolean().describe('True if user did not mention budget in this message'),
  }),
  dietaryPreferences: z.object({
    vegan: z.boolean(),
    vegetarian: z.boolean(),
    glutenFree: z.boolean(),
    proteinRich: z.boolean(),
    organic: z.boolean(),
    lowCalorie: z.boolean(),
    unchanged: z.boolean().describe('True if user did not mention dietary preferences in this message'),
  }),
  stylePreferences: z.object({
    type: z.enum(['ethnic', 'casual', 'formal', 'sportswear', 'streetwear']).optional(),
    occasion: z.string().optional(),
    fabric: z.string().optional(),
    fit: z.enum(['regular', 'slim', 'oversized', 'relaxed']).optional(),
    season: z.enum(['summer', 'winter', 'all-season', 'monsoon']).optional(),
    unchanged: z.boolean().describe('True if user did not mention style preferences in this message'),
  }),
  keywords: z.array(z.string()),
  isFollowUp: z.boolean().describe('True if this is a follow-up/refinement of a previous search'),
  cartAction: z.object({
    type: z.enum(['add', 'remove', 'view', 'clear']).optional(),
    productName: z.string().optional().describe('Name or description of product for cart action'),
    productId: z.string().optional(),
  }).optional().describe('Cart action details when intent is cart-related'),
  comparisonProducts: z.array(z.string()).optional().describe('Product names/descriptions to compare when intent is comparison'),
});

// Store the last context for maintaining conversation state
let lastContext: ExtractedContext | null = null;

export async function extractContext(
  query: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<ExtractedContext> {
  // Build conversation context summary
  const recentMessages = conversationHistory?.slice(-6) || [];
  const historyContext = recentMessages
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.substring(0, 200)}`)
    .join('\n');

  const systemPrompt = `You are a context extraction AI for an Indian e-commerce platform selling food and fashion products.

CRITICAL: This is a CONVERSATIONAL shopping assistant. Users often make follow-up requests that REFINE their previous search rather than starting a new one.

Examples of follow-up refinements:
- After "show me ethnic wear" → "something cheaper" = ethnic wear with lower budget
- After "vegan snacks under 300" → "show me more options" = same search, more results
- After "casual tees" → "in blue" = casual tees in blue color
- After "kurtas for summer" → "under 1000" = summer kurtas under ₹1000

${historyContext ? `\n=== CONVERSATION HISTORY ===\n${historyContext}\n=== END HISTORY ===\n` : ''}

${lastContext ? `\n=== PREVIOUS SEARCH CONTEXT ===
Category: ${lastContext.category}
Budget: ${lastContext.budget.hasConstraint ? `₹${lastContext.budget.min || 0} - ₹${lastContext.budget.max || 'no limit'}` : 'No constraint'}
Style: ${lastContext.stylePreferences.type || 'Not specified'}
Dietary: ${Object.entries(lastContext.dietaryPreferences).filter(([k, v]) => v === true && k !== 'unchanged').map(([k]) => k).join(', ') || 'None'}
Keywords: ${lastContext.keywords.join(', ')}
=== END PREVIOUS CONTEXT ===` : ''}

Analyze the CURRENT user query: "${query}"

Instructions:
1. Determine if this is a NEW search or a REFINEMENT of the previous search
2. If it's a refinement (isFollowUp=true):
   - Set "unchanged" to true for fields the user did NOT mention
   - Only extract values for fields the user DID mention
   - Example: "under 1000" only changes budget, everything else is "unchanged"
3. If it's a new search (isFollowUp=false):
   - Extract all relevant fields fresh
   - Set "unchanged" to false for all fields
4. Intent "refinement" = user is adjusting previous search
5. Budget is in INR (₹). Common patterns: "under X", "below X", "less than X", "within X"

Be generous with detecting follow-ups. Phrases like "show me cheaper", "something else", "more options", "different color", "lower price" are ALL follow-ups.

CART ACTION DETECTION:
- "add to cart", "buy this", "I'll take it", "add the first one" → intent: add_to_cart
- "show my cart", "what's in my bag", "view cart" → intent: view_cart
- "remove from cart", "take out", "delete from cart" → intent: remove_from_cart
- For cart actions, extract the product name if mentioned (e.g., "add the kurta to cart" → productName: "kurta")

CHECKOUT AND ORDERS:
- "checkout", "pay", "place order", "buy now", "complete purchase" → intent: checkout
- "my orders", "order history", "track order" → intent: view_orders

COMPARISON DETECTION:
- "compare these", "which is better", "compare the first two" → intent: comparison
- Extract product names/references for comparison`;

  try {
    const { object } = await generateObject({
      model: AI_PRESETS.extraction.model,
      schema: contextSchema,
      system: systemPrompt,
      prompt: query,
      temperature: DEFAULT_TEMPERATURE,
      experimental_providerMetadata: AI_PRESETS.extraction.providerOptions,
    });

    // Merge with previous context if this is a follow-up
    let finalContext: ExtractedContext;

    if (object.isFollowUp && lastContext) {
      finalContext = {
        intent: object.intent === 'refinement' ? 'search' : object.intent,
        category: object.category === 'unchanged' ? lastContext.category : (object.category as 'food' | 'fashion' | 'both' | 'unknown'),
        budget: object.budget.unchanged
          ? lastContext.budget
          : {
              min: object.budget.min,
              max: object.budget.max,
              hasConstraint: object.budget.hasConstraint
            },
        dietaryPreferences: object.dietaryPreferences.unchanged
          ? lastContext.dietaryPreferences
          : {
              vegan: object.dietaryPreferences.vegan,
              vegetarian: object.dietaryPreferences.vegetarian,
              glutenFree: object.dietaryPreferences.glutenFree,
              proteinRich: object.dietaryPreferences.proteinRich,
              organic: object.dietaryPreferences.organic,
              lowCalorie: object.dietaryPreferences.lowCalorie,
            },
        stylePreferences: object.stylePreferences.unchanged
          ? lastContext.stylePreferences
          : {
              type: object.stylePreferences.type,
              occasion: object.stylePreferences.occasion,
              fabric: object.stylePreferences.fabric,
              fit: object.stylePreferences.fit,
              season: object.stylePreferences.season,
            },
        keywords: object.keywords.length > 0
          ? Array.from(new Set([...lastContext.keywords, ...object.keywords]))
          : lastContext.keywords,
        originalQuery: query,
        cartAction: object.cartAction,
        comparisonProducts: object.comparisonProducts,
      };
    } else {
      finalContext = {
        intent: object.intent === 'refinement' ? 'search' : object.intent,
        category: object.category === 'unchanged' ? 'unknown' : (object.category as 'food' | 'fashion' | 'both' | 'unknown'),
        budget: {
          min: object.budget.min,
          max: object.budget.max,
          hasConstraint: object.budget.hasConstraint
        },
        dietaryPreferences: {
          vegan: object.dietaryPreferences.vegan,
          vegetarian: object.dietaryPreferences.vegetarian,
          glutenFree: object.dietaryPreferences.glutenFree,
          proteinRich: object.dietaryPreferences.proteinRich,
          organic: object.dietaryPreferences.organic,
          lowCalorie: object.dietaryPreferences.lowCalorie,
        },
        stylePreferences: {
          type: object.stylePreferences.type,
          occasion: object.stylePreferences.occasion,
          fabric: object.stylePreferences.fabric,
          fit: object.stylePreferences.fit,
          season: object.stylePreferences.season,
        },
        keywords: object.keywords,
        originalQuery: query,
        cartAction: object.cartAction,
        comparisonProducts: object.comparisonProducts,
      };
    }

    // Save context for next turn
    if (
      finalContext.intent !== 'greeting' &&
      finalContext.intent !== 'other' &&
      finalContext.intent !== 'checkout' &&
      finalContext.intent !== 'view_orders' &&
      finalContext.intent !== 'view_cart' &&
      finalContext.intent !== 'add_to_cart' &&
      finalContext.intent !== 'remove_from_cart'
    ) {
      lastContext = finalContext;
    }

    return finalContext;
  } catch (error) {
    console.error('Context extraction error:', error);
    // Return a default context on error, preserving last context if available
    const fallback: ExtractedContext = lastContext || {
      intent: 'search',
      category: 'unknown',
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
      keywords: query.toLowerCase().split(' ').filter((w) => w.length > 2),
      originalQuery: query,
    };
    return { ...fallback, originalQuery: query };
  }
}

// Reset context (can be called when conversation is cleared)
export function resetContext() {
  lastContext = null;
}
