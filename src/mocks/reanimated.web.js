const { Animated } = require('react-native');

module.exports = {
  default: Animated,
  Animated,
  View: Animated.View,
  Text: Animated.Text,
  Image: Animated.Image,
  ScrollView: Animated.ScrollView,
  SharedValue: (initial) => ({ value: initial }),
  interpolate: (value, inputRange, outputRange) => value,
  useAnimatedStyle: () => ({}),
  useSharedValue: (initial) => ({ value: initial }),
  useAnimatedRef: () => ({ current: null }),
  useScrollOffset: () => ({ value: 0 }),
  withSpring: (value) => value,
  withTiming: (value) => value,
  withDecay: (value) => value,
  withDelay: (delay, value) => value,
};
