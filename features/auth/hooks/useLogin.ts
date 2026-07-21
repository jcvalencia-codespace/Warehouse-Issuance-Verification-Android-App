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
  company: string;
  isLoading: boolean;
  modalState: ModalState;
  setUsername: (username: string) => void;
  setPassword: (password: string) => void;
  setCompany: (company: string) => void;
  handleLogin: (company: string, system?: string) => Promise<void>;
  closeModal: () => void;
}

export function useLogin(): UseLoginReturn {
  const router = useRouter();
  const { setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('SFC');
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

  const handleLogin = useCallback(async (company: string, system?: string) => {
    const validationError = await AuthService.getInstance().validateCredentials(username, password);
    if (validationError) {
      showModal('Validation Error', validationError, 'warning');
      return;
    }

    if (!company) {
      showModal('Validation Error', 'Please select a company', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const user = await AuthService.getInstance().authenticate(username, password, company, system);

      if (user) {
        setUser(user);
        
        const homeRoute = user.DEPTCODE === 'PAWHSP' ? '/(tabs)/supplies-dept' : '/(tabs)';
        router.replace(homeRoute);

        showModal('Success', 'Login successful!', 'success');

        setTimeout(() => {
          router.replace(homeRoute);
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
    company,
    isLoading,
    modalState,
    setUsername,
    setPassword,
    setCompany,
    handleLogin,
    closeModal,
  };
}
