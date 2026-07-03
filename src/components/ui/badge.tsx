import { cva, type VariantProps } from 'class-variance-authority';
import { View } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from './text';

const badgeVariants = cva('self-start rounded-full px-2.5 py-0.5', {
  variants: {
    variant: {
      default: 'bg-elevated',
      primary: 'bg-primary/15',
      outline: 'border border-border',
    },
  },
  defaultVariants: { variant: 'default' },
});

const badgeTextVariants = cva('text-xs font-medium', {
  variants: {
    variant: {
      default: 'text-muted',
      primary: 'text-primary',
      outline: 'text-muted',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  label: string;
  className?: string;
}

export function Badge({ label, variant, className }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)}>
      <Text className={badgeTextVariants({ variant })}>{label}</Text>
    </View>
  );
}
