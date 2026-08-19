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
      case 'material-request-review':              // <-- match the module id
        router.push('/production-dept/material-issuance-request-review' as any);
        break;
      case 'material-issuance-confirmation':
        router.push({ pathname: '/production-dept/material-issuance-confirmation', params: { source: 'production' } } as any);
        break;
      case 'material-utilization':
        router.push('/production-dept/material-utilization' as any);
        break;
      case 'material-utilization-tag':
        router.push('/production-dept/material-utilization-tag' as any);
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
