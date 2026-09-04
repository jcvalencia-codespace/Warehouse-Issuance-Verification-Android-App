import { Colors } from "@/constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RmTotalKgs } from "../types/materialUtilization.types";
import { MaterialUtilizationDonePivotRow } from "../types/materialUtilization.types";

interface MaterialUtilizationDoneDetailsProps {
  loading: boolean;
  header: any | null;
  rows: MaterialUtilizationDonePivotRow[];
  rmTotalKgs?: RmTotalKgs | null;
  onBack: () => void;
}

export const MaterialUtilizationDoneDetails: React.FC<
  MaterialUtilizationDoneDetailsProps
> = ({ loading, header, rows, rmTotalKgs, onBack }) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? "light"];

  const {
    nonDosingRows,
    dosingRows,
    batchColumns,
    batchMeta,
    nonDosingBatchMeta,
    dosingBatchMeta,
    totals,
  } = useMemo(() => {
      const itemMap = new Map<
        string,
        {
          itemNo: string;
          itemDescription: string;
          isDosingMachine: number;
          batches: Map<number, number>;
        }
      >();
      const batchSet = new Set<number>();
      const batchMeta = new Map<
        number,
        { weighedBy: string; validatedBy: string }
      >();
      const nonDosingBatchMeta = new Map<
        number,
        { weighedBy: string; validatedBy: string }
      >();
      const dosingBatchMeta = new Map<
        number,
        { weighedBy: string; validatedBy: string }
      >();
      let grandTotal = 0;

      for (const r of rows) {
        const key = r.ITEMNMBR;
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            itemNo: r.ITEMNMBR,
            itemDescription: (r.ITEMDESC || r.ITEMNMBR || "").trim(),
            isDosingMachine: Number(r.IS_DOSING_MACHINE) || 0,
            batches: new Map<number, number>(),
          });
        }
        const item = itemMap.get(key)!;
        const kgs = Number(r.KGSUSED) || 0;
        const existing = item.batches.get(r.BATCHNO) || 0;
        item.batches.set(r.BATCHNO, existing + kgs);
        batchSet.add(r.BATCHNO);
        grandTotal += kgs;

        const weighedBy = (r.WEIGHEDBY || "").toString().trim();
        const validatedBy = (r.VALIDATEDBY || "").toString().trim();

        if (!batchMeta.has(r.BATCHNO)) {
          batchMeta.set(r.BATCHNO, { weighedBy, validatedBy });
        }
        const isDosing = Number(r.IS_DOSING_MACHINE) === 1;
        const sectionMap = isDosing ? dosingBatchMeta : nonDosingBatchMeta;
        if (!sectionMap.has(r.BATCHNO)) {
          sectionMap.set(r.BATCHNO, { weighedBy, validatedBy });
        }
      }

      const allItems = Array.from(itemMap.values()).sort((a, b) =>
        a.itemNo.localeCompare(b.itemNo),
      );

      const nonDosingRows = allItems.filter((i) => i.isDosingMachine !== 1);
      const dosingRows = allItems.filter((i) => i.isDosingMachine === 1);

      return {
        nonDosingRows,
        dosingRows,
        batchColumns: Array.from(batchSet).sort((a, b) => a - b),
        batchMeta,
        nonDosingBatchMeta,
        dosingBatchMeta,
        totals: { grandTotal },
      };
    }, [rows]);

  const computeRowTotal = (item: { batches: Map<number, number> }) => {
    let total = 0;
    for (const kgs of item.batches.values()) total += kgs;
    return total;
  };

  const renderMetaRowCells = (
    metaMap: Map<number, { weighedBy: string; validatedBy: string }>,
    field: "validatedBy" | "weighedBy",
    rowKeyPrefix: string,
  ) => (
    <>
      {batchColumns.map((batch) => {
        const meta = metaMap.get(batch);
        const value =
          field === "validatedBy"
            ? meta?.validatedBy || "—"
            : meta?.weighedBy || "—";
        return (
          <View
            key={`${rowKeyPrefix}-${batch}`}
            style={[
              styles.metaCell,
              {
                width: dynamicBatchWidth,
                height: metaRowHeight,
                backgroundColor: colors.primary + "10",
                borderBottomColor: colors.cardBorder,
                borderBottomWidth: 1,
              },
            ]}
          >
            <Text
              style={[styles.metaLineText, { color: colors.primary }]}
              numberOfLines={1}
            >
              {value}
            </Text>
          </View>
        );
      })}
      <View
        style={[
          styles.metaCell,
          styles.lastCol,
          {
            width: dynamicTotalWidth,
            height: metaRowHeight,
            backgroundColor: colors.primary + "10",
            borderBottomColor: colors.cardBorder,
            borderBottomWidth: 1,
            justifyContent: "center",
          },
        ]}
      >
        <Text
          style={[
            styles.metaLineText,
            { color: colors.primary, fontWeight: "700" },
          ]}
          numberOfLines={1}
        >
          {field === "validatedBy" ? "Reviewed by" : "Encoded by"}
        </Text>
        <Text
          style={[styles.metaLineText, { color: colors.primary }]}
          numberOfLines={1}
        >
          {field === "validatedBy"
            ? header?.REVIEWEDBY || "—"
            : header?.ENCODEDBY || "—"}
        </Text>
      </View>
    </>
  );

  const nonDosingTotal = useMemo(
    () =>
      nonDosingRows.reduce(
        (sum, item) =>
          sum +
          Array.from(item.batches.values()).reduce((s, v) => s + v, 0),
        0,
      ),
    [nonDosingRows],
  );

  const dosingTotal = useMemo(
    () =>
      dosingRows.reduce(
        (sum, item) =>
          sum +
          Array.from(item.batches.values()).reduce((s, v) => s + v, 0),
        0,
      ),
    [dosingRows],
  );

  const hasAnyItems = nonDosingRows.length > 0 || dosingRows.length > 0;

  const headerScrollRef = useRef<ScrollView>(null);
  const validatedScrollRef = useRef<ScrollView>(null);
  const weighedScrollRef = useRef<ScrollView>(null);
  const bodyScrollRef = useRef<ScrollView>(null);
  const isSyncing = useRef(false);

  const syncTo = (
    target: React.RefObject<ScrollView | null>,
    x: number,
  ) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    target.current?.scrollTo({ x, animated: false });
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  const syncAllFromX = (x: number) => {
    syncTo(headerScrollRef, x);
    syncTo(validatedScrollRef, x);
    syncTo(weighedScrollRef, x);
    syncTo(bodyScrollRef, x);
  };

  const handleHeaderScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    const x = e.nativeEvent.contentOffset.x;
    validatedScrollRef.current?.scrollTo({ x, animated: false });
    weighedScrollRef.current?.scrollTo({ x, animated: false });
    bodyScrollRef.current?.scrollTo({ x, animated: false });
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  const handleValidatedScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    const x = e.nativeEvent.contentOffset.x;
    headerScrollRef.current?.scrollTo({ x, animated: false });
    weighedScrollRef.current?.scrollTo({ x, animated: false });
    bodyScrollRef.current?.scrollTo({ x, animated: false });
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  const handleWeighedScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    const x = e.nativeEvent.contentOffset.x;
    headerScrollRef.current?.scrollTo({ x, animated: false });
    validatedScrollRef.current?.scrollTo({ x, animated: false });
    bodyScrollRef.current?.scrollTo({ x, animated: false });
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  const handleBodyScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    const x = e.nativeEvent.contentOffset.x;
    headerScrollRef.current?.scrollTo({ x, animated: false });
    validatedScrollRef.current?.scrollTo({ x, animated: false });
    weighedScrollRef.current?.scrollTo({ x, animated: false });
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

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

  const minColWidth = 160;
  const firstColWidth = 200;
  const totalColWidth = 140;
  const headerRowHeight = 40;
  const metaRowHeight = 40;
  const dividerRowHeight = 38;
  const dataRowHeight = 64;
  const totalRowHeight = 44;

  const [availableWidth, setAvailableWidth] = useState(0);
  const numCols = Math.max(batchColumns.length, 1) + 1;
  const availableScrollWidth = Math.max(
    availableWidth - firstColWidth,
    0,
  );
  const dynamicBatchWidth = Math.max(
    minColWidth,
    Math.floor(availableScrollWidth / numCols),
  );
  const dynamicTotalWidth = Math.max(
    totalColWidth,
    availableScrollWidth - dynamicBatchWidth * batchColumns.length,
  );
  const scrollableWidth =
    batchColumns.length * dynamicBatchWidth + dynamicTotalWidth;

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerBarTitle, { color: colors.text }]}>
          Done Utilization Details
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading details
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {header && (
            <>
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
                    <Text
                      style={[styles.headerValue, { color: colors.text }]}
                    >
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
                  <View style={styles.headerRowItem}>
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
                  </View>
                  <View style={styles.headerRowItem}>
                    <MaterialCommunityIcons
                      name="monitor-dashboard"
                      size={20}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.headerLabel, { color: colors.textSecondary }]}
                    >
                      Control Room Operator:
                    </Text>
                    <Text style={[styles.headerValue, { color: colors.text }]}>
                      {header.CONTROLROOMOPERATOR || "-"}
                    </Text>
                  </View>
                  <View style={styles.headerRowItem}>
                    <MaterialCommunityIcons
                      name="scale-balance"
                      size={20}
                      color={colors.primary}
                    />
                    <Text
                      style={[styles.headerLabel, { color: colors.textSecondary }]}
                    >
                      RM Total KGS:
                    </Text>
                    <Text style={[styles.headerValue, { color: colors.text }]}>
                      {rmTotalKgs?.notDosing ?? "-"}
                      {" / "}
                      {rmTotalKgs?.dosing ?? "-"}
                    </Text>
                  </View>
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
                      {header.ISSUANCENO || "-"}
                    </Text>
                  </View>
                </View>
              </View>

              <View
                style={[
                  styles.remarksCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
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
                <Text
                  style={[
                    styles.remarksText,
                    { color: colors.text },
                  ]}
                >
                  {header.REMARKS || "-"}
                </Text>
              </View>
            </>
          )}

          <Text style={[styles.tableTitle, { color: colors.text }]}>
            Items and Batches (KGS Used)
          </Text>

          {!hasAnyItems ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="table-off"
                size={48}
                color={colors.textTertiary}
              />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No batch details available
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.tableWrapper,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <View style={styles.tableHeaderRow}>
                <View
                  style={[
                    styles.headerCell,
                    styles.firstColSticky,
                    {
                      width: firstColWidth,
                      height: headerRowHeight,
                      backgroundColor: colors.primary + "14",
                      borderBottomColor: colors.cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={[styles.headerCellText, { color: colors.primary }]}
                  >
                    Item
                  </Text>
                </View>
                <ScrollView
                  ref={headerScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.headerScroll}
                  scrollEventThrottle={16}
                  onScroll={handleHeaderScroll}
                  contentContainerStyle={[
                    styles.headerScrollContent,
                    { width: scrollableWidth },
                  ]}
                >
                  {batchColumns.map((batch) => (
                    <View
                      key={`hdr-${batch}`}
                      style={[
                        styles.headerCell,
                        {
                          width: dynamicBatchWidth,
                          height: headerRowHeight,
                          backgroundColor: colors.primary + "14",
                          borderBottomColor: colors.cardBorder,
                          borderBottomWidth: 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.headerCellText,
                          { color: colors.primary },
                        ]}
                      >
                        Batch {batch}
                      </Text>
                    </View>
                  ))}
                  <View
                    style={[
                      styles.headerCell,
                      styles.lastCol,
                      {
                        width: dynamicTotalWidth,
                        height: headerRowHeight,
                        backgroundColor: colors.primary + "14",
                        borderBottomColor: colors.cardBorder,
                        borderBottomWidth: 1,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.headerCellText, { color: colors.primary }]}
                    >
                      Total
                    </Text>
                  </View>
                </ScrollView>
              </View>

              <View
                style={styles.bodyContainer}
                onLayout={(e) =>
                  setAvailableWidth(e.nativeEvent.layout.width)
                }
              >
                <View
                  style={[
                    styles.stickyColumn,
                    {
                      zIndex: 10,
                      backgroundColor: colors.cardBackground,
                      width: firstColWidth,
                    },
                  ]}
                >
                  {nonDosingRows.length > 0 && (
                    <>
                      <View
                        style={[
                          styles.sectionDividerRow,
                          styles.dividerRow,
                          {
                            height: dividerRowHeight,
                            backgroundColor: colors.primary + "10",
                            borderBottomColor: colors.primary + "30",
                          },
                        ]}
                      >
                        <View style={styles.sectionDividerContent}>
                          <MaterialCommunityIcons
                            name="cog-outline"
                            size={16}
                            color={colors.primary}
                          />
                          <Text
                            style={[
                              styles.sectionDividerText,
                              { color: colors.primary },
                            ]}
                          >
                            Non-Dosing
                          </Text>
                        </View>
                      </View>
                      {nonDosingRows.map((item, idx) => (
                        <View
                          key={`sticky-nd-${item.itemNo}-${idx}`}
                          style={[
                            styles.cell,
                            styles.firstColSticky,
                            styles.dataRow,
                            {
                              height: dataRowHeight,
                              borderBottomColor: colors.cardBorder,
                              borderBottomWidth:
                                idx === nonDosingRows.length - 1 ? 0 : 1,
                              backgroundColor:
                                idx % 2 === 0
                                  ? colors.cardBackground
                                  : colors.cardBorder + "40",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.itemNoText,
                              { color: colors.text },
                            ]}
                            numberOfLines={1}
                          >
                            {item.itemNo}
                          </Text>
                          {/* <Text
                            style={[
                              styles.itemDescText,
                              { color: colors.textSecondary },
                            ]}
                            numberOfLines={2}
                          >
                            {item.itemDescription}
                          </Text> */}
                        </View>
                      ))}
                      <View
                        style={[
                          styles.cell,
                          styles.firstColSticky,
                          {
                            height: metaRowHeight,
                            backgroundColor: colors.primary + "10",
                            borderBottomColor: colors.cardBorder,
                            borderBottomWidth: 1,
                            justifyContent: "center",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.metaLineText,
                            { color: colors.primary, fontWeight: "700" },
                          ]}
                        >
                          Validated by
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.cell,
                          styles.firstColSticky,
                          {
                            height: metaRowHeight,
                            backgroundColor: colors.primary + "10",
                            borderBottomColor: colors.cardBorder,
                            borderBottomWidth: 1,
                            justifyContent: "center",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.metaLineText,
                            { color: colors.primary, fontWeight: "700" },
                          ]}
                        >
                          Weighed by
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.cell,
                          styles.firstColSticky,
                          styles.totalRow,
                          {
                            height: totalRowHeight,
                            backgroundColor: colors.primary + "10",
                            borderTopColor: colors.cardBorder,
                            borderTopWidth: 2,
                            justifyContent: "center",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.itemNoText,
                            { color: colors.primary, fontWeight: "700" },
                          ]}
                        >
                          Non-Dosing Subtotal
                        </Text>
                      </View>
                    </>
                  )}

                  {dosingRows.length > 0 && (
                    <>
                      <View
                        style={[
                          styles.sectionDividerRow,
                          styles.dividerRow,
                          {
                            height: dividerRowHeight,
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
                            Dosing
                          </Text>
                        </View>
                      </View>
                      {dosingRows.map((item, idx) => (
                        <View
                          key={`sticky-d-${item.itemNo}-${idx}`}
                          style={[
                            styles.cell,
                            styles.firstColSticky,
                            styles.dataRow,
                            {
                              height: dataRowHeight,
                              borderBottomColor: colors.cardBorder,
                              borderBottomWidth:
                                idx === dosingRows.length - 1 ? 0 : 1,
                              backgroundColor:
                                idx % 2 === 0
                                  ? colors.cardBackground
                                  : colors.cardBorder + "40",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.itemNoText,
                              { color: colors.text },
                            ]}
                            numberOfLines={1}
                          >
                            {item.itemNo}
                          </Text>
                          {/* <Text
                            style={[
                              styles.itemDescText,
                              { color: colors.textSecondary },
                            ]}
                            numberOfLines={2}
                          >
                            {item.itemDescription}
                          </Text> */}
                        </View>
                      ))}
                      <View
                        style={[
                          styles.cell,
                          styles.firstColSticky,
                          {
                            height: metaRowHeight,
                            backgroundColor: colors.primary + "10",
                            borderBottomColor: colors.cardBorder,
                            borderBottomWidth: 1,
                            justifyContent: "center",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.metaLineText,
                            { color: colors.primary, fontWeight: "700" },
                          ]}
                        >
                          Validated by
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.cell,
                          styles.firstColSticky,
                          {
                            height: metaRowHeight,
                            backgroundColor: colors.primary + "10",
                            borderBottomColor: colors.cardBorder,
                            borderBottomWidth: 1,
                            justifyContent: "center",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.metaLineText,
                            { color: colors.primary, fontWeight: "700" },
                          ]}
                        >
                          Weighed by
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.cell,
                          styles.firstColSticky,
                          styles.totalRow,
                          {
                            height: totalRowHeight,
                            backgroundColor: colors.primary + "10",
                            borderTopColor: colors.cardBorder,
                            borderTopWidth: 2,
                            justifyContent: "center",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.itemNoText,
                            { color: colors.primary, fontWeight: "700" },
                          ]}
                        >
                          Dosing Subtotal
                        </Text>
                      </View>
                    </>
                  )}

                  <View
                    style={[
                      styles.cell,
                      styles.firstColSticky,
                      styles.totalRow,
                      {
                        height: totalRowHeight,
                        marginTop: 8,
                        backgroundColor: colors.primary + "20",
                        borderTopColor: colors.cardBorder,
                        borderTopWidth: 2,
                        justifyContent: "center",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.itemNoText,
                        { color: colors.primary, fontWeight: "700" },
                      ]}
                    >
                      Grand Total
                    </Text>
                  </View>
                </View>

                <ScrollView
                  ref={bodyScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.scrollableBody}
                  scrollEventThrottle={16}
                  onScroll={handleBodyScroll}
                >
                  <View style={{ width: scrollableWidth }}>
                    {nonDosingRows.length > 0 && (
                      <>
                        <View
                          style={[
                             styles.sectionDividerRow,
                            styles.dividerRow,
                            {
                              height: dividerRowHeight,
                              backgroundColor: colors.primary + "10",
                              borderBottomColor: colors.primary + "30",
                            },
                          ]}
                        />
                        {nonDosingRows.map((item, idx) => {
                          const rowTotal = computeRowTotal(item);
                          const rowBg =
                            idx % 2 === 0
                              ? colors.cardBackground
                              : colors.cardBorder + "40";
                          return (
                            <View
                              key={`row-nd-${item.itemNo}-${idx}`}
                              style={[
                                styles.tableRow,
                                styles.dataRow,
                                {
                                  height: dataRowHeight,
                                  borderBottomColor: colors.cardBorder,
                                  borderBottomWidth:
                                    idx === nonDosingRows.length - 1 ? 0 : 1,
                                },
                              ]}
                            >
                              {batchColumns.map((batch) => {
                                const kgs = item.batches.get(batch) || 0;
                                return (
                                  <View
                                    key={`cell-nd-${item.itemNo}-${batch}`}
                                    style={[
                                      styles.cell,
                                      {
                                        width: dynamicBatchWidth,
                                        height: dataRowHeight,
                                        backgroundColor: rowBg,
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.cellText,
                                        {
                                          color:
                                            kgs > 0
                                              ? colors.text
                                              : colors.textTertiary,
                                          fontWeight: kgs > 0 ? "600" : "400",
                                        },
                                      ]}
                                    >
                                      {kgs > 0 ? kgs.toLocaleString() : "-"}
                                    </Text>
                                  </View>
                                );
                              })}
                              <View
                                style={[
                                  styles.cell,
                                  styles.lastCol,
                                  {
                                    width: dynamicTotalWidth,
                                    height: dataRowHeight,
                                    backgroundColor: colors.primary + "10",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.cellText,
                                    {
                                      color: colors.primary,
                                      fontWeight: "700",
                                    },
                                  ]}
                                >
                                  {rowTotal > 0
                                    ? rowTotal.toLocaleString()
                                    : "-"}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                        <View
                          style={[
                            styles.tableRow,
                            {
                              height: metaRowHeight,
                              backgroundColor: colors.primary + "10",
                              borderBottomColor: colors.cardBorder,
                              borderBottomWidth: 1,
                            },
                          ]}
                        >
                          {renderMetaRowCells(
                            nonDosingBatchMeta,
                            "validatedBy",
                            "nd-validated",
                          )}
                        </View>
                        <View
                          style={[
                            styles.tableRow,
                            {
                              height: metaRowHeight,
                              backgroundColor: colors.primary + "10",
                              borderBottomColor: colors.cardBorder,
                              borderBottomWidth: 1,
                            },
                          ]}
                        >
                          {renderMetaRowCells(
                            nonDosingBatchMeta,
                            "weighedBy",
                            "nd-weighed",
                          )}
                        </View>
                        <View
                          style={[
                            styles.tableRow,
                            styles.totalRow,
                            {
                              height: totalRowHeight,
                              backgroundColor: colors.primary + "10",
                              borderTopColor: colors.cardBorder,
                              borderTopWidth: 2,
                            },
                          ]}
                        >
                          {batchColumns.map((batch) => {
                            let batchTotal = 0;
                            for (const it of nonDosingRows) {
                              batchTotal += it.batches.get(batch) || 0;
                            }
                            return (
                              <View
                                key={`subtotal-nd-${batch}`}
                                style={[
                                  styles.cell,
                                  {
                                    width: dynamicBatchWidth,
                                    height: totalRowHeight,
                                    backgroundColor: colors.primary + "10",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.cellText,
                                    {
                                      color: colors.primary,
                                      fontWeight: "700",
                                    },
                                  ]}
                                >
                                  {batchTotal > 0
                                    ? batchTotal.toLocaleString()
                                    : "-"}
                                </Text>
                              </View>
                            );
                          })}
                          <View
                            style={[
                              styles.cell,
                              styles.lastCol,
                              {
                                width: dynamicTotalWidth,
                                height: totalRowHeight,
                                backgroundColor: colors.primary + "20",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.cellText,
                                {
                                  color: colors.primary,
                                  fontWeight: "700",
                                },
                              ]}
                            >
                              {nonDosingTotal > 0
                                ? nonDosingTotal.toLocaleString()
                                : "-"}
                            </Text>
                          </View>
                        </View>
                      </>
                    )}

                    {dosingRows.length > 0 && (
                      <>
                        <View
                          style={[
                            styles.sectionDividerRow,
                            styles.dividerRow,
                            {
                              height: dividerRowHeight,
                              backgroundColor: colors.primary + "10",
                              borderBottomColor: colors.primary + "30",
                            },
                          ]}
                        />
                        {dosingRows.map((item, idx) => {
                          const rowTotal = computeRowTotal(item);
                          const rowBg =
                            idx % 2 === 0
                              ? colors.cardBackground
                              : colors.cardBorder + "40";
                          return (
                            <View
                              key={`row-d-${item.itemNo}-${idx}`}
                              style={[
                                styles.tableRow,
                                styles.dataRow,
                                {
                                  height: dataRowHeight,
                                  borderBottomColor: colors.cardBorder,
                                  borderBottomWidth:
                                    idx === dosingRows.length - 1 ? 0 : 1,
                                },
                              ]}
                            >
                              {batchColumns.map((batch) => {
                                const kgs = item.batches.get(batch) || 0;
                                return (
                                  <View
                                    key={`cell-d-${item.itemNo}-${batch}`}
                                    style={[
                                      styles.cell,
                                      {
                                        width: dynamicBatchWidth,
                                        height: dataRowHeight,
                                        backgroundColor: rowBg,
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        styles.cellText,
                                        {
                                          color:
                                            kgs > 0
                                              ? colors.text
                                              : colors.textTertiary,
                                          fontWeight: kgs > 0 ? "600" : "400",
                                        },
                                      ]}
                                    >
                                      {kgs > 0 ? kgs.toLocaleString() : "-"}
                                    </Text>
                                  </View>
                                );
                              })}
                              <View
                                style={[
                                  styles.cell,
                                  styles.lastCol,
                                  {
                                    width: dynamicTotalWidth,
                                    height: dataRowHeight,
                                    backgroundColor: colors.primary + "10",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.cellText,
                                    {
                                      color: colors.primary,
                                      fontWeight: "700",
                                    },
                                  ]}
                                >
                                  {rowTotal > 0
                                    ? rowTotal.toLocaleString()
                                    : "-"}
                                </Text>
                              </View>
                            </View>
                          );
                        })}
                        <View
                          style={[
                            styles.tableRow,
                            {
                              height: metaRowHeight,
                              backgroundColor: colors.primary + "10",
                              borderBottomColor: colors.cardBorder,
                              borderBottomWidth: 1,
                            },
                          ]}
                        >
                          {renderMetaRowCells(
                            dosingBatchMeta,
                            "validatedBy",
                            "d-validated",
                          )}
                        </View>
                        <View
                          style={[
                            styles.tableRow,
                            {
                              height: metaRowHeight,
                              backgroundColor: colors.primary + "10",
                              borderBottomColor: colors.cardBorder,
                              borderBottomWidth: 1,
                            },
                          ]}
                        >
                          {renderMetaRowCells(
                            dosingBatchMeta,
                            "weighedBy",
                            "d-weighed",
                          )}
                        </View>
                        <View
                          style={[
                            styles.tableRow,
                            styles.totalRow,
                            {
                              height: totalRowHeight,
                              backgroundColor: colors.primary + "10",
                              borderTopColor: colors.cardBorder,
                              borderTopWidth: 2,
                            },
                          ]}
                        >
                          {batchColumns.map((batch) => {
                            let batchTotal = 0;
                            for (const it of dosingRows) {
                              batchTotal += it.batches.get(batch) || 0;
                            }
                            return (
                              <View
                                key={`subtotal-d-${batch}`}
                                style={[
                                  styles.cell,
                                  {
                                    width: dynamicBatchWidth,
                                    height: totalRowHeight,
                                    backgroundColor: colors.primary + "10",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.cellText,
                                    {
                                      color: colors.primary,
                                      fontWeight: "700",
                                    },
                                  ]}
                                >
                                  {batchTotal > 0
                                    ? batchTotal.toLocaleString()
                                    : "-"}
                                </Text>
                              </View>
                            );
                          })}
                          <View
                            style={[
                              styles.cell,
                              styles.lastCol,
                              {
                                width: dynamicTotalWidth,
                                height: totalRowHeight,
                                backgroundColor: colors.primary + "20",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.cellText,
                                {
                                  color: colors.primary,
                                  fontWeight: "700",
                                },
                              ]}
                            >
                              {dosingTotal > 0
                                ? dosingTotal.toLocaleString()
                                : "-"}
                            </Text>
                          </View>
                        </View>
                      </>
                    )}

                    <View
                      style={[
                        styles.tableRow,
                        styles.totalRow,
                        {
                          height: totalRowHeight,
                          marginTop: 8,
                          backgroundColor: colors.primary + "20",
                          borderTopColor: colors.cardBorder,
                          borderTopWidth: 2,
                        },
                      ]}
                    >
                      {batchColumns.map((batch) => {
                        let batchTotal = 0;
                        for (const it of [...nonDosingRows, ...dosingRows]) {
                          batchTotal += it.batches.get(batch) || 0;
                        }
                        return (
                          <View
                            key={`grandtotal-${batch}`}
                            style={[
                              styles.cell,
                              {
                                width: dynamicBatchWidth,
                                height: totalRowHeight,
                                backgroundColor: colors.primary + "20",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.cellText,
                                {
                                  color: colors.primary,
                                  fontWeight: "700",
                                },
                              ]}
                            >
                              {batchTotal > 0
                                ? batchTotal.toLocaleString()
                                : "-"}
                            </Text>
                          </View>
                        );
                      })}
                      <View
                        style={[
                          styles.cell,
                          styles.lastCol,
                          {
                            width: dynamicTotalWidth,
                            height: totalRowHeight,
                            backgroundColor: colors.primary + "30",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.cellText,
                            { color: colors.primary, fontWeight: "700" },
                          ]}
                        >
                          {totals.grandTotal > 0
                            ? totals.grandTotal.toLocaleString()
                            : "-"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>
              </View>
            </View>
          )}

          <View style={{ height: 24 }} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerBarTitle: {
    fontSize: 20,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  headerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 16,
  },
  headerRowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "48%",
    minWidth: 220,
    flexShrink: 1,
  },
  remarksCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  remarksHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  remarksText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  headerLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  headerValue: {
    fontSize: 18,
    fontWeight: "700",
    flexShrink: 1,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  tableWrapper: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
  },
  headerScroll: {
    flex: 1,
  },
  headerScrollContent: {
    flexDirection: "row",
  },
  bodyContainer: {
    position: "relative",
  },
  stickyColumn: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
  },
  scrollableBody: {
    flex: 1,
    marginLeft: 200,
  },
  tableRow: {
    flexDirection: "row",
  },
  dataRow: {},
  totalRow: {},
  dividerRow: {
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  firstColSticky: {
    width: 200,
  },
  sectionDividerRow: {
    flexDirection: "row",
    borderBottomWidth: 2,
  },
  sectionDividerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionDividerText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  headerCell: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCellText: {
    fontSize: 13,
    fontWeight: "700",
  },
  metaCell: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  metaLineText: {
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 13,
  },
  cell: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  cellText: {
    fontSize: 13,
    textAlign: "center",
  },
  lastCol: {},
  itemNoText: {
    fontSize: 13,
    fontWeight: "600",
  },
  itemDescText: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
});
