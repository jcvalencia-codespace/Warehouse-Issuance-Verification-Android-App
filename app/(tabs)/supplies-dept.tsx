import { useAuth } from '@/features/auth/context/AuthContext';
import { SuppliesDeptHomeScreen } from '@/features/supplies-dept/home/SuppliesDeptHomeScreen';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function SuppliesIssuanceScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState('Supplies Operator');
  const [userDepartment, setUserDepartment] = useState('Operations');

  useEffect(() => {
    if (user) {
      setUserName(user.NAME || user.USERNAME || 'Supplies Operator');
      setUserDepartment(user.DEPARTMENT || 'Operations');
    }
  }, [user]);

  const handleModulePress = (moduleId: string) => {
    console.log('Supplies module pressed:', moduleId);

    switch (moduleId) {
      case 'issuance':
        router.push('/supplies-issuance' as any);
        break;
      case 'supplies-dept-posted':
        router.push('/posted-warehouse-confirmation' as any);
        break;
      case 'supplies-stock-balance':
        router.push('/stock-balance' as any);
        break;
      case 'supplies-reports':
        router.push('/reports' as any);
        break;
      default:
        console.log('Module not implemented:', moduleId);
    }
  };

  return (
    <SuppliesDeptHomeScreen
      userName={userName}
      userDepartment={userDepartment}
      onModulePress={handleModulePress}
    />
  );
}
