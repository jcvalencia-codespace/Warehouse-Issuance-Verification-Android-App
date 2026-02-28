import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  className?: string;
  children?: React.ReactNode;
  style?: any;
  [key: string]: any;
}

const Button = React.forwardRef<View, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, children, style, ...props }, ref) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    
    const getVariantStyles = () => {
      const isDark = colorScheme === 'dark';
      switch (variant) {
        case 'destructive':
          return { backgroundColor: colors.error, borderColor: colors.error };
        case 'secondary':
          return { backgroundColor: colors.secondary, borderColor: colors.secondary };
        case 'outline':
          return { backgroundColor: 'transparent', borderColor: isDark ? colors.text : colors.cardBorder };
        case 'ghost':
          return { backgroundColor: 'transparent', borderColor: 'transparent' };
        case 'link':
          return { backgroundColor: 'transparent', borderColor: 'transparent' };
        default:
          return { backgroundColor: colors.primary, borderColor: colors.primary };
      }
    };

    const getTextColor = () => {
      switch (variant) {
        case 'outline':
        case 'ghost':
        case 'link':
          return colors.primary;
        default:
          return '#ffffff';
      }
    };

    return (
      <Pressable
        ref={ref}
        style={[
          styles.button,
          getVariantStyles(),
          (styles as any)[size],
          style,
        ]}
        {...props}
      >
        {typeof children === 'string' ? (
          <Text style={[styles.text, { color: getTextColor() }]}>{children}</Text>
        ) : (
          children
        )}
      </Pressable>
    );
  }
);
Button.displayName = 'Button';

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  default: {},
  destructive: {},
  outline: {
    borderWidth: 1,
  },
  secondary: {},
  ghost: {},
  link: {},
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  lg: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  icon: {
    padding: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export { Button };

