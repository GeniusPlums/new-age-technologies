'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, GitCompare, ShoppingBag } from 'lucide-react';
import { useComparison } from '@/lib/context/ComparisonContext';
import { useCart } from '@/lib/context/CartContext';
import { formatPrice } from '@/lib/utils';
import { ProductImage } from './ProductImage';

export function ComparisonTable() {
  const { products, removeFromComparison, clearComparison } = useComparison();
  const { addItem } = useCart();

  if (products.length === 0) {
    return null;
  }

  const attributes: Array<{
    key: string;
    label: string;
    render: (product: (typeof products)[0]) => React.ReactNode;
  }> = [
    {
      key: 'image',
      label: 'Look',
      render: (product) => (
        <div className="relative h-24 w-24 mx-auto rounded-2xl overflow-hidden bg-muted">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            sizes="96px"
          />
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      render: (product) => (
        <span className="font-semibold">{formatPrice(product.price)}</span>
      ),
    },
    {
      key: 'brand',
      label: 'Maker',
      render: (product) => product.brand,
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (product) => (
        <span className="flex items-center justify-center gap-1">
          <span className="text-primary">★</span>
          {product.rating}/5
        </span>
      ),
    },
    {
      key: 'matchScore',
      label: 'Match',
      render: (product) => (
        <Badge variant={product.matchScore >= 85 ? 'default' : 'secondary'}>
          {product.matchScore}%
        </Badge>
      ),
    },
    {
      key: 'matchReasons',
      label: 'Why it fits',
      render: (product) => (
        <div className="flex flex-wrap justify-center gap-1">
          {product.matchReasons.slice(0, 2).map((reason, idx) => (
            <Badge key={idx} variant="outline" className="text-xs font-normal">
              {reason}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Bag',
      render: (product) => (
        <Button size="sm" onClick={() => addItem(product)} className="w-full rounded-full">
          <ShoppingBag className="h-4 w-4 mr-1" />
          Add
        </Button>
      ),
    },
  ];

  return (
    <Card className="mt-6 animate-fade-in rounded-3xl border-border/70 paper-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-primary" />
            Side by side
          </CardTitle>
          <Button variant="ghost" size="sm" className="rounded-full" onClick={clearComparison}>
            Clear all
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Detail</TableHead>
                {products.map((product) => (
                  <TableHead key={product.id} className="min-w-[180px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{product.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0 rounded-full"
                        onClick={() => removeFromComparison(product.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {attributes.map((attr) => (
                <TableRow key={attr.key}>
                  <TableCell className="font-medium text-muted-foreground">
                    {attr.label}
                  </TableCell>
                  {products.map((product) => (
                    <TableCell key={product.id} className="text-center">
                      {attr.render(product)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
