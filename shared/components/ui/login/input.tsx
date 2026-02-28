import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

const Input = React.forwardRef<View, any>(
  ({ className, type, style, placeholderTextColor, ...props }, ref) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    
    return (
      <TextInput
        style={[
          styles.input, 
          { 
            borderColor: colors.cardBorder, 
            backgroundColor: colors.background,
            color: colors.text,
          },
          style
        ]}
        placeholderTextColor={colors.textTertiary}
        ref={ref as any}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

const styles = StyleSheet.create({
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
});

export { Input };

