import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme.config';
import { twoFactorSettingsStyles as styles } from './TwoFactorSettingsScreen.styles';

interface TwoFactorSettingsScreenProps {
  navigation: any;
}

const TwoFactorSettingsScreen: React.FC<TwoFactorSettingsScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Two-Factor Authentication</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <Ionicons name="shield-half-outline" size={48} color={theme.colors.primary} />
            <Text style={styles.heroTitle}>Extra protection for your estate</Text>
            <Text style={styles.heroSubtitle}>
              Two-Factor Authentication (2FA) adds a second check before anyone can access your MiWill profile.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current status</Text>
            <Text style={styles.sectionBody}>
              2FA is being rolled out in phases. You will receive an email once the feature is available for your account.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How 2FA will work</Text>
            <Text style={styles.sectionBody}>
              • When logging in you will enter your password and then confirm a one-time code sent via SMS or authenticator app.{'\n'}
              • Executors accessing the MiWill dashboard will also pass the second factor to protect sensitive documents.{'\n'}
              • You can designate backup codes for emergencies such as a lost phone.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prepare now</Text>
            <Text style={styles.sectionBody}>
              • Make sure your mobile number is current on the Update Profile screen.{'\n'}
              • Download an authenticator app (Google Authenticator, Authy) if you prefer app-based codes.{'\n'}
              • Keep secondary contact details updated so MiWill can help you recover access.
            </Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('UpdateProfile')}>
              <Ionicons name="phone-portrait-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.secondaryButtonText}>Verify my phone number</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default TwoFactorSettingsScreen;


