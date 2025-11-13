import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';

interface AccountSettingsScreenProps {
  navigation: any;
}

const AccountSettingsScreen: React.FC<AccountSettingsScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Account Overview</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Ionicons name="person-circle-outline" size={48} color={theme.colors.primary} />
            <Text style={styles.heroTitle}>Manage your MiWill account</Text>
            <Text style={styles.heroSubtitle}>
              Keep your personal information up to date so we can help your loved ones honour your wishes.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('UpdateProfile')}
            >
              <Ionicons name="create-outline" size={18} color={theme.colors.buttonText} />
              <Text style={styles.primaryButtonText}>Update profile details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile</Text>
            <Text style={styles.sectionBody}>
              • Full legal names and verified ID number ensure the executor can identify you quickly.{'\n'}
              • Mobile number and email address keep you informed about beneficiary activity and will updates.{'\n'}
              • Upload a recent photograph to help attorneys and beneficiaries confirm they are working on the correct MiWill profile.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <Text style={styles.sectionBody}>
              Decide how often MiWill checks in with you. Custom reminders (1–5 years) ensure your estate plan reflects any life changes such as marriage, new property acquisitions or new dependants.
            </Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Dashboard')}>
              <Ionicons name="notifications-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.secondaryButtonText}>Review reminder cadence</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verification trail</Text>
            <Text style={styles.sectionBody}>
              We log when beneficiaries, executors and attorneys are added or verified. Coming soon you will be able to export the verification log from this screen for compliance reviews.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Need to change ownership details?</Text>
            <Text style={styles.sectionBody}>
              Contact our support desk if your legal name has changed or if you need to transfer ownership of this account. We will guide you through the secure verification process.
            </Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Support')}>
              <Ionicons name="call-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.secondaryButtonText}>Contact support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold as any,
    color: theme.colors.text,
  },
  content: {
    flex: 1,
  },
  heroCard: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.md,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xxl,
    alignItems: 'center',
    gap: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  heroTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  primaryButtonText: {
    color: theme.colors.buttonText,
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
  },
  section: {
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  sectionBody: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  secondaryButton: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
  },
  secondaryButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.primary,
  },
});

export default AccountSettingsScreen;


