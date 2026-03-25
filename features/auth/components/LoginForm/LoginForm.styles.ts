import { Dimensions, StyleSheet } from "react-native";

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  keyboardView: {
    flex: 1,
  },

  // Background gradient
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Background decorations
  backgroundCircle: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  backgroundCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -100,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  backgroundCircle3: {
    position: 'absolute',
    top: height * 0.4,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
  },

  // Dots pattern
  dotsPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  decorativeDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Content wrapper
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },

  // Logo section
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoContainer: {
    width: 76,
    height: 76,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoTextContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  appTagline: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#64748b',
  },

  // Unified card container (combines form elements into one box)
  unifiedCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  // Card header (welcome text inside card)
  cardHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  cardWelcomeText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  cardInstructionText: {
    fontSize: 13,
    textAlign: 'center',
    color: '#64748b',
  },

  // Unified input fields inside the card
  cardInputWrapper: {
    marginBottom: 12,
  },
  cardInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 50,
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  cardInputIconContainer: {
    width: 44,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  cardInput: {
    flex: 1,
    fontSize: 14,
    height: 50,
    paddingHorizontal: 10,
  },
  cardEyeButton: {
    width: 44,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Valid icon container
  validIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },

  cardErrorText: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Card footer (utility row and button inside card)
  cardFooter: {
    marginTop: 8,
  },
  cardUtilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  cardRememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardCheckboxChecked: {
    width: 9,
    height: 9,
    borderRadius: 2,
  },
  cardRememberText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardForgotText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Login button inside card
  cardLoginButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
  },
  cardButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardLoginButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Loading animation
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Help container
  helpContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  helpText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
  },

  // Footer
  footer: {
    marginTop: 28,
    alignItems: 'center',
  },
  subFooter: {
    alignItems: 'center',
  },
  footerLine: {
    width: 60,
    height: 3,
    borderRadius: 2,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Legacy/unused styles - keeping for compatibility
  inputField: {
    flex: 1,
    fontSize: 16,
    height: 56,
  },
  titleContainer: {
    marginBottom: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  loginButtonLegacy: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  combinedInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 72,
    paddingHorizontal: 4,
  },
  combinedInputIcon: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  combinedInputContent: {
    flex: 1,
    justifyContent: 'center',
  },
  combinedLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  combinedInput: {
    fontSize: 15,
    paddingVertical: 0,
    height: 40,
  },
});
