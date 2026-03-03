import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ComingSoonScreenProps {
  title?: string;
  description?: string;
  icon?: string;
}

export function ComingSoonScreen({
  title = 'Coming Soon',
  description = 'This feature is under development and will be available in a future update.',
  icon = 'hammer-wrench',
}: ComingSoonScreenProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const router = useRouter();

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={styles.container}>
        {/* Icon Container */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.primary + '15' },
          ]}
        >
          <MaterialCommunityIcons
            name={icon as any}
            size={64}
            color={colors.primary}
          />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

        {/* Description */}
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>

        {/* Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    gap: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ComingSoonScreen;
