import { StyleSheet } from 'react-native';
import { theme } from '../config/theme.config';

export const codCalculatorStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  resetButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.info + '15',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.info,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  infoTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
  },
  formSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  inputHint: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.inputBackground,
    paddingLeft: theme.spacing.md,
  },
  currencyPrefix: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginRight: theme.spacing.xs,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
  },
  calculateButton: {
    height: 56,
    backgroundColor: theme.colors.buttonPrimary,
    borderRadius: theme.borderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  calculateButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.buttonText,
  },
  resultsSection: {
    marginBottom: theme.spacing.xl,
  },
  resultsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  resultsTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
  },
  resultsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  resultLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  resultValue: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium as any,
    color: theme.colors.text,
  },
  resultDivider: {
    height: 2,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  totalRow: {
    paddingTop: theme.spacing.md,
  },
  totalLabel: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.text,
    flex: 1,
  },
  totalValue: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.success,
  },
  formulaCard: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  formulaTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  formulaText: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: 'monospace',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  formulaNote: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  educationalSection: {
    marginTop: theme.spacing.lg,
  },
  educationalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  educationalItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  educationalContent: {
    flex: 1,
  },
  educationalItemTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  educationalItemText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.sm,
  },
});



