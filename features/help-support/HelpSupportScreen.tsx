import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  action?: () => void;
}

interface HelpItem {
  id: string;
  title: string;
  content: string;
  icon: string;
  action?: () => void;
}

export function HelpSupportScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const quickActions: QuickAction[] = [
    {
      id: 'data-correction',
      title: 'Data Correction Request',
      description: 'Request correction of erroneous data',
      icon: 'file-edit-outline',
      color: '#4A90D9',
    },
    {
      id: 'system-support',
      title: 'System Support Request',
      description: 'Submit a support ticket',
      icon: 'headset',
      color: '#5CB85C',
      action: () => router.push('/coming-soon'),
    },
    {
      id: 'faq',
      title: 'FAQs',
      description: 'Find answers to common questions',
      icon: 'help-circle-outline',
      color: '#F0AD4E',
      action: () => router.push('/coming-soon'),
    },
    {
      id: 'tutorial',
      title: 'Video Tutorials',
      description: 'Learn how to use the app',
      icon: 'play-circle-outline',
      color: '#D9534F',
      action: () => router.push('/coming-soon'),
    },
  ];

  const helpTopics: HelpItem[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      content: 'Learn the basics of using the warehouse confirmation system',
      icon: 'rocket-launch-outline',
    },
    {
      id: 'issuance',
      title: 'Issuance Verification',
      content: 'How to create and manage issuance verifications',
      icon: 'file-check-outline',
    },
    {
      id: 'confirmation',
      title: 'Warehouse Confirmation',
      content: 'Process and confirm warehouse issuances',
      icon: 'package-variant-closed-check',
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      content: 'Understanding your warehouse reports',
      icon: 'chart-line',
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      content: 'Common issues and how to resolve them',
      icon: 'wrench-outline',
    },
    {
      id: 'account',
      title: 'Account & Settings',
      content: 'Manage your account preferences',
      icon: 'cog-outline',
    },
  ];

  const renderQuickAction = (action: QuickAction) => (
    <TouchableOpacity
      key={action.id}
      style={[styles.quickActionCard, { backgroundColor: colors.cardBackground }]}
      onPress={action.action}
      activeOpacity={action.action ? 0.7 : 1}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
        <MaterialCommunityIcons
          name={action.icon as any}
          size={28}
          color={action.color}
        />
      </View>
      <Text style={[styles.quickActionTitle, { color: colors.text }]}>
        {action.title}
      </Text>
      <Text style={[styles.quickActionDescription, { color: colors.textSecondary }]}>
        {action.description}
      </Text>
    </TouchableOpacity>
  );

  const renderHelpTopic = (topic: HelpItem) => (
    <TouchableOpacity
      key={topic.id}
      style={[styles.helpItem, { borderBottomColor: colors.cardBorder }]}
      onPress={topic.action}
      activeOpacity={topic.action ? 0.7 : 1}
    >
      <View style={styles.helpItemLeft}>
        <MaterialCommunityIcons
          name={topic.icon as any}
          size={24}
          color={colors.tint}
        />
      </View>
      <View style={styles.helpItemContent}>
        <Text style={[styles.helpItemTitle, { color: colors.text }]}>
          {topic.title}
        </Text>
        <Text style={[styles.helpItemContentText, { color: colors.textSecondary }]}>
          {topic.content}
        </Text>
      </View>
      <View style={styles.helpItemRight}>
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 32 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Help & Support
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            How can we help you today?
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.slice(0, 2).map(renderQuickAction)}
          </View>
          <View style={styles.quickActionsGrid}>
            {quickActions.slice(2, 4).map(renderQuickAction)}
          </View>
        </View>

        {/* Help Topics */}
        {/* <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Browse by Topic
          </Text>
          <View style={[styles.helpList, { backgroundColor: colors.cardBackground }]}>
            {helpTopics.map(renderHelpTopic)}
          </View>
        </View> */}

        {/* App Info */}
        <View style={styles.section}>
          <View style={[styles.appInfoCard, { backgroundColor: colors.cardBackground }]}>
            <MaterialCommunityIcons
              name="warehouse"
              size={40}
              color={colors.tint}
            />
            <Text style={[styles.appName, { color: colors.text }]}>
              Santeh Feeds Corporation - App
            </Text>
            <Text style={[styles.copyright, { color: colors.textSecondary }]}>
              © 2026 Management Information System - Software
            </Text>
            <Text style={[styles.appVersion, { color: colors.textSecondary }]}>
              Version 1.0.0
            </Text>
          </View>
        </View>
        {/* Bottom Padding */}
        <View style={{ height: 50 + insets.bottom }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickActionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  helpList: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  helpItemLeft: {
    marginRight: 16,
  },
  helpItemContent: {
    flex: 1,
  },
  helpItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  helpItemContentText: {
    fontSize: 14,
  },
  helpItemRight: {
    marginLeft: 8,
  },
  appInfoCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    marginBottom: 8,
  },
  copyright: {
    fontSize: 12,
  },
});
