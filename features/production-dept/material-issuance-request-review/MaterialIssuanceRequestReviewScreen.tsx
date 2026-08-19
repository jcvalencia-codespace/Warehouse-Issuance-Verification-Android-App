import { Pressable, StyleSheet, Text, View } from 'react-native';

interface MaterialIssuanceRequestReviewProps{
    onBack?: () => void;
}

export default function MaterialIssuanceRequestReviewScreen({ onBack }: MaterialIssuanceRequestReviewProps) {
    return (
        <View style={styles.container}>
            <Text>testing</Text>
            <Pressable onPress={onBack} style={styles.button}>
                <Text style={styles.buttonText}>back</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    button: { padding: 16, backgroundColor: '#1e40af', borderRadius: 8 },
    buttonText: { color: '#fff', fontWeight: '600' },
});