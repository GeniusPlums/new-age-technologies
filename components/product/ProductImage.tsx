'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ProductImageProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}

export function ProductImage({ src, alt, sizes, className }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center bg-secondary text-center px-3',
          className
        )}
        data-testid="product-image-fallback"
      >
        <span className="text-xs text-muted-foreground line-clamp-3">{alt}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={cn('object-cover', className)}
      sizes={sizes}
      data-testid="product-image"
      onError={() => setFailed(true)}
    />
  );
}
