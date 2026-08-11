import { ConfirmModal } from '@/components/ConfirmModal';
import { SuccessModal } from '@/components/SuccessModal';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/context/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialUtilizationTag, MaterialUtilizationTagService } from './services/materialUtilizationTagService';

interface MaterialUtilizationTagScreenProps {
  onBack?: () => void;
}

export default function MaterialUtilizationTagScreen({ onBack }: MaterialUtilizationTagScreenProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const { user } = useAuth();

  const [tag, setTag] = useState<MaterialUtilizationTag | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<boolean>(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchTag = useCallback(async () => {
    setLoading(true);
    try {
      const data = await MaterialUtilizationTagService.getInstance().getTag(user?.COMPANY);
      if (data && data.length > 0) {
        setTag(data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch tag:', error);
      Alert.alert('Error', 'Failed to load material utilization tag.');
    } finally {
      setLoading(false);
    }
  }, [user?.COMPANY]);

  useEffect(() => {
    fetchTag();
  }, [fetchTag]);

  const handleTogglePress = () => {
    setPendingToggle(!tag?.IS_TAGGED_IN_QM4D);
    setConfirmVisible(true);
  };

  const handleConfirmToggle = async () => {
    if (!tag) return;

    setConfirmVisible(false);
    setUpdating(true);

    try {
      await MaterialUtilizationTagService.getInstance().updateTag(
        {
          newTagValue: pendingToggle,
          user: user?.NAME || '',
        },
        user?.COMPANY
      );

      setTag((prev) =>
        prev
          ? { ...prev, IS_TAGGED_IN_QM4D: pendingToggle, MODIFIEDBY: user?.NAME || '', DATEMODIFIED: new Date().toISOString() }
          : null
      );

      setSuccessMessage(
        `QM4D tagging ${pendingToggle ? 'enabled' : 'disabled'} successfully.`
      );
      setSuccessVisible(true);
    } catch (error) {
      console.error('Failed to update tag:', error);
      Alert.alert('Error', 'Failed to update tag. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSuccessDone = () => {
    setSuccessVisible(false);
    setSuccessMessage('');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Material Utilization Tag
        </Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            QM4D Tagging Control
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Control whether material utilization records are tagged in the QM4D system.
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading tag status...
              </Text>
            </View>
          ) : tag ? (
            <View>
              <View style={[styles.row, { borderBottomColor: colors.cardBorder }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>QM4D Tag</Text>
                <Text style={[styles.value, { color: tag.IS_TAGGED_IN_QM4D ? colors.success : colors.error }]}>
                  {tag.IS_TAGGED_IN_QM4D ? 'Enabled' : 'Disabled'}
                </Text>
              </View>

              <View style={[styles.row, { borderBottomColor: colors.cardBorder }]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Modified By</Text>
                <Text style={[styles.value, { color: colors.text }]}>{tag.MODIFIEDBY || '—'}</Text>
              </View>

              <View style={styles.row}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Last Modified</Text>
                <Text style={[styles.value, { color: colors.text }]}>{formatDate(tag.DATEMODIFIED)}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No tag configuration found.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.toggleButton,
              {
                backgroundColor: tag?.IS_TAGGED_IN_QM4D ? colors.error : colors.success,
                opacity: (updating || loading || !tag) ? 0.6 : 1,
              },
            ]}
            onPress={handleTogglePress}
            disabled={updating || loading || !tag}
            activeOpacity={0.8}
          >
            {updating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <MaterialCommunityIcons
                  name={tag?.IS_TAGGED_IN_QM4D ? 'toggle-switch' : 'toggle-switch-off'}
                  size={24}
                  color="#ffffff"
                />
                <Text style={styles.toggleButtonText}>
                  {tag?.IS_TAGGED_IN_QM4D
                    ? 'Disable QM4D Tagging'
                    : 'Enable QM4D Tagging'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ConfirmModal
        visible={confirmVisible}
        title="Confirm Tagging Change"
        message={
          pendingToggle
            ? 'Enable QM4D tagging for material utilization records? New entries will be tagged in QM4D.'
            : 'Disable QM4D tagging for material utilization records? New entries will not be tagged in QM4D.'
        }
        iconName={pendingToggle ? 'tag-check' : 'tag-remove'}
        iconColor={pendingToggle ? colors.success : colors.warning}
        cancelText="Cancel"
        confirmText={pendingToggle ? 'Enable' : 'Disable'}
        onConfirm={handleConfirmToggle}
        onCancel={() => setConfirmVisible(false)}
      />

      <SuccessModal
        visible={successVisible}
        title="Success"
        message={successMessage}
        buttonText="Done"
        onDone={handleSuccessDone}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 15,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    fontSize: 15,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    gap: 8,
    marginTop: 16,
  },
  toggleButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
