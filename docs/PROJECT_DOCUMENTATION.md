# Lumin - AI Shopping Assistant

## Project Documentation

---

## 1. Problem Definition

### Problem Statement
Traditional e-commerce search relies on keyword matching and rigid filters, leading to poor discovery and user frustration. Users often struggle to find products that match their specific needs, dietary requirements, style preferences, and budget constraints.

### Solution
Lumin is a conversational AI-powered shopping assistant that understands natural language queries and provides personalized product recommendations. Users can:
- Describe what they want in plain language ("vegan snacks under ₹300")
- Refine results conversationally ("show me something cheaper")
- Compare products side-by-side
- Manage their cart through chat

### Target Market
Indian D2C brands focusing on:
- **Food**: Healthy snacks, breakfast items, beverages, spreads
- **Fashion**: Ethnic wear, casual, formal, sportswear, accessories

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  ChatInput   │  │ ChatMessage  │  │    ProductGrid       │  │
│  └──────┬───────┘  └──────────────┘  └──────────────────────┘  │
│         │                                                        │
│  ┌──────▼───────────────────────────────────────────────────┐   │
│  │                   ChatContainer                           │   │
│  │                   (useChat hook)                          │   │
│  └──────┬───────────────────────────────────────────────────┘   │
│         │                                                        │
├─────────┼────────────────────────────────────────────────────────┤
│         │              State Management                          │
│  ┌──────▼───────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ CartContext  │  │ Comparison   │  │   localStorage       │  │
│  │ (useReducer) │  │   Context    │  │   (persistence)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ POST /api/chat
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (API Routes)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  /api/chat/route.ts                       │   │
│  │                                                           │   │
│  │  1. Extract Context (AI)                                  │   │
│  │  2. Route by Intent                                       │   │
│  │  3. Match Products                                        │   │
│  │  4. Generate Response (AI)                                │   │
│  │  5. Stream Response + Data                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐     │
│  │  AI Config  │  │  Matcher    │  │  Response Generator │     │
│  │  (Gemini)   │  │  (Scoring)  │  │  (Prompts)          │     │
│  └─────────────┘  └─────────────┘  └─────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌────────────────────────────────┐  │
│  │  Google Gemini API   │  │  Product Database (JSON)       │  │
│  │  (AI Inference)      │  │  (18 products: food + fashion) │  │
│  └──────────────────────┘  └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack
| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| UI | React 18 + Tailwind CSS + Shadcn/ui |
| AI | Vercel AI SDK + Google Gemini 3 Flash |
| Validation | Zod |
| State | React Context + useReducer |
| Icons | Lucide React |

---

## 3. Data Flow

### User Query Processing Pipeline

```
┌─────────────────┐
│   User Input    │
│ "vegan snacks   │
│  under ₹300"    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    CONTEXT EXTRACTION                        │
│                                                              │
│  Input: User message + Conversation history (last 6 msgs)   │
│                                                              │
│  AI extracts structured data using Zod schema:              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ {                                                   │    │
│  │   intent: "search",                                 │    │
│  │   category: "food",                                 │    │
│  │   budget: { max: 300 },                            │    │
│  │   dietary: { isVegan: true },                      │    │
│  │   keywords: ["snacks"],                            │    │
│  │   isFollowUp: false                                │    │
│  │ }                                                   │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    CONTEXT MERGING                           │
│                                                              │
│  If follow-up query (e.g., "something cheaper"):            │
│  - Preserve previous context                                 │
│  - Only update fields user mentioned                         │
│  - Allows iterative refinement                              │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    INTENT ROUTING                            │
│                                                              │
│  ┌─────────────┬───────────────────────────────────────┐   │
│  │   Intent    │            Action                      │   │
│  ├─────────────┼───────────────────────────────────────┤   │
│  │  greeting   │  Generate welcome message             │   │
│  │  search     │  Match products → Recommend           │   │
│  │  comparison │  Compare selected products            │   │
│  │  add_cart   │  Add product to cart                  │   │
│  │  view_cart  │  Show cart contents                   │   │
│  │  other      │  General conversation                 │   │
│  └─────────────┴───────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   PRODUCT MATCHING                           │
│                                                              │
│  Weighted Scoring Algorithm (Total: 100 points)             │
│  ┌──────────────────┬────────┬─────────────────────────┐   │
│  │    Component     │ Weight │      Criteria           │   │
│  ├──────────────────┼────────┼─────────────────────────┤   │
│  │  Category        │   25   │ Exact match             │   │
│  │  Budget          │   25   │ Within price range      │   │
│  │  Preferences     │   30   │ Dietary/Style match     │   │
│  │  Keywords        │   20   │ Name/desc/tags match    │   │
│  └──────────────────┴────────┴─────────────────────────┘   │
│                                                              │
│  Minimum threshold: 40 points                               │
│  Returns: Top 5 products with scores + match reasons        │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  RESPONSE GENERATION                         │
│                                                              │
│  AI generates conversational response with:                  │
│  - Acknowledgment of user preferences                        │
│  - Product recommendations with match scores                 │
│  - Match reasons (why product fits)                         │
│  - Prices in INR (₹)                                        │
│  - Suggestions for refinement                               │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    STREAM RESPONSE                           │
│                                                              │
│  Uses Vercel AI SDK StreamData to send:                     │
│  - AI text (streamed token by token)                        │
│  - Product data (structured JSON)                           │
│  - Action triggers (cart updates, comparisons)              │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND UI                             │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Chat Bubble │  │ Product     │  │ Cart/Comparison     │ │
│  │ (AI text)   │  │ Cards       │  │ Actions             │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. AI Logic

### 4.1 Model Configuration

```typescript
// lib/ai/config.ts
Model: Google Gemini 3 Flash
Temperature: 1.0 (optimal for Gemini)

Thinking Levels:
- extraction: Minimal (fast context parsing)
- chat: Low (responsive conversations)
- analysis: Medium (product comparisons)
```

### 4.2 Context Extraction

The AI extracts structured data from natural language using a Zod schema:

```typescript
// Extracted Context Schema
{
  intent: "search" | "recommendation" | "comparison" | "greeting" |
          "add_to_cart" | "view_cart" | "remove_from_cart" | "other",

  category: "food" | "fashion" | "both" | "unknown",

  budget: {
    min?: number,
    max?: number,
    unchanged: boolean  // For follow-up queries
  },

  dietary: {
    isVegan?: boolean,
    isVegetarian?: boolean,
    isGlutenFree?: boolean,
    isProteinRich?: boolean,
    isOrganic?: boolean,
    isLowCalorie?: boolean
  },

  style: {
    type?: "ethnic" | "casual" | "formal" | "sportswear" | "streetwear",
    occasion?: string[],
    fabric?: string,
    fit?: "slim" | "regular" | "relaxed" | "oversized",
    season?: string
  },

  keywords: string[],
  isFollowUp: boolean,
  productId?: string  // For cart actions
}
```

### 4.3 Product Matching Algorithm

```
SCORING BREAKDOWN (100 points total):

┌─────────────────────────────────────────────────────────────┐
│ CATEGORY MATCH (25 points)                                   │
│                                                              │
│ - Exact match (food/fashion): 25 points                     │
│ - User wants "both": 25 points for either                   │
│ - No match: 0 points                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ BUDGET MATCH (25 points)                                     │
│                                                              │
│ - Within budget: 25 points                                  │
│ - Up to 20% over: Partial points (scaled)                   │
│ - Over 20%: 0 points                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PREFERENCE MATCH (30 points)                                 │
│                                                              │
│ Food Products:                                               │
│ - Each dietary match: +5 points                             │
│   (vegan, vegetarian, gluten-free, protein, organic, etc.)  │
│                                                              │
│ Fashion Products:                                            │
│ - Style type match: +10 points                              │
│ - Occasion match: +5 points                                 │
│ - Fabric match: +5 points                                   │
│ - Fit match: +5 points                                      │
│ - Season match: +5 points                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ KEYWORD MATCH (20 points)                                    │
│                                                              │
│ Searches across:                                             │
│ - Product name                                               │
│ - Description                                                │
│ - Brand                                                      │
│ - Tags                                                       │
│                                                              │
│ Points = (matched keywords / total keywords) × 20           │
└─────────────────────────────────────────────────────────────┘

FINAL: Products with score >= 40 are returned (top 5)
```

### 4.4 Response Generation Prompts

**System Prompt (Personality)**:
```
You are Lumin, a friendly AI shopping assistant for Indian D2C
food and fashion products. You have a warm, conversational tone.

Guidelines:
- Use natural language, not lists
- Show match scores as percentages
- Explain WHY products match user preferences
- Format prices in INR (₹)
- Suggest follow-up refinements
- Keep responses concise but helpful
```

**Response Types**:

| Type | Purpose | Example |
|------|---------|---------|
| Greeting | Welcome new users | "Hi! I'm Lumin. Looking for healthy snacks or trendy outfits?" |
| Recommendation | Product suggestions | "Here are 3 vegan snacks under ₹300..." |
| No Results | Guide user | "I couldn't find exact matches. Try adjusting your budget..." |
| Cart | Confirm actions | "Added Quinoa Bites to your cart!" |
| Comparison | Analyze products | "Comparing these 2 kurtas: Here's how they differ..." |

### 4.5 Conversation Memory

```
┌─────────────────────────────────────────────────────────────┐
│                  CONTEXT PERSISTENCE                         │
│                                                              │
│  Maintains last 6 messages for:                             │
│  - Follow-up detection ("show me cheaper ones")             │
│  - Context merging (preserve previous filters)              │
│  - Natural conversation flow                                │
│                                                              │
│  Example:                                                    │
│  User: "vegan snacks under ₹300"                            │
│  AI: [shows 3 products]                                     │
│  User: "something with more protein"                        │
│  AI: [refines to protein-rich vegan snacks under ₹300]     │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Key Features

| Feature | Description |
|---------|-------------|
| Natural Language Search | Understands queries like "ethnic wear for summer wedding" |
| Smart Recommendations | Weighted scoring considers budget, preferences, keywords |
| Conversational Refinement | Follow-up queries preserve context |
| Product Comparison | Side-by-side analysis of up to 3 products |
| Cart Management | Add, remove, view bag through chat or the header |
| Checkout & payments | Mock UPI, card, and COD with GST, shipping, and order IDs |
| Order history | Past mock orders stored on-device |
| Match Explanations | Shows why each product was recommended |
| Streaming Responses | Real-time AI response generation |

---

## 6. File Structure

```
e-com/
├── app/
│   ├── api/chat/route.ts      # Main API endpoint
│   ├── page.tsx               # Home page
│   ├── layout.tsx             # App layout
│   └── globals.css            # Theme & styles
├── components/
│   ├── chat/                  # Chat UI components
│   ├── cart/                  # Cart components
│   ├── product/               # Product cards
│   └── ui/                    # Shadcn components
├── lib/
│   ├── ai/
│   │   ├── config.ts          # Gemini configuration
│   │   ├── extract-context.ts # Context extraction
│   │   └── generate-response.ts # Response generation
│   ├── recommendation/
│   │   └── matcher.ts         # Product scoring
│   ├── context/               # React contexts
│   └── types/                 # TypeScript types
├── data/
│   └── products.json          # Product database
└── public/
    └── images/                # Product images
```

---

## 7. Future Enhancements

- [x] Mock checkout (UPI / card / COD) and order history
- [x] Saved delivery preferences (on-device)
- [ ] Real payment gateway (Razorpay)
- [ ] Real database integration (PostgreSQL/MongoDB)
- [ ] User authentication
- [ ] Voice input support
- [ ] Multi-language support (Hindi, regional)
- [ ] Advanced filtering UI
- [ ] Product reviews & ratings
- [ ] Inventory management
