import IssuanceScreen from '@/features/supplies-dept/issuance/IssuanceScreen';
import { useRouter } from 'expo-router';

export default function SuppliesIssuanceRoute() {
  const router = useRouter();

  return (
    <IssuanceScreen
      onCancel={() => router.back()}
      onSubmit={() => router.back()}
    />
  );
}
