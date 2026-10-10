import { MobileAppNames } from '@/features/profile';
import { useRouter } from 'expo-router';

export default function ProfileMobileAppNamesRoute() {
  const router = useRouter();

  return <MobileAppNames onBack={() => router.back()} />;
}
