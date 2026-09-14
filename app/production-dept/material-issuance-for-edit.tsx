import { MaterialIssuanceForEditList } from '@/features/production-dept/material-issuance/components/MaterialIssuanceForEditList';
import { MaterialIssuanceRequestHeader } from '@/features/production-dept/material-issuance/types/materialIssuance.types';
import { useRouter } from 'expo-router';

export default function ProductionMaterialIssuanceForEditRoute() {
    const router = useRouter();

    return (
        <MaterialIssuanceForEditList
            onBack={() => router.back()}
            onRecordPress={(header: MaterialIssuanceRequestHeader) => {
                router.replace({
                    pathname: '/production-dept/material-issuance',
                    params: { selectedHeader: JSON.stringify(header) },
                });
            }}
        />
    );
}
