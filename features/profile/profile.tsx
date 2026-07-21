import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useToast } from '@/hooks/use-toast';
import { router } from 'expo-router';
import {
  ChevronRight,
  History,
  Lock,
  LogOut,
  Shield,
  User
} from 'lucide-react-native';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface MenuItem {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  variant?: 'default' | 'warning' | 'info';
  onPress?: () => void;
}

interface ProfileScreenProps {
  // Add any props if needed
}

export default function ProfileScreen() {
  const { user, logout: authLogout } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { toast } = useToast();
  const insets = useSafeAreaInsets();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Get user info from auth context or use defaults
  const username = user?.NAME || user?.USERNAME || '';
  const email = user?.EMAILADD || '';
  const department = user?.DEPARTMENT || '';

  const handleLogout = async () => {
    setShowLogoutModal(false);
    setIsLoggingOut(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      authLogout();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account",
        variant: "default"
      });
      await new Promise(resolve => setTimeout(resolve, 300));
      router.replace('/auth');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const MenuItemComponent = ({ item, colors }: { item: MenuItem; colors: typeof Colors.light }) => {
    const Icon = item.icon;
    const iconColor = item.variant === 'warning'
      ? colors.error
      : item.variant === 'info'
        ? colors.primary
        : colors.textSecondary;

    return (
      <TouchableOpacity
        style={[styles.menuItem, { backgroundColor: colors.cardBackground }]}
        onPress={item.onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.menuIconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Icon size={22} color={iconColor} />
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
          {item.subtitle && (
            <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
              {item.subtitle}
            </Text>
          )}
        </View>
        <ChevronRight size={20} color={colors.textTertiary} />
      </TouchableOpacity>
    );
  };

  const accountMenuItems: MenuItem[] = [
    {
      id: 'profile',
      icon: User,
      title: 'Personal Information',
      subtitle: 'Update your profile details',
      onPress: () => router.push('/coming-soon'),
    },
    {
      id: 'history',
      icon: History,
      title: 'Transaction History',
      subtitle: 'View past transactions',
      onPress: () => router.push('/coming-soon'),
    },
  ];

  // const preferenceMenuItems: MenuItem[] = [
  //   {
  //     id: 'appearance',
  //     icon: colorScheme === 'dark' ? Moon : Sun,
  //     title: 'Appearance',
  //     subtitle: colorScheme === 'dark' ? 'Dark mode is on' : 'Light mode is on',
  //     onPress: handleThemeToggle,
  //   },
  //   {
  //     id: 'notifications',
  //     icon: Bell,
  //     title: 'Notifications',
  //     subtitle: 'Configure push notifications',
  //     onPress: () => toast({ title: "Coming Soon", description: "Notifications settings", variant: "default" }),
  //   },
  // ];

  const securityMenuItems: MenuItem[] = [
    {
      id: 'security',
      icon: Lock,
      title: 'Security',
      subtitle: 'Password & authentication',
      onPress: () => router.push('/coming-soon'),
    },
    {
      id: 'privacy',
      icon: Shield,
      title: 'Privacy Policy',
      subtitle: 'How we handle your data',
      onPress: () => router.push('/coming-soon'),
    },
  ];

  // const supportMenuItems: MenuItem[] = [
  //   {
  //     id: 'help',
  //     icon: HelpCircle,
  //     title: 'Help & Support',
  //     subtitle: 'Get assistance with issues',
  //     onPress: () => toast({ title: "Coming Soon", description: "Help center", variant: "default" }),
  //   },
  //   {
  //     id: 'feedback',
  //     icon: Star,
  //     title: 'Rate the App',
  //     subtitle: 'Share your feedback',
  //     onPress: () => toast({ title: "Thank You!", description: "We appreciate your support", variant: "default" }),
  //   },
  // ];

  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
      {title}
    </Text>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {username.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{username}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{email}</Text>
            <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{department}</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        {/* <View style={styles.statsContainer}>
          <View style={[styles.statItem, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.statValue, { color: colors.primary }]}>24</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Transactions</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.statValue, { color: colors.success }]}>18</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.statValue, { color: colors.warning }]}>6</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
          </View>
        </View> */}

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          {renderSectionHeader('ACCOUNT')}
          <View style={styles.menuGroup}>
            {accountMenuItems.map((item) => (
              <MenuItemComponent key={item.id} item={item} colors={colors} />
            ))}
          </View>
        </View>

        {/* <View style={styles.menuSection}>
          {renderSectionHeader('PREFERENCES')}
          <View style={styles.menuGroup}>
            {preferenceMenuItems.map((item) => (
              <MenuItemComponent key={item.id} item={item} colors={colors} />
            ))}
          </View>
        </View> */}

        <View style={styles.menuSection}>
          {renderSectionHeader('SECURITY')}
          <View style={styles.menuGroup}>
            {securityMenuItems.map((item) => (
              <MenuItemComponent key={item.id} item={item} colors={colors} />
            ))}
          </View>
        </View>

        {/* <View style={styles.menuSection}>
          {renderSectionHeader('SUPPORT')}
          <View style={styles.menuGroup}>
            {supportMenuItems.map((item) => (
              <MenuItemComponent key={item.id} item={item} colors={colors} />
            ))}
          </View>
        </View> */}

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error }]}
          onPress={() => setShowLogoutModal(true)}
          disabled={isLoggingOut}
          activeOpacity={0.8}
        >
          {isLoggingOut ? (
            <Text style={styles.logoutText}>Signing out...</Text>
          ) : (
            <>
              <LogOut size={20} color="#ffffff" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </>
          )}
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: colors.textTertiary }]}>
            Santeh Feeds Corporation - App v2.7.21.26
          </Text>
          <Text style={[styles.appCopyright, { color: colors.textTertiary }]}>
            © 2026 MIS-SOFTWARE. All rights reserved.
          </Text>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 50 + insets.bottom }} />
      </ScrollView>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLogoutModal(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to sign out?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleLogout}
                disabled={isLoggingOut}
              >
                <Text style={styles.modalConfirmText}>
                  {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  profileCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  statItem: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuGroup: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 14,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 32,
    gap: 4,
  },
  appVersion: {
    fontSize: 14,
    fontWeight: '500',
  },
  appCopyright: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
