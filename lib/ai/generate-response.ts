import { streamText } from 'ai';
import type { ExtractedContext, ScoredProduct, Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { AI_PRESETS, DEFAULT_TEMPERATURE } from './config';

export async function generateRecommendationResponse(
  context: ExtractedContext,
  products: ScoredProduct[],
  isRefinement: boolean = false
) {
  const productList = products
    .map(
      (p, i) =>
        `${i + 1}. **${p.name}** by ${p.brand}
   - Price: ${formatPrice(p.price)}
   - Match Score: ${p.matchScore}%
   - Why it's perfect: ${p.matchReasons.join(', ') || 'Great quality product'}
   - Description: ${p.description}`
    )
    .join('\n\n');

  const systemPrompt = `You are ShopSmart AI, a friendly and knowledgeable shopping assistant for Indian consumers.

Your personality:
- Warm and conversational, like a helpful friend
- Knowledgeable about Indian food and fashion preferences
- Focused on helping users find exactly what they need
- Use simple language, avoid being overly formal

Response guidelines:
1. ${isRefinement ? 'Acknowledge that you understood their refinement (e.g., "Here are some options within your budget..." or "Based on your updated criteria...")' : 'Start with a brief, friendly acknowledgment of what they\'re looking for'}
2. Present the products naturally in a conversational way
3. Mention the match percentage and key reasons for each product
4. Use INR (₹) for all prices
5. End with a helpful suggestion or question to continue the conversation
6. Keep responses concise but informative (2-3 short paragraphs max)
${isRefinement ? '7. Reference that this is an updated/refined search based on their new criteria' : ''}

DO NOT include any JSON, code, or special markers in your response. Just write natural conversational text.`;

  const userPrompt = `User's query: "${context.originalQuery}"
${isRefinement ? '\nNote: This is a FOLLOW-UP/REFINEMENT of their previous search. They are narrowing down their options.\n' : ''}
Extracted preferences:
- Category: ${context.category}
- Budget: ${context.budget.hasConstraint ? `Up to ${formatPrice(context.budget.max || 0)}` : 'No specific budget'}
- Style: ${context.stylePreferences.type || 'Not specified'}
- Key interests: ${context.keywords.join(', ') || 'General browsing'}

Here are the best matching products to recommend:

${productList}

Write a friendly, conversational response presenting these products to the user.${isRefinement ? ' Acknowledge that you\'ve adjusted the results based on their new criteria.' : ''}`;

  return streamText({
    model: AI_PRESETS.chat.model,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: DEFAULT_TEMPERATURE,
    experimental_providerMetadata: AI_PRESETS.chat.providerOptions,
  });
}

export async function generateGreetingResponse() {
  const systemPrompt = `You are ShopSmart AI, a friendly shopping assistant for Indian consumers looking for food and fashion products.

Respond to greetings warmly and briefly introduce what you can help with:
- Finding the perfect food products (healthy snacks, breakfast items, beverages)
- Discovering fashion items (ethnic wear, casual clothing, formal wear)
- Personalized recommendations based on their preferences and budget

Keep the greeting short and inviting. Suggest 2-3 example queries they could try.`;

  return streamText({
    model: AI_PRESETS.chat.model,
    system: systemPrompt,
    prompt: 'The user has just greeted me. Respond warmly and help them get started.',
    temperature: DEFAULT_TEMPERATURE,
    experimental_providerMetadata: AI_PRESETS.chat.providerOptions,
  });
}

export async function generateNoResultsResponse(context: ExtractedContext) {
  const systemPrompt = `You are ShopSmart AI. The user searched for something but we couldn't find good matches.

Be helpful and:
1. Acknowledge their search
2. Explain briefly why we might not have matches
3. Suggest alternative searches or ask clarifying questions
4. Stay positive and helpful`;

  return streamText({
    model: AI_PRESETS.chat.model,
    system: systemPrompt,
    prompt: `User searched for: "${context.originalQuery}"
Category: ${context.category}
Keywords: ${context.keywords.join(', ')}

Help them refine their search or suggest alternatives.`,
    temperature: DEFAULT_TEMPERATURE,
    experimental_providerMetadata: AI_PRESETS.chat.providerOptions,
  });
}

export async function generateOtherResponse(query: string) {
  const systemPrompt = `You are ShopSmart AI, a shopping assistant. The user has asked something that isn't a product search.

Be helpful and:
1. Try to answer their question if it's about your capabilities
2. Gently guide them back to product recommendations
3. Provide example queries they can try

You can help with:
- Food products: snacks, breakfast items, beverages, spreads
- Fashion: ethnic wear, casual clothing, formal wear, sportswear, accessories

Keep responses brief and friendly.`;

  return streamText({
    model: AI_PRESETS.chat.model,
    system: systemPrompt,
    prompt: query,
    temperature: DEFAULT_TEMPERATURE,
    experimental_providerMetadata: AI_PRESETS.chat.providerOptions,
  });
}

// Cart response generator
export async function generateCartResponse(
  action: 'view' | 'add' | 'remove' | 'clear',
  product?: Product,
  cartSummary?: string
) {
  const systemPrompt = `You are ShopSmart AI, a friendly shopping assistant. Respond to cart actions naturally and helpfully.

For 'add': Confirm the item was added, mention the product name and price, and ask if they need anything else.
For 'view': Present the cart summary in a friendly way, mention the total if items exist.
For 'remove': Confirm removal and suggest they might want to look at alternatives.
For 'clear': Confirm cart was cleared and invite them to continue shopping.

Keep responses brief (1-2 sentences) and conversational.`;

  const prompts: Record<string, string> = {
    view: `User wants to view their cart. Cart contents:\n${cartSummary || 'Your cart is empty.'}`,
    add: `User added "${product?.name}" to their cart. Price: ${product ? formatPrice(product.price) : 'N/A'}`,
    remove: `User removed an item from their cart.`,
    clear: `User cleared their entire cart.`,
  };

  return streamText({
    model: AI_PRESETS.chat.model,
    system: systemPrompt,
    prompt: prompts[action],
    temperature: DEFAULT_TEMPERATURE,
    experimental_providerMetadata: AI_PRESETS.chat.providerOptions,
  });
}

// Comparison response generator
export async function generateComparisonResponse(products: ScoredProduct[]) {
  const productDetails = products
    .map(
      (p) =>
        `- **${p.name}** by ${p.brand}
  Price: ${formatPrice(p.price)}
  Match Score: ${p.matchScore}%
  Rating: ${p.rating}/5
  Key Features: ${p.matchReasons.join(', ')}`
    )
    .join('\n\n');

  const systemPrompt = `You are ShopSmart AI. Generate a helpful comparison analysis of the products.

Guidelines:
1. Highlight key differences between the products
2. Consider value for money, features, and quality
3. Make a recommendation based on the match scores and features
4. Be conversational but informative
5. Keep the comparison concise (2-3 short paragraphs)`;

  return streamText({
    model: AI_PRESETS.analysis.model,
    system: systemPrompt,
    prompt: `Compare these ${products.length} products for the user:\n\n${productDetails}`,
    temperature: DEFAULT_TEMPERATURE,
    experimental_providerMetadata: AI_PRESETS.analysis.providerOptions,
  });
}

export async function generateCheckoutResponse() {
  const systemPrompt = `You are Lumin, a warm shopping assistant. The checkout panel is opening so the user can pay with mock UPI, card, or cash on delivery.

Keep it to 1-2 sentences. Mention they can complete payment in the checkout panel. Do not invent order IDs.`;

  return streamText({
    model: AI_PRESETS.chat.model,
    system: systemPrompt,
    prompt: 'The user wants to checkout and pay.',
    temperature: DEFAULT_TEMPERATURE,
    experimental_providerMetadata: AI_PRESETS.chat.providerOptions,
  });
}

export async function generateOrdersResponse() {
  const systemPrompt = `You are Lumin. The orders panel is opening. In one short sentence, tell the user they can review past mock orders there.`;

  return streamText({
    model: AI_PRESETS.chat.model,
    system: systemPrompt,
    prompt: 'The user wants to see their orders.',
    temperature: DEFAULT_TEMPERATURE,
    experimental_providerMetadata: AI_PRESETS.chat.providerOptions,
  });
}
