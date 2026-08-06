import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { notificationService } from '@/features/shared/services/notificationService';
import { socketService } from '@/features/shared/services/socketService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NotificationData {
  mirNo?: string;
  receiver?: string;
  category?: string;
  form?: string;
  referenceno?: string;
  sender?: string;
}

interface NotificationPayload {
  type?: string;
  data?: NotificationData;
}

export function NotificationPopUp() {
  const [visible, setVisible] = useState(false);
  const [notification, setNotification] = useState<any | null>(null);
  const [borderColorState, setBorderColorState] = useState<string>('');
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(-120)).current;
  const blinkAnim = React.useRef(new Animated.Value(1)).current;
  const blinkRef = React.useRef<Animated.CompositeAnimation | null>(null);
  const borderIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const activeCategoryColor = React.useRef<string>(colors.primary);
  const { user } = useAuth();
  const hasShownInitialRef = useRef(false);
  const queueRef = React.useRef<any[]>([]);

  const getCategoryColor = (category?: string) => {
    const lower = (category || '').toLowerCase();
    if (lower.includes('approved')) return '#10b981';
    if (lower.includes('rejected')) return '#ef4444';
    if (lower.includes('pending')) return '#f59e0b';
    if (lower.includes('request')) return '#3b82f6';
    if (lower.includes('served')) return '#f59e0b';
    return colors.primary;
  };

  const getCategoryIcon = (category?: string) => {
    const lower = (category || '').toLowerCase();
    if (lower.includes('approved')) return 'check-circle-outline';
    if (lower.includes('rejected')) return 'close-circle-outline';
    if (lower.includes('pending')) return 'clock-outline';
    if (lower.includes('request')) return 'bell-ring-outline';
    if (lower.includes('served')) return 'check';
    return 'bell-outline';
  };

  const startBlinking = () => {
    blinkRef.current?.stop();
    blinkRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.25,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    blinkRef.current.start();

    borderIntervalRef.current = setInterval(() => {
      setBorderColorState((prev) => (prev === 'transparent' ? activeCategoryColor.current : 'transparent'));
    }, 700);
  };

  const stopBlinking = () => {
    blinkRef.current?.stop();
    blinkRef.current = null;
    blinkAnim.setValue(1);
    if (borderIntervalRef.current) {
      clearInterval(borderIntervalRef.current);
      borderIntervalRef.current = null;
    }
  };

  const showNext = () => {
    const next = queueRef.current.shift();
    if (!next) {
      setVisible(false);
      setNotification(null);
      return;
    }
    setNotification(next);
    activeCategoryColor.current = getCategoryColor(next.CATEGORY || next.category);
    setBorderColorState(activeCategoryColor.current);
    setVisible(true);
    startBlinking();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const enqueue = (items: any[]) => {
    queueRef.current = [...queueRef.current, ...items];
    if (!visible) {
      showNext();
    }
  };

  const handleSocketNotification = (data: NotificationPayload) => {
    const incoming = data.data;
    if (!incoming) {
      return;
    }
    const item = {
      CATEGORY: incoming.category ,
      // || incoming.CATEGORY,
      FORM: incoming.form ,
      // || incoming.FORM,
      REFERENCENO: incoming.referenceno ,
      // || incoming.REFERENCENO,
      MIRNO: incoming.mirNo ,
      // || incoming.MIRNO,
      SENDER: incoming.sender, 
      // || incoming.SENDER,
      RECEIVER: incoming.receiver ,
      // || incoming.RECEIVER,
    };
    queueRef.current = queueRef.current.filter(
      (existing) =>
        (existing.REFERENCENO || existing.referenceno) === item.REFERENCENO &&
        (existing.CATEGORY || existing.category) === item.CATEGORY
    );
    enqueue([item]);
  };

  useEffect(() => {
    socketService.connect();
    socketService.onNotification(handleSocketNotification);
    return () => {
      socketService.offNotification(handleSocketNotification);
      stopBlinking();
    };
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    if (!user) {
      queueRef.current = [];
      setNotification(null);
      setVisible(false);
      hasShownInitialRef.current = false;
      return;
    }

    let cancelled = false;
    const loadExistingNotifications = async () => {
      try {
        const notifications = await notificationService.getNotifications(user.NAME || user.USERNAME || '');
        if (cancelled) {
          return;
        }
        if (notifications.length > 0 && !hasShownInitialRef.current) {
          hasShownInitialRef.current = true;
          enqueue(notifications);
        }
      } catch (error) {
        console.error('Failed to load existing notifications for popup:', error);
      }
    };

    loadExistingNotifications();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handlePress = () => {
    router.push('/notifications');
    hidePopup();
  };

  const hidePopup = () => {
    stopBlinking();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      setNotification(null);
    });
  };

  if (!visible || !notification) {
    return null;
  }

  const category = notification.CATEGORY || notification.category || 'Notification';
  const message = notification.FORM || notification.form || category;
  const reference = notification.REFERENCENO || notification.referenceno ? `Ref: ${notification.REFERENCENO || notification.referenceno}` : '';
  const iconColor = getCategoryColor(category);
  const iconName = getCategoryIcon(category);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          paddingTop: insets.top + 12,
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
      >
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.cardBackground,
              borderColor: borderColorState,
              opacity: blinkAnim,
              shadowColor: iconColor,
              shadowOpacity: blinkAnim.interpolate({
                inputRange: [0.25, 1],
                outputRange: [0.05, 0.35],
              }),
              shadowRadius: blinkAnim.interpolate({
                inputRange: [0.25, 1],
                outputRange: [4, 16],
              }),
              elevation: blinkAnim.interpolate({
                inputRange: [0.25, 1],
                outputRange: [2, 10],
              }),
              transform: [
                {
                  scale: blinkAnim.interpolate({
                    inputRange: [0.25, 1],
                    outputRange: [0.97, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '18' }]}>
            <MaterialCommunityIcons name={iconName as any} size={28} color={iconColor} />
          </View>
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
              {category}
            </Text>
            <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
              {message}
            </Text>
            {reference ? (
              <Text style={[styles.reference, { color: colors.textTertiary }]} numberOfLines={1}>
                {reference}
              </Text>
            ) : null}
          </View>
          {/* <View style={styles.badge}>
            <Text style={styles.badgeText}>{queueRef.current.length + 1}</Text>
          </View> */}
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    pointerEvents: 'box-none',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  iconContainer: {
    width: 48,
    height: 150,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
  },
  reference: {
    fontSize: 20,
    fontWeight: '600',
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
});
