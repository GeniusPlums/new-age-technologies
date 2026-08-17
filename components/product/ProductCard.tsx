'use client';

import { ProductImage } from './ProductImage';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfidenceBadge } from './ConfidenceBadge';
import { formatPrice } from '@/lib/utils';
import { Star, ShoppingBag, GitCompare, Check } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import { useComparison } from '@/lib/context/ComparisonContext';
import type { ScoredProduct } from '@/lib/types';

interface ProductCardProps {
  product: ScoredProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, isInCart } = useCart();
  const { addToComparison, removeFromComparison, isInComparison, canAddMore } =
    useComparison();

  const inCart = isInCart(product.id);
  const inComparison = isInComparison(product.id);

  const handleComparisonClick = () => {
    if (inComparison) {
      removeFromComparison(product.id);
    } else {
      addToComparison(product);
    }
  };

  return (
    <Card
      className="overflow-hidden rounded-3xl border-border/70 paper-shadow hover:-translate-y-0.5 transition-transform duration-200 flex flex-col bg-card"
      data-testid="product-card"
      data-product-id={product.id}
      data-product-name={product.name}
      data-product-price={String(product.price)}
      data-product-category={product.category}
    >
      <div className="relative aspect-[4/5] bg-muted">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-3 left-3">
          <ConfidenceBadge score={product.matchScore} />
        </div>
      </div>
      <CardContent className="p-4 flex-1">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {product.brand}
              </p>
              <h3 className="font-display text-base leading-tight mt-0.5 line-clamp-2">
                {product.name}
              </h3>
            </div>
            <div className="flex items-center gap-1 text-primary shrink-0">
              <Star className="h-3 w-3 fill-current" />
              <span className="text-xs text-foreground">{product.rating}</span>
            </div>
          </div>

          <p className="text-lg font-semibold tracking-tight">
            {formatPrice(product.price)}
          </p>

          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {product.matchReasons.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {product.matchReasons.slice(0, 2).map((reason, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-normal">
                  {reason}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button
          variant={inCart ? 'secondary' : 'default'}
          size="sm"
          className="flex-1 rounded-full"
          onClick={() => addItem(product)}
        >
          {inCart ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Added
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4 mr-1" />
              Add
            </>
          )}
        </Button>
        <Button
          variant={inComparison ? 'secondary' : 'outline'}
          size="icon"
          className="rounded-full"
          disabled={!inComparison && !canAddMore}
          onClick={handleComparisonClick}
          title={
            inComparison
              ? 'Remove from comparison'
              : canAddMore
              ? 'Add to comparison'
              : 'Comparison is full (max 3)'
          }
        >
          {inComparison ? (
            <Check className="h-4 w-4" />
          ) : (
            <GitCompare className="h-4 w-4" />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
