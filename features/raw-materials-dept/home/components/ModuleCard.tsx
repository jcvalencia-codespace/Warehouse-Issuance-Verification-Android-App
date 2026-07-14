import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  ViewStyle,
} from 'react-native';

export interface ModuleCardData {
  id: string;
  title: string;
  description: string;
  icon: string;
  color?: string;
  badge?: number | string;
  onPress?: (event: GestureResponderEvent) => void;
}

interface ModuleCardProps {
  data: ModuleCardData;
  style?: ViewStyle;
}

export function ModuleCard({ data, style }: ModuleCardProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  const cardColor = data.color || colors.primary;
  const hasBadge = data.badge !== undefined && data.badge !== null;

  return (
    <TouchableOpacity
      style={[
        moduleCardStyles.card,
        {
          backgroundColor: colors.background,
          borderColor: colors.cardBorder,
        },
        style,
      ]}
      activeOpacity={0.7}
      onPress={data.onPress}
    >
      {/* Color Accent Bar */}
      <View
        style={[
          moduleCardStyles.accentBar,
          { backgroundColor: cardColor },
        ]}
      />

      {/* Icon Section */}
      <View
        style={[
          moduleCardStyles.iconSection,
          { backgroundColor: cardColor + '10' },
        ]}
      >
        <MaterialCommunityIcons
          name={data.icon as any}
          size={40}
          color={cardColor}
        />
        {hasBadge && (
          <View
            style={[
              moduleCardStyles.badge,
              { backgroundColor: colors.warning },
            ]}
          >
            <Text style={moduleCardStyles.badgeText}>{data.badge}</Text>
          </View>
        )}
      </View>

      {/* Text Section */}
      <View style={moduleCardStyles.textSection}>
        <Text
          style={[
            moduleCardStyles.title,
            { color: colors.text },
          ]}
          numberOfLines={2}
        >
          {data.title}
        </Text>
        <Text
          style={[
            moduleCardStyles.description,
            { color: colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {data.description}
        </Text>
      </View>

      {/* Arrow Icon */}
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={colors.textTertiary}
        style={moduleCardStyles.chevron}
      />
    </TouchableOpacity>
  );
}

interface ModuleGridProps {
  modules: ModuleCardData[];
  isTablet?: boolean;
  onModulePress?: (moduleId: string) => void;
}

export function ModuleGrid({ modules, isTablet = false, onModulePress }: ModuleGridProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];

  const handlePress = (module: ModuleCardData) => {
    if (onModulePress) {
      onModulePress(module.id);
    }
    if (module.onPress) {
      module.onPress({} as GestureResponderEvent);
    }
  };

  return (
    <View
      style={[
        moduleGridStyles.container,
        isTablet && moduleGridStyles.containerTablet,
      ]}
    >
      {modules.map((module) => (
        <ModuleCard
          key={module.id}
          data={{ ...module, onPress: () => handlePress(module) }}
          style={isTablet ? moduleGridStyles.tabletCard : undefined}
        />
      ))}
    </View>
  );
}

const moduleCardStyles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    minHeight: 88,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  accentBar: {
    width: 4,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  iconSection: {
    width: 88,
    height: 88,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  textSection: {
    flex: 1,
    gap: 4,
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
  },
  chevron: {
    marginLeft: 8,
  },
});

const moduleGridStyles = StyleSheet.create({
  container: {
    gap: 12,
  },
  containerTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  tabletCard: {
    // width: '48%',
    width: '100%',
    minHeight: 100,
  },
});
