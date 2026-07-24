import MaterialIssuanceScreen from '@/features/production-dept/material-issuance/MaterialIssuanceScreen';
import { useRouter } from 'expo-router';

export default function ProductionMaterialIssuanceRoute() {
  const router = useRouter();

  return(
    <MaterialIssuanceScreen 
      onBack={() => router.back()}
      onSubmit={() => {}}
    />
  );
}