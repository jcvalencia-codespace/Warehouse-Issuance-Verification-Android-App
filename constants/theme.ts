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

// Material issuance status colors
const preparing = '#EA5806'; // Orange for preparing
const prepared = '#2563EB'; // Blue for prepared
const served = '#22C55E'; // Green for served
const countBadgeBorder = '#E5E7EB'; // Gray border for count badge
const cancelButtonBg = '#FEE2E2'; // Light red for cancel button

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
    errorWhite: '#f87171',
    neutral,
    cardBackground: '#f8fafc',
    cardBorder: '#e2e8f0',
    divider: '#e2e8f0',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    shadowColor: '#000000',
    // Material issuance status colors
    preparing,
    preparingBg: '#FFF7ED',
    preparingBorder: '#FDBA74',
    prepared,
    preparedBg: '#EFF6FF',
    preparedBorder: '#BFDBFE',
    served,
    servedBg: '#F0FDF4',
    servedBorder: '#BBF7D0',
    cancelButtonBg,
    countBadgeBorder,

    review: '#FFEDD5',
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
    errorWhite: '#EFF6FF',
    neutral: '#1e293b',
    cardBackground: '#1e293b',
    cardBorder: '#334155',
    divider: '#334155',
    textSecondary: '#cbd5e1',
    textTertiary: '#94a3b8',
    shadowColor: '#000000',
    // Material issuance status colors (dark mode)
    preparing: '#f97316', // orange-500
    preparingBg: '#451a03', // orange-950
    preparingBorder: '#9a3412', // orange-800
    prepared: '#3b82f6', // blue-500
    preparedBg: '#172554', // blue-950
    preparedBorder: '#1e40af', // blue-800
    served: '#34d399', // green-400
    servedBg: '#022c22', // green-950
    servedBorder: '#065f46', // green-800
    cancelButtonBg: '#7f1d1d', // red-900
    countBadgeBorder: '#334155',

    review: '#F97316',
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
