import { Colors } from "@/constants/theme";
import { useAuth } from "@/features/auth/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { MaterialUtilizationService } from "../services/materialUtilizationService";

interface MaterialUtilizationForQaReviewProps {
  onBack: () => void;
  onRecordPress: (record: any) => void;
}

export const MaterialUtilizationForQaReview: React.FC<
  MaterialUtilizationForQaReviewProps
> = ({ onBack, onRecordPress }) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? "light"];
  const { user } = useAuth();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const result =
        await MaterialUtilizationService.getInstance().getMaterialUtilizationForQaReviewLists(
          user?.COMPANY,
        );
      setData(result || []);
    } catch (error) {
      console.error("Failed to load QA review material utilization lists:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.COMPANY]);

  const formatDateDisplay = (dateValue: string | Date): string => {
    if (!dateValue) return "—";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredData = search.trim()
    ? data.filter((r) => {
        const s = search.trim().toLowerCase();
        return (
          String(r.USAGENO ?? "").toLowerCase().includes(s) ||
          String(r.MACHINELINENO ?? "").toLowerCase().includes(s) ||
          String(r.SHIFT ?? "").toLowerCase().includes(s) ||
          String(r.FORMULANAME ?? "").toLowerCase().includes(s) ||
          String(r.VARIANTCODE ?? "").toLowerCase().includes(s) ||
          String(r.FORMULATIONNO ?? "").toLowerCase().includes(s)
        );
      })
    : data;

  const renderListItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.listItemCard,
        { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
      ]}
      onPress={() => onRecordPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.listItemHeader}>
        <View
          style={[
            styles.listItemIconContainer,
            { backgroundColor: colors.warning + "14" },
          ]}
        >
          <MaterialCommunityIcons
            name="microscope"
            size={22}
            color={colors.warning}
          />
        </View>
        <View style={styles.usageNo}>
          <Text style={[styles.listItemUsageNo, { color: colors.primary }]}>
            PMU-{item.USAGENO || "—"}
          </Text>
          <Text style={[styles.listItemUsageNo, { color: colors.preparing }]}>
            {item.FORMULANAME || "—"}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            alignItems: "flex-end",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={30}
            color={colors.textSecondary}
          />
        </View>
      </View>
      <View style={styles.listItemMeta}>
        <Text style={[styles.listItemMetaText, { color: colors.textSecondary }]}>
          Machine No.: {item.MACHINELINENO || "No machine line"}
        </Text>
        <Text style={[styles.listItemMetaText, { color: colors.textSecondary }]}>
          Formula: {item.FORMULATIONNO || "-"}
        </Text>
      </View>
      <View style={styles.listItemMeta}>
        <Text style={[styles.listItemMetaText, { color: colors.textSecondary }]}>
          Shift: {item.SHIFT || "—"}
        </Text>
        <Text style={[styles.listItemMetaText, { color: colors.textSecondary }]}>
          Date: {formatDateDisplay(item.USAGEDATE)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>For QA Review</Text>
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
          onPress={load}
          activeOpacity={0.7}
          disabled={loading}
        >
          <MaterialCommunityIcons name="refresh" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
        ]}
      >
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by Usage No, Feed, Machine, Shift, Formula"
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch("")}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading records…
          </Text>
        </View>
      ) : filteredData.length > 0 ? (
        <FlatList
          data={filteredData}
          keyExtractor={(item, index) => `${item.USAGENO ?? index}-${index}`}
          renderItem={renderListItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={<View style={{ height: 16 }} />}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="microscope"
            size={48}
            color={colors.textTertiary}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No QA review records found
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: { padding: 4 },
  title: { fontSize: 22, fontWeight: "700" },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    height: 52,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 0,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: { fontSize: 16, fontWeight: "500" },
  listContent: { paddingHorizontal: 16, paddingBottom: 16 },
  listItemCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 8,
  },
  listItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  listItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  usageNo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  listItemUsageNo: {
    fontSize: 26,
    fontWeight: "700",
    marginLeft: "auto",
  },
  listItemMeta: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 4,
  },
  listItemMetaText: {
    fontSize: 18,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: { fontSize: 16 },
});
