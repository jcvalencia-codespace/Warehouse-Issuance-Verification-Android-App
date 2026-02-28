import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

const Input = React.forwardRef<View, any>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <TextInput
        style={[styles.input, style]}
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
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
});

export { Input };

