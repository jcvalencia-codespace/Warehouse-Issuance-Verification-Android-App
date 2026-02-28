import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, useColorScheme, View, ViewStyle } from 'react-native';

export interface SummaryStatItem {
  icon: string;
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

interface SummaryCardProps {
  item: SummaryStatItem;
  style?: ViewStyle;
}

export function StatisticCard({ item, style }: SummaryCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  const getTrendIcon = () => {
    if (item.trend === 'up') return 'trending-up';
    if (item.trend === 'down') return 'trending-down';
    return null;
  };

  const getTrendColor = () => {
    if (item.trend === 'up') return colors.success;
    if (item.trend === 'down') return colors.warning;
    return colors.textSecondary;
  };

  const backgroundColor = item.color || colors.cardBackground;
  const iconColor = item.color || colors.primary;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: colors.cardBorder,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: iconColor + '15' },
        ]}
      >
        <MaterialCommunityIcons
          name={item.icon as any}
          size={28}
          color={iconColor}
        />
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {item.label}
        </Text>
        <View style={styles.valueRow}>
          <Text style={[styles.value, { color: colors.text }]}>
            {item.value}
          </Text>
          {item.trend && getTrendIcon() && (
            <MaterialCommunityIcons
              name={getTrendIcon() as any}
              size={16}
              color={getTrendColor()}
              style={styles.trendIcon}
            />
          )}
        </View>
      </View>
    </View>
  );
}

interface SummaryStatsProps {
  stats: SummaryStatItem[];
  isTablet?: boolean;
}

export function SummaryStats({ stats, isTablet = false }: SummaryStatsProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  const StatItemWrapper = ({ item }: { item: SummaryStatItem }) => {
    const flex = isTablet ? 1 : undefined;
    return <StatisticCard item={item} style={{ flex }} />;
  };

  return (
    <View
      style={[
        styles.statsContainer,
        isTablet && styles.statsContainerTablet,
      ]}
    >
      {stats.map((stat, index) => (
        <StatItemWrapper key={index} item={stat} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  statsContainerTablet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
  },
  trendIcon: {
    marginLeft: 4,
  },
});
