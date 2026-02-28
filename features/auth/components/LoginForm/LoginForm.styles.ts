import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 40,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  titleContainer: {
    marginBottom: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
  inputContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: [{ translateY: -8 }],
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: 12,
    top: "50%",
    transform: [{ translateY: -8 }],
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingLeft: 40,
    paddingRight: 16,
    fontSize: 16,
    flex: 1,
  },
  inputWithIcon: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingLeft: 40,
    paddingRight: 16,
    fontSize: 16,
    flex: 1,
  },
  loginButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  helpText: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 12,
  },
});
