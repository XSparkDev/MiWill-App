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

interface VerificationHistoryScreenProps {
  navigation: any;
}

const mockTimeline = [
  {
    date: '12 Nov 2025',
    title: 'Secondary contact verified',
    description: 'Verification email accepted by Thandi Mkhize (secondary contact).',
  },
  {
    date: '05 Oct 2025',
    title: 'Executor confirmation',
    description: 'Executor Musa Dlamini confirmed receipt of will and asset listings.',
  },
  {
    date: '18 Sep 2025',
    title: 'Beneficiary ID check',
    description: 'ID number confirmed for beneficiary Zola Ndlovu (policy allocation 40%).',
  },
];

const VerificationHistoryScreen: React.FC<VerificationHistoryScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verification History</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Ionicons name="checkmark-circle-outline" size={48} color={theme.colors.primary} />
            <Text style={styles.heroTitle}>Track every approval</Text>
            <Text style={styles.heroSubtitle}>
              Executors rely on clear, timestamped confirmation trails. MiWill records each action automatically.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            {mockTimeline.map(item => (
              <View key={item.title} style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                  <Ionicons name="checkmark-done-outline" size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineDate}>{item.date}</Text>
                  <Text style={styles.timelineTitle}>{item.title}</Text>
                  <Text style={styles.timelineDescription}>{item.description}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="download-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.secondaryButtonText}>Export verification log (coming soon)</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What gets logged?</Text>
            <Text style={styles.sectionBody}>
              • Executor acceptance and document downloads.{'\n'}
              • Beneficiary email confirmations and ID matches.{'\n'}
              • When assets, policies or wills are updated or deleted.{'\n'}
              • POPIA consent renewals (auto-updated at sign-in).
            </Text>
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
  timelineItem: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  timelineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary + '1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelineDate: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  timelineTitle: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginTop: theme.spacing.xs / 1.5,
  },
  timelineDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    lineHeight: 18,
  },
  secondaryButton: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  secondaryButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.primary,
  },
});

export default VerificationHistoryScreen;


