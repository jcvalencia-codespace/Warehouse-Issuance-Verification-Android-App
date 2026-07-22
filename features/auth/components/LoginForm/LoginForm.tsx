/**
 * Expert-Level Login Form with Premium UI/UX Design
 * Features: Advanced animations, polished inputs, micro-interactions
 */

import { ModalDialog } from "@/components/ui/modal-dialog";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Input } from "@/shared/components/ui/login/input";
import {
  Eye,
  EyeOff,
  Lock,
  LogIn,
  ShieldCheck,
  User,
  Warehouse
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import Constants from 'expo-constants';

import { useLogin } from "../../hooks/useLogin";
import { CompanyDropdown, CompanyOption } from "./CompanyDropdown";
import { styles } from "./LoginForm.styles";

const { width, height } = Dimensions.get('window');

export function LoginForm() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const {
    username,
    password,
    company,
    setUsername,
    setPassword,
    setCompany,
    isLoading,
    handleLogin,
    modalState,
    closeModal,
  } = useLogin();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScaleAnim = useRef(new Animated.Value(0)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  
  // Input animations
  const usernameInputAnim = useRef(new Animated.Value(0)).current;
  const passwordInputAnim = useRef(new Animated.Value(0)).current;
  
  // Background animation
  const bgPulseAnim = useRef(new Animated.Value(1)).current;

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  
  // Validation states
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [companyError, setCompanyError] = useState(false);

  const companyOptions: CompanyOption[] = [
    {
      label: 'Santeh Feeds Corp.',
      value: 'SFC',
      logo: require('@/assets/images/SFC.png'),
      initials: 'SF',
      color: '#2563eb',
    },
    {
      label: 'ProNatural Feeds Corp.',
      value: 'FEEDPRO',
      logo: require('@/assets/images/PNC.png'),
      initials: 'PN',
      color: '#16a34a',
    },
    {
      label: 'PetOne Inc.',
      value: 'PET1',
      logo: require('@/assets/images/PET1.png'),
      initials: 'P1',
      color: '#e6e628',
    },
  ];

  const selectedCompany = companyOptions.find((c) => c.value === company);

  // Entry animations
  useEffect(() => {
    // Background pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(bgPulseAnim, {
          toValue: 1.02,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(bgPulseAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Staggered entrance
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScaleAnim, {
          toValue: 1,
          tension: 45,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Input focus animations
  useEffect(() => {
    Animated.timing(usernameInputAnim, {
      toValue: isUsernameFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isUsernameFocused]);

  useEffect(() => {
    Animated.timing(passwordInputAnim, {
      toValue: isPasswordFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isPasswordFocused]);

  // Button press animation
  const handleButtonPressIn = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 0.96,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  // Validate inputs before login
  const validateInputs = () => {
    let isValid = true;
    if (!company) {
      setCompanyError(true);
      isValid = false;
    } else {
      setCompanyError(false);
    }
    if (!username.trim()) {
      setUsernameError(true);
      isValid = false;
    } else {
      setUsernameError(false);
    }
    
    if (!password.trim()) {
      setPasswordError(true);
      isValid = false;
    } else {
      setPasswordError(false);
    }
    
    return isValid;
  };

  const onLoginPress = () => {
    if (validateInputs()) {
      Keyboard.dismiss();
      handleLogin(
        company,
        `${Platform.OS} ${Constants.systemVersion}`
      );
    }
  };

  // Logo rotation interpolation
  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.keyboardView, { backgroundColor: colors.background }]}
      >
        <TouchableWithoutFeedback>
          <View style={styles.container}>
            {/* Animated Gradient Background */}
            <Animated.View 
              style={[
                styles.backgroundGradient, 
                { 
                  backgroundColor: colors.background,
                  transform: [{ scale: bgPulseAnim }],
                  opacity: isDark ? 0.95 : 1,
                }
              ]}
            />
            
            {/* Background decorations */}
            <View style={[styles.backgroundCircle, { backgroundColor: colors.primary + '08' }]} />
            <View style={[styles.backgroundCircle2, { backgroundColor: colors.secondary + '06' }]} />
            <View style={[styles.backgroundCircle3, { backgroundColor: colors.primary + '04' }]} />
            
            {/* Decorative dots pattern */}
            <View style={styles.dotsPattern}>
              {[...Array(5)].map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.decorativeDot, 
                    { 
                      backgroundColor: colors.primary + '15',
                      left: Math.random() * (width - 40),
                      top: Math.random() * (height * 0.3),
                    }
                  ]} 
                />
              ))}
            </View>

            <Animated.View
              style={[
                styles.contentWrapper,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* Logo Section */}
              <Animated.View 
                style={[
                  styles.logoSection, 
                  { 
                    transform: [
                      { scale: logoScaleAnim },
                      { rotate: logoRotate }
                    ] 
                  }
                ]}
              >
                <View style={[styles.logoContainer, { 
                  backgroundColor: selectedCompany ? selectedCompany.color + '18' : (isDark ? colors.primary + '20' : colors.primary + '12'),
                  shadowColor: selectedCompany ? selectedCompany.color : colors.primary,
                  shadowOpacity: isDark ? 0.4 : 0.2,
                  shadowRadius: 20,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: isDark ? 12 : 6,
                }]}>
                  {selectedCompany ? (
                    selectedCompany.logo ? (
                      <Image 
                        source={selectedCompany.logo} 
                        style={styles.companyLogoImage} 
                        resizeMode="contain" 
                      />
                    ) : (
                      <Text style={[styles.companyInitials, { color: selectedCompany.color }]}>
                        {selectedCompany.initials}
                      </Text>
                    )
                  ) : (
                    <Warehouse size={36} color={colors.primary} />
                  )}
                </View>
                <View style={styles.logoTextContainer}>
                  <Text style={[styles.appName, { color: colors.text }]}>
                    {selectedCompany ? selectedCompany.label : 'Santeh Feeds Corporation'}
                  </Text>
                  <Text style={[styles.appTagline, { color: colors.textSecondary }]}>
                    ERP - MOBILE
                  </Text>
                </View>
              </Animated.View>

              {/* Form Section - Unified Card Design */}
              <Animated.View
                style={[
                  styles.unifiedCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.cardBorder,
                  }
                ]}
              >
                {/* Card Header */}
                <Animated.View style={styles.cardHeader}>
                  <Text style={[styles.cardWelcomeText, { color: colors.text }]}>Welcome Back</Text>
                  <Text style={[styles.cardInstructionText, { color: colors.textSecondary }]}>
                    Sign in to continue
                  </Text>
                </Animated.View>

                {/* Company Selector */}
                <View style={styles.companyDropdownWrapper}>
                  <CompanyDropdown
                    options={companyOptions}
                    value={company}
                    onSelect={(val) => {
                      setCompany(val);
                      if (val) setCompanyError(false);
                    }}
                    placeholder="Select company"
                    colors={{
                      primary: colors.primary,
                      text: colors.text,
                      textSecondary: colors.textSecondary,
                      textTertiary: colors.textTertiary,
                      background: colors.background,
                      cardBackground: colors.cardBackground,
                      cardBorder: colors.cardBorder,
                      divider: colors.divider,
                    }}
                  />
                  {companyError && (
                    <Text style={[styles.cardErrorText, { color: colors.error }]}>
                      Company is required
                    </Text>
                  )}
                </View>

                {/* Username Input */}
                <Animated.View 
                  style={[
                    styles.cardInputWrapper,
                    { 
                      transform: [
                        { 
                          translateX: usernameInputAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -2]
                          }) 
                        }
                      ]
                    }
                  ]}
                >
                  <Text style={[styles.cardInputLabel, { color: isUsernameFocused || username ? colors.primary : colors.textSecondary }]}>
                    Username
                  </Text>
                  <View style={[
                    styles.cardInputContainer, 
                    { 
                      borderColor: usernameError ? colors.error : (isUsernameFocused ? colors.primary : colors.cardBorder),
                      backgroundColor: colors.background,
                    }
                  ]}>
                    <View style={[styles.cardInputIconContainer, { backgroundColor: isUsernameFocused ? colors.primary + '20' : colors.divider }]}>
                      <User size={16} color={isUsernameFocused ? colors.primary : colors.textSecondary} />
                    </View>
                    <Input
                      placeholder="Enter your username"
                      placeholderTextColor={colors.textTertiary}
                      value={username}
                      onChangeText={(text: string) => {
                        setUsername(text);
                        if (text) setUsernameError(false);
                      }}
                      onFocus={() => setIsUsernameFocused(true)}
                      onBlur={() => setIsUsernameFocused(false)}
                      style={[styles.cardInput, { color: colors.text }]}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                    {username.length > 0 && !usernameError && (
                      <View style={[styles.validIconContainer, { backgroundColor: colors.success + '20' }]}>
                        <ShieldCheck size={14} color={colors.success} />
                      </View>
                    )}
                  </View>
                  {usernameError && (
                    <Text style={[styles.cardErrorText, { color: colors.error }]}>
                      Username is required
                    </Text>
                  )}
                </Animated.View>

                {/* Password Input */}
                <Animated.View 
                  style={[
                    styles.cardInputWrapper,
                    { 
                      transform: [
                        { 
                          translateX: passwordInputAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, -2]
                          }) 
                        }
                      ]
                    }
                  ]}
                >
                  <Text style={[styles.cardInputLabel, { color: isPasswordFocused || password ? colors.primary : colors.textSecondary }]}>
                    Password
                  </Text>
                  <View style={[
                    styles.cardInputContainer, 
                    { 
                      borderColor: passwordError ? colors.error : (isPasswordFocused ? colors.primary : colors.cardBorder),
                      backgroundColor: colors.background,
                    }
                  ]}>
                    <View style={[styles.cardInputIconContainer, { backgroundColor: isPasswordFocused ? colors.primary + '20' : colors.divider }]}>
                      <Lock size={16} color={isPasswordFocused ? colors.primary : colors.textSecondary} />
                    </View>
                    <Input
                      placeholder="Enter your password"
                      placeholderTextColor={colors.textTertiary}
                      value={password}
                      onChangeText={(text: string) => {
                        setPassword(text);
                        if (text) setPasswordError(false);
                      }}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      style={[styles.cardInput, { color: colors.text }]}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                    />
                    <Pressable 
                      onPress={() => setShowPassword(!showPassword)} 
                      style={[styles.cardEyeButton, { backgroundColor: showPassword ? colors.primary + '15' : 'transparent' }]}
                    >
                      {showPassword ? (
                        <EyeOff size={16} color={colors.textSecondary} />
                      ) : (
                        <Eye size={16} color={colors.textSecondary} />
                      )}
                    </Pressable>
                  </View>
                  {passwordError && (
                    <Text style={[styles.cardErrorText, { color: colors.error }]}>
                      Password is required
                    </Text>
                  )}
                </Animated.View>
                
                {/* Card Footer */}
                <View style={styles.cardFooter}>
                  
                  {/* Login Button */}
                  <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                    <Pressable
                      onPress={onLoginPress}
                      onPressIn={handleButtonPressIn}
                      onPressOut={handleButtonPressOut}
                      disabled={isLoading}
                      style={({ pressed }) => [
                        styles.cardLoginButton,
                        { 
                          backgroundColor: colors.primary,
                          shadowColor: colors.primary,
                          shadowOpacity: pressed ? 0.3 : 0.4,
                          shadowRadius: pressed ? 6 : 10,
                          shadowOffset: { width: 0, height: pressed ? 3 : 5 },
                        },
                      ]}
                    >
                      {isLoading ? (
                        <View style={styles.loadingContainer}>
                          <View style={[styles.loadingDot, { backgroundColor: colors.neutral }]} />
                          <View style={[styles.loadingDot, { backgroundColor: colors.neutral }]} />
                          <View style={[styles.loadingDot, { backgroundColor: colors.neutral }]} />
                        </View>
                      ) : (
                        <View style={styles.cardButtonContent}>
                          <Text style={[styles.cardLoginButtonText, { color: colors.neutral }]}>Sign In</Text>
                          <LogIn size={16} color={colors.neutral} />
                        </View>
                      )}
                    </Pressable>
                  </Animated.View>
                </View>
              </Animated.View>

              {/* Footer */}
              <View style={styles.footer}>
                <View style={[styles.footerLine, { backgroundColor: colors.divider }]} />
                <Text style={[styles.footerText, { color: colors.textTertiary }]}>
                  VERSION 1.0.0 • SANTEH FEEDS CORPORATION
                </Text>
              </View>
              <View style={styles.subFooter}>
                <Text style={[styles.footerText, { color: colors.textTertiary }]}>
                  2026 MISSW - CALUMPIT
                </Text>
              </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Modal Dialog */}
      <ModalDialog
        visible={modalState.visible}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type as any}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancelButton={modalState.showCancelButton}
        isLoading={isLoading}
      />
    </>
  );
}

