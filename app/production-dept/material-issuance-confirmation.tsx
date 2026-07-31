import MaterialIssuanceConfirmationScreen from '@/features/raw-materials-dept/material-issuance-confirmation/MaterialIssuanceConfirmationScreen';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ProductionMaterialIssuanceConfirmationRoute() {
    const router = useRouter();
    const { source } = useLocalSearchParams<{ source?: string }>();

    return (
      <MaterialIssuanceConfirmationScreen
        onBack={() => router.back()}
        source={source}
      />
    );
}