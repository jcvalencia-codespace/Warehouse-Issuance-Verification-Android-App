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
    console.log('Production module pressed:', moduleId);

    switch (moduleId) {
      case 'material-issuance':
        router.push('/production-dept/material-issuance' as any);
        break;
      case 'production-issuance-posted':
        router.push('/production-dept/posted-issuance' as any);
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
