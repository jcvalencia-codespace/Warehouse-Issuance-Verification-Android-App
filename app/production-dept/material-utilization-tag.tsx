import MaterialUtilizationTagScreen from '@/features/production-dept/material-utilization-tag/MaterialUtilizationTagScreen';
import { useRouter } from 'expo-router';

export default function ProductionMaterialUtilizationTagRoute() {
  const router = useRouter();

  return(
    <MaterialUtilizationTagScreen 
      onBack={() => router.back()}
    />
  );
}