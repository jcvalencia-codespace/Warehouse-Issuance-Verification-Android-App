import { ModalDialogProps } from '@/components/ui/modal-dialog';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthService } from '../services/authService';

interface ModalState extends Omit<ModalDialogProps, 'visible' | 'onClose'> {
  visible: boolean;
}

interface UseLoginReturn {
  username: string;
  password: string;
  isLoading: boolean;
  modalState: ModalState;
  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  handleLogin: () => Promise<void>;
  closeModal: () => void;
}

export function useLogin(): UseLoginReturn {
  const router = useRouter();
  const { setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancelButton: false,
  });

  const showModal = useCallback(
    (
      title: string,
      message: string,
      type: 'success' | 'error' | 'info' | 'warning' = 'info',
      showCancel: boolean = false,
      confirmText: string = 'OK'
    ) => {
      setModalState({
        visible: true,
        title,
        message,
        type,
        confirmText,
        cancelText: 'Cancel',
        showCancelButton: showCancel,
      });
    },
    []
  );

  const closeModal = useCallback(() => {
    setModalState((prev) => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const handleLogin = useCallback(async () => {
    // Validate credentials
    const validationError = await AuthService.getInstance().validateCredentials(username, password);
    if (validationError) {
      showModal('Validation Error', validationError, 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const user = await AuthService.getInstance().authenticate(
        username,
        password
      );

      if (user) {
        // Store user in context
        setUser(user);
        
        showModal('Success', 'Login successful!', 'success');

        // Navigate to main app screen after a short delay for modal display
        setTimeout(() => {
          router.replace('/(tabs)');
          setUsername('');
          setPassword('');
          closeModal();
        }, 1500);
      } else {
        showModal(
          'Login Failed',
          'Invalid username or password',
          'error'
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      showModal(
        'Error',
        'An unexpected error occurred. Please try again.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  }, [username, password, router, showModal, closeModal, setUser]);

  return {
    username,
    password,
    isLoading,
    modalState,
    setUsername,
    setPassword,
    handleLogin,
    closeModal,
  };
}
