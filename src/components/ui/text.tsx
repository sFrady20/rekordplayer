import { cva, type VariantProps } from 'class-variance-authority';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cn } from '@/lib/cn';

const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      default: 'text-base',
      title: 'text-2xl font-bold tracking-tight',
      heading: 'text-lg font-semibold',
      body: 'text-base',
      muted: 'text-sm text-muted',
      caption: 'text-xs text-subtle',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface TextProps extends RNTextProps, VariantProps<typeof textVariants> {}

export function Text({ className, variant, ...props }: TextProps) {
  return <RNText className={cn(textVariants({ variant }), className)} {...props} />;
}
