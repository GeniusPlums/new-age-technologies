import { cn } from '@/lib/utils';

interface BrandMarkProps {
  className?: string;
  size?: number;
}

export function BrandMark({ className, size = 32 }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="10" fill="hsl(var(--primary))" />
      <path
        d="M16 7.2c.4 3.2 1.6 5.4 3.8 7.1 2 1.6 3.2 3.4 3.2 5.5 0 3.5-3.1 6.2-7 6.2s-7-2.7-7-6.2c0-2.1 1.2-3.9 3.2-5.5 2.2-1.7 3.4-3.9 3.8-7.1Z"
        fill="hsl(var(--primary-foreground))"
      />
      <circle cx="16" cy="20.2" r="2.1" fill="hsl(var(--primary))" />
    </svg>
  );
}
