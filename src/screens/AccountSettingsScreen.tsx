import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import { accountSettingsStyles as styles } from './AccountSettingsScreen.styles';

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

export default AccountSettingsScreen;


