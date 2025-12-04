import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import { securityPrivacyStyles as styles } from './SecurityPrivacyScreen.styles';

interface SecurityPrivacyScreenProps {
  navigation: any;
}

const SecurityPrivacyScreen: React.FC<SecurityPrivacyScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Security & Privacy</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Ionicons name="shield-checkmark-outline" size={48} color={theme.colors.primary} />
            <Text style={styles.heroTitle}>Protecting the wishes in your will</Text>
            <Text style={styles.heroSubtitle}>
              MiWill is designed for POPIA compliance and secure collaboration between executors, beneficiaries and attorneys.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>POPIA compliance</Text>
            <Text style={styles.sectionBody}>
              • We only process personal data necessary to administer your MiWill estate plan.{'\n'}
              • Every user must accept the POPIA Act at registration and during login. Acceptance is recorded together with the timestamp and email address used.{'\n'}
              • You can request an export or deletion of your personal information by contacting support.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account security</Text>
            <Text style={styles.sectionBody}>
              • Passwords must meet our strong password policy and can be reset from the login screen.{'\n'}
              • Two-Factor Authentication (2FA) is planned for a future release; subscribe to release notes from the Support section.{'\n'}
              • Device sessions are monitored—if we detect unusual activity you will be prompted to re-authenticate.
            </Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Support')}>
              <Ionicons name="alert-circle-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.secondaryButtonText}>Report suspicious activity</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Document storage</Text>
            <Text style={styles.sectionBody}>
              Uploaded wills (PDF, audio or video) are stored using encrypted Firebase Storage buckets. Metadata is kept in Firestore so we can show version history and download activity.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data retention & audit</Text>
            <Text style={styles.sectionBody}>
              We keep a full audit log of beneficiary links, asset updates and verification statuses. These records help executors resolve disputes quickly should a will be contested.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default SecurityPrivacyScreen;


