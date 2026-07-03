import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/cn';

export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('rounded-xl bg-surface p-4', className)} {...props} />;
}
