'use client';

import { UtensilsCrossed, Shirt, Sparkles, Coffee } from 'lucide-react';
import { BrandMark } from '@/components/brand/BrandMark';

interface WelcomeMessageProps {
  onSampleQuery: (query: string) => void;
}

const sampleQueries = [
  {
    icon: UtensilsCrossed,
    query: 'Vegan snacks under ₹300',
    label: 'Pantry',
  },
  {
    icon: Shirt,
    query: 'Light ethnic wear for summer',
    label: 'Wardrobe',
  },
  {
    icon: Coffee,
    query: 'Protein-rich breakfast options',
    label: 'Morning',
  },
  {
    icon: Sparkles,
    query: 'Casual wear under ₹1000',
    label: 'Everyday',
  },
];

export function WelcomeMessage({ onSampleQuery }: WelcomeMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-2 py-10 text-center animate-rise-in">
      <div className="mb-6 flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-muted-foreground">
        <BrandMark size={18} />
        Food & fashion, in your words
      </div>

      <h1 className="font-display text-4xl sm:text-5xl leading-[1.08] tracking-tight max-w-xl mb-4">
        Find what feels right.
      </h1>
      <p className="text-muted-foreground max-w-md mb-10 text-[15px] leading-relaxed">
        Tell Lumin a craving, a budget, or a vibe. It will pull Indian D2C
        makers that actually match.
      </p>

      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sampleQueries.map((item) => (
          <button
            key={item.query}
            type="button"
            onClick={() => onSampleQuery(item.query)}
            className="group text-left rounded-2xl border border-border/80 bg-card/90 px-4 py-4 paper-shadow transition-all hover:-translate-y-0.5 hover:border-primary/30"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {item.label}
              </span>
              <item.icon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
              {item.query}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
