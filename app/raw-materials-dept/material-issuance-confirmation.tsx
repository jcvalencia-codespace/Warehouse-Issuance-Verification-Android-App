import MaterialIssuanceConfirmationScreen from '@/features/raw-materials-dept/material-issuance-confirmation/MaterialIssuanceConfirmationScreen';
import { useRouter } from 'expo-router';

export default function RawMaterialIssuanceConfirmationRoute() {
  const router = useRouter();
  return (
    <MaterialIssuanceConfirmationScreen
      onBack={() => router.back()} />
  );
} 