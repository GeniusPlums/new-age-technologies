import { StreamData } from 'ai';
import { extractContext } from '@/lib/ai/extract-context';
import {
  generateRecommendationResponse,
  generateGreetingResponse,
  generateNoResultsResponse,
  generateOtherResponse,
  generateCartResponse,
  generateComparisonResponse,
  generateCheckoutResponse,
  generateOrdersResponse,
} from '@/lib/ai/generate-response';
import { matchProducts } from '@/lib/recommendation/matcher';
import productsData from '@/data/products.json';
import type { Product, ScoredProduct } from '@/lib/types';

export const maxDuration = 30;

// Helper function to find a product by name or partial match
function findProductByName(products: Product[], searchName: string): Product | null {
  const lowerSearch = searchName.toLowerCase();

  // Try exact match first
  const exactMatch = products.find(
    (p) => p.name.toLowerCase() === lowerSearch
  );
  if (exactMatch) return exactMatch;

  // Try partial match
  const partialMatch = products.find(
    (p) =>
      p.name.toLowerCase().includes(lowerSearch) ||
      lowerSearch.includes(p.name.toLowerCase())
  );
  return partialMatch || null;
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;

    // Extract conversation history for context
    const conversationHistory = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

    // Step 1: Extract context from user query
    const context = await extractContext(userQuery, conversationHistory);

    // Create StreamData for passing structured data
    const data = new StreamData();
    const products = productsData.products as Product[];

    // Step 2: Handle different intents

    // Handle greeting intent
    if (context.intent === 'greeting') {
      const result = await generateGreetingResponse();
      data.close();
      return result.toDataStreamResponse({ data });
    }

    // Handle cart intents
    if (context.intent === 'view_cart') {
      // Signal to frontend to show cart
      data.append(JSON.parse(JSON.stringify({ action: 'view_cart' })));
      const result = await generateCartResponse('view');
      data.close();
      return result.toDataStreamResponse({ data });
    }

    if (context.intent === 'add_to_cart') {
      const productName = context.cartAction?.productName;
      let productToAdd: Product | null = null;

      if (productName) {
        productToAdd = findProductByName(products, productName);
      }

      if (productToAdd) {
        data.append(JSON.parse(JSON.stringify({
          action: 'add_to_cart',
          product: productToAdd
        })));
        const result = await generateCartResponse('add', productToAdd);
        data.close();
        return result.toDataStreamResponse({ data });
      } else {
        // Couldn't find the product, respond helpfully
        const result = await generateOtherResponse(
          `User wants to add "${productName || 'something'}" to cart but I couldn't find it. Help them specify which product.`
        );
        data.close();
        return result.toDataStreamResponse({ data });
      }
    }

    if (context.intent === 'remove_from_cart') {
      data.append(JSON.parse(JSON.stringify({ action: 'remove_from_cart' })));
      const result = await generateCartResponse('remove');
      data.close();
      return result.toDataStreamResponse({ data });
    }

    if (context.intent === 'checkout') {
      data.append(JSON.parse(JSON.stringify({ action: 'open_checkout' })));
      const result = await generateCheckoutResponse();
      data.close();
      return result.toDataStreamResponse({ data });
    }

    if (context.intent === 'view_orders') {
      data.append(JSON.parse(JSON.stringify({ action: 'view_orders' })));
      const result = await generateOrdersResponse();
      data.close();
      return result.toDataStreamResponse({ data });
    }

    // Handle comparison intent
    if (context.intent === 'comparison' && context.comparisonProducts && context.comparisonProducts.length > 0) {
      // Try to find products to compare
      const productsToCompare: ScoredProduct[] = context.comparisonProducts
        .map((name) => {
          const found = findProductByName(products, name);
          if (found) {
            return {
              ...found,
              matchScore: 100,
              matchReasons: ['Selected for comparison'],
            };
          }
          return null;
        })
        .filter((p): p is ScoredProduct => p !== null);

      if (productsToCompare.length > 0) {
        data.append(JSON.parse(JSON.stringify({
          action: 'compare',
          products: productsToCompare
        })));
        const result = await generateComparisonResponse(productsToCompare);

        result.textStream.pipeTo(
          new WritableStream({
            close() {
              data.close();
            },
          })
        ).catch(() => {
          data.close();
        });

        return result.toDataStreamResponse({ data });
      }
    }

    // Handle other/unknown intent
    if (context.intent === 'other' && context.category === 'unknown') {
      const result = await generateOtherResponse(userQuery);
      data.close();
      return result.toDataStreamResponse({ data });
    }

    // Step 3: Match products based on extracted context (search/recommendation)
    const matchedProducts = matchProducts(products, context);

    // Step 4: Generate response
    if (matchedProducts.length === 0) {
      const result = await generateNoResultsResponse(context);
      data.close();
      return result.toDataStreamResponse({ data });
    }

    // Append product data to the stream
    data.append(JSON.parse(JSON.stringify({ products: matchedProducts })));

    // Check if this is a refinement
    const hasAssistantHistory = conversationHistory.some((m: { role: string }) => m.role === 'assistant');
    const isRefinement = hasAssistantHistory && context.category !== 'unknown';

    const result = await generateRecommendationResponse(context, matchedProducts, isRefinement);

    // Close the stream data when the text stream ends
    result.textStream.pipeTo(
      new WritableStream({
        close() {
          data.close();
        },
      })
    ).catch(() => {
      data.close();
    });

    return result.toDataStreamResponse({ data });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
