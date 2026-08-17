'use client';

import { cn } from '@/lib/utils';

interface ConfidenceBadgeProps {
  score: number;
  className?: string;
}

export function ConfidenceBadge({ score, className }: ConfidenceBadgeProps) {
  const getColorClass = () => {
    if (score >= 85) return 'bg-primary text-primary-foreground border-transparent';
    if (score >= 70) return 'bg-card text-sage border-border';
    if (score >= 50) return 'bg-accent text-accent-foreground border-transparent';
    return 'bg-card/90 text-muted-foreground border-border';
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium border backdrop-blur-md',
        getColorClass(),
        className
      )}
    >
      {score}% match
    </span>
  );
}
