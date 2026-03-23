/**
 * Professional Loading Screen Component
 * Provides a polished, enterprise-grade loading experience
 * with animated progress indicators and status messaging
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StatusBar,
  StatusBarStyle,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';

const { width } = Dimensions.get('window');

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
  progress?: number; // 0-100, undefined for indeterminate
}

export function LoadingScreen({
  message = 'Loading',
  subMessage = 'Please wait...',
  progress,
}: LoadingScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;
  const indeterminateAnim = useRef(new Animated.Value(-1)).current;

  // Progress bar animation
  useEffect(() => {
    if (progress !== undefined) {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [progress]);

  // Indeterminate progress animation
  useEffect(() => {
    if (progress === undefined) {
      const indeterminate = Animated.loop(
        Animated.timing(indeterminateAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      indeterminate.start();
      return () => indeterminate.stop();
    }
  }, [progress]);

  // Initial entrance animations
  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Slide up
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  // Pulsing logo animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Loading dots animation
  useEffect(() => {
    const animateDot = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const dot1 = animateDot(dotAnim1, 0);
    const dot2 = animateDot(dotAnim2, 400);
    const dot3 = animateDot(dotAnim3, 800);

    dot1.start();
    dot2.start();
    dot3.start();

    return () => {
      dot1.stop();
      dot2.stop();
      dot3.stop();
    };
  }, []);

  // Calculate progress bar width
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={(colorScheme === 'dark' ? 'light' : 'dark') as StatusBarStyle}
        backgroundColor={colors.background}
      />

      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Image
            source={require('../../assets/images/appLogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* App Name */}
        <Text style={[styles.appName, { color: colors.text }]}>
          Santeh Feeds Corp.
        </Text>
        <Text style={[styles.appSubtitle, { color: colors.textSecondary }]}>
          Warehouse Confirmation
        </Text>

        {/* Loading Dots */}
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                backgroundColor: colors.tint,
                opacity: dotAnim1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                backgroundColor: colors.tint,
                opacity: dotAnim2.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                backgroundColor: colors.tint,
                opacity: dotAnim3.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
            ]}
          />
        </View>

        {/* Message */}
        <Text style={[styles.message, { color: colors.text }]}>
          {message}
        </Text>
        {subMessage && (
          <Text style={[styles.subMessage, { color: colors.textSecondary }]}>
            {subMessage}
          </Text>
        )}

        {/* Indeterminate Progress Bar */}
        {progress === undefined ? (
          <View style={styles.indeterminateContainer}>
            <View
              style={[
                styles.indeterminateTrack,
                { backgroundColor: colors.cardBorder },
              ]}
            >
              <Animated.View
                style={[
                  styles.indeterminateBar,
                  {
                    backgroundColor: colors.tint,
                    transform: [
                      {
                        translateX: indeterminateAnim.interpolate({
                          inputRange: [-1, 1],
                          outputRange: [-200, 200],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          </View>
        ) : (
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: colors.cardBorder },
              ]}
            >
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: colors.tint,
                    width: progressWidth,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {Math.round(progress)}%
            </Text>
          </View>
        )}

        {/* Version Info */}
        <Text style={[styles.version, { color: colors.textTertiary }]}>
          Version 1.0.0
        </Text>
      </Animated.View>

      {/* Background Pattern */}
      <View
        style={[
          styles.backgroundPattern,
          { opacity: colorScheme === 'dark' ? 0.03 : 0.05 },
        ]}
      >
        {[...Array(5)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.patternLine,
              {
                top: `${20 * (i + 1)}%`,
                backgroundColor: colors.text,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 32,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subMessage: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  indeterminateContainer: {
    width: '100%',
    maxWidth: 280,
    marginTop: 8,
  },
  indeterminateTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  indeterminateBar: {
    width: 100,
    height: '100%',
    borderRadius: 2,
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
});

export default LoadingScreen;
