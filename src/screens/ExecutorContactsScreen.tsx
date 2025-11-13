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

interface ExecutorContactsScreenProps {
  navigation: any;
}

const ExecutorContactsScreen: React.FC<ExecutorContactsScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Executor & Contacts</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Ionicons name="people-circle-outline" size={48} color={theme.colors.primary} />
            <Text style={styles.heroTitle}>Keep your support network updated</Text>
            <Text style={styles.heroSubtitle}>
              Executors, secondary contacts and attorneys ensure your estate plan is executed correctly. MiWill stores everyone in one view.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Primary executor</Text>
            <Text style={styles.sectionBody}>
              • Provide full name, ID number, phone, email and physical address.{'\n'}
              • Executors receive alerts when wills are updated or beneficiaries change.{'\n'}
              • If the executor changes, update their details and re-send verification immediately.
            </Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('AddBeneficiary')}>
              <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.secondaryButtonText}>Edit executor details</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Secondary contacts</Text>
            <Text style={styles.sectionBody}>
              Secondary contacts are notified if the executor is unreachable. Ensure they can access your MiWill account and know where original documents are stored.
            </Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('AddBeneficiary')}>
              <Ionicons name="person-add-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.secondaryButtonText}>Add a secondary contact</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attorney</Text>
            <Text style={styles.sectionBody}>
              If you use an attorney or trust company, capture their full details. You can copy attorney info to the executor step using the “Same as attorney” shortcut in registration.
            </Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Registration')}>
              <Ionicons name="briefcase-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.secondaryButtonText}>Update attorney information</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verification checklist</Text>
            <Text style={styles.sectionBody}>
              • Verify each contact via email or phone call, then log the confirmation on the Verification History screen.{'\n'}
              • Encourage executors and attorneys to store a printed copy of your will alongside the MiWill digital version.{'\n'}
              • Update contact details whenever a phone number or email changes to avoid estate delays.
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

export default ExecutorContactsScreen;


