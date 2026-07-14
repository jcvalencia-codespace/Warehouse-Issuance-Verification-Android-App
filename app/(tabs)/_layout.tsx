import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';

const TAB_SIZE_ACTIVE = 60;
const TAB_SIZE_INACTIVE = 48;
const BORDER_RADIUS_CIRCLE = 24;
const BORDER_RADIUS_SQUARE = 12;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { isAdmin } = useAuth();
  const router = useRouter();

  const [activeIndex, setActiveIndex] = useState(1);
  const indicatorPosition = useSharedValue(1);

  const tab0Scale = useSharedValue(0.8);
  const tab1Scale = useSharedValue(1);
  const tab2Scale = useSharedValue(0.8);

  const [showHomeMenu, setShowHomeMenu] = useState(false);

  useEffect(() => {
    indicatorPosition.value = withSpring(activeIndex, {
      damping: 15,
      stiffness: 150,
    });

    tab0Scale.value = withSpring(activeIndex === 0 ? 1 : 0.8, { damping: 15, stiffness: 200 });
    tab1Scale.value = withSpring(activeIndex === 1 ? 1 : 0.8, { damping: 15, stiffness: 200 });
    tab2Scale.value = withSpring(activeIndex === 2 ? 1 : 0.8, { damping: 15, stiffness: 200 });
  }, [activeIndex]);

  const handleIndexChange = (index: number) => {
    setActiveIndex(index);
  };

  const getTabStyle = (index: number, scaleValue: SharedValue<number>) => {
    return useAnimatedStyle(() => {
      const isActive = indicatorPosition.value === index;
      const size = isActive ? TAB_SIZE_ACTIVE : TAB_SIZE_INACTIVE;

      const borderRadius = interpolate(
        scaleValue.value,
        [0.8, 1],
        [BORDER_RADIUS_CIRCLE, BORDER_RADIUS_SQUARE]
      );

      return {
        transform: [{ scale: scaleValue.value }],
        width: size,
        height: size,
        borderRadius: borderRadius,
      };
    });
  };

  const handleHomeMenuSelect = (route: string) => {
    setShowHomeMenu(false);
    setActiveIndex(1);
    router.push(route as any);
  };

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: isDark ? '#6B7280' : '#9CA3AF',
          headerShown: false,
          tabBarButton: (props) => <HapticTab {...props} />,
          animation: 'fade',
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              shadowColor: isDark ? '#000' : '#1E40AF',
              paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 8) : Math.max(insets.bottom, 8),
              height: Platform.OS === 'ios' ? 88 + insets.bottom : 70 + insets.bottom,
            },
          ],
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="help/index"
          options={{
            title: '',
            tabBarIcon: () => {
              const isActive = activeIndex === 0;
              const animatedStyle = getTabStyle(0, tab0Scale);
              return (
                <View style={styles.tabWrapper}>
                  <Animated.View
                    style={[
                      styles.floatingTab,
                      {
                        backgroundColor: isActive ? colors.tint : isDark ? '#1E293B' : '#F1F5F9',
                        shadowColor: isActive ? colors.tint : '#000',
                      },
                      animatedStyle,
                    ]}
                  >
                    <IconSymbol
                      size={isActive ? 24 : 20}
                      name="questionmark.circle.fill"
                      color={isActive ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                    />
                  </Animated.View>
                </View>
              );
            },
          }}
          listeners={{
            tabPress: () => handleIndexChange(0),
          }}
        />

        <Tabs.Screen
          name="index"
          options={{
            title: '',
            tabBarIcon: () => {
              const isActive = activeIndex === 1;
              const animatedStyle = getTabStyle(1, tab1Scale);
              return (
                <View style={styles.tabWrapper}>
                  <Animated.View
                    style={[
                      styles.floatingTab,
                      {
                        backgroundColor: isActive ? colors.tint : isDark ? '#1E293B' : '#F1F5F9',
                        shadowColor: isActive ? colors.tint : '#000',
                      },
                      animatedStyle,
                    ]}
                  >
                    <IconSymbol
                      size={isActive ? 28 : 22}
                      name="house.fill"
                      color={isActive ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                    />
                  </Animated.View>
                </View>
              );
            },
          }}
          listeners={{
            tabPress: (e) => {
              if (isAdmin) {
                if (showHomeMenu) {
                  setShowHomeMenu(false);
                  return;
                }
                e.preventDefault();
                handleIndexChange(1);
                setShowHomeMenu(true);
              } else {
                handleIndexChange(1);
              }
            },
          }}
        />

        <Tabs.Screen
          name="profile/index"
          options={{
            title: '',
            tabBarIcon: () => {
              const isActive = activeIndex === 2;
              const animatedStyle = getTabStyle(2, tab2Scale);
              return (
                <View style={styles.tabWrapper}>
                  <Animated.View
                    style={[
                      styles.floatingTab,
                      {
                        backgroundColor: isActive ? colors.tint : isDark ? '#1E293B' : '#F1F5F9',
                        shadowColor: isActive ? colors.tint : '#000',
                      },
                      animatedStyle,
                    ]}
                  >
                    <IconSymbol
                      size={isActive ? 24 : 20}
                      name="person.fill"
                      color={isActive ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                    />
                  </Animated.View>
                </View>
              );
            },
          }}
          listeners={{
            tabPress: () => handleIndexChange(2),
          }}
        />

        <Tabs.Screen
          name="supplies-dept"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {showHomeMenu && (
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowHomeMenu(false)}>
          <View
            style={[
              styles.homeMenuContainer,
              {
                backgroundColor: colors.background,
                borderColor: colors.cardBorder,
                bottom: Platform.OS === 'ios' ? insets.bottom + 96 : insets.bottom + 78,
              },
            ]}
          >
            <Pressable
              style={styles.homeMenuItem}
              onPress={() => handleHomeMenuSelect('(tabs)')}
            >
              <Text style={[styles.homeMenuText, { color: colors.text }]}>RM ISSUANCE</Text>
            </Pressable>
            <View style={[styles.homeMenuDivider, { backgroundColor: colors.divider }]} />
            <Pressable
              style={styles.homeMenuItem}
              onPress={() => handleHomeMenuSelect('supplies-dept')}
            >
              <Text style={[styles.homeMenuText, { color: colors.text }]}>SUPPLIES ISSUANCE</Text>
            </Pressable>
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    elevation: 0,
    paddingTop: 12,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  tabWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -15,
  },
  floatingTab: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  homeMenuContainer: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: '-50%' }],
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
    minWidth: 180,
    overflow: 'hidden',
  },
  homeMenuItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  homeMenuText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  homeMenuDivider: {
    height: 1,
    marginHorizontal: 12,
  },
});
