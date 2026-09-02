import { Colors } from "@/constants/theme";
import { useAuth } from "@/features/auth/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialUtilizationService } from "../services/materialUtilizationService";

interface MaterialUtilizationBatchListsProps {
  usageNo?: number;
  onBack?: () => void;
  onAddNew?: (isDosingMachine: boolean) => void;
  onAddBaseDetail?: () => void;
  onBatchPress?: (batchNo: number, isDosingMachine: boolean) => void;
  onMarkAsDone?: () => void;
}

export const MaterialUtilizationBatchLists: React.FC<
  MaterialUtilizationBatchListsProps
> = ({ usageNo, onBack, onAddNew, onAddBaseDetail, onBatchPress, onMarkAsDone }) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? "light"];
  const { user } = useAuth();

  const [autoDosingBatchNos, setAutoDosingBatchNos] = useState<any[]>([]);
  const [notDosingBatchNos, setNotDosingBatchNos] = useState<any[]>([]);
  const [totalDosingItem, setTotalDosingItem] = useState<number>(0);
  const [totalNotDosingItem, setTotalNotDosingItem] = useState<number>(0);

  const [loading, setLoading] = useState(false);

  const loadBatchLists = useCallback(async () => {
    if (!usageNo) return;
    setLoading(true);
    try {
      const data = await MaterialUtilizationService.getInstance().getBatchLists(
        user?.COMPANY,
        usageNo,
      );
      setAutoDosingBatchNos(data.autoDosingBatchNos || []);
      setNotDosingBatchNos(data.notDosingBatchNos || []);

      setTotalDosingItem(data.totalDosingItem || 0);
      setTotalNotDosingItem(data.totalNotDosingItem || 0);
    } catch (error) {
      console.error("Failed to load batch lists:", error);
      Alert.alert("Error", "Failed to load batch lists.");
    } finally {
      setLoading(false);
    }
  }, [usageNo, user?.COMPANY]);

  useEffect(() => {
    loadBatchLists();
  }, [loadBatchLists]);

  const renderBatchItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.batchItem,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
        },
      ]}
      onPress={() => onBatchPress?.(Number(item.BATCHNO), true)}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name="package-variant-closed"
        size={20}
        color={colors.primary}
        style={styles.batchItemIcon}
      />
      <Text style={[styles.batchItemText, { color: colors.text }]}>
        Batch No: {item.BATCHNO}
      </Text>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );

  const renderNotDosingItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.batchItem,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.cardBorder,
        },
      ]}
      onPress={() => onBatchPress?.(Number(item.BATCHNO), false)}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons
        name="package-variant"
        size={20}
        color={colors.secondary}
        style={styles.batchItemIcon}
      />
      <Text style={[styles.batchItemText, { color: colors.text }]}>
        Batch No: {item.BATCHNO}
      </Text>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.textSecondary}
      />
    </TouchableOpacity>
  );

  const renderEmptyState = (isDosing: boolean) => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="clipboard-outline"
        size={48}
        color={colors.textTertiary}
      />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        No batch numbers found
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.primary }]}
        onPress={() => onAddNew?.(isDosing)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Create New</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBaseDetailEmpty = () => {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="clipboard-outline"
          size={48}
          color={colors.textTertiary}
        />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No base details found in this record.
        </Text>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary }]}
          onPress={() => onAddBaseDetail?.()}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          <Text style={styles.createButtonText}>
            Create Material Utilization Base Detail.
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={["bottom"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.headerBar}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Batch Lists
        </Text>
        <TouchableOpacity
          onPress={onMarkAsDone}
          activeOpacity={0.7}
          style={[styles.headerDoneButton, { backgroundColor: colors.primary }]}
        >
          <MaterialCommunityIcons name="check" size={16} color="#fff" />
          <Text style={styles.headerDoneButtonText}>Mark as Done</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading batch lists…
          </Text>
        </View>
      ) : (
        <View style={styles.content}>
          {totalNotDosingItem > 0 && (
            <View style={[styles.section, { marginTop: 24 }]}>
              <View
                style={[
                  styles.sectionHeader,
                  { borderBottomColor: colors.cardBorder },
                ]}
              >
                <MaterialCommunityIcons
                  name="robot-confused"
                  size={22}
                  color={colors.secondary}
                />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Not Dosing Machine Items
                </Text>
                {notDosingBatchNos.length > 0 && (
                  <View style={styles.addButton}>
                    <TouchableOpacity
                      style={[
                        styles.addFab,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={() => onAddNew?.(false)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name="plus"
                        size={24}
                        color="#ffffff"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {notDosingBatchNos.length > 0 ? (
                <FlatList
                  data={notDosingBatchNos}
                  keyExtractor={(item, index) =>
                    `notdosing-${item.BATCHNO ?? index}`
                  }
                  renderItem={renderNotDosingItem}
                  scrollEnabled={false}
                  contentContainerStyle={styles.listContent}
                />
              ) : (
                renderEmptyState(false)
              )}
            </View>
          )}

          {totalDosingItem > 0 && (
            <View style={styles.section}>
              <View
                style={[
                  styles.sectionHeader,
                  { borderBottomColor: colors.cardBorder },
                ]}
              >
                <MaterialCommunityIcons
                  name="robot-industrial"
                  size={22}
                  color={colors.primary}
                />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Auto Dosing Machine Items
                </Text>
                {autoDosingBatchNos.length > 0 && (
                  <View style={styles.addButton}>
                    <TouchableOpacity
                      style={[
                        styles.addFab,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={() => onAddNew?.(true)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name="plus"
                        size={24}
                        color="#ffffff"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {autoDosingBatchNos.length > 0 ? (
                <FlatList
                  data={autoDosingBatchNos}
                  keyExtractor={(item, index) =>
                    `auto-${item.BATCHNO ?? index}`
                  }
                  renderItem={renderBatchItem}
                  scrollEnabled={false}
                  contentContainerStyle={styles.listContent}
                />
              ) : (
                renderEmptyState(true)
              )}
            </View>
          )}

          {totalDosingItem === 0 &&
            totalNotDosingItem === 0 &&
            renderBaseDetailEmpty()}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // pushes done button to the right edge
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  headerDoneButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginLeft: "auto", // fallback if headerBar isn't space-between
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },

  headerDoneButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  backButton: {
    padding: 4,
  },
  addButton: {
    marginLeft: "auto",
  },
  addFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  listContent: {
    gap: 8,
  },
  batchItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    height: 56,
    paddingHorizontal: 16,
  },
  batchItemIcon: {
    marginRight: 4,
  },
  batchItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingBottom: 40,
  },
  emptyText: {
    fontSize: 16,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
