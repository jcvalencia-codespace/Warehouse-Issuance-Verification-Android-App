import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react-native';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export type ToastVariant = 'default' | 'destructive';

export interface ToastProps {
  open?: boolean;
  variant?: ToastVariant;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  style?: any;
}

export type ToastActionElement = React.ReactElement<typeof ToastAction>;

const Toast = React.forwardRef<View, ToastProps>(
  ({ variant = 'default', children, style, ...props }, ref) => {
    return (
      <View
        ref={ref}
        style={[
          styles.toast,
          variant === 'destructive' ? styles.destructive : styles.default,
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  }
);
Toast.displayName = 'Toast';

const ToastAction = React.forwardRef<View, any>(
  ({ children, style, ...props }, ref) => {
    return (
      <Pressable
        ref={ref}
        style={[styles.action, style]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }
);
ToastAction.displayName = 'ToastAction';

const ToastClose = React.forwardRef<View, any>(
  ({ style, ...props }, ref) => {
    return (
      <Pressable
        ref={ref}
        style={[styles.close, style]}
        {...props}
      >
        <X size={16} color="#666" />
      </Pressable>
    );
  }
);
ToastClose.displayName = 'ToastClose';

const ToastTitle = React.forwardRef<Text, any>(
  ({ children, style, ...props }, ref) => {
    return (
      <Text
        ref={ref}
        style={[styles.title, style]}
        {...props}
      >
        {children}
      </Text>
    );
  }
);
ToastTitle.displayName = 'ToastTitle';

const ToastDescription = React.forwardRef<Text, any>(
  ({ children, style, ...props }, ref) => {
    return (
      <Text
        ref={ref}
        style={[styles.description, style]}
        {...props}
      >
        {children}
      </Text>
    );
  }
);
ToastDescription.displayName = 'ToastDescription';

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const ToastViewport = ({ children }: { children?: React.ReactNode }) => {
  const { toasts } = useToast();
  
  return (
    <View style={styles.viewport}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          style={styles.toastItem}
        >
          <View style={styles.toastContent}>
            <ToastTitle>{toast.title}</ToastTitle>
            {toast.description && (
              <ToastDescription>{toast.description}</ToastDescription>
            )}
          </View>
          {toast.action && (
            <View style={styles.toastAction}>
              {toast.action}
            </View>
          )}
          <ToastClose onPress={() => toast.onOpenChange?.(false)} />
        </Toast>
      ))}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  viewport: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  toast: {
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toastItem: {
    marginBottom: 8,
  },
  toastContent: {
    flex: 1,
    marginRight: 8,
  },
  toastAction: {
    marginLeft: 8,
  },
  default: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  destructive: {
    backgroundColor: '#ef4444',
    borderColor: '#dc2626',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  action: {
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  close: {
    padding: 4,
  },
});

export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport
};

