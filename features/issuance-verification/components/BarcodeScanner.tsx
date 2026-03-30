/**
 * Barcode Scanner Component with IDAutomation Code 128 Display
 * Provides barcode scanning functionality using expo-camera
 * and renders the scanned barcode using IDAutomation Code128 font.
 */

import { Colors } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

// --- IDAutomation Code128 helper ---
const START_B = '\xCD'; // Ì
const STOP = '\xCE';    // Î
function encodeCode128B(data: string): string {
  let checksum = 104; // Start B
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) - 32;
    checksum += charCode * (i + 1);
  }
  checksum = checksum % 103;

  let checksumChar: string;
  if (checksum < 32) checksumChar = String.fromCharCode(checksum + 64);
  else if (checksum < 64) checksumChar = String.fromCharCode(checksum + 32);
  else checksumChar = String.fromCharCode(checksum);

  return `${START_B}${data}${checksumChar}${STOP}`;
}

// --- Component Props ---
interface BarcodeScannerProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
  title?: string;
}

export function BarcodeScanner({
  visible,
  onClose,
  onScan,
  title = 'Scan Barcode',
}: BarcodeScannerProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme ?? 'light'];
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [barcodeText, setBarcodeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;

    setScanned(true);

    // Encode for IDAutomation Code128 font display
    const encoded = encodeCode128B(data);
    setBarcodeText(encoded);

    // Call external callback
    onScan(data);
  };

  const handleClose = () => {
    setScanned(false);
    setBarcodeText('');
    onClose();
  };

  const handleRequestPermission = async () => {
    setIsLoading(true);
    const result = await requestPermission();
    setIsLoading(false);

    if (!result.granted) {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to scan barcodes.',
        [{ text: 'OK', onPress: handleClose }]
      );
    }
  };

  // Reset scanned state when modal opens
  useEffect(() => {
    if (visible) {
      setScanned(false);
      setBarcodeText('');
    }
  }, [visible]);

  if (!visible) return null;

  if (!permission) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.9)' }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Loading camera...
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.9)' }]}>
          <View style={styles.permissionContainer}>
            <MaterialCommunityIcons name="camera-off" size={64} color="#ef4444" />
            <Text style={[styles.permissionTitle, { color: colors.text }]}>
              Camera Permission Required
            </Text>
            <Text style={[styles.permissionText, { color: colors.text }]}>
              Please grant camera permission to use the barcode scanner.
            </Text>
            <TouchableOpacity
              style={[styles.permissionButton, { backgroundColor: colors.primary }]}
              onPress={handleRequestPermission}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.closeButton, { borderColor: colors.cardBorder || '#e5e7eb' }]}
              onPress={handleClose}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Scanner */}
        <View style={styles.scannerContainer}>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['code128'] }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Overlay */}
          <View style={styles.overlay}>
            <View style={styles.unfocusedContainer} />
            <View style={styles.middleContainer}>
              <View style={styles.unfocusedContainer} />
              <View style={styles.focusedContainer}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <View style={styles.unfocusedContainer} />
            </View>
            <View style={styles.unfocusedContainer} />
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Position the barcode within the frame
            </Text>
            <Text style={styles.instructionsSubtext}>
              The scanner will automatically detect the barcode
            </Text>
          </View>

          {/* Display scanned barcode */}
          {barcodeText ? (
            <View style={styles.barcodeDisplayContainer}>
              <Text
                style={[
                  styles.barcodeDisplayText,
                  { fontFamily: 'IDAutomationCode128', color: colors.text },
                ]}
              >
                {barcodeText}
              </Text>
              <Text style={[styles.barcodeValueText, { color: colors.text }]}>
                {barcodeText.replace(/[\xCD\xCE]/g, '') /* human-readable value */}
              </Text>
            </View>
          ) : null}

          {/* Rescan button */}
          {scanned && (
            <TouchableOpacity
              style={[styles.rescanButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setScanned(false);
                setBarcodeText('');
              }}
            >
              <MaterialCommunityIcons name="refresh" size={24} color="#fff" />
              <Text style={styles.rescanButtonText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

// --- Styles (same as before) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16 },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: '#fff', textAlign: 'center' },
  headerSpacer: { width: 40 },
  scannerContainer: { flex: 1, position: 'relative' },
  overlay: { flex: 1, flexDirection: 'column' },
  unfocusedContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' },
  middleContainer: { flexDirection: 'row', height: 200 },
  focusedContainer: { flex: 6, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#fff', borderWidth: 3 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  instructionsContainer: { position: 'absolute', bottom: 100, left: 0, right: 0, alignItems: 'center', paddingHorizontal: 20 },
  instructionsText: { fontSize: 16, fontWeight: '600', color: '#fff', textAlign: 'center', marginBottom: 8 },
  instructionsSubtext: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  rescanButton: { position: 'absolute', bottom: 40, left: '50%', transform: [{ translateX: -75 }], flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 25, width: 150 },
  rescanButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  permissionTitle: { fontSize: 20, fontWeight: '600', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  permissionText: { fontSize: 14, textAlign: 'center', marginBottom: 24, opacity: 0.8 },
  permissionButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginBottom: 12 },
  permissionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  closeButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, borderWidth: 1 },
  closeButtonText: { fontSize: 16, fontWeight: '600' },
  barcodeDisplayContainer: { position: 'absolute', bottom: 150, width: '100%', alignItems: 'center' },
  barcodeDisplayText: { fontSize: 48 },
  barcodeValueText: { fontSize: 16, marginTop: 8 },
});