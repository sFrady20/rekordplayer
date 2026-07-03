import { cva, type VariantProps } from 'class-variance-authority';
import { Pressable, type PressableProps, View } from 'react-native';
import { cn } from '@/lib/cn';
import { Text } from './text';

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-full active:opacity-80',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        secondary: 'bg-elevated',
        outline: 'border border-border bg-transparent',
        ghost: 'bg-transparent',
      },
      size: {
        default: 'h-12 px-6',
        sm: 'h-9 px-4',
        lg: 'h-14 px-8',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

const buttonTextVariants = cva('font-semibold', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      secondary: 'text-foreground',
      outline: 'text-foreground',
      ghost: 'text-foreground',
    },
    size: {
      default: 'text-base',
      sm: 'text-sm',
      lg: 'text-lg',
      icon: 'text-base',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

export interface ButtonProps extends PressableProps, VariantProps<typeof buttonVariants> {
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

export function Button({ className, variant, size, label, children, ...props }: ButtonProps) {
  return (
    <Pressable className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {label != null ? (
        <Text className={buttonTextVariants({ variant, size })}>{label}</Text>
      ) : (
        <View className="flex-row items-center gap-2">{children}</View>
      )}
    </Pressable>
  );
}
