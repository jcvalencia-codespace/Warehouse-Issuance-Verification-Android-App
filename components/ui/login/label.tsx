import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const Label = React.forwardRef<View, any>(
  ({ className, children, style, ...props }, ref) => {
    return (
      <Text
        ref={ref as any}
        style={[styles.label, style]}
        {...props}
      >
        {children}
      </Text>
    );
  }
);
Label.displayName = 'Label';

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
});

export { Label };

