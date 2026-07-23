import { useAuth } from '@/features/auth/context/AuthContext';
import { ProductionDeptHomeScreen } from '@/features/production-dept/home/ProductionDeptHomeScreen';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function ProductionDeptRoute() {
  const { user } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState('Production Operator');
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
        router.push('/supplies-dept/supplies-issuance' as any);
        break;
      case 'supplies-issuance-posted':
        router.push('/supplies-dept/posted-issuance' as any);
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
    <ProductionDeptHomeScreen
      userName={userName}
      userDepartment={userDepartment}
      onModulePress={handleModulePress}
    />
  );
}
