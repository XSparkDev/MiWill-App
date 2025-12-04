import { StyleSheet } from 'react-native';
import { theme } from '../config/theme.config';

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.xxl,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
    marginTop: theme.spacing.lg,
  },
  logo: {
    width: 180,
    height: 120,
  },
  title: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.regular as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xxl,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 2,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    backgroundColor: theme.colors.inputBackground,
    textAlign: 'center',
  },
  passwordInputWrapper: {
    width: '100%',
    height: 56,
    borderWidth: 2,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.inputBackground,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  passwordInput: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    textAlign: 'center',
  },
  eyeIcon: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  loginButton: {
    width: '100%',
    height: 56,
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  loginButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.buttonText,
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  registerText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  registerLink: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold as any,
  },
  resetPasswordLink: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.regular as any,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.sizes.sm,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  popiaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
  },
  checkboxWrapper: {
    marginRight: theme.spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold' as any,
  },
  popiaText: {
    flex: 1,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
  },
  popiaLink: {
    color: theme.colors.primary,
    fontWeight: theme.typography.weights.semibold as any,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xl,
  },
  modalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  modalScroll: {
    maxHeight: 320,
    marginBottom: theme.spacing.lg,
  },
  modalBody: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: theme.borderRadius.lg,
  },
  modalCloseText: {
    color: theme.colors.buttonText,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
  },
});



