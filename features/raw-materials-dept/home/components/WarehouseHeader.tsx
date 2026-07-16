import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native';

const COMPANY_LOGOS: Record<string, any> = {
  SFC: require('@/assets/images/SFC.png'),
  FEEDPRO: require('@/assets/images/PNC.png'),
  PET1: require('@/assets/images/PET1.png'),
};

interface WarehouseHeaderProps {
  userName?: string;
  userDepartment?: string;
  company?: string;
}

const COMPANY_LABELS: Record<string, string> = {
  SFC: 'Santeh Feeds Corp.',
  FEEDPRO: 'ProNatural Feeds Corp.',
  PET1: 'PetOne Inc.',
};

const COMPANY_COLORS: Record<string, string> = {
  SFC: '#1e3a8a',
  FEEDPRO: '#14532d',
  PET1: '#a16207',
};

export function WarehouseHeader({
  userName = 'Warehouse Operator',
  userDepartment = 'Operations',
  company: companyProp
}: WarehouseHeaderProps) {
  const { user } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const companyCode = companyProp ?? user?.COMPANY ?? '';
  const companyName = COMPANY_LABELS[companyCode] ?? companyCode ?? 'Santeh Feeds Corporation';
  const headerColor = COMPANY_COLORS[companyCode] ?? colors.primary;
  const foreground = '#ffffff';
  const mutedForeground = 'rgba(255, 255, 255, 0.72)';
  const faintForeground = 'rgba(255, 255, 255, 0.5)';
  const cardBg = 'rgba(255, 255, 255, 0.08)';
  const cardBorder = 'rgba(255, 255, 255, 0.12)';
  const badgeBg = 'rgba(255, 255, 255, 0.14)';
  const accentLine = 'rgba(255, 255, 255, 0.28)';
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 414;
  const [currentTime, setCurrentTime] = useState(new Date());
  const { isLocalConnected } = useNetworkStatus();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: headerColor }]}>
      {/* Multiple layered overlays for depth */}
      <View style={styles.gradientOverlay} />
      <View style={styles.patternOverlay} />

      {/* Top accent line */}
      <View style={[styles.topAccent, { backgroundColor: accentLine }]} />

      {/* App Title and Logo Area */}
      <View style={styles.titleSection}>
        <View style={styles.logoWrapper}>
          <View style={styles.logoGlow} />
          <View style={styles.logoBackground}>
            {COMPANY_LOGOS[companyCode] ? (
              <Image
                source={COMPANY_LOGOS[companyCode]}
                style={styles.companyLogo}
                resizeMode="contain"
              />
            ) : (
              <MaterialCommunityIcons
                name="warehouse"
                size={26}
                color="#ffffff"
              />
            )}
          </View>
        </View>
          <View style={styles.titleTextContainer}>
            <Text style={[styles.appName, { color: foreground }]} numberOfLines={1}>{companyName}</Text>
          <View style={styles.taglineContainer}>
            <Text style={[styles.tagline, { color: mutedForeground }]}>Enterprise Resource Planning</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: accentLine }]} />

      {/* User and Time Info */}
      <View style={styles.infoSection}>
        <View style={[styles.userInfoCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons
              name="account-circle"
              size={44}
              color={foreground}
            />
            <View style={[styles.onlineIndicator, { borderColor: headerColor }]}>
              <View style={styles.onlinePulse} />
            </View>
          </View>
          <View style={styles.userTextContainer}>
            <Text style={[styles.userLabel, { color: faintForeground }]}>Operator</Text>
            <Text style={[styles.userName, { color: foreground }]} numberOfLines={1}>{userName}</Text>
            <View style={styles.departmentRow}>
              <MaterialCommunityIcons
                name="briefcase-outline"
                size={11}
                color={mutedForeground}
              />
              <Text style={[styles.userDepartment, { color: mutedForeground }]}>{userDepartment}</Text>
            </View>
          </View>
        </View>

        {/* Date, Time, and Network Status */}
        <View style={styles.dateTimeContainer}>
          <View style={[styles.dateTimeItem, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.iconBadge, { backgroundColor: badgeBg }]}>
              <MaterialCommunityIcons
                name="calendar-blank"
                size={13}
                color={foreground}
              />
            </View>
            <View style={styles.dateTimeTextContainer}>
              <Text style={[styles.dateTimeLabel, { color: faintForeground }]}>DATE</Text>
              <Text style={[styles.dateTimeText, { color: foreground }]}>{formatDate(currentTime)}</Text>
            </View>
          </View>
          <View style={[styles.dateTimeItem, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.iconBadge, { backgroundColor: badgeBg }]}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={13}
                color={foreground}
              />
            </View>
            <View style={styles.dateTimeTextContainer}>
              <Text style={[styles.dateTimeLabel, { color: faintForeground }]}>TIME</Text>
              <Text style={[styles.dateTimeText, { color: foreground }]}>{formatTime(currentTime)}</Text>
            </View>
          </View>
          <View style={[styles.dateTimeItem, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.iconBadge, { backgroundColor: isLocalConnected ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)' }]}>
              <MaterialCommunityIcons
                name={isLocalConnected ? 'wifi' : 'wifi-off'}
                size={13}
                color={isLocalConnected ? '#10b981' : '#ef4444'}
              />
            </View>
            <View style={styles.dateTimeTextContainer}>
              <Text style={[styles.dateTimeLabel, { color: faintForeground }]}>LOCAL</Text>
              <View style={[styles.connectionPill, { backgroundColor: isLocalConnected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)' }]}>
                <Text style={[styles.connectionText, { color: isLocalConnected ? '#059669' : '#dc2626' }]}>
                  {isLocalConnected ? 'Connected' : 'Disconnected'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Bottom decorative accent */}
      <View style={[styles.bottomAccent, { backgroundColor: accentLine }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 18,
    gap: 14,
    overflow: 'hidden',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03,
    backgroundColor: '#ffffff',
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoWrapper: {
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBackground: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  companyLogo: {
    width: 38,
    height: 38,
  },
  titleTextContainer: {
    flex: 1,
    gap: 2,
  },
  appName: {
    fontSize: 21,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  taglineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 2,
  },
  infoSection: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 12,
  },
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 25,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatarContainer: {
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1e40af',
  },
  onlinePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  userTextContainer: {
    gap: 0,
    flex: 1,
  },
  userLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  departmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  userDepartment: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.55)',
    fontWeight: '500',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    flexWrap: 'wrap',
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    flex: 1,
    minWidth: 80,
    maxWidth: '48%',
  },
  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateTimeTextContainer: {
    gap: 0,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  dateTimeText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  connectionPill: {
    marginTop: 2,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  connectionText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});
