import { ConfirmModal } from "@/components/ConfirmModal";
import { Colors } from "@/constants/theme";
import { BarcodeScanner } from "@/features/raw-materials-dept/issuance-verification/components/BarcodeScanner";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialUtilizationService } from "../services/materialUtilizationService";
import { IssuanceNoOption, RmTotalKgs } from "../types/materialUtilization.types";

interface MaterialUtilizationDoneModalProps {
  visible: boolean;
  rmTotalKgs?: RmTotalKgs;
  issuanceNo?: string | number;
  issuanceNoOptions?: IssuanceNoOption[];
  issuanceNoLoading?: boolean;
  usageNo?: string;
  onIssuanceNoChange?: (value: string) => void;
  encodedBy?: string;
  controlRoomOperator?: string | null;
  reviewedByProductionSupervisor?: string | null;
  remarks?: string;
  allowedReviewers?: string[];
  onDone: (data: {
    issuanceNo: string;
    controlRoomOperator: string;
    reviewedByProductionSupervisor: string;
    remarks: string;
  }) => void;
  onClose?: () => void;
}

export function MaterialUtilizationDoneModal({
  visible,
  rmTotalKgs,
  issuanceNo: issuanceNoProp,
  issuanceNoOptions,
  issuanceNoLoading,
  onIssuanceNoChange,
  usageNo: usageNoProp,
  encodedBy: encodedByProp,
  controlRoomOperator: controlRoomOperatorProp,
  reviewedByProductionSupervisor: reviewedByProductionSupervisorProp,
  remarks: remarksProp,
  allowedReviewers,
  onDone,
  onClose,
}: MaterialUtilizationDoneModalProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? "light"];

  const [controlRoomOperatorValue, setControlRoomOperatorValue] = useState("");
  const [reviewedByValue, setReviewedByValue] = useState("");
  const [remarksValue, setRemarksValue] = useState(remarksProp ?? "");

  const [reviewedByError, setReviewedByError] = useState("");
  const [issuanceNoError, setIssuanceNoError] = useState("");
  const [controlRoomOperatorError, setControlRoomOperatorError] = useState("");

  useEffect(() => {
    setRemarksValue(remarksProp ?? "");
  }, [remarksProp]);

  useEffect(() => {
    setSelectedIssuanceNo(issuanceNoProp ? String(issuanceNoProp) : "");
    setIssuanceNoError("");
  }, [issuanceNoProp]);

  useEffect(() => {
    setControlRoomOperatorValue(controlRoomOperatorProp ?? "");
    setControlRoomOperatorError("");
  }, [controlRoomOperatorProp]);

  useEffect(() => {
    setReviewedByValue(reviewedByProductionSupervisorProp ?? "");
    setReviewedByError("");
  }, [reviewedByProductionSupervisorProp]);

  useEffect(() => {
    if (!visible) {
      setSelectedIssuanceNo("");
      setIssuanceSearch("");
      setIssuanceNoError("");
      setControlRoomOperatorError("");
      setReviewedByError("");
    }
  }, [visible]);

  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<
    "controlRoomOperator" | "reviewedBy"
  >("controlRoomOperator");
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [issuanceDropdownOpen, setIssuanceDropdownOpen] = useState(false);
  const [issuanceSearch, setIssuanceSearch] = useState("");
  const [selectedIssuanceNo, setSelectedIssuanceNo] = useState(
    issuanceNoProp ? String(issuanceNoProp) : "",
  );
  const issuanceTriggerRef = useRef<View>(null);

  const formatSingleKgs = (value?: string | number) => {
    if (value === undefined || value === null || value === "") {
      return "0.00000";
    }
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatRmTotalKgs = (data?: RmTotalKgs) => {
    if (!data) {
      return "—";
    }
    const nd = data.notDosing ?? 0;
    const d = data.dosing ?? 0;
    return `${formatSingleKgs(nd)} / ${formatSingleKgs(d)}`;
  };

  const openScanner = (target: "controlRoomOperator" | "reviewedBy") => {
    setScannerTarget(target);
    setBarcodeScannerVisible(true);
  };

  const handleBarcodeScanned = (data: string) => {
    setBarcodeScannerVisible(false);
    if (scannerTarget === "controlRoomOperator") {
      setControlRoomOperatorValue(data);
      setControlRoomOperatorError("");
    } else if (scannerTarget === "reviewedBy") {
      setReviewedByValue(data);
      setReviewedByError("");
    }
  };

  const validateReviewedByScan = async (value: string): Promise<boolean | string> => {
    if (allowedReviewers && allowedReviewers.length > 0) {
      return allowedReviewers.includes(value)
        ? true
        : `"${value}" is not an authorized reviewer.`;
    }
    try {
      const reviewers = await MaterialUtilizationService.getInstance().getAllowedReviewers();
      if (reviewers.length === 0) {
        return "Authorized reviewers could not be loaded. Please try again.";
      }
      return reviewers.includes(value) ? true : `"${value}" is not an authorized reviewer.`;
    } catch {
      return "Authorized reviewers could not be loaded. Please try again.";
    }
  };

  const handleDonePress = () => {
    let valid = true;
    if (!selectedIssuanceNo) {
      setIssuanceNoError("Issuance No is required.");
      valid = false;
    } else {
      setIssuanceNoError("");
    }
    if (!controlRoomOperatorValue) {
      setControlRoomOperatorError("Control Room Operator is required.");
      valid = false;
    } else {
      setControlRoomOperatorError("");
    }
    if (!reviewedByValue) {
      setReviewedByError("Reviewed By is required.");
      valid = false;
    } else {
      setReviewedByError("");
    }
    if (!valid) {
      Alert.alert(
        "Required Fields",
        "Please fill in Issuance No, Control Room Operator, and Reviewed By.",
      );
      return;
    }
    setConfirmVisible(true);
  };

  const handleConfirmDone = () => {
    if (
      allowedReviewers &&
      allowedReviewers.length > 0 &&
      reviewedByValue &&
      !allowedReviewers.includes(reviewedByValue)
    ) {
      setReviewedByError(`"${reviewedByValue}" is not an authorized reviewer.`);
      setConfirmVisible(false);
      Alert.alert(
        "Invalid Reviewer",
        `"${reviewedByValue}" is not an authorized reviewer. Please scan or enter an allowed reviewer.`,
      );
      return;
    }
    setConfirmVisible(false);
    onDone({
      issuanceNo: selectedIssuanceNo,
      controlRoomOperator: controlRoomOperatorValue,
      reviewedByProductionSupervisor: reviewedByValue,
      remarks: remarksValue,
    });
  };

  const renderStaticField = (label: string, value: string) => (
    <View style={styles.staticFieldRow}>
      <Text style={[styles.staticFieldLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.staticFieldValue, { color: colors.text }]}>
        {value}
      </Text>
    </View>
  );

  const issuanceOptions = issuanceNoOptions ?? [];
  const filteredIssuanceOptions = issuanceSearch.trim() === ""
    ? issuanceOptions
    : issuanceOptions.filter((o) =>
      o.label.toLowerCase().includes(issuanceSearch.trim().toLowerCase()),
    );
  const selectedIssuance = issuanceOptions.find(
    (o) => o.value === selectedIssuanceNo,
  );

  const handleIssuanceSelect = (value: string) => {
    setSelectedIssuanceNo(value);
    onIssuanceNoChange?.(value);
    setIssuanceDropdownOpen(false);
    setIssuanceSearch("");
    setIssuanceNoError("");
  };

  const renderEditableField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    target: "controlRoomOperator" | "reviewedBy",
    readOnly: boolean = false,
  ) => (
    <View style={styles.inputFieldBlock}>
      <Text style={[styles.inputFieldLabel, { color: colors.text }]}>
        {label}
      </Text>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.background,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="account-outline"
          size={20}
          color={colors.textTertiary}
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          value={value}
          placeholder={readOnly ? "Scan name" : "Scan or enter name"}
          placeholderTextColor={colors.textTertiary}
          onChangeText={onChangeText}
          readOnly={readOnly}
        />
        <TouchableOpacity
          style={[styles.scanButton, { backgroundColor: colors.primary }]}
          onPress={() => openScanner(target)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="barcode-scan"
            size={20}
            color="#ffffff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade">
      <SafeAreaView
        edges={["top", "bottom", "left", "right"]}
        style={[styles.safeArea, { backgroundColor: "rgba(0,0,0,0.45)" }]}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View
              style={[styles.iconWrapper, { backgroundColor: "#22C55E14" }]}
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={48}
                color="#22C55E"
              />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              Material Utilization Done
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Confirm the details below to complete the record.
            </Text>

            <View
              style={[
                styles.summarySection,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              {renderStaticField("RM TOTAL KGS", formatRmTotalKgs(rmTotalKgs))}
              {renderStaticField("Usage No", usageNoProp || "-")}
              {renderStaticField("Encoded By", encodedByProp || "—")}
            </View>

            <View style={styles.formSection}>
              <View style={styles.inputFieldBlock}>
                <Text style={[styles.inputFieldLabel, { color: colors.text }]}>
                  Issuance No
                </Text>
                <TouchableOpacity
                  ref={issuanceTriggerRef}
                  style={[
                    styles.inputRow,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                  onPress={() => setIssuanceDropdownOpen(true)}
                  activeOpacity={0.7}
                >
                  {issuanceNoLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.primary}
                      style={styles.inputIcon}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.input,
                      { color: selectedIssuance ? colors.text : colors.textTertiary },
                    ]}
                    numberOfLines={1}
                  >
                    {selectedIssuance ? selectedIssuance.label : "Select issuance no"}
                  </Text>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={22}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {issuanceNoError ? (
                <Text style={[styles.fieldErrorText, { color: colors.error }]}>
                  {issuanceNoError}
                </Text>
              ) : null}
              {renderEditableField(
                "Control Room Operator",
                controlRoomOperatorValue,
                (text) => {
                  setControlRoomOperatorValue(text);
                  setControlRoomOperatorError("");
                },
                "controlRoomOperator",
              )}
              {controlRoomOperatorError ? (
                <Text style={[styles.fieldErrorText, { color: colors.error }]}>
                  {controlRoomOperatorError}
                </Text>
              ) : null}
              {renderEditableField(
                "Reviewed By Production Supervisor",
                reviewedByValue,
                setReviewedByValue,
                "reviewedBy",
                true,
              )}
              {reviewedByError ? (
                <Text style={[styles.fieldErrorText, { color: colors.error }]}>
                  {reviewedByError}
                </Text>
              ) : null}
              <View style={styles.inputFieldBlock}>
                <Text style={[styles.inputFieldLabel, { color: colors.text }]}>
                  Remarks
                </Text>
                <View
                  style={[
                    styles.inputRow,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.cardBorder,
                      height: 100,
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "stretch",
                      paddingVertical: 8,
                    },
                  ]}
                >
                  <TextInput
                    style={{
                      flex: 1,
                      width: "100%",
                      fontSize: 16,
                      fontWeight: "500",
                      color: colors.text,
                      textAlignVertical: "top",
                      padding: 0,
                      paddingTop: 4,
                    }}
                    value={remarksValue}
                    placeholder="Enter remarks (optional)"
                    placeholderTextColor={colors.textTertiary}
                    onChangeText={setRemarksValue}
                    multiline
                  />
                </View>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.cardBorder,
                  },
                ]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.doneButton, { backgroundColor: colors.primary }]}
                onPress={handleDonePress}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="send" size={20} color="#ffffff" />
                <Text style={styles.doneButtonText}>Complete & Done</Text>
              </TouchableOpacity>
            </View>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ConfirmModal
        visible={confirmVisible}
        title="Complete Material Utilization"
        message="Are you sure you want to complete this material utilization record?"
        iconName="send-check"
        iconColor={colors.primary}
        cancelText="Cancel"
        confirmText="Complete"
        onConfirm={handleConfirmDone}
        onCancel={() => setConfirmVisible(false)}
      />

      <Modal
        visible={issuanceDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIssuanceDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setIssuanceDropdownOpen(false)}
        >
          <View
            style={[
              styles.dropdownContainer,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View
              style={[
                styles.dropdownSearchContainer,
                { borderColor: colors.cardBorder },
              ]}
            >
              <MaterialCommunityIcons
                name="magnify"
                size={18}
                color={colors.textSecondary}
              />
              <TextInput
                style={[styles.dropdownSearchInput, { color: colors.text }]}
                placeholder="Search issuance no..."
                placeholderTextColor={colors.textTertiary}
                value={issuanceSearch}
                onChangeText={setIssuanceSearch}
                autoFocus
              />
              {issuanceSearch.length > 0 && (
                <TouchableOpacity
                  onPress={() => setIssuanceSearch("")}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={18}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={filteredIssuanceOptions}
              keyExtractor={(item, index) => `${item.value}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownOption}
                  onPress={() => handleIssuanceSelect(item.value)}
                >
                  <Text
                    style={[styles.dropdownOptionText, { color: colors.text }]}
                  >
                    {item.label}
                  </Text>
                  {selectedIssuanceNo === item.value && (
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.dropdownEmpty}>
                  <Text
                    style={[styles.dropdownOptionText, { color: colors.textSecondary }]}
                  >
                    No results found
                  </Text>
                </View>
              }
              style={styles.dropdownScrollView}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <BarcodeScanner
        visible={barcodeScannerVisible}
        onClose={() => setBarcodeScannerVisible(false)}
        onScan={handleBarcodeScanned}
        title="Scan Operator Barcode"
        validateScannedValue={
          scannerTarget === "reviewedBy" ? validateReviewedByScan : undefined
        }
      />
    </Modal>
  );
}

export default MaterialUtilizationDoneModal;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
  },
  card: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  iconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 26,
    textAlign: "center",
    lineHeight: 20,
  },
  summarySection: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    gap: 14,
  },
  staticFieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  staticFieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  staticFieldValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  formSection: {
    width: "100%",
    gap: 18,
    marginBottom: 28,
  },
  inputFieldBlock: {
    gap: 8,
  },
  inputFieldLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1.5,
    height: 60,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    paddingVertical: 3,
  },
  scanButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: "700",
  },
  doneButton: {
    flex: 1.3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 16,
    gap: 8,
    elevation: 3,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  doneButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  fieldErrorText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "500",
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  dropdownContainer: {
    width: "100%",
    maxHeight: "70%",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  dropdownSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    paddingVertical: 0,
  },
  dropdownScrollView: {
    maxHeight: "100%",
  },
  dropdownOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  dropdownOptionText: {
    fontSize: 20,
    fontWeight: "500",
  },
  dropdownEmpty: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
});
