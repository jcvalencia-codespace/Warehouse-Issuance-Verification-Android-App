/**
 * Enterprise warehouse confirmation theme colors
 * Professional, clean design optimized for warehouse operators
 */

import { Platform } from 'react-native';

// Enterprise color palette for warehouse operations
const primary = '#1e40af'; // Professional blue
const secondary = '#0ea5e9'; // Accent blue
const success = '#10b981'; // Green for completed operations
const warning = '#f59e0b'; // Amber for pending items
const error = '#ef4444'; // Red for failures
const neutral = '#f8fafc'; // Off-white background
const darkNeutral = '#1e293b'; // Dark text

export const Colors = {
  light: {
    text: darkNeutral,
    background: '#ffffff',
    tint: primary,
    icon: '#64748b',
    tabIconDefault: '#64748b',
    tabIconSelected: primary,
    // Additional enterprise colors
    primary,
    secondary,
    success,
    warning,
    error,
    neutral,
    cardBackground: '#f8fafc',
    cardBorder: '#e2e8f0',
    divider: '#e2e8f0',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    shadowColor: '#000000',
  },
  dark: {
    text: '#f1f5f9',
    background: '#0f172a',
    tint: secondary,
    icon: '#cbd5e1',
    tabIconDefault: '#cbd5e1',
    tabIconSelected: secondary,
    // Additional enterprise colors
    primary: '#3b82f6',
    secondary: '#38bdf8',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    neutral: '#1e293b',
    cardBackground: '#1e293b',
    cardBorder: '#334155',
    divider: '#334155',
    textSecondary: '#cbd5e1',
    textTertiary: '#94a3b8',
    shadowColor: '#000000',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
