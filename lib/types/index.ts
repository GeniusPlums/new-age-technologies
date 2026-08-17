// Product Types
export interface DietaryInfo {
  isVegan: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  isProteinRich: boolean;
  isOrganic: boolean;
  isLowCalorie: boolean;
}

export interface StyleInfo {
  type: 'ethnic' | 'casual' | 'formal' | 'sportswear' | 'streetwear';
  occasion: string[];
  fabric: string;
  fit: 'regular' | 'slim' | 'oversized' | 'relaxed';
  season: 'summer' | 'winter' | 'all-season' | 'monsoon';
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: 'food' | 'fashion';
  subcategory: string;
  price: number;
  imageUrl: string;
  brand: string;
  dietary?: DietaryInfo;
  style?: StyleInfo;
  tags: string[];
  rating: number;
  inStock: boolean;
}

// AI Context Types
export interface BudgetConstraint {
  min?: number;
  max?: number;
  hasConstraint: boolean;
}

export interface DietaryPreferences {
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
  proteinRich: boolean;
  organic: boolean;
  lowCalorie: boolean;
}

export interface StylePreferences {
  type?: 'ethnic' | 'casual' | 'formal' | 'sportswear' | 'streetwear';
  occasion?: string;
  fabric?: string;
  fit?: 'regular' | 'slim' | 'oversized' | 'relaxed';
  season?: 'summer' | 'winter' | 'all-season' | 'monsoon';
}

// Cart Action Types
export interface CartAction {
  type?: 'add' | 'remove' | 'view' | 'clear';
  productName?: string;
  productId?: string;
}

export type PaymentMethod = 'upi' | 'card' | 'cod';
export type PaymentStatus = 'paid' | 'pending' | 'failed';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
}

export interface PaymentDetails {
  method: PaymentMethod;
  upiId?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardName?: string;
}

export interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  brand?: string;
}

export interface OrderTotals {
  subtotal: number;
  tax: number;
  shippingFee: number;
  total: number;
}

export interface Order {
  id: string;
  createdAt: string;
  items: CheckoutItem[];
  shipping: ShippingAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  totals: OrderTotals;
}

export interface ExtractedContext {
  intent: 'search' | 'recommendation' | 'comparison' | 'greeting' | 'other' | 'add_to_cart' | 'view_cart' | 'remove_from_cart' | 'checkout' | 'view_orders';
  category: 'food' | 'fashion' | 'both' | 'unknown';
  budget: BudgetConstraint;
  dietaryPreferences: DietaryPreferences;
  stylePreferences: StylePreferences;
  keywords: string[];
  originalQuery: string;
  cartAction?: CartAction;
  comparisonProducts?: string[];
}

// Recommendation Types
export interface ScoredProduct extends Product {
  matchScore: number;
  matchReasons: string[];
}

export interface RecommendationResult {
  products: ScoredProduct[];
  context: ExtractedContext;
}

// Cart Types
export interface CartItem extends Product {
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

// Comparison Types
export interface ComparisonState {
  products: ScoredProduct[];
  maxProducts: number;
}
