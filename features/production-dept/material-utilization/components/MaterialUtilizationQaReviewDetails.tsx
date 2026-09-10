import { Colors } from "@/constants/theme";
import { useAuth } from "@/features/auth/context/AuthContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialUtilizationService } from "../services/materialUtilizationService";

interface QaReviewBaseItem {
  ROWID: number;
  USAGENO: number;
  ITEMNMBR: string;
  ITEMDESC: string;
  KGSREQUIRED: number;
  IS_DOSING_MACHINE: number;
}

interface MaterialUtilizationQaReviewDetailsProps {
  usageNo: number;
  onBack: () => void;
}

export const MaterialUtilizationQaReviewDetails: React.FC<
  MaterialUtilizationQaReviewDetailsProps
> = ({ usageNo, onBack }) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? "light"];
  const { user } = useAuth();

  const [header, setHeader] = useState<any | null>(null);
  const [baseDetails, setBaseDetails] = useState<QaReviewBaseItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!usageNo) return;
    setLoading(true);
    try {
      const result =
        await MaterialUtilizationService.getInstance().getMaterialUtilizationDetailsForPosting(
          user?.COMPANY,
          usageNo,
        );
      setHeader(result.header || null);
      setBaseDetails(result.details || []);
    } catch (error) {
      console.error("Failed to load QA review details:", error);
      setHeader(null);
      setBaseDetails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [usageNo, user?.COMPANY]);

  const formatDate = (value: any) => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatKg = (value: any) => {
    if (value === undefined || value === null || value === "") return "-";
    const num = Number(value);
    if (isNaN(num)) return "-";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const nonDosingItems = baseDetails.filter(
    (item) => Number(item.IS_DOSING_MACHINE) !== 1,
  );
  const dosingItems = baseDetails.filter(
    (item) => Number(item.IS_DOSING_MACHINE) === 1,
  );

  const renderItemRow = ({ item }: { item: QaReviewBaseItem }) => (
    <View
      style={[
        styles.itemRow,
        {
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.cardBorder,
        },
      ]}
    >
      <View style={styles.itemNoCell}>
        <Text style={[styles.itemNoText, { color: colors.text }]}>
          {item.ITEMNMBR || "-"}
        </Text>
        <Text style={[styles.itemDescText, { color: colors.textSecondary }]}>
          {item.ITEMDESC ? item.ITEMDESC.trimEnd() : "-"}
        </Text>
      </View>
      <View style={[styles.kgsCell, { alignItems: "flex-end" }]}>
        <Text style={[styles.kgsValue, { color: colors.text }]}>
          {formatKg(item.KGSREQUIRED)}
        </Text>
      </View>
      <View style={[styles.tagCell, { alignItems: "center" }]}>
        {Number(item.IS_DOSING_MACHINE) === 1 ? (
          <MaterialCommunityIcons
            name="robot-industrial"
            size={20}
            color={colors.primary}
          />
        ) : (
          <MaterialCommunityIcons
            name="cog-outline"
            size={20}
            color={colors.secondary}
          />
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerBarTitle, { color: colors.text }]}>
          QA Review Details
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading details…
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {header && (
            <View
              style={[
                styles.headerCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <View style={styles.headerGrid}>
                <View style={styles.headerRowItem}>
                  <MaterialCommunityIcons
                    name="clipboard-file-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.headerLabel, { color: colors.textSecondary }]}
                  >
                    Usage No:
                  </Text>
                  <Text style={[styles.headerValue, { color: colors.text }]}>
                    PMU-{header.USAGENO}
                  </Text>
                </View>
                <View style={styles.headerRowItem}>
                  <MaterialCommunityIcons
                    name="flask-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.headerLabel, { color: colors.textSecondary }]}
                  >
                    Formula:
                  </Text>
                  <Text style={[styles.headerValue, { color: colors.text }]}>
                    {header.FORMULANAME || "-"}
                  </Text>
                </View>
                <View style={styles.headerRowItem}>
                  <MaterialCommunityIcons
                    name="flask-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.headerLabel, { color: colors.textSecondary }]}
                  >
                    Variant:
                  </Text>
                  <Text style={[styles.headerValue, { color: colors.text }]}>
                    {header.VARIANTCODE || "-"}
                  </Text>
                </View>
                <View style={styles.headerRowItem}>
                  <MaterialCommunityIcons
                    name="calendar"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.headerLabel, { color: colors.textSecondary }]}
                  >
                    Usage Date:
                  </Text>
                  <Text style={[styles.headerValue, { color: colors.text }]}>
                    {formatDate(header.USAGEDATE)}
                  </Text>
                </View>
                <View style={styles.headerRowItem}>
                  <MaterialCommunityIcons
                    name="cog-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.headerLabel, { color: colors.textSecondary }]}
                  >
                    Machine:
                  </Text>
                  <Text style={[styles.headerValue, { color: colors.text }]}>
                    {header.MACHINELINENO || "-"}
                  </Text>
                </View>
                <View style={styles.headerRowItem}>
                  <MaterialCommunityIcons
                    name="account-clock-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.headerLabel, { color: colors.textSecondary }]}
                  >
                    Shift:
                  </Text>
                  <Text style={[styles.headerValue, { color: colors.text }]}>
                    {header.SHIFT || "-"}
                  </Text>
                </View>
                {/* <View style={styles.headerRowItem}>
                  <MaterialCommunityIcons
                    name="account-tie-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text
                    style={[styles.headerLabel, { color: colors.textSecondary }]}
                  >
                    Production Supervisor:
                  </Text>
                  <Text style={[styles.headerValue, { color: colors.text }]}>
                    {header.REVIEWEDBY || "-"}
                  </Text>
                </View> */}
                {header.ISSUANCENO ? (
                  <View style={styles.headerRowItem}>
                    <MaterialCommunityIcons
                      name="package-variant-closed"
                      size={20}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.headerLabel, { color: colors.textSecondary }]}
                    >
                      Issuance No:
                    </Text>
                    <Text style={[styles.headerValue, { color: colors.text }]}>
                      {header.ISSUANCENO}
                    </Text>
                  </View>
                ) : null}
              </View>

              {header.REMARKS ? (
                <View style={styles.remarksContainer}>
                  <View style={styles.remarksHeader}>
                    <MaterialCommunityIcons
                      name="comment-text-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.headerLabel, { color: colors.textSecondary }]}
                    >
                      Remarks
                    </Text>
                  </View>
                  <Text style={[styles.remarksText, { color: colors.text }]}>
                    {header.REMARKS}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          <Text style={[styles.tableTitle, { color: colors.text }]}>
            Required Materials
          </Text>

          {baseDetails.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="clipboard-outline"
                size={48}
                color={colors.textTertiary}
              />
              <Text
                style={[styles.emptyText, { color: colors.textSecondary }]}
              >
                No base details available
              </Text>
            </View>
          ) : (
            <>
              {nonDosingItems.length > 0 && (
                <>
                  <View
                    style={[
                      styles.sectionDividerRow,
                      {
                        backgroundColor: colors.secondary + "10",
                        borderBottomColor: colors.secondary + "30",
                      },
                    ]}
                  >
                    <View style={styles.sectionDividerContent}>
                      <MaterialCommunityIcons
                        name="cog-outline"
                        size={16}
                        color={colors.secondary}
                      />
                      <Text
                        style={[
                          styles.sectionDividerText,
                          { color: colors.secondary },
                        ]}
                      >
                        Non-Dosing Items
                      </Text>
                    </View>
                  </View>
                  <FlatList
                    data={nonDosingItems}
                    keyExtractor={(item, index) =>
                      `nd-${item.ITEMNMBR ?? index}`
                    }
                    renderItem={renderItemRow}
                    scrollEnabled={false}
                  />
                </>
              )}

              {dosingItems.length > 0 && (
                <>
                  <View
                    style={[
                      styles.sectionDividerRow,
                      {
                        backgroundColor: colors.primary + "10",
                        borderBottomColor: colors.primary + "30",
                      },
                    ]}
                  >
                    <View style={styles.sectionDividerContent}>
                      <MaterialCommunityIcons
                        name="robot-industrial"
                        size={16}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.sectionDividerText,
                          { color: colors.primary },
                        ]}
                      >
                        Dosing Machine Items
                      </Text>
                    </View>
                  </View>
                  <FlatList
                    data={dosingItems}
                    keyExtractor={(item, index) =>
                      `d-${item.ITEMNMBR ?? index}`
                    }
                    renderItem={renderItemRow}
                    scrollEnabled={false}
                  />
                </>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerBarTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
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
  headerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  headerGrid: {
    gap: 12,
  },
  headerRowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  headerValue: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: "auto",
  },
  remarksContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  remarksHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  remarksText: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  sectionDividerRow: {
    height: 38,
  },
  sectionDividerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    height: "100%",
  },
  sectionDividerText: {
    fontSize: 14,
    fontWeight: "700",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 64,
    borderBottomWidth: 1,
  },
  itemNoCell: {
    flex: 1,
  },
  itemNoText: {
    fontSize: 15,
    fontWeight: "600",
  },
  itemDescText: {
    fontSize: 13,
    marginTop: 2,
  },
  kgsCell: {
    minWidth: 90,
  },
  kgsValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  tagCell: {
    width: 48,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
  },
});
