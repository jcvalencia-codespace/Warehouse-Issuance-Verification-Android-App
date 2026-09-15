import { ConfirmModal } from "@/components/ConfirmModal";
import { SuccessModal } from "@/components/SuccessModal";
import { Colors } from "@/constants/theme";
import { BarcodeScanner } from "@/features/raw-materials-dept/issuance-verification/components/BarcodeScanner";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

interface MaterialUtilizationQaReviewModalProps {
  visible: boolean;
  usageNo: number;
  company?: string;
  userName?: string;
  action: "approve" | "reject";
  onClose: () => void;
  onSuccess: () => void;
}

export const MaterialUtilizationQaReviewModal: React.FC<
  MaterialUtilizationQaReviewModalProps
> = ({
  visible,
  usageNo,
  company,
  userName,
  action,
  onClose,
  onSuccess,
}) => {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? "light"];

  const [qaName, setQaName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [qaNameError, setQaNameError] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [barcodeScannerVisible, setBarcodeScannerVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  useEffect(() => {
    if (!visible) {
      setQaName("");
      setRemarks("");
      setQaNameError("");
      setRemarksError("");
      setConfirmVisible(false);
    }
  }, [visible]);

  const handleBarcodeScanned = (data: string) => {
    setBarcodeScannerVisible(false);
    setQaName(data);
    setQaNameError("");
  };

  const validateQaName = async (value: string): Promise<boolean | string> => {
    try {
      const approvers = await MaterialUtilizationService.getInstance().getQaApprovers();
      if (approvers.length === 0) {
        return "QA approvers could not be loaded. Please try again.";
      }
      return approvers.includes(value)
        ? true
        : `"${value}" is not an authorized QA approver.`;
    } catch {
      return "QA approvers could not be loaded. Please try again.";
    }
  };

  const handleConfirmAction = async () => {
    let valid = true;

    if (!qaName.trim()) {
      setQaNameError("QA Name is required.");
      valid = false;
    } else {
      const validationResult = await validateQaName(qaName.trim());
      if (validationResult !== true) {
        setQaNameError(validationResult as string);
        valid = false;
      } else {
        setQaNameError("");
      }
    }

    if (action === "reject" && !remarks.trim()) {
      setRemarksError("Remarks are required for rejection.");
      valid = false;
    } else {
      setRemarksError("");
    }

    if (!valid) {
      return;
    }

    setConfirmVisible(true);
  };

  const handleConfirmSubmit = async () => {
    setConfirmVisible(false);
    setSubmitting(true);

    try {
      const payload = {
        usageNo,
        qaName: qaName.trim(),
        remarks: remarks.trim() || undefined,
        user: userName || "",
      };

      const result =
        action === "approve"
          ? await MaterialUtilizationService.getInstance().approveQaReview(
              payload,
              company,
            )
          : await MaterialUtilizationService.getInstance().rejectQaReview(
              payload,
              company,
            );

      if (result.success) {
        setSuccessVisible(true);
      } else {
        Alert.alert(
          "Error",
          result.message ||
            `Failed to ${action === "approve" ? "approve" : "reject"} record.`,
        );
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          error?.message ||
          `Failed to ${action === "approve" ? "approve" : "reject"} record.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessDone = () => {
    setSuccessVisible(false);
    onSuccess();
    onClose();
  };

  const title = action === "approve" ? "Approve QA Review" : "Reject QA Review";
  const iconName = action === "approve" ? "check-circle" : "close-circle";
  const iconColor =
    action === "approve" ? "#22C55E" : "#ef4444";

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
                style={[styles.iconWrapper, { backgroundColor: `${iconColor}14` }]}
              >
                <MaterialCommunityIcons
                  name={iconName}
                  size={48}
                  color={iconColor}
                />
              </View>

              <Text style={[styles.title, { color: colors.text }]}>
                {title}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Usage No: {usageNo}
              </Text>

              <View style={styles.formSection}>
                <View style={styles.inputFieldBlock}>
                  <Text style={[styles.inputFieldLabel, { color: colors.text }]}>
                    QA Name
                  </Text>
                  <View
                    style={[
                      styles.inputRow,
                      {
                        backgroundColor: colors.background,
                        borderColor: qaNameError ? colors.error : colors.cardBorder,
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
                      value={qaName}
                      placeholder="Scan or enter QA name"
                      placeholderTextColor={colors.textTertiary}
                      onChangeText={(text) => {
                        setQaName(text);
                        setQaNameError("");
                      }}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={[styles.scanButton, { backgroundColor: colors.primary }]}
                      onPress={() => setBarcodeScannerVisible(true)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name="barcode-scan"
                        size={20}
                        color="#ffffff"
                      />
                    </TouchableOpacity>
                  </View>
                  {qaNameError ? (
                    <Text style={[styles.fieldErrorText, { color: colors.error }]}>
                      {qaNameError}
                    </Text>
                  ) : null}
                </View>

                {action === "reject" ? (
                  <View style={styles.inputFieldBlock}>
                    <Text style={[styles.inputFieldLabel, { color: colors.text }]}>
                      Remarks
                    </Text>
                    <View
                      style={[
                        styles.inputRow,
                        {
                          backgroundColor: colors.background,
                          borderColor: remarksError ? colors.error : colors.cardBorder,
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
                        value={remarks}
                        placeholder="Enter remarks (required)"
                        placeholderTextColor={colors.textTertiary}
                        onChangeText={(text) => {
                          setRemarks(text);
                          setRemarksError("");
                        }}
                        multiline
                      />
                    </View>
                    {remarksError ? (
                      <Text style={[styles.fieldErrorText, { color: colors.error }]}>
                        {remarksError}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
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
                  disabled={submitting}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    {
                      backgroundColor:
                        action === "approve" ? colors.success : colors.error,
                    },
                  ]}
                  onPress={handleConfirmAction}
                  activeOpacity={0.85}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <MaterialCommunityIcons
                      name={action === "approve" ? "send" : "close-circle"}
                      size={20}
                      color="#ffffff"
                    />
                  )}
                  <Text style={[styles.actionButtonText, { textAlign: "center" }]}>
                    {submitting
                      ? "Processing…"
                      : action === "approve"
                        ? "Approve"
                        : "Reject"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <ConfirmModal
          visible={confirmVisible}
          title={title}
          message={
            action === "approve"
              ? `Are you sure you want to approve this record?\nQA Name: ${qaName || "-"}`
              : `Are you sure you want to reject this record?\nQA Name: ${qaName || "-"}\nRemarks: ${remarks.trim() || "(none)"}`
          }
          iconName={action === "approve" ? "send-check" : "close-circle"}
          iconColor={action === "approve" ? colors.success : colors.error}
          cancelText="Cancel"
          confirmText={action === "approve" ? "Approve" : "Reject"}
          onConfirm={handleConfirmSubmit}
          onCancel={() => setConfirmVisible(false)}
        />

        <SuccessModal
          visible={successVisible}
          title="Success"
          message={
            action === "approve"
              ? "QA review approved successfully."
              : "QA review rejected successfully."
          }
          buttonText="Done"
          onDone={handleSuccessDone}
        />

        <BarcodeScanner
          visible={barcodeScannerVisible}
          onClose={() => setBarcodeScannerVisible(false)}
          onScan={handleBarcodeScanned}
          title="Scan QA Name Barcode"
          validateScannedValue={validateQaName}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
  },
  card: {
    width: "90%",
    maxWidth: 400,
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
  actionButton: {
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
  actionButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  fieldErrorText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "500",
  },
});
