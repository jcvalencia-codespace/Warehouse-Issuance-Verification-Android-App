import { useAuth } from '@/features/auth/context/AuthContext';
import { WarehouseHomeScreen } from '@/features/raw-materials-dept/home/WarehouseHomeScreen';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState('Warehouse Operator');
  const [userDepartment, setUserDepartment] = useState('Operations');

  useEffect(() => {
    // Update user info when authenticated user changes
    if (user) {
      setUserName(user.NAME || user.USERNAME || 'Warehouse Operator');
      setUserDepartment(user.DEPARTMENT || 'Operations');
    }
  }, [user]);

  const handleModulePress = (moduleId: string) => {
    console.log('Module pressed:', moduleId);
    
    // Navigate to the corresponding module screen
    switch (moduleId) {
      case 'receiving':
        router.push('/raw-materials-dept/posted-warehouse-confirmation');
        break;
      case 'pending':
        router.push('/raw-materials-dept/pending-warehouse-confirmation');
        break;
      case 'reports':
        router.push('/raw-materials-dept/reports');
        break;
      case 'settings':
        router.push('/raw-materials-dept/settings');
        break;
      case 'help':
        router.push('/(tabs)/help');
        break;
      default:
        console.log('Module not implemented:', moduleId);
    }
  };

  return (
    <WarehouseHomeScreen
      userName={userName}
      userDepartment={userDepartment}
      onModulePress={handleModulePress}
    />
  );
}
