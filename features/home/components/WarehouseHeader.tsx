import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

interface WarehouseHeaderProps {
  userName?: string;
  userDepartment?: string;
}

export function WarehouseHeader({ 
  userName = 'Warehouse Operator',
  userDepartment = 'Operations'
}: WarehouseHeaderProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const [currentTime, setCurrentTime] = useState(new Date());

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
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      {/* App Title and Logo Area */}
      <View style={styles.titleSection}>
        <View style={styles.logoContainer}>
          <MaterialCommunityIcons
            name="warehouse"
            size={32}
            color="#ffffff"
          />
        </View>
        <View>
          <Text style={styles.appName}>Santeh Feeds Corporation - App</Text>
          <Text style={styles.tagline}>Enterprise Resource Management</Text>
        </View>
      </View>

      {/* User and Time Info */}
      <View style={styles.infoSection}>
        <View style={styles.userInfo}>
          <MaterialCommunityIcons
            name="account-circle"
            size={24}
            color="#ffffff"
          />
          <View style={styles.userTextContainer}>
            <Text style={styles.userLabel}>Operator</Text>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.userDepartment}>{userDepartment}</Text>
          </View>
        </View>

        <View style={styles.dateTimeContainer}>
          <View style={styles.dateTimeItem}>
            <MaterialCommunityIcons
              name="calendar-today"
              size={16}
              color="#ffffff"
            />
            <Text style={styles.dateTimeText}>{formatDate(currentTime)}</Text>
          </View>
          <View style={styles.dateTimeItem}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color="#ffffff"
            />
            <Text style={styles.dateTimeText}>{formatTime(currentTime)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 24,
    gap: 16,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  tagline: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userTextContainer: {
    gap: 2,
  },
  userLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  userDepartment: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  dateTimeContainer: {
    gap: 12,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  dateTimeText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
});
