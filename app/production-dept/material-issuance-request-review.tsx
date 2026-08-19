import MaterialIssuanceRequestReviewScreen from '@/features/production-dept/material-issuance-request-review/MaterialIssuanceRequestReviewScreen';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ProductionMaterialIssuanceConfirmationRoute() {
    const router = useRouter();
    const { source } = useLocalSearchParams<{ source?: string }>();

    return (
      <MaterialIssuanceRequestReviewScreen
        onBack={() => router.back()}
      />
    );
}