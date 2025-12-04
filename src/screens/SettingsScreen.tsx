import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import { settingsStyles as styles } from './SettingsScreen.styles';

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('AccountSettings')}
            >
              <Ionicons name="person-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.settingText}>Profile Information</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('NotificationPreferences')}
            >
              <Ionicons name="notifications-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.settingText}>Notification Preferences</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('VerificationHistory')}
            >
              <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.settingText}>Verification History</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documents & Contacts</Text>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('DocumentsContacts')}
            >
              <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.settingText}>My Documents</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('ExecutorContacts')}
            >
              <Ionicons name="people-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.settingText}>Executor & Contacts</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security & Privacy</Text>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('SecurityPrivacy')}
            >
              <Ionicons name="lock-closed-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.settingText}>Change Password</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('PrivacySettings')}
            >
              <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.settingText}>Privacy Settings</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('TwoFactorSettings')}
            >
              <Ionicons name="key-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.settingText}>Two-Factor Authentication</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('Support')}
            >
              <Ionicons name="help-circle-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.settingText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('TermsConditions')}
            >
              <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.settingText}>Terms & Conditions</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              <Ionicons name="shield-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.settingText}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => navigation.navigate('About')}
            >
              <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.settingText}>About MiWill</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.settingItem}>
              <Ionicons name="code-working-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.settingText}>App Version</Text>
              <Text style={styles.settingValue}>1.0.0</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default SettingsScreen;

