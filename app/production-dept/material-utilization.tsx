import MaterialUtilizationScreen from '@/features/production-dept/material-utilization/MaterialUtilizationScreen';
import { useRouter } from 'expo-router';

export default function ProductionMaterialUtilizationRoute() {
  const router = useRouter();

  return(
    <MaterialUtilizationScreen 
      onBack={() => router.back()}
      onSubmit={() => {}}
    />
  );
}