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
    return (
      <Pressable
        ref={ref}
        style={[
          styles.button,
          (styles as any)[variant],
          (styles as any)[size],
          style,
        ]}
        {...props}
      >
        {typeof children === 'string' ? (
          <Text style={styles.text}>{children}</Text>
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
  default: {
    backgroundColor: '#007bff',
  },
  destructive: {
    backgroundColor: '#dc3545',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6c757d',
  },
  secondary: {
    backgroundColor: '#6c757d',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  link: {
    backgroundColor: 'transparent',
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  sm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  lg: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
  },
  icon: {
    width: 40,
    height: 40,
    padding: 0,
    borderRadius: 20,
  },
});

export { Button };

