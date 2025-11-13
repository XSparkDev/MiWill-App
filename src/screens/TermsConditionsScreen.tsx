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

interface TermsConditionsScreenProps {
  navigation: any;
}

const TermsConditionsScreen: React.FC<TermsConditionsScreenProps> = ({ navigation }) => {
  const terms = [
    {
      title: '1. Acceptance',
      body: 'By creating a MiWill account you agree to these Terms and warrant that the information provided is accurate and complete.',
    },
    {
      title: '2. Service scope',
      body: 'MiWill provides tools for capturing estate details, but final legal validity of wills and instructions remains subject to South African law.',
    },
    {
      title: '3. User responsibilities',
      body: 'Keep your login credentials secure, update contact details and ensure executors have access to the most recent documents.',
    },
    {
      title: '4. Data storage',
      body: 'Documents are stored in encrypted Firebase storage. Regularly download a signed copy of your will for offline safekeeping.',
    },
    {
      title: '5. Termination',
      body: 'You may delete your MiWill account at any time. We may suspend access if misuse, fraud or POPIA breaches are suspected.',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Support')}>
            <Ionicons name="help-circle-outline" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {terms.map(item => (
            <View key={item.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{item.title}</Text>
              <Text style={styles.sectionBody}>{item.body}</Text>
            </View>
          ))}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Need help?</Text>
            <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Support')}>
              <Ionicons name="mail-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.linkText}>Contact the MiWill support desk</Text>
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
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sectionBody: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  linkText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold as any,
    color: theme.colors.primary,
  },
});

export default TermsConditionsScreen;


