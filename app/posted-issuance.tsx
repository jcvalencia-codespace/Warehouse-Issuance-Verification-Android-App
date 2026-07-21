import PostedIssuanceScreen from '@/features/supplies-dept/posted-issuance/PostedIssuanceScreen';
import { useRouter } from 'expo-router';

export default function PostedIssuanceRoute() {
  const router = useRouter();

  return (
    <PostedIssuanceScreen
      onBack={() => router.back()}
    />
  );
}
