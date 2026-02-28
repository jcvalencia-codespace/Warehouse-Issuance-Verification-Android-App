import { ModalDialog } from "@/components/ui/modal-dialog";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Button } from "@/shared/components/ui/login/button";
import { Input } from "@/shared/components/ui/login/input";
import { Label } from "@/shared/components/ui/login/label";
import { ArrowRight, Lock, User } from "lucide-react-native";
import { Text, View } from "react-native";

import { useLogin } from "../../hooks/useLogin";
import { styles } from "./LoginForm.styles";

export function LoginForm() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const {
    username,
    password,
    setUsername,
    setPassword,
    isLoading,
    handleLogin,
    modalState,
    closeModal,
  } = useLogin();
  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Right panel - form */}
        <View style={styles.formContainer}>

          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to manage your inventory</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Label style={[styles.label, { color: colors.text }]}>Username</Label>
              <View style={styles.inputContainer}>
                <View style={styles.iconContainer}>
                  <User size={16} color={colors.textSecondary} />
                </View>
                <Input
                  placeholder="Enter your username"
                  value={username}
                  onChangeText={(text: string) => setUsername(text)}
                  style={[styles.inputWithIcon, { borderColor: colors.cardBorder, backgroundColor: colors.background }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Label style={[styles.label, { color: colors.text }]}>Password</Label>
              <View style={styles.inputContainer}>
                  <View style={styles.iconContainer}>
                  <Lock size={16} color={colors.textSecondary} />
                </View>
                <Input
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={(text: string) => setPassword(text)}
                  style={[styles.inputWithIcon, { borderColor: colors.cardBorder, backgroundColor: colors.background }]}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <Button
              onPress={handleLogin}
              disabled={isLoading}
              style={[styles.loginButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.buttonText, { color: colors.neutral }]}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Text>
              {!isLoading && <ArrowRight size={16} color={colors.neutral} />}
            </Button>
          </View>

          <Text style={[styles.helpText, { color: colors.textTertiary }]}>
            Having trouble signing in? Contact MIS-SOFTWARE admin.
          </Text>
        </View>
      </View>

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
