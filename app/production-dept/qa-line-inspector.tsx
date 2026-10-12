import MaterialUtilizationScreen from '@/features/production-dept/qa-line-inspector/components/QaLineInspector';
import { useRouter } from 'expo-router';

export default function QaLineInspectorRoute() {
  const router = useRouter();

  return(
    <MaterialUtilizationScreen 
      onBack={() => router.back()}
    />
  );
}