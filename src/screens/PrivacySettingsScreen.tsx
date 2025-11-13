import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';

interface PrivacySettingsScreenProps {
  navigation: any;
}

const PrivacySettingsScreen: React.FC<PrivacySettingsScreenProps> = ({ navigation }) => {
  const [shareWithExecutor, setShareWithExecutor] = React.useState(true);
  const [shareWithBeneficiaries, setShareWithBeneficiaries] = React.useState(true);
  const [activityDigest, setActivityDigest] = React.useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data sharing</Text>
            <Text style={styles.sectionBody}>
              MiWill only shares your information with trusted contacts you nominate. Control who can view asset allocations and will documents below.
            </Text>

            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleLabel}>Share with executor</Text>
                <Text style={styles.toggleDescription}>Recommended. Executors see the latest will, asset listings and contact details.</Text>
              </View>
              <Switch value={shareWithExecutor} onValueChange={setShareWithExecutor} trackColor={{ true: theme.colors.primary }} />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleLabel}>Share with beneficiaries</Text>
                <Text style={styles.toggleDescription}>Share high-level allocations with verified beneficiaries to avoid inheritance disputes.</Text>
              </View>
              <Switch value={shareWithBeneficiaries} onValueChange={setShareWithBeneficiaries} trackColor={{ true: theme.colors.primary }} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity digest</Text>
            <Text style={styles.sectionBody}>
              Receive a summary email whenever someone views or downloads a stored document. Ideal for estates with multiple executors.
            </Text>
            <View style={styles.toggleRow}>
              <View style={styles.toggleText}>
                <Text style={styles.toggleLabel}>Weekly digest</Text>
                <Text style={styles.toggleDescription}>Includes document downloads, beneficiary verification and asset updates.</Text>
              </View>
              <Switch value={activityDigest} onValueChange={setActivityDigest} trackColor={{ true: theme.colors.primary }} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>POPIA controls</Text>
            <Text style={styles.sectionBody}>
              You can request a copy of all personal information stored in MiWill or ask us to delete your account after the estate is concluded. Contact support for assisted removal.
            </Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Support')}>
              <Ionicons name="mail-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.secondaryButtonText}>Request data export</Text>
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
  toggleRow: {
    marginTop: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    justifyContent: 'space-between',
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
  },
  toggleDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
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

export default PrivacySettingsScreen;


