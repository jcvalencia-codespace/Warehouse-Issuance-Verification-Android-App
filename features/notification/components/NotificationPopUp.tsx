import { Colors } from '@/constants/theme';
import { socketService } from '@/features/shared/services/socketService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
  const [payload, setPayload] = useState<NotificationPayload | null>(null);
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

  useEffect(() => {
    const handleNotification = (data: NotificationPayload) => {
      setPayload(data);
      activeCategoryColor.current = getCategoryColor(data.data?.category);
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

    socketService.connect();
    socketService.onNotification(handleNotification);

    return () => {
      socketService.offNotification(handleNotification);
      stopBlinking();
    };
  }, [fadeAnim, slideAnim]);

  const handlePress = () => {
    if (!payload?.data) return;

    // const category = payload.data.category || '';
    // if (category === 'Material issuance request SERVED and now ready for confirmation') {
    //   router.push({
    //     pathname: '/raw-materials-dept/material-issuance-confirmation',
    //     params: { source: 'production' },
    //   });
    // } else if (category === 'New Material Issuance Request') {
    //   router.push('/raw-materials-dept/material-issuance-confirmation');
    // } else {
    //   router.push('/notifications');
    // }

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
      setPayload(null);
    });
  };

  if (!visible || !payload?.data) {
    return null;
  }

  const category = payload.data.category || 'Notification';
  const message = payload.data.form || category;
  const reference = payload.data.referenceno ? `Ref: ${payload.data.referenceno}` : '';

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
              shadowColor: getCategoryColor(category),
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
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: getCategoryColor(category) + '18',
              transform: [
                {
                  scale: blinkAnim.interpolate({
                    inputRange: [0.25, 1],
                    outputRange: [0.85, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons
            name={getCategoryIcon(category) as any}
            size={28}
            color={getCategoryColor(category)}
          />
        </Animated.View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>
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
});
