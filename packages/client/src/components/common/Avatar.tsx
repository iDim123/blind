import { cn } from '@/lib/utils';

interface AvatarProps {
  avatarId: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

const placeholderColors = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#78716C', '#64748B', '#0D9488',
  '#059669', '#0284C7', '#4F46E5', '#7C3AED', '#C026D3',
  '#DB2777', '#DC2626', '#EA580C', '#CA8A04', '#65A30D',
];

export default function Avatar({ avatarId, size = 'md', className }: AvatarProps) {
  if (avatarId <= 0) {
    return (
      <div className={cn(sizeClasses[size], 'rounded-full bg-muted flex-shrink-0', className)} />
    );
  }

  const color = placeholderColors[(avatarId - 1) % placeholderColors.length];

  return (
    <div
      className={cn(sizeClasses[size], 'rounded-full flex-shrink-0', className)}
      style={{ backgroundColor: color }}
      title={`Avatar ${avatarId}`}
    />
  );
}