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

interface PrivacyPolicyScreenProps {
  navigation: any;
}

const policySections = [
  {
    title: 'What we collect',
    body: 'Personal details (names, ID numbers, email, phone), executor and beneficiary information, asset and policy metadata, uploaded will documents and activity logs.',
  },
  {
    title: 'How it is used',
    body: 'We use your data to render the MiWill dashboard, notify executors or beneficiaries of updates, and to satisfy legal requirements around will management.',
  },
  {
    title: 'Storage & retention',
    body: 'Data is stored in Google Firebase (located within compliant regions). We retain records while your account is active or until the estate is concluded.',
  },
  {
    title: 'Your rights',
    body: 'You can request a copy of your data, update inaccuracies or ask us to delete information after the estate is settled, in line with POPIA provisions.',
  },
];

const PrivacyPolicyScreen: React.FC<PrivacyPolicyScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Support')}>
            <Ionicons name="shield-checkmark-outline" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {policySections.map(item => (
            <View key={item.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{item.title}</Text>
              <Text style={styles.sectionBody}>{item.body}</Text>
            </View>
          ))}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <Text style={styles.sectionBody}>
              For privacy related queries please email support@miwill.co.za or call +27 12 345 6789. Our information officer will respond within two business days.
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
});

export default PrivacyPolicyScreen;


